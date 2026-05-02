// backend/server.js
const express = require('express')
const cors = require('cors')
const app = express()
const reportRoutes = require('./src/routes/reportRoutes')

app.use(cors())
app.use(express.json())

// Routes
const authRoutes = require('./src/routes/authRoutes')
const serviceRoutes = require('./src/routes/serviceRoutes')
const queueRoutes = require('./src/routes/queueRoutes')
const notificationRoutes = require('./src/routes/notificationRoutes')
const historyRoutes = require('./src/routes/historyRoutes')

app.use('/api/auth', authRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/queue', queueRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/history', historyRoutes)
app.use('/api/reports', reportRoutes)

const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '127.0.0.1'

app.startServer = (port = PORT, host = HOST) => {
  return app.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}`)
  })
}

if (require.main === module) {
  app.startServer()
}

module.exports = app
