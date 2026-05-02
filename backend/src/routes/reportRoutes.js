const express = require('express')
const router  = express.Router()
const { getReportData, exportCSV, exportPDF } = require('../controllers/reportController')
const { authenticate, requireAdmin } = require('../middleware/authMiddleware')

router.use(authenticate, requireAdmin)

router.get('/data', getReportData)
router.get('/csv',  exportCSV)
router.get('/pdf',  exportPDF)

module.exports = router
