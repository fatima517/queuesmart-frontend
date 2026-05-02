const db = require('../config/db')
const PDFDocument = require('pdfkit')

// ── helpers ──────────────────────────────────────────────────────────────────

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

// ── main data query ───────────────────────────────────────────────────────────

function fetchReportData(filters, callback) {
  const { conditions, params } = filters

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''

  const sql = `
    SELECT
      qe.entry_id,
      qe.join_time,
      qe.status,
      qe.position,
      COALESCE(p.full_name, CONCAT('User #', qe.user_id)) AS customer_name,
      u.email,
      s.service_name,
      s.expected_duration,
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

// ── stats summary ─────────────────────────────────────────────────────────────

function buildStats(rows) {
  const total      = rows.length
  const served     = rows.filter(r => r.status === 'served').length
  const canceled   = rows.filter(r => r.status === 'canceled').length
  const waiting    = rows.filter(r => r.status === 'waiting').length
  const avgWait    = total > 0
    ? (rows.reduce((sum, r) => sum + (r.expected_duration || 0), 0) / total).toFixed(1)
    : 0

  return { total, served, canceled, waiting, avgWait }
}

// ── GET /api/reports/data  (JSON preview) ─────────────────────────────────────

const getReportData = (req, res) => {
  const filters = buildFilters(req.query)
  fetchReportData(filters, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Error generating report' })
    res.json({ stats: buildStats(rows), rows })
  })
}

// ── GET /api/reports/csv ──────────────────────────────────────────────────────

const exportCSV = (req, res) => {
  const filters = buildFilters(req.query)
  fetchReportData(filters, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Error generating CSV' })

    const stats = buildStats(rows)

    const header = 'Entry ID,Customer Name,Email,Service,Join Time,Status,Position,Expected Duration (min)\n'
    const body   = rows.map(r =>
      [
        r.entry_id,
        `"${r.customer_name}"`,
        r.email,
        `"${r.service_name}"`,
        new Date(r.join_time).toISOString(),
        r.status,
        r.position,
        r.expected_duration
      ].join(',')
    ).join('\n')

    const summary =
      `\n\nSUMMARY\nTotal Entries,${stats.total}\nServed,${stats.served}` +
      `\nCanceled,${stats.canceled}\nWaiting,${stats.waiting}\nAvg Expected Wait (min),${stats.avgWait}`

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="queuesmart-report.csv"')
    res.send(header + body + summary)
  })
}

// ── GET /api/reports/pdf ──────────────────────────────────────────────────────

const exportPDF = (req, res) => {
  const filters = buildFilters(req.query)
  fetchReportData(filters, (err, rows) => {
    if (err) return res.status(500).json({ message: 'Error generating PDF' })

    const stats = buildStats(rows)
    const doc   = new PDFDocument({ margin: 40 })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename="queuesmart-report.pdf"')
    doc.pipe(res)

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text('QueueSmart – Queue Activity Report', { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
    doc.moveDown(1)

    // Stats box
    doc.fontSize(13).font('Helvetica-Bold').text('Summary Statistics')
    doc.moveDown(0.3)
    doc.fontSize(10).font('Helvetica')
    doc.text(`Total Entries: ${stats.total}`)
    doc.text(`Served: ${stats.served}   |   Canceled: ${stats.canceled}   |   Waiting: ${stats.waiting}`)
    doc.text(`Average Expected Wait Time: ${stats.avgWait} minutes`)
    doc.moveDown(1)

    // Table header
    doc.fontSize(12).font('Helvetica-Bold').text('Queue Entry Details')
    doc.moveDown(0.3)

    const colWidths = [40, 100, 130, 110, 80, 60]
    const headers   = ['#', 'Customer', 'Email', 'Service', 'Join Time', 'Status']
    let x = doc.page.margins.left
    const startY = doc.y

    // Draw header row
    doc.font('Helvetica-Bold').fontSize(9)
    headers.forEach((h, i) => {
      doc.text(h, x, startY, { width: colWidths[i], lineBreak: false })
      x += colWidths[i]
    })
    doc.moveDown(0.5)
    doc.moveTo(doc.page.margins.left, doc.y).lineTo(550, doc.y).stroke()
    doc.moveDown(0.2)

    // Draw data rows
    doc.font('Helvetica').fontSize(8)
    rows.slice(0, 100).forEach(r => {   // cap at 100 rows for readability
      x = doc.page.margins.left
      const rowY = doc.y
      const cells = [
        String(r.entry_id),
        r.customer_name,
        r.email,
        r.service_name,
        new Date(r.join_time).toLocaleDateString(),
        r.status
      ]
      cells.forEach((cell, i) => {
        doc.text(cell, x, rowY, { width: colWidths[i], lineBreak: false })
        x += colWidths[i]
      })
      doc.moveDown(0.6)

      // Add new page if near bottom
      if (doc.y > doc.page.height - 80) doc.addPage()
    })

    if (rows.length > 100) {
      doc.moveDown(0.5).font('Helvetica-Oblique').fontSize(9)
         .text(`... and ${rows.length - 100} more entries (export CSV for full data)`)
    }

    doc.end()
  })
}

module.exports = { getReportData, exportCSV, exportPDF }