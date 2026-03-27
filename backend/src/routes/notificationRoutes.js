const express = require('express')
const router = express.Router()
const { getUserNotifications, markAsRead } = require('../controllers/notificationController')

router.get('/:userId', getUserNotifications)
router.put('/:id/read', markAsRead)

module.exports = router
