jest.mock('../src/config/db', () => ({ query: jest.fn() }))

const request = require('supertest')
const app = require('../server')
const db = require('../src/config/db')
const User = require('../src/models/userModel')

jest.mock('../src/models/userModel', () => ({
  getById: jest.fn()
}))

const adminUser = { user_id: 2, email: 'admin@queuesmart.local', role: 'administrator' }

const sampleRows = [
  {
    entry_id: 1,
    join_time: '2026-04-28T09:00:00.000Z',
    completed_at: '2026-04-28T09:14:00.000Z',
    wait_minutes: 14,
    status: 'served',
    position: 1,
    user_id: 3,
    service_id: 1,
    service_name: 'General Consultation',
    service_description: 'Walk-in',
    expected_duration: 10,
    priority_level: 'medium',
    customer_name: 'Alex Rivera',
    email: 'alex@example.com',
    queue_id: 1
  },
  {
    entry_id: 2,
    join_time: '2026-04-28T10:30:00.000Z',
    completed_at: '2026-04-28T10:36:00.000Z',
    wait_minutes: 6,
    status: 'canceled',
    position: 2,
    user_id: 4,
    service_id: 1,
    service_name: 'General Consultation',
    service_description: 'Walk-in',
    expected_duration: 10,
    priority_level: 'medium',
    customer_name: 'Jamie Chen',
    email: 'jamie@example.com',
    queue_id: 1
  }
]

beforeEach(() => {
  jest.clearAllMocks()
  User.getById.mockImplementation((id, cb) => cb(null, [adminUser]))
})

function adminGet(path) {
  return request(app).get(path).set('x-user-id', String(adminUser.user_id))
}

describe('GET /api/reports/data', () => {
  test('returns stats, service summary, and rows for admin', async () => {
    db.query.mockImplementation((sql, params, cb) => cb(null, sampleRows))

    const res = await adminGet('/api/reports/data')
    expect(res.status).toBe(200)
    expect(res.body.stats.total).toBe(2)
    expect(res.body.stats.served).toBe(1)
    expect(res.body.stats.canceled).toBe(1)
    expect(res.body.stats.uniqueCustomers).toBe(2)
    expect(res.body.serviceSummary).toHaveLength(1)
    expect(res.body.serviceSummary[0].total_entries).toBe(2)
    expect(res.body.rows).toHaveLength(2)
  })

  test('rejects without x-user-id', async () => {
    const res = await request(app).get('/api/reports/data')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/reports/csv', () => {
  test('returns CSV attachment', async () => {
    db.query.mockImplementation((sql, params, cb) => cb(null, sampleRows))

    const res = await adminGet('/api/reports/csv')
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/csv/)
    expect(res.headers['content-disposition']).toMatch(/attachment/)
    expect(res.text).toContain('SERVICE ACTIVITY')
    expect(res.text).toContain('Alex Rivera')
  })
})

describe('GET /api/reports/pdf', () => {
  test('returns PDF for admin', async () => {
    db.query.mockImplementation((sql, params, cb) => cb(null, sampleRows))

    const res = await adminGet('/api/reports/pdf')
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toBe('application/pdf')
    expect(Buffer.isBuffer(res.body) || res.body instanceof Buffer).toBe(true)
    expect(res.body.length).toBeGreaterThan(500)
  })
})
