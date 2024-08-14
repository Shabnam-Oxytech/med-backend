// models/userModel.js
const connection = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
  create: (firstName, lastName, email, password, callback) => {
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) return callback(err);

      connection.query(
        'INSERT INTO users (firstName, lastName, email, password) VALUES (?, ?, ?, ?)',
        [firstName, lastName, email, hashedPassword],
        (err, results) => {
          if (err) return callback(err);
          callback(null, results);
        }
      );
    });
  },

  findByEmail: (email, callback) => {
    connection.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0]);
    });
  }
};

module.exports = User;
