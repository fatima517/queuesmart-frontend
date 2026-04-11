jest.mock('../src/config/db', () => ({ query: jest.fn() }))

const db = require('../src/config/db')
const User = require('../src/models/userModel')
const Profile = require('../src/models/profileModel')
const Service = require('../src/models/serviceModel')
const Queue = require('../src/models/queueModel')
const QueueEntry = require('../src/models/queueEntryModel')
const Notification = require('../src/models/notificationModel')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('User model', () => {
  test('create calls db.query', () => {
    const cb = jest.fn()
    User.create('a@b.com', 'hash', 'user', cb)
    expect(db.query).toHaveBeenCalledTimes(1)
    expect(db.query.mock.calls[0][1]).toEqual(['a@b.com', 'hash', 'user'])
    db.query.mock.calls[0][2](null, { insertId: 1 })
    expect(cb).toHaveBeenCalledWith(null, { insertId: 1 })
  })

  test('findByEmail', () => {
    const cb = jest.fn()
    User.findByEmail('x@y.com', cb)
    expect(db.query.mock.calls[0][1]).toEqual(['x@y.com'])
    db.query.mock.calls[0][2](null, [])
    expect(cb).toHaveBeenCalledWith(null, [])
  })

  test('getById', () => {
    const cb = jest.fn()
    User.getById(5, cb)
    expect(db.query.mock.calls[0][1]).toEqual([5])
    db.query.mock.calls[0][2](null, [{ user_id: 5 }])
    expect(cb).toHaveBeenCalled()
  })

  test('getAll', () => {
    const cb = jest.fn()
    User.getAll(cb)
    expect(db.query.mock.calls[0][0]).toContain('SELECT * FROM users')
    db.query.mock.calls[0][1](null, [])
    expect(cb).toHaveBeenCalledWith(null, [])
  })

  test('deleteById', () => {
    const cb = jest.fn()
    User.deleteById(3, cb)
    expect(db.query.mock.calls[0][1]).toEqual([3])
    db.query.mock.calls[0][2](null, { affectedRows: 1 })
    expect(cb).toHaveBeenCalled()
  })
})

describe('Profile model', () => {
  test('create', () => {
    const cb = jest.fn()
    Profile.create(1, 'N', '555', null, cb)
    expect(db.query.mock.calls[0][1]).toEqual([1, 'N', '555', null])
    db.query.mock.calls[0][2](null)
    expect(cb).toHaveBeenCalledWith(null)
  })

  test('getByUserId', () => {
    const cb = jest.fn()
    Profile.getByUserId(2, cb)
    db.query.mock.calls[0][2](null, [])
    expect(cb).toHaveBeenCalledWith(null, [])
  })

  test('updateByUserId', () => {
    const cb = jest.fn()
    Profile.updateByUserId(1, 'A', 'B', 'C', cb)
    expect(db.query.mock.calls[0][1]).toEqual(['A', 'B', 'C', 1])
    db.query.mock.calls[0][2](null)
    expect(cb).toHaveBeenCalledWith(null)
  })

  test('deleteByUserId', () => {
    const cb = jest.fn()
    Profile.deleteByUserId(9, cb)
    db.query.mock.calls[0][2](null)
    expect(cb).toHaveBeenCalledWith(null)
  })
})

describe('Service model', () => {
  test('create', () => {
    const cb = jest.fn()
    Service.create(1, 'S', 'D', 5, 'low', cb)
    expect(db.query.mock.calls[0][1]).toEqual([1, 'S', 'D', 5, 'low'])
    db.query.mock.calls[0][2](null, { insertId: 1 })
    expect(cb).toHaveBeenCalled()
  })

  test('getAll', () => {
    const cb = jest.fn()
    Service.getAll(cb)
    db.query.mock.calls[0][1](null, [])
    expect(cb).toHaveBeenCalledWith(null, [])
  })

  test('getById', () => {
    const cb = jest.fn()
    Service.getById(2, cb)
    db.query.mock.calls[0][2](null, [])
    expect(cb).toHaveBeenCalled()
  })

  test('getByBusinessId', () => {
    const cb = jest.fn()
    Service.getByBusinessId(1, cb)
    db.query.mock.calls[0][2](null, [])
    expect(cb).toHaveBeenCalled()
  })

  test('updateById', () => {
    const cb = jest.fn()
    Service.updateById(1, 'n', 'd', 10, 'high', cb)
    expect(db.query.mock.calls[0][1]).toEqual(['n', 'd', 10, 'high', 1])
    db.query.mock.calls[0][2](null)
    expect(cb).toHaveBeenCalledWith(null)
  })

  test('deleteById', () => {
    const cb = jest.fn()
    Service.deleteById(4, cb)
    db.query.mock.calls[0][2](null)
    expect(cb).toHaveBeenCalledWith(null)
  })
})

