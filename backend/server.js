// backend/server.js
const express = require('express')
const cors = require('cors')
const app = express()

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

const PORT = 3000

app.startServer = (port = PORT) => {
  return app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
  })
}

module.exports = app
