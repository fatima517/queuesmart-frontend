const db = require('../config/db')
const QueueEntry = require('../models/queueEntryModel')

const getUserHistory = (req, res) => {
  const user_id = parseInt(req.params.userId)
  if (isNaN(user_id)) return res.status(400).json({ message: 'User ID is required' })

  const query = `
    SELECT qe.entry_id, qe.user_id, qe.position, qe.join_time, qe.completed_at, qe.wait_minutes, qe.status,
           q.queue_id, q.service_id,
           s.service_name, s.expected_duration
    FROM queue_entries qe
    JOIN queues q ON qe.queue_id = q.queue_id
    JOIN services s ON q.service_id = s.service_id
    WHERE qe.user_id = ? AND qe.status IN ('served', 'canceled')
    ORDER BY qe.join_time DESC
  `
  db.query(query, [user_id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching history' })
    if (results.length === 0) return res.status(404).json({ message: 'No history found for this user' })
    res.status(200).json(results)
  })
}

const addHistory = (req, res) => {
  const { entry_id } = req.body
  if (!entry_id || isNaN(parseInt(entry_id))) {
    return res.status(400).json({ message: 'entry_id is required' })
  }

  const eid = parseInt(entry_id)

  QueueEntry.getById(eid, (err, results) => {
    if (err) return res.status(500).json({ message: 'Error adding history' })
    if (results.length === 0) return res.status(404).json({ message: 'Queue entry not found' })

    const entry = results[0]
    if (entry.status !== 'waiting') {
      return res.status(400).json({ message: 'Entry is not in waiting status' })
    }

    QueueEntry.updateStatus(eid, 'served', (err) => {
      if (err) return res.status(500).json({ message: 'Error adding history' })
      res.status(201).json({ message: 'History added', entry: { ...entry, status: 'served' } })
    })
  })
}

module.exports = { getUserHistory, addHistory }
