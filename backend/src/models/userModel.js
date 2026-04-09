const db = require("../config/db");

const User = {
  create: (email, password, role, callback) => {
    const query = `
      INSERT INTO users (email, password, role)
      VALUES (?, ?, ?)
    `;
    db.query(query, [email, password, role], callback);
  },

  findByEmail: (email, callback) => {
    const query = "SELECT * FROM users WHERE email = ?";
    db.query(query, [email], callback);
  },

  getById: (user_id, callback) => {
    const query = "SELECT * FROM users WHERE user_id = ?";
    db.query(query, [user_id], callback);
  },

  getAll: (callback) => {
    const query = "SELECT * FROM users ORDER BY created_at DESC";
    db.query(query, callback);
  },

  deleteById: (user_id, callback) => {
    const query = "DELETE FROM users WHERE user_id = ?";
    db.query(query, [user_id], callback);
  }
};

module.exports = User;