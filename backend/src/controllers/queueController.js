const store = require('../data/store')

const joinQueue = (req, res) => {
  try {
    const { userId, serviceId } = req.body

    if (!userId || !serviceId) {
      return res.status(400).json({ message: 'userId and serviceId are required' })
    }
    if (typeof userId !== 'string') {
      return res.status(400).json({ message: 'userId must be a string' })
    }
    if (typeof serviceId !== 'string') {
      return res.status(400).json({ message: 'serviceId must be a string' })
    }

    const user = store.users.find(u => u.id === userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const service = store.services.find(s => s.id === serviceId)
    if (!service) {
      return res.status(404).json({ message: 'Service not found' })
    }

    const alreadyInQueue = store.queue.find(q => q.userId === userId && q.status === 'waiting')
    if (alreadyInQueue) {
      return res.status(409).json({ message: 'User is already in a queue' })
    }

    const position = store.queue.filter(q => q.serviceId === serviceId && q.status === 'waiting').length + 1
    const waitTime = position * service.expectedDuration

    const newEntry = {
      queueId: 'q' + Date.now(),
      userId,
      serviceId,
      joinedAt: new Date(),
      priority: service.priorityLevel || 'normal',
      status: 'waiting',
      position,
      waitTime
    }

    store.queue.push(newEntry)

    store.notifications.push({
      id: 'n' + Date.now(),
      userId,
      message: `You joined the queue for ${service.name}. Your position: #${position}. Estimated wait: ${waitTime} minutes.`,
      type: 'joined',
      read: false,
      timestamp: new Date()
    })

    res.status(201).json({ message: 'Joined queue', queueEntry: newEntry })
  } catch (error) {
    res.status(500).json({ message: 'Error joining queue' })
  }
}

const getQueueStatus = (req, res) => {
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' })
    }

    const entry = store.queue.find(q => q.userId === userId && q.status === 'waiting')
    if (!entry) {
      return res.status(404).json({ message: 'User is not in any queue' })
    }

    const service = store.services.find(s => s.id === entry.serviceId)
    if (!service) {
      return res.status(404).json({ message: 'Service not found' })
    }

    const waitingEntries = store.queue.filter(q => q.serviceId === entry.serviceId && q.status === 'waiting')
    const position = waitingEntries.findIndex(q => q.userId === userId) + 1
    const waitTime = position * service.expectedDuration

    entry.position = position
    entry.waitTime = waitTime

    if (position <= 2) {
      const hasAlmostNotif = store.notifications.some(n => n.userId === userId && n.type === 'almost')
      if (!hasAlmostNotif) {
        store.notifications.push({
          id: 'n' + (Date.now() + 1),
          userId,
          message: `You are almost up! Only ${position} person(s) ahead of you for ${service.name}.`,
          type: 'almost',
          read: false,
          timestamp: new Date()
        })
      }
    }

    res.status(200).json({
      queueEntry: entry,
      position,
      waitTime,
      serviceName: service.name
    })
  } catch (error) {
    res.status(500).json({ message: 'Error fetching queue status' })
  }
}

const leaveQueue = (req, res) => {
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' })
    }

    const index = store.queue.findIndex(q => q.userId === userId && q.status === 'waiting')
    if (index === -1) {
      return res.status(404).json({ message: 'User is not in any queue' })
    }

    const entry = store.queue[index]
    store.queue.splice(index, 1)

    store.history.push({
      id: 'h' + Date.now(),
      userId,
      serviceId: entry.serviceId,
      servedAt: new Date(),
      waitTime: entry.waitTime || 0,
      outcome: 'left'
    })

    res.status(200).json({ message: 'Left queue successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error leaving queue' })
  }
}

const getQueue = (req, res) => {
  try {
    res.status(200).json(store.queue)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching queue' })
  }
}

const serveNext = (req, res) => {
  try {
    const waitingEntries = store.queue.filter(q => q.status === 'waiting')
    if (waitingEntries.length === 0) {
      return res.status(404).json({ message: 'No one in queue' })
    }

    const next = waitingEntries[0]
    const index = store.queue.findIndex(q => q.queueId === next.queueId)
    store.queue.splice(index, 1)

    const service = store.services.find(s => s.id === next.serviceId)

    store.notifications.push({
      id: 'n' + Date.now(),
      userId: next.userId,
      message: `It's your turn! Please proceed to ${service ? service.name : 'the service counter'}.`,
      type: 'served',
      read: false,
      timestamp: new Date()
    })

    store.history.push({
      id: 'h' + Date.now(),
      userId: next.userId,
      serviceId: next.serviceId,
      servedAt: new Date(),
      waitTime: next.waitTime || 0,
      outcome: 'served'
    })

    res.status(200).json({ message: 'Served next in queue', served: next })
  } catch (error) {
    res.status(500).json({ message: 'Error serving next in queue' })
  }
}

module.exports = { joinQueue, getQueueStatus, leaveQueue, getQueue, serveNext }
