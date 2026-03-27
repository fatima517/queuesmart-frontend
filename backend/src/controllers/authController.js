const store = require('../data/store')

const register = (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }
    if (typeof name !== 'string') {
      return res.status(400).json({ message: 'Name must be a string' })
    }
    if (typeof email !== 'string') {
      return res.status(400).json({ message: 'Email must be a string' })
    }
    if (typeof password !== 'string') {
      return res.status(400).json({ message: 'Password must be a string' })
    }
    if (name.length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' })
    }
    if (name.length > 100) {
      return res.status(400).json({ message: 'Name must be 100 characters or fewer' })
    }
    if (email.length > 254) {
      return res.status(400).json({ message: 'Email must be 254 characters or fewer' })
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' })
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    }
    if (password.length > 128) {
      return res.status(400).json({ message: 'Password must be 128 characters or fewer' })
    }

    const existingUser = store.users.find(u => u.email === email.toLowerCase())
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    const newUser = {
      id: String(store.users.length + 1),
      name,
      email: email.toLowerCase(),
      password,
      role: 'user'
    }

    store.users.push(newUser)
    res.status(201).json({
      message: 'User registered',
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    })
  } catch (error) {
    res.status(500).json({ message: 'Error registering user' })
  }
}

const login = (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }
    if (typeof email !== 'string') {
      return res.status(400).json({ message: 'Email must be a string' })
    }
    if (typeof password !== 'string') {
      return res.status(400).json({ message: 'Password must be a string' })
    }

    const user = store.users.find(u => u.email === email.toLowerCase() && u.password === password)
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    res.status(200).json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    })
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' })
  }
}

module.exports = { register, login }
