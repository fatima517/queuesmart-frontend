jest.mock('../src/config/db', () => ({ query: jest.fn() }))

const request = require('supertest')
const app     = require('../server')
const db      = require('../src/config/db')

const sampleResults = [
  { service_id: 1, service_name: 'General Consultation', expected_duration: 10, priority_level: 'medium', queue_length: 2, estimated_wait: 20 },
  { service_id: 2, service_name: 'Technical Support',    expected_duration: 20, priority_level: 'high',   queue_length: 5, estimated_wait: 100 }
]

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/smart/recommend', () => {
  test('returns the service with the shortest wait as recommendation', async () => {
    db.query.mockImplementation((sql, cb) => cb(null, sampleResults))

    const res = await request(app).get('/api/smart/recommend')
    expect(res.status).toBe(200)
    expect(res.body.recommendation.service_id).toBe(1)
    expect(res.body.recommendation.queue_length).toBe(2)
    expect(res.body.recommendation.estimated_wait).toBe(20)
    expect(res.body.recommendation.reason).toBeTruthy()
    expect(res.body.all_services).toHaveLength(2)
  })

  test('reason mentions no one waiting when queue_length is 0', async () => {
    const empty = [{ service_id: 1, service_name: 'Quick Service', expected_duration: 5, priority_level: 'low', queue_length: 0, estimated_wait: 0 }]
    db.query.mockImplementation((sql, cb) => cb(null, empty))

    const res = await request(app).get('/api/smart/recommend')
    expect(res.status).toBe(200)
    expect(res.body.recommendation.reason).toContain('no one waiting')
  })

  test('returns 404 when no services exist', async () => {
    db.query.mockImplementation((sql, cb) => cb(null, []))

    const res = await request(app).get('/api/smart/recommend')
    expect(res.status).toBe(404)
    expect(res.body.message).toBe('No services available')
  })

  test('returns 500 on database error', async () => {
    db.query.mockImplementation((sql, cb) => cb(new Error('DB error')))

    const res = await request(app).get('/api/smart/recommend')
    expect(res.status).toBe(500)
    expect(res.body.message).toBe('Error fetching recommendation')
  })

  test('all_services list is ordered by estimated wait ascending', async () => {
    db.query.mockImplementation((sql, cb) => cb(null, sampleResults))

    const res = await request(app).get('/api/smart/recommend')
    const waits = res.body.all_services.map(s => s.estimated_wait)
    expect(waits[0]).toBeLessThanOrEqual(waits[1])
  })
})
