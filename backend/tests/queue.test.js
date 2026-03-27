const request = require('supertest')
const app = require('../server')
const store = require('../src/data/store')

beforeEach(() => {
  store.users = [
    { id: '1', name: 'John Doe', email: 'john@example.com', password: 'password123', role: 'user' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', password: 'password123', role: 'user' }
  ]
  store.services = [
    { id: '1', name: 'General Consultation', description: 'General help', expectedDuration: 10, priorityLevel: 'normal' },
    { id: '2', name: 'Technical Support', description: 'Tech help', expectedDuration: 20, priorityLevel: 'high' }
  ]
  store.queue = []
  store.notifications = []
  store.history = []
})

describe('POST /api/queue/join', () => {
  test('should join the queue and return correct wait time', async () => {
    const res = await request(app)
      .post('/api/queue/join')
      .send({ userId: '1', serviceId: '1' })
    expect(res.status).toBe(201)
    expect(res.body.queueEntry.position).toBe(1)
    expect(res.body.queueEntry.waitTime).toBe(10)
  })

  test('should calculate wait time as position x service duration', async () => {
    await request(app).post('/api/queue/join').send({ userId: '1', serviceId: '1' })
    const res = await request(app)
      .post('/api/queue/join')
      .send({ userId: '2', serviceId: '1' })
    expect(res.status).toBe(201)
    expect(res.body.queueEntry.position).toBe(2)
    expect(res.body.queueEntry.waitTime).toBe(20)
  })

  test('should fail if userId is missing', async () => {
    const res = await request(app)
      .post('/api/queue/join')
      .send({ serviceId: '1' })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('userId and serviceId are required')
  })

  test('should fail if serviceId is missing', async () => {
    const res = await request(app)
      .post('/api/queue/join')
      .send({ userId: '1' })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('userId and serviceId are required')
  })

  test('should fail if user does not exist', async () => {
    const res = await request(app)
      .post('/api/queue/join')
      .send({ userId: '999', serviceId: '1' })
    expect(res.status).toBe(404)
    expect(res.body.message).toBe('User not found')
  })

  test('should fail if service does not exist', async () => {
    const res = await request(app)
      .post('/api/queue/join')
      .send({ userId: '1', serviceId: '999' })
    expect(res.status).toBe(404)
    expect(res.body.message).toBe('Service not found')
  })

  test('should fail if user is already in a queue', async () => {
    await request(app).post('/api/queue/join').send({ userId: '1', serviceId: '1' })
    const res = await request(app)
      .post('/api/queue/join')
      .send({ userId: '1', serviceId: '2' })
    expect(res.status).toBe(409)
    expect(res.body.message).toBe('User is already in a queue')
  })

  test('should create a joined notification when user joins', async () => {
    await request(app).post('/api/queue/join').send({ userId: '1', serviceId: '1' })
    const notif = store.notifications.find(n => n.userId === '1' && n.type === 'joined')
    expect(notif).toBeDefined()
    expect(notif.message).toContain('General Consultation')
    expect(notif.read).toBe(false)
  })
})

describe('GET /api/queue/status/:userId', () => {
  test('should return correct position and wait time', async () => {
    await request(app).post('/api/queue/join').send({ userId: '1', serviceId: '1' })
    store.notifications = []
    const res = await request(app).get('/api/queue/status/1')
    expect(res.status).toBe(200)
    expect(res.body.position).toBe(1)
    expect(res.body.waitTime).toBe(10)
    expect(res.body.serviceName).toBe('General Consultation')
  })

  test('should return 404 if user is not in any queue', async () => {
    const res = await request(app).get('/api/queue/status/1')
    expect(res.status).toBe(404)
    expect(res.body.message).toBe('User is not in any queue')
  })

  test('should create an almost notification when position is 2 or less', async () => {
    await request(app).post('/api/queue/join').send({ userId: '1', serviceId: '1' })
    store.notifications = []
    await request(app).get('/api/queue/status/1')
    const almostNotif = store.notifications.find(n => n.userId === '1' && n.type === 'almost')
    expect(almostNotif).toBeDefined()
  })

  test('should not create duplicate almost notifications', async () => {
    await request(app).post('/api/queue/join').send({ userId: '1', serviceId: '1' })
    store.notifications = []
    await request(app).get('/api/queue/status/1')
    await request(app).get('/api/queue/status/1')
    const almostNotifs = store.notifications.filter(n => n.userId === '1' && n.type === 'almost')
    expect(almostNotifs.length).toBe(1)
  })

  test('should recalculate wait time based on current position', async () => {
    await request(app).post('/api/queue/join').send({ userId: '1', serviceId: '1' })
    await request(app).post('/api/queue/join').send({ userId: '2', serviceId: '1' })
    const res = await request(app).get('/api/queue/status/2')
    expect(res.body.position).toBe(2)
    expect(res.body.waitTime).toBe(20)
  })
})

describe('DELETE /api/queue/leave/:userId', () => {
  test('should leave queue successfully', async () => {
    await request(app).post('/api/queue/join').send({ userId: '1', serviceId: '1' })
    const res = await request(app).delete('/api/queue/leave/1')
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Left queue successfully')
  })

  test('should add to history when leaving', async () => {
    await request(app).post('/api/queue/join').send({ userId: '1', serviceId: '1' })
    store.history = []
    await request(app).delete('/api/queue/leave/1')
    const historyEntry = store.history.find(h => h.userId === '1' && h.outcome === 'left')
    expect(historyEntry).toBeDefined()
  })

  test('should fail if user is not in any queue', async () => {
    const res = await request(app).delete('/api/queue/leave/1')
    expect(res.status).toBe(404)
    expect(res.body.message).toBe('User is not in any queue')
  })

  test('should remove user from queue', async () => {
    await request(app).post('/api/queue/join').send({ userId: '1', serviceId: '1' })
    await request(app).delete('/api/queue/leave/1')
    const entry = store.queue.find(q => q.userId === '1')
    expect(entry).toBeUndefined()
  })
})

describe('GET /api/queue', () => {
  test('should return all queue entries', async () => {
    await request(app).post('/api/queue/join').send({ userId: '1', serviceId: '1' })
    const res = await request(app).get('/api/queue')
    expect(res.status).toBe(200)
    expect(res.body.length).toBe(1)
  })

  test('should return empty array when queue is empty', async () => {
    const res = await request(app).get('/api/queue')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })
})

describe('POST /api/queue/serve-next', () => {
  test('should serve the next person in queue', async () => {
    await request(app).post('/api/queue/join').send({ userId: '1', serviceId: '1' })
    const res = await request(app).post('/api/queue/serve-next')
    expect(res.status).toBe(200)
    expect(res.body.served.userId).toBe('1')
  })

  test('should fail when queue is empty', async () => {
    const res = await request(app).post('/api/queue/serve-next')
    expect(res.status).toBe(404)
    expect(res.body.message).toBe('No one in queue')
  })

  test('should create a served notification', async () => {
    await request(app).post('/api/queue/join').send({ userId: '1', serviceId: '1' })
    store.notifications = []
    await request(app).post('/api/queue/serve-next')
    const notif = store.notifications.find(n => n.userId === '1' && n.type === 'served')
    expect(notif).toBeDefined()
    expect(notif.read).toBe(false)
  })

  test('should add to history when served', async () => {
    await request(app).post('/api/queue/join').send({ userId: '1', serviceId: '1' })
    store.history = []
    await request(app).post('/api/queue/serve-next')
    const historyEntry = store.history.find(h => h.userId === '1' && h.outcome === 'served')
    expect(historyEntry).toBeDefined()
  })

  test('should remove served person from queue', async () => {
    await request(app).post('/api/queue/join').send({ userId: '1', serviceId: '1' })
    await request(app).post('/api/queue/serve-next')
    expect(store.queue.length).toBe(0)
  })
})
