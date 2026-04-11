jest.mock('../src/config/db', () => ({ query: jest.fn() }))
jest.mock('../src/models/queueEntryModel', () => ({
  joinQueue: jest.fn(),
  getQueueEntries: jest.fn(),
  getByUserId: jest.fn(),
  getById: jest.fn(),
  updateStatus: jest.fn(),
  deleteById: jest.fn()
}))
jest.mock('../src/models/queueModel', () => ({
  create: jest.fn(),
  getById: jest.fn(),
  getByServiceId: jest.fn(),
  updateStatus: jest.fn(),
  deleteById: jest.fn()
}))
jest.mock('../src/models/serviceModel', () => ({
  create: jest.fn(),
  getAll: jest.fn(),
  getById: jest.fn(),
  getByBusinessId: jest.fn(),
  updateById: jest.fn(),
  deleteById: jest.fn()
}))
jest.mock('../src/models/notificationModel', () => ({
  create: jest.fn(),
  getByUserId: jest.fn(),
  getById: jest.fn(),
  markAsViewed: jest.fn(),
  deleteById: jest.fn()
}))

const request = require('supertest')
const app = require('../server')
const db = require('../src/config/db')

function mockDbQueryResult(rows) {
  return (query, paramsOrCb, maybeCb) => {
    const cb = typeof paramsOrCb === 'function' ? paramsOrCb : maybeCb
    cb(null, rows)
  }
}
const QueueEntry = require('../src/models/queueEntryModel')
const Queue = require('../src/models/queueModel')
const Service = require('../src/models/serviceModel')
const Notification = require('../src/models/notificationModel')

const mockService = { service_id: 1, service_name: 'General Consultation', expected_duration: 10, priority_level: 'medium' }
const mockQueue = { queue_id: 1, service_id: 1, status: 'open', max_size: 50 }
const mockEntry = { entry_id: 1, queue_id: 1, user_id: 1, position: 1, join_time: new Date().toISOString(), status: 'waiting' }

beforeEach(() => {
  jest.clearAllMocks()
  Notification.create.mockImplementation((uid, msg, cb) => cb(null))
})

describe('POST /api/queue/join', () => {
  test('should join the queue and return correct position and wait time', async () => {
    Service.getById.mockImplementation((id, cb) => cb(null, [mockService]))
    Queue.getByServiceId.mockImplementation((id, cb) => cb(null, [mockQueue]))
    QueueEntry.getQueueEntries.mockImplementation((id, cb) => cb(null, []))
    QueueEntry.joinQueue.mockImplementation((qid, uid, pos, cb) => cb(null, { insertId: 1 }))

    const res = await request(app).post('/api/queue/join').send({ user_id: 1, service_id: 1 })
    expect(res.status).toBe(201)
    expect(res.body.queueEntry.position).toBe(1)
    expect(res.body.queueEntry.waitTime).toBe(10)
  })

  test('should calculate wait time as position x expected_duration', async () => {
    Service.getById.mockImplementation((id, cb) => cb(null, [mockService]))
    Queue.getByServiceId.mockImplementation((id, cb) => cb(null, [mockQueue]))
    QueueEntry.getQueueEntries.mockImplementation((id, cb) => cb(null, [{ ...mockEntry, user_id: 2 }]))
    QueueEntry.joinQueue.mockImplementation((qid, uid, pos, cb) => cb(null, { insertId: 2 }))

    const res = await request(app).post('/api/queue/join').send({ user_id: 1, service_id: 1 })
    expect(res.status).toBe(201)
    expect(res.body.queueEntry.position).toBe(2)
    expect(res.body.queueEntry.waitTime).toBe(20)
  })

  test('should fail if user_id is missing', async () => {
    const res = await request(app).post('/api/queue/join').send({ service_id: 1 })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('user_id and service_id are required')
  })

  test('should fail if service_id is missing', async () => {
    const res = await request(app).post('/api/queue/join').send({ user_id: 1 })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('user_id and service_id are required')
  })

  test('should accept camelCase userId and serviceId', async () => {
    Service.getById.mockImplementation((id, cb) => cb(null, [mockService]))
    Queue.getByServiceId.mockImplementation((id, cb) => cb(null, [mockQueue]))
    QueueEntry.getQueueEntries.mockImplementation((id, cb) => cb(null, []))
    QueueEntry.joinQueue.mockImplementation((qid, uid, pos, cb) => cb(null, { insertId: 1 }))

    const res = await request(app).post('/api/queue/join').send({ userId: 1, serviceId: 1 })
    expect(res.status).toBe(201)
    expect(res.body.queueEntry.user_id).toBe(1)
    expect(res.body.queueEntry.service_id).toBe(1)
  })

  test('should fail if service does not exist', async () => {
    Service.getById.mockImplementation((id, cb) => cb(null, []))

    const res = await request(app).post('/api/queue/join').send({ user_id: 1, service_id: 999 })
    expect(res.status).toBe(404)
    expect(res.body.message).toBe('Service not found')
  })

  test('should fail if no open queue exists for the service', async () => {
    Service.getById.mockImplementation((id, cb) => cb(null, [mockService]))
    Queue.getByServiceId.mockImplementation((id, cb) => cb(null, [{ ...mockQueue, status: 'closed' }]))

    const res = await request(app).post('/api/queue/join').send({ user_id: 1, service_id: 1 })
    expect(res.status).toBe(404)
    expect(res.body.message).toBe('No open queue for this service')
  })

  test('should fail if user is already waiting in queue', async () => {
    Service.getById.mockImplementation((id, cb) => cb(null, [mockService]))
    Queue.getByServiceId.mockImplementation((id, cb) => cb(null, [mockQueue]))
    QueueEntry.getQueueEntries.mockImplementation((id, cb) => cb(null, [mockEntry]))

    const res = await request(app).post('/api/queue/join').send({ user_id: 1, service_id: 1 })
    expect(res.status).toBe(409)
    expect(res.body.message).toBe('User is already in this queue')
  })

  test('should fail if queue is full', async () => {
    const fullQueue = { ...mockQueue, max_size: 1 }
    Service.getById.mockImplementation((id, cb) => cb(null, [mockService]))
    Queue.getByServiceId.mockImplementation((id, cb) => cb(null, [fullQueue]))
    QueueEntry.getQueueEntries.mockImplementation((id, cb) => cb(null, [{ ...mockEntry, user_id: 2 }]))

    const res = await request(app).post('/api/queue/join').send({ user_id: 1, service_id: 1 })
    expect(res.status).toBe(409)
    expect(res.body.message).toBe('Queue is full')
  })

  test('should create a notification when user joins', async () => {
    Service.getById.mockImplementation((id, cb) => cb(null, [mockService]))
    Queue.getByServiceId.mockImplementation((id, cb) => cb(null, [mockQueue]))
    QueueEntry.getQueueEntries.mockImplementation((id, cb) => cb(null, []))
    QueueEntry.joinQueue.mockImplementation((qid, uid, pos, cb) => cb(null, { insertId: 1 }))

    await request(app).post('/api/queue/join').send({ user_id: 1, service_id: 1 })
    expect(Notification.create).toHaveBeenCalledWith(1, expect.stringContaining('General Consultation'), expect.any(Function))
  })
})

