const store = require('../data/store')

const getUserNotifications = (req, res) => {
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' })
    }

    const userNotifications = store.notifications.filter(n => n.userId === userId)
    res.status(200).json(userNotifications)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications' })
  }
}

const markAsRead = (req, res) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ message: 'Notification id is required' })
    }

    const notification = store.notifications.find(n => n.id === id)
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' })
    }

    notification.read = true
    res.status(200).json({ message: 'Notification marked as read', notification })
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification' })
  }
}

module.exports = { getUserNotifications, markAsRead }
