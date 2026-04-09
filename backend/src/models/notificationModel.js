const db = require("../config/db");

const Notification = {
  create: (user_id, message, callback) => {
    const query = `
      INSERT INTO notifications (user_id, message)
      VALUES (?, ?)
    `;
    db.query(query, [user_id, message], callback);
  },

  getByUserId: (user_id, callback) => {
    const query = `
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY timestamp DESC
    `;
    db.query(query, [user_id], callback);
  },

  getById: (notification_id, callback) => {
    const query = "SELECT * FROM notifications WHERE notification_id = ?";
    db.query(query, [notification_id], callback);
  },

  markAsViewed: (notification_id, callback) => {
    const query = `
      UPDATE notifications
      SET status = 'viewed'
      WHERE notification_id = ?
    `;
    db.query(query, [notification_id], callback);
  },

  deleteById: (notification_id, callback) => {
    const query = "DELETE FROM notifications WHERE notification_id = ?";
    db.query(query, [notification_id], callback);
  }
};

module.exports = Notification;