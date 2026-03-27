const request = require('supertest')
const app = require('../server')
const store = require('../src/data/store')

beforeEach(() => {
  store.users = [
    { id: '1', name: 'John Doe', email: 'john@example.com', password: 'password123', role: 'user' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', password: 'password123', role: 'user' }
  ]
  store.notifications = [
    { id: 'n1', userId: '1', message: 'You joined the queue', type: 'joined', read: false, timestamp: new Date() },
    { id: 'n2', userId: '1', message: 'Almost your turn', type: 'almost', read: false, timestamp: new Date() },
    { id: 'n3', userId: '2', message: 'You joined the queue', type: 'joined', read: false, timestamp: new Date() }
  ]
})

describe('GET /api/notifications/:userId', () => {
  test('should return all notifications for a user', async () => {
    const res = await request(app).get('/api/notifications/1')
    expect(res.status).toBe(200)
    expect(res.body.length).toBe(2)
  })

  test('should return only notifications for the specified user', async () => {
    const res = await request(app).get('/api/notifications/2')
    expect(res.status).toBe(200)
    expect(res.body.length).toBe(1)
    expect(res.body[0].userId).toBe('2')
  })

  test('should return empty array if user has no notifications', async () => {
    const res = await request(app).get('/api/notifications/999')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  test('should return notification objects with expected fields', async () => {
    const res = await request(app).get('/api/notifications/1')
    expect(res.status).toBe(200)
    expect(res.body[0]).toHaveProperty('id')
    expect(res.body[0]).toHaveProperty('userId')
    expect(res.body[0]).toHaveProperty('message')
    expect(res.body[0]).toHaveProperty('read')
  })
})

describe('PUT /api/notifications/:id/read', () => {
  test('should mark a notification as read', async () => {
    const res = await request(app).put('/api/notifications/n1/read')
    expect(res.status).toBe(200)
    expect(res.body.notification.read).toBe(true)
  })

  test('should return the updated notification', async () => {
    const res = await request(app).put('/api/notifications/n1/read')
    expect(res.status).toBe(200)
    expect(res.body.notification.id).toBe('n1')
    expect(res.body.message).toBe('Notification marked as read')
  })

  test('should fail if notification does not exist', async () => {
    const res = await request(app).put('/api/notifications/n999/read')
    expect(res.status).toBe(404)
    expect(res.body.message).toBe('Notification not found')
  })

  test('should persist the read status in the store', async () => {
    await request(app).put('/api/notifications/n2/read')
    const notif = store.notifications.find(n => n.id === 'n2')
    expect(notif.read).toBe(true)
  })
})