describe('Queue model', () => {
  test('create', () => {
    const cb = jest.fn()
    Queue.create(1, 'open', 50, cb)
    db.query.mock.calls[0][2](null, { insertId: 1 })
    expect(cb).toHaveBeenCalled()
  })

  test('getById', () => {
    const cb = jest.fn()
    Queue.getById(1, cb)
    db.query.mock.calls[0][2](null, [])
    expect(cb).toHaveBeenCalled()
  })

  test('getByServiceId', () => {
    const cb = jest.fn()
    Queue.getByServiceId(2, cb)
    db.query.mock.calls[0][2](null, [])
    expect(cb).toHaveBeenCalled()
  })

  test('updateStatus', () => {
    const cb = jest.fn()
    Queue.updateStatus(1, 'closed', cb)
    expect(db.query.mock.calls[0][1]).toEqual(['closed', 1])
    db.query.mock.calls[0][2](null)
    expect(cb).toHaveBeenCalled()
  })

  test('updateMaxSize', () => {
    const cb = jest.fn()
    Queue.updateMaxSize(1, 99, cb)
    db.query.mock.calls[0][2](null)
    expect(cb).toHaveBeenCalled()
  })

  test('deleteById', () => {
    const cb = jest.fn()
    Queue.deleteById(1, cb)
    db.query.mock.calls[0][2](null)
    expect(cb).toHaveBeenCalled()
  })
})

describe('QueueEntry model', () => {
  test('joinQueue', () => {
    const cb = jest.fn()
    QueueEntry.joinQueue(1, 2, 3, cb)
    expect(db.query.mock.calls[0][1]).toEqual([1, 2, 3])
    db.query.mock.calls[0][2](null, { insertId: 1 })
    expect(cb).toHaveBeenCalled()
  })

  test('getQueueEntries', () => {
    const cb = jest.fn()
    QueueEntry.getQueueEntries(1, cb)
    db.query.mock.calls[0][2](null, [])
    expect(cb).toHaveBeenCalled()
  })

  test('getByUserId', () => {
    const cb = jest.fn()
    QueueEntry.getByUserId(5, cb)
    db.query.mock.calls[0][2](null, [])
    expect(cb).toHaveBeenCalled()
  })

  test('getById', () => {
    const cb = jest.fn()
    QueueEntry.getById(10, cb)
    db.query.mock.calls[0][2](null, [])
    expect(cb).toHaveBeenCalled()
  })

  test('updateStatus', () => {
    const cb = jest.fn()
    QueueEntry.updateStatus(1, 'served', cb)
    expect(db.query.mock.calls[0][1]).toEqual(['served', 1])
    db.query.mock.calls[0][2](null)
    expect(cb).toHaveBeenCalled()
  })

  test('deleteById', () => {
    const cb = jest.fn()
    QueueEntry.deleteById(7, cb)
    db.query.mock.calls[0][2](null)
    expect(cb).toHaveBeenCalled()
  })
})

describe('Notification model', () => {
  test('create', () => {
    const cb = jest.fn()
    Notification.create(1, 'hello', cb)
    expect(db.query.mock.calls[0][1]).toEqual([1, 'hello'])
    db.query.mock.calls[0][2](null, { insertId: 1 })
    expect(cb).toHaveBeenCalled()
  })

  test('getByUserId', () => {
    const cb = jest.fn()
    Notification.getByUserId(2, cb)
    db.query.mock.calls[0][2](null, [])
    expect(cb).toHaveBeenCalled()
  })

  test('getById', () => {
    const cb = jest.fn()
    Notification.getById(3, cb)
    db.query.mock.calls[0][2](null, [])
    expect(cb).toHaveBeenCalled()
  })

  test('markAsViewed', () => {
    const cb = jest.fn()
    Notification.markAsViewed(4, cb)
    db.query.mock.calls[0][2](null)
    expect(cb).toHaveBeenCalled()
  })

  test('deleteById', () => {
    const cb = jest.fn()
    Notification.deleteById(5, cb)
    db.query.mock.calls[0][2](null)
    expect(cb).toHaveBeenCalled()
  })
})