describe('GET /api/queue/status/:userId', () => {
  test('should return position, wait time, and service name', async () => {
    QueueEntry.getByUserId.mockImplementation((id, cb) => cb(null, [mockEntry]))
    QueueEntry.getQueueEntries.mockImplementation((id, cb) => cb(null, [mockEntry]))
    Queue.getById.mockImplementation((id, cb) => cb(null, [mockQueue]))
    Service.getById.mockImplementation((id, cb) => cb(null, [mockService]))
    Notification.getByUserId.mockImplementation((id, cb) => cb(null, []))

    const res = await request(app).get('/api/queue/status/1')
    expect(res.status).toBe(200)
    expect(res.body.position).toBe(1)
    expect(res.body.waitTime).toBe(10)
    expect(res.body.serviceName).toBe('General Consultation')
  })

  test('should return 404 if user is not in any queue', async () => {
    QueueEntry.getByUserId.mockImplementation((id, cb) => cb(null, []))

    const res = await request(app).get('/api/queue/status/1')
    expect(res.status).toBe(404)
    expect(res.body.message).toBe('User is not in any queue')
  })

  test('should trigger almost notification when position is 2 or less', async () => {
    QueueEntry.getByUserId.mockImplementation((id, cb) => cb(null, [mockEntry]))
    QueueEntry.getQueueEntries.mockImplementation((id, cb) => cb(null, [mockEntry]))
    Queue.getById.mockImplementation((id, cb) => cb(null, [mockQueue]))
    Service.getById.mockImplementation((id, cb) => cb(null, [mockService]))
    Notification.getByUserId.mockImplementation((id, cb) => cb(null, []))

    await request(app).get('/api/queue/status/1')
    expect(Notification.create).toHaveBeenCalledWith(1, expect.stringContaining('almost up'), expect.any(Function))
  })

  test('should not create duplicate almost notifications', async () => {
    const existingAlmost = { notification_id: 99, user_id: 1, message: 'You are almost up!', status: 'sent' }
    QueueEntry.getByUserId.mockImplementation((id, cb) => cb(null, [mockEntry]))
    QueueEntry.getQueueEntries.mockImplementation((id, cb) => cb(null, [mockEntry]))
    Queue.getById.mockImplementation((id, cb) => cb(null, [mockQueue]))
    Service.getById.mockImplementation((id, cb) => cb(null, [mockService]))
    Notification.getByUserId.mockImplementation((id, cb) => cb(null, [existingAlmost]))

    await request(app).get('/api/queue/status/1')
    expect(Notification.create).not.toHaveBeenCalled()
  })

  test('should recalculate wait time based on current position', async () => {
    const entry2 = { ...mockEntry, entry_id: 2, user_id: 2, position: 2 }
    QueueEntry.getByUserId.mockImplementation((id, cb) => cb(null, [entry2]))
    QueueEntry.getQueueEntries.mockImplementation((id, cb) => cb(null, [mockEntry, entry2]))
    Queue.getById.mockImplementation((id, cb) => cb(null, [mockQueue]))
    Service.getById.mockImplementation((id, cb) => cb(null, [mockService]))

    const res = await request(app).get('/api/queue/status/2')
    expect(res.body.position).toBe(2)
    expect(res.body.waitTime).toBe(20)
  })
})

