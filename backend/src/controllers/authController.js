// src/controllers/authController.js
const bcrypt = require('bcrypt')
const User = require('../models/userModel')
const Profile = require('../models/profileModel')
const { validateRegisterBody, validateLoginBody } = require('../validators/authValidator')

const register = (req, res) => {
  const validationError = validateRegisterBody(req.body)
  if (validationError) {
    return res.status(400).json({ message: validationError })
  }

  const { name, email, password, phone = null, preferences = null } = req.body
  const normalizedEmail = email.toLowerCase()

  User.findByEmail(normalizedEmail, async (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' })
    }
    if (results.length > 0) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10)

      User.create(normalizedEmail, hashedPassword, 'user', (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Error creating user' })
        }

        const userId = result.insertId

        Profile.create(userId, name, phone, preferences, (err) => {
          if (err) {
            return res.status(500).json({ message: 'Error creating profile' })
          }

          return res.status(201).json({
            message: 'User registered',
            user: {
              id: userId,
              name,
              email: normalizedEmail,
              role: 'user'
            }
          })
        })
      })
    } catch (error) {
      return res.status(500).json({ message: 'Error hashing password' })
    }
  })
}

const login = (req, res) => {
  const validationError = validateLoginBody(req.body)
  if (validationError) {
    return res.status(400).json({ message: validationError })
  }

  const { email, password } = req.body
  const normalizedEmail = email.toLowerCase()

  User.findByEmail(normalizedEmail, async (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' })
    }
    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const user = results[0]

    try {
      const isMatch = await bcrypt.compare(password, user.password)
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' })
      }

      Profile.getByUserId(user.user_id, (err, profileResults) => {
        if (err) {
          return res.status(500).json({ message: 'Error fetching profile' })
        }

        const profile = profileResults[0]

        return res.status(200).json({
          message: 'Login successful',
          user: {
            id: user.user_id,
            name: profile?.full_name || '',
            email: user.email,
            role: user.role
          }
        })
      })
    } catch (error) {
      return res.status(500).json({ message: 'Error verifying password' })
    }
  })
}

module.exports = { register, login }
