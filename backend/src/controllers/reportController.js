const db = require('../config/db')
const PDFDocument = require('pdfkit')

function buildFilters(query) {
  const conditions = []
  const params = []

  if (query.service_id) {
    conditions.push('s.service_id = ?')
    params.push(parseInt(query.service_id, 10))
  }
  if (query.date_from) {
    conditions.push('qe.join_time >= ?')
    params.push(query.date_from)
  }
  if (query.date_to) {
    conditions.push('qe.join_time <= ?')
    params.push(query.date_to + ' 23:59:59')
  }

  return { conditions, params }
}

function fetchReportData(filters, callback) {
  const { conditions, params } = filters
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''

  const sql = `
    SELECT
      qe.entry_id,
      qe.join_time,
      qe.completed_at,
      qe.wait_minutes,
      qe.status,
      qe.position,
      qe.user_id,
      s.service_id,
      s.service_name,
      s.description AS service_description,
      s.expected_duration,
      s.priority_level,
      COALESCE(p.full_name, CONCAT('User #', qe.user_id)) AS customer_name,
      u.email,
      q.queue_id
    FROM queue_entries qe
    JOIN queues      q  ON qe.queue_id  = q.queue_id
    JOIN services    s  ON q.service_id = s.service_id
    JOIN users       u  ON qe.user_id   = u.user_id
    LEFT JOIN profiles p ON p.user_id   = qe.user_id
    ${where}
    ORDER BY qe.join_time DESC
  `
  db.query(sql, params, callback)
}

function buildStats(rows) {
  const total = rows.length
  const served = rows.filter(r => r.status === 'served').length
  const canceled = rows.filter(r => r.status === 'canceled').length
  const waiting = rows.filter(r => r.status === 'waiting').length

  const servedWithExpected = rows.filter(r => r.status === 'served')
  const avgExpected =
    servedWithExpected.length > 0
      ? (
          servedWithExpected.reduce((sum, r) => sum + (Number(r.expected_duration) || 0), 0) /
          servedWithExpected.length
        ).toFixed(1)
      : '0'

  const servedWithActual = rows.filter(
    r => r.status === 'served' && r.wait_minutes != null && !Number.isNaN(Number(r.wait_minutes))
  )
  const avgActual =
    servedWithActual.length > 0
      ? (
          servedWithActual.reduce((sum, r) => sum + Number(r.wait_minutes), 0) /
          servedWithActual.length
        ).toFixed(2)
      : null

  const uniqueCustomers = new Set(rows.map(r => r.user_id)).size

  return {
    total,
    served,
    canceled,
    waiting,
    avgExpectedWaitMinutes: avgExpected,
    avgActualWaitMinutesServed: avgActual,
    uniqueCustomers
  }
}

function buildServiceSummary(rows) {
  const map = new Map()
  for (const r of rows) {
    const sid = r.service_id
    if (!map.has(sid)) {
      map.set(sid, {
        service_id: sid,
        service_name: r.service_name,
        expected_duration: r.expected_duration,
        priority_level: r.priority_level,
        total_entries: 0,
        served: 0,
        canceled: 0,
        waiting: 0,
        waitSum: 0,
        waitCount: 0
      })
    }
    const m = map.get(sid)
    m.total_entries++
    if (r.status === 'served') {
      m.served++
      if (r.wait_minutes != null && !Number.isNaN(Number(r.wait_minutes))) {
        m.waitSum += Number(r.wait_minutes)
        m.waitCount++
      }
    } else if (r.status === 'canceled') m.canceled++
    else if (r.status === 'waiting') m.waiting++
  }
  return [...map.values()].map(m => ({
    service_id: m.service_id,
    service_name: m.service_name,
    expected_duration: m.expected_duration,
    priority_level: m.priority_level,
    total_entries: m.total_entries,
    served: m.served,
    canceled: m.canceled,
    waiting: m.waiting,
    avg_actual_wait_minutes_served:
      m.waitCount > 0 ? (m.waitSum / m.waitCount).toFixed(2) : null
  }))
}

const getReportData = (req, res) => {
  const filters = buildFilters(req.query)
  fetchReportData(filters, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Error generating report' })
    const stats = buildStats(rows)
    const serviceSummary = buildServiceSummary(rows)
    res.json({ stats, serviceSummary, rows })
  })
}