describe('DELETE /api/queue/leave/:userId', () => {
  test('should leave queue successfully', async () => {
    QueueEntry.getByUserId.mockImplementation((id, cb) => cb(null, [mockEntry]))
    QueueEntry.updateStatus.mockImplementation((id, status, cb) => cb(null))

    const res = await request(app).delete('/api/queue/leave/1')
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Left queue successfully')
  })

  test('should fail if user is not in any queue', async () => {
    QueueEntry.getByUserId.mockImplementation((id, cb) => cb(null, []))

    const res = await request(app).delete('/api/queue/leave/1')
    expect(res.status).toBe(404)
    expect(res.body.message).toBe('User is not in any queue')
  })

  test('should mark the entry as canceled', async () => {
    QueueEntry.getByUserId.mockImplementation((id, cb) => cb(null, [mockEntry]))
    QueueEntry.updateStatus.mockImplementation((id, status, cb) => cb(null))

    await request(app).delete('/api/queue/leave/1')
    expect(QueueEntry.updateStatus).toHaveBeenCalledWith(1, 'canceled', expect.any(Function))
  })
})

describe('GET /api/queue', () => {
  test('should return all waiting queue entries', async () => {
    db.query.mockImplementation(mockDbQueryResult([{ ...mockEntry, service_name: 'General Consultation', expected_duration: 10 }]))

    const res = await request(app).get('/api/queue')
    expect(res.status).toBe(200)
    expect(res.body.length).toBe(1)
  })

  test('should return empty array when queue is empty', async () => {
    db.query.mockImplementation(mockDbQueryResult([]))

    const res = await request(app).get('/api/queue')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })
})

describe('POST /api/queue/serve-next', () => {
  test('should serve the next person in queue', async () => {
    db.query.mockImplementationOnce(mockDbQueryResult([{ ...mockEntry, service_id: 1 }]))
    QueueEntry.updateStatus.mockImplementation((id, status, cb) => cb(null))
    Service.getById.mockImplementation((id, cb) => cb(null, [mockService]))

    const res = await request(app).post('/api/queue/serve-next')
    expect(res.status).toBe(200)
    expect(res.body.served.user_id).toBe(1)
  })

  test('should fail when queue is empty', async () => {
    db.query.mockImplementationOnce(mockDbQueryResult([]))

    const res = await request(app).post('/api/queue/serve-next')
    expect(res.status).toBe(404)
    expect(res.body.message).toBe('No one in queue')
  })

  test('should create a served notification', async () => {
    db.query.mockImplementationOnce(mockDbQueryResult([{ ...mockEntry, service_id: 1 }]))
    QueueEntry.updateStatus.mockImplementation((id, status, cb) => cb(null))
    Service.getById.mockImplementation((id, cb) => cb(null, [mockService]))

    await request(app).post('/api/queue/serve-next')
    expect(Notification.create).toHaveBeenCalledWith(1, expect.stringContaining("It's your turn"), expect.any(Function))
  })

  test('should update entry status to served', async () => {
    db.query.mockImplementationOnce(mockDbQueryResult([{ ...mockEntry, service_id: 1 }]))
    QueueEntry.updateStatus.mockImplementation((id, status, cb) => cb(null))
    Service.getById.mockImplementation((id, cb) => cb(null, [mockService]))

    await request(app).post('/api/queue/serve-next')
    expect(QueueEntry.updateStatus).toHaveBeenCalledWith(1, 'served', expect.any(Function))
  })

  test('should pass service_id filter to db when serving next', async () => {
    db.query.mockImplementationOnce((query, params, cb) => {
      expect(params).toEqual([2])
      cb(null, [{ ...mockEntry, entry_id: 5, service_id: 2 }])
    })
    QueueEntry.updateStatus.mockImplementation((id, status, cb) => cb(null))
    Service.getById.mockImplementation((id, cb) => cb(null, [{ ...mockService, service_id: 2 }]))

    const res = await request(app).post('/api/queue/serve-next').send({ service_id: 2 })
    expect(res.status).toBe(200)
    expect(res.body.served.service_id).toBe(2)
  })
})
