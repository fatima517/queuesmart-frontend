const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const Profile = require('../models/profileModel');

// Register
const register = (req, res) => {
  const { name, email, password, phone = null, preferences = null } = req.body;

  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (typeof name !== 'string' || name.length < 2 || name.length > 100) {
    return res.status(400).json({ message: 'Name must be between 2 and 100 characters' });
  }

  if (typeof email !== 'string' || email.length > 254) {
    return res.status(400).json({ message: 'Invalid email' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return res.status(400).json({ message: 'Password must be between 8 and 128 characters' });
  }

  const normalizedEmail = email.toLowerCase();

  // Check if user exists
  User.findByEmail(normalizedEmail, async (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      User.create(normalizedEmail, hashedPassword, 'user', (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Error creating user' });
        }

        const userId = result.insertId;

        // Create profile
        Profile.create(userId, name, phone, preferences, (err) => {
          if (err) {
            return res.status(500).json({ message: 'Error creating profile' });
          }

          return res.status(201).json({
            message: 'User registered',
            user: {
              id: userId,
              name,
              email: normalizedEmail,
              role: 'user'
            }
          });
        });
      });
    } catch (error) {
      return res.status(500).json({ message: 'Error hashing password' });
    }
  });
};

// Login
const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const normalizedEmail = email.toLowerCase();

  User.findByEmail(normalizedEmail, async (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = results[0];

    try {
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Get profile
      Profile.getByUserId(user.user_id, (err, profileResults) => {
        if (err) {
          return res.status(500).json({ message: 'Error fetching profile' });
        }

        const profile = profileResults[0];

        return res.status(200).json({
          message: 'Login successful',
          user: {
            id: user.user_id,
            name: profile?.full_name || '',
            email: user.email,
            role: user.role
          }
        });
      });
    } catch (error) {
      return res.status(500).json({ message: 'Error verifying password' });
    }
  });
};

module.exports = { register, login };
