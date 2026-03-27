const express = require('express')
const router = express.Router()
const { joinQueue, getQueueStatus, leaveQueue, getQueue, serveNext } = require('../controllers/queueController')

router.get('/', getQueue)
router.post('/join', joinQueue)
router.get('/status/:userId', getQueueStatus)
router.delete('/leave/:userId', leaveQueue)
router.post('/serve-next', serveNext)

module.exports = router
