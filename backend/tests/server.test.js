jest.mock('../src/config/db', () => ({ query: jest.fn() }))

const request = require('supertest')
const db = require('../src/config/db')

describe('server.js', () => {
  let app
  let consoleSpy

  beforeAll(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    db.query.mockImplementation((sql, paramsOrCb, maybeCb) => {
      const cb = typeof paramsOrCb === 'function' ? paramsOrCb : maybeCb
      if (typeof cb === 'function') cb(null, [])
    })
    app = require('../server')
  })

  afterAll(() => {
    consoleSpy.mockRestore()
  })

  test('exports Express app with API routes mounted', async () => {
    const res = await request(app).get('/api/services')
    expect([200, 500]).toContain(res.status)
    expect(res.headers['content-type'] || '').toMatch(/json/)
  })

  test('startServer listens and log callback runs', (done) => {
    const srv = app.startServer(0)
    srv.on('listening', () => {
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/Server running/))
      srv.close(() => done())
    })
    srv.on('error', done)
  })

  test('startServer uses default PORT when port is omitted', () => {
    const fake = { on: jest.fn(), close: jest.fn() }
    const listenSpy = jest.spyOn(app, 'listen').mockImplementation((port, host, cb) => {
      expect(port).toBe(3000)
      expect(host).toBe('127.0.0.1')
      if (typeof cb === 'function') cb()
      return fake
    })
    app.startServer()
    listenSpy.mockRestore()
  })
})
