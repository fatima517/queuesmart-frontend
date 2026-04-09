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

  updateStatus: (entry_id, status, callback) => {
    const query = `
      UPDATE queue_entries
      SET status = ?
      WHERE entry_id = ?
    `;
    db.query(query, [status, entry_id], callback);
  },

  deleteById: (entry_id, callback) => {
    const query = "DELETE FROM queue_entries WHERE entry_id = ?";
    db.query(query, [entry_id], callback);
  }
};

module.exports = QueueEntry;