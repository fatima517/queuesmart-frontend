const request = require('supertest')
const app = require('../server')
const store = require('../src/data/store')

beforeEach(() => {
  store.users = [
    { id: '1', name: 'John Doe', email: 'john@example.com', password: 'password123', role: 'user' },
    { id: '2', name: 'Admin User', email: 'admin@example.com', password: 'admin123', role: 'admin' }
  ]
})

describe('POST /api/auth/register', () => {
  test('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Jane Doe', email: 'jane@example.com', password: 'password123' })
    expect(res.status).toBe(201)
    expect(res.body.user.email).toBe('jane@example.com')
    expect(res.body.user.role).toBe('user')
    expect(res.body.user.password).toBeUndefined()
  })

  test('should fail if all fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({})
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('All fields are required')
  })

  test('should fail if name is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'jane@example.com', password: 'password123' })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('All fields are required')
  })

  test('should fail if email is already registered', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'John Doe', email: 'john@example.com', password: 'password123' })
    expect(res.status).toBe(409)
    expect(res.body.message).toBe('Email already registered')
  })

  test('should fail if password is too short', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Jane Doe', email: 'jane@example.com', password: 'short' })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Password must be at least 8 characters')
  })

  test('should fail if password exceeds 128 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Jane Doe', email: 'jane@example.com', password: 'A'.repeat(129) })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Password must be 128 characters or fewer')
  })

  test('should fail if email format is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Jane Doe', email: 'not-an-email', password: 'password123' })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Invalid email format')
  })

  test('should fail if name is over 100 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A'.repeat(101), email: 'jane@example.com', password: 'password123' })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Name must be 100 characters or fewer')
  })

  test('should fail if name is less than 2 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'jane@example.com', password: 'password123' })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Name must be at least 2 characters')
  })

  test('should store email in lowercase', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Jane Doe', email: 'JANE@EXAMPLE.COM', password: 'password123' })
    expect(res.status).toBe(201)
    expect(res.body.user.email).toBe('jane@example.com')
  })
})

describe('POST /api/auth/login', () => {
  test('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@example.com', password: 'password123' })
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('john@example.com')
    expect(res.body.user.id).toBe('1')
    expect(res.body.user.password).toBeUndefined()
  })

  test('should login case-insensitively on email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'JOHN@EXAMPLE.COM', password: 'password123' })
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('john@example.com')
  })

  test('should fail with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@example.com', password: 'wrongpassword' })
    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Invalid email or password')
  })

  test('should fail if email does not exist', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' })
    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Invalid email or password')
  })

  test('should fail if fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@example.com' })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Email and password are required')
  })

  test('should fail if email field is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'password123' })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Email and password are required')
  })
})