function csvEscape(value) {
  if (value == null) return ''
  const s = String(value)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

const exportCSV = (req, res) => {
  const filters = buildFilters(req.query)
  fetchReportData(filters, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Error generating CSV' })

    const stats = buildStats(rows)
    const serviceSummary = buildServiceSummary(rows)

    const header =
      'Entry ID,User ID,Customer Name,Email,Service ID,Service Name,Priority,Expected Duration (min),Join Time,Completed At,Status,Position,Actual Wait (min)\n'
    const body = rows
      .map(r =>
        [
          r.entry_id,
          r.user_id,
          csvEscape(r.customer_name),
          csvEscape(r.email),
          r.service_id,
          csvEscape(r.service_name),
          r.priority_level,
          r.expected_duration,
          new Date(r.join_time).toISOString(),
          r.completed_at ? new Date(r.completed_at).toISOString() : '',
          r.status,
          r.position,
          r.wait_minutes != null ? r.wait_minutes : ''
        ].join(',')
      )
      .join('\n')

    const svcLines = serviceSummary
      .map(
        s =>
          `${s.service_id},${csvEscape(s.service_name)},${s.priority_level},${s.expected_duration},${s.total_entries},${s.served},${s.canceled},${s.waiting},${s.avg_actual_wait_minutes_served ?? ''}`
      )
      .join('\n')

    const summary =
      '\n\nSUMMARY\n' +
      `Total Entries,${stats.total}\nUnique Customers,${stats.uniqueCustomers}\nServed,${stats.served}\n` +
      `Canceled,${stats.canceled}\nWaiting,${stats.waiting}\nAvg Expected Wait — Served Only (min),${stats.avgExpectedWaitMinutes}\n` +
      `Avg Actual Wait — Served Only (min),${stats.avgActualWaitMinutesServed ?? ''}\n\n` +
      'SERVICE ACTIVITY\nService ID,Service Name,Priority,Expected Duration (min),Total Entries,Served,Canceled,Waiting,Avg Actual Wait Served (min)\n' +
      svcLines

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="queuesmart-report.csv"')
    res.send(header + body + summary)
  })
}

const exportPDF = (req, res) => {
  const filters = buildFilters(req.query)
  fetchReportData(filters, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Error generating PDF' })

    const stats = buildStats(rows)
    const serviceSummary = buildServiceSummary(rows)
    const doc = new PDFDocument({ margin: 40, size: 'LETTER' })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename="queuesmart-report.pdf"')
    doc.pipe(res)

    doc.fontSize(20).font('Helvetica-Bold').text('QueueSmart — Admin Report', { align: 'center' })
    doc.moveDown(0.4)
    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Users, services, queue participation, and performance metrics', { align: 'center' })
    doc.moveDown(0.3)
    doc.fontSize(9).fillColor('#555555').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
    doc.fillColor('#000000')
    doc.moveDown(1)

    doc.fontSize(13).font('Helvetica-Bold').text('Summary')
    doc.moveDown(0.25)
    doc.fontSize(10).font('Helvetica')
    doc.text(`Total queue entries: ${stats.total}`)
    doc.text(`Unique customers: ${stats.uniqueCustomers}`)
    doc.text(`Served: ${stats.served}   |   Canceled: ${stats.canceled}   |   Waiting: ${stats.waiting}`)
    doc.text(
      `Average expected wait (served visits, minutes): ${stats.avgExpectedWaitMinutes}  —  Actual average wait (served): ${stats.avgActualWaitMinutesServed ?? 'n/a'} min`
    )
    doc.moveDown(0.8)

    doc.fontSize(13).font('Helvetica-Bold').text('Service activity')
    doc.moveDown(0.3)
    doc.font('Helvetica').fontSize(9)
    if (serviceSummary.length === 0) {
      doc.text('No service rows in the selected filter.')
    } else {
      serviceSummary.forEach(s => {
        doc.text(
          `• ${s.service_name} (ID ${s.service_id}) — priority ${s.priority_level}, est. ${s.expected_duration} min — ` +
            `entries: ${s.total_entries}, served ${s.served}, canceled ${s.canceled}, waiting ${s.waiting}` +
            (s.avg_actual_wait_minutes_served != null
              ? `, avg actual wait (served): ${s.avg_actual_wait_minutes_served} min`
              : '')
        )
        doc.moveDown(0.35)
      })
    }
    doc.moveDown(0.6)

    doc.fontSize(13).font('Helvetica-Bold').text('Customer participation & queue history')
    doc.moveDown(0.35)

    const colWidths = [38, 72, 118, 100, 88, 52, 52]
    const headers = ['#', 'Customer', 'Email', 'Service', 'Join', 'Status', 'Wait']
    let x = doc.page.margins.left
    const startY = doc.y
    doc.font('Helvetica-Bold').fontSize(8)
    headers.forEach((h, i) => {
      doc.text(h, x, startY, { width: colWidths[i], lineBreak: false })
      x += colWidths[i]
    })
    doc.moveDown(0.45)
    doc.moveTo(doc.page.margins.left, doc.y).lineTo(520, doc.y).stroke()
    doc.moveDown(0.15)

    doc.font('Helvetica').fontSize(7.5)
    rows.slice(0, 80).forEach(r => {
      x = doc.page.margins.left
      const rowY = doc.y
      const joinStr = new Date(r.join_time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      const waitStr = r.wait_minutes != null ? String(r.wait_minutes) : '—'
      const cells = [
        String(r.entry_id),
        String(r.customer_name || '').slice(0, 22),
        String(r.email || '').slice(0, 28),
        String(r.service_name || '').slice(0, 24),
        joinStr,
        String(r.status),
        waitStr
      ]
      cells.forEach((cell, i) => {
        doc.text(cell, x, rowY, { width: colWidths[i], lineBreak: false })
        x += colWidths[i]
      })
      doc.moveDown(0.55)
      if (doc.y > doc.page.height - 72) doc.addPage()
    })

    if (rows.length > 80) {
      doc.moveDown(0.3).font('Helvetica-Oblique').fontSize(9).text(`…and ${rows.length - 80} more rows (use CSV export for the full dataset).`)
    }

    doc.end()
  })
}

module.exports = { getReportData, exportCSV, exportPDF }
