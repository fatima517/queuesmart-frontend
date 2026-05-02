const db = require('../config/db')

// Smart recommendation: finds the service with the shortest estimated wait time
// by looking at the current number of waiting entries across all open queues.
// Estimated wait = queue_length * expected_duration (same formula used across the app).
const getRecommendation = (req, res) => {
  const sql = `
    SELECT
      s.service_id,
      s.service_name,
      s.expected_duration,
      s.priority_level,
      COUNT(CASE WHEN qe.status = 'waiting' THEN 1 END)                              AS queue_length,
      COUNT(CASE WHEN qe.status = 'waiting' THEN 1 END) * s.expected_duration        AS estimated_wait
    FROM services s
    LEFT JOIN queues       q  ON q.service_id  = s.service_id AND q.status = 'open'
    LEFT JOIN queue_entries qe ON qe.queue_id  = q.queue_id   AND qe.status = 'waiting'
    GROUP BY s.service_id, s.service_name, s.expected_duration, s.priority_level
    ORDER BY estimated_wait ASC, s.expected_duration ASC
  `

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching recommendation' })
    if (!results || results.length === 0) return res.status(404).json({ message: 'No services available' })

    const best = results[0]
    const queueLength = Number(best.queue_length)
    const estimatedWait = Number(best.estimated_wait)

    const reason = queueLength === 0
      ? `${best.service_name} has no one waiting — join now for immediate service.`
      : `${best.service_name} has the shortest wait with only ${queueLength} person(s) ahead — est. ${estimatedWait} min.`

    const all_services = results.map(r => ({
      service_id: r.service_id,
      service_name: r.service_name,
      expected_duration: r.expected_duration,
      priority_level: r.priority_level,
      queue_length: Number(r.queue_length),
      estimated_wait: Number(r.estimated_wait)
    }))

    res.json({
      recommendation: {
        service_id: best.service_id,
        service_name: best.service_name,
        expected_duration: best.expected_duration,
        queue_length: queueLength,
        estimated_wait: estimatedWait,
        reason
      },
      all_services
    })
  })
}

module.exports = { getRecommendation }
