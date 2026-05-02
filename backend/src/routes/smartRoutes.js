const express = require('express')
const router = express.Router()
const { getRecommendation } = require('../controllers/smartController')

router.get('/recommend', getRecommendation)

module.exports = router
