const db = require("../config/db");

const Profile = {
  create: (user_id, full_name, phone, preferences, callback) => {
    const query = `
      INSERT INTO profiles (user_id, full_name, phone, preferences)
      VALUES (?, ?, ?, ?)
    `;
    db.query(query, [user_id, full_name, phone, preferences], callback);
  },

  getByUserId: (user_id, callback) => {
    const query = "SELECT * FROM profiles WHERE user_id = ?";
    db.query(query, [user_id], callback);
  },

  updateByUserId: (user_id, full_name, phone, preferences, callback) => {
    const query = `
      UPDATE profiles
      SET full_name = ?, phone = ?, preferences = ?
      WHERE user_id = ?
    `;
    db.query(query, [full_name, phone, preferences, user_id], callback);
  },

  deleteByUserId: (user_id, callback) => {
    const query = "DELETE FROM profiles WHERE user_id = ?";
    db.query(query, [user_id], callback);
  }
};

module.exports = Profile;