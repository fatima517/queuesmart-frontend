const db = require("../config/db");

const Service = {
  create: (business_id, service_name, description, expected_duration, priority_level, callback) => {
    const query = `
      INSERT INTO services (business_id, service_name, description, expected_duration, priority_level)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(
      query,
      [business_id, service_name, description, expected_duration, priority_level],
      callback
    );
  },

  getAll: (callback) => {
    const query = "SELECT * FROM services ORDER BY created_at DESC";
    db.query(query, callback);
  },

  getById: (service_id, callback) => {
    const query = "SELECT * FROM services WHERE service_id = ?";
    db.query(query, [service_id], callback);
  },

  getByBusinessId: (business_id, callback) => {
    const query = "SELECT * FROM services WHERE business_id = ? ORDER BY created_at DESC";
    db.query(query, [business_id], callback);
  },

  updateById: (service_id, service_name, description, expected_duration, priority_level, callback) => {
    const query = `
      UPDATE services
      SET service_name = ?, description = ?, expected_duration = ?, priority_level = ?
      WHERE service_id = ?
    `;
    db.query(
      query,
      [service_name, description, expected_duration, priority_level, service_id],
      callback
    );
  },

  deleteById: (service_id, callback) => {
    const query = "DELETE FROM services WHERE service_id = ?";
    db.query(query, [service_id], callback);
  }
};

module.exports = Service;