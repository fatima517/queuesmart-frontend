const db = require("../config/db");

const QueueEntry = {
  joinQueue: (queue_id, user_id, position, callback) => {
    const query = `
      INSERT INTO queue_entries (queue_id, user_id, position)
      VALUES (?, ?, ?)
    `;
    db.query(query, [queue_id, user_id, position], callback);
  },

  getQueueEntries: (queue_id, callback) => {
    const query = `
      SELECT * FROM queue_entries
      WHERE queue_id = ?
      ORDER BY position ASC
    `;
    db.query(query, [queue_id], callback);
  },

  getByUserId: (user_id, callback) => {
    const query = `
      SELECT * FROM queue_entries
      WHERE user_id = ?
      ORDER BY join_time DESC
    `;
    db.query(query, [user_id], callback);
  },

  getById: (entry_id, callback) => {
    const query = "SELECT * FROM queue_entries WHERE entry_id = ?";
    db.query(query, [entry_id], callback);
  },

  /**
   * Terminal statuses (served, canceled) set completed_at, wait_minutes, and append queue_history.
   * Only transitions from waiting are applied for terminal updates (affectedRows guard).
   */
  updateStatus: (entry_id, status, callback) => {
    const terminal = status === "served" || status === "canceled";

    if (!terminal) {
      const query = `
        UPDATE queue_entries
        SET status = ?
        WHERE entry_id = ?
      `;
      return db.query(query, [status, entry_id], callback);
    }

    const updateSql = `
      UPDATE queue_entries
      SET status = ?,
          completed_at = CURRENT_TIMESTAMP,
          wait_minutes = ROUND(TIMESTAMPDIFF(SECOND, join_time, CURRENT_TIMESTAMP) / 60, 2)
      WHERE entry_id = ?
        AND status = 'waiting'
    `;

    db.query(updateSql, [status, entry_id], (err, result) => {
      if (err) return callback(err);
      if (!result || result.affectedRows === 0) {
        return callback(null, result);
      }

      const historySql = `
        INSERT INTO queue_history (entry_id, queue_id, user_id, service_id, join_time, completed_at, final_status, wait_minutes)
        SELECT qe.entry_id,
               qe.queue_id,
               qe.user_id,
               q.service_id,
               qe.join_time,
               qe.completed_at,
               qe.status,
               qe.wait_minutes
        FROM queue_entries qe
        JOIN queues q ON qe.queue_id = q.queue_id
        WHERE qe.entry_id = ?
      `;

      db.query(historySql, [entry_id], (histErr) => {
        if (histErr) return callback(histErr);
        callback(null, result);
      });
    });
  },

  deleteById: (entry_id, callback) => {
    const query = "DELETE FROM queue_entries WHERE entry_id = ?";
    db.query(query, [entry_id], callback);
  }
};

module.exports = QueueEntry;
