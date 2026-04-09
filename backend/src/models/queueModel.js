const db = require("../config/db");

const Queue = {
  create: (service_id, status, max_size, callback) => {
    const query = `
      INSERT INTO queues (service_id, status, max_size)
      VALUES (?, ?, ?)
    `;
    db.query(query, [service_id, status, max_size], callback);
  },

  getById: (queue_id, callback) => {
    const query = "SELECT * FROM queues WHERE queue_id = ?";
    db.query(query, [queue_id], callback);
  },

  getByServiceId: (service_id, callback) => {
    const query = "SELECT * FROM queues WHERE service_id = ?";
    db.query(query, [service_id], callback);
  },

  updateStatus: (queue_id, status, callback) => {
    const query = "UPDATE queues SET status = ? WHERE queue_id = ?";
    db.query(query, [status, queue_id], callback);
  },

  updateMaxSize: (queue_id, max_size, callback) => {
    const query = "UPDATE queues SET max_size = ? WHERE queue_id = ?";
    db.query(query, [max_size, queue_id], callback);
  },

  deleteById: (queue_id, callback) => {
    const query = "DELETE FROM queues WHERE queue_id = ?";
    db.query(query, [queue_id], callback);
  }
};

module.exports = Queue;