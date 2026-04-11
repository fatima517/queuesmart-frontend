const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateRegisterBody(body) {
  if (!body || typeof body !== 'object') {
    return 'All fields are required'
  }
  const { name, email, password } = body

  if (!name || !email || !password) {
    return 'All fields are required'
  }
  if (typeof name !== 'string' || name.length < 2 || name.length > 100) {
    return 'Name must be between 2 and 100 characters'
  }
  if (typeof email !== 'string' || email.length > 254) {
    return 'Invalid email'
  }
  if (!EMAIL_REGEX.test(email)) {
    return 'Invalid email format'
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return 'Password must be between 8 and 128 characters'
  }
  return null
}

function validateLoginBody(body) {
  if (!body || typeof body !== 'object') {
    return 'Email and password are required'
  }
  const { email, password } = body
  if (!email || !password) {
    return 'Email and password are required'
  }
  if (typeof email !== 'string' || typeof password !== 'string') {
    return 'Email and password must be strings'
  }
  return null
}

module.exports = { validateRegisterBody, validateLoginBody }
