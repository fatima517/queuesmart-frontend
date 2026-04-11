const store = require('../data/store')

// Reads x-user-id header, finds the user in store, and attaches to req.user
const authenticate = (req, res, next) => {
  const userId = req.headers['x-user-id']

  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  const user = store.users.find(u => u.id === userId)
  if (!user) {
    return res.status(401).json({ message: 'Invalid user' })
  }

  req.user = { id: user.id, name: user.name, email: user.email, role: user.role }
  next()
}

// Must be used after authenticate — rejects non-admin users
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' })
  }
  const adminRoles = new Set(['admin', 'administrator'])
  if (!adminRoles.has(req.user.role)) {
    return res.status(403).json({ message: 'Admin access required' })
  }
  next()
}

module.exports = { authenticate, requireAdmin }
