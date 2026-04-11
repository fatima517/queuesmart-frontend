const app = require('./server')
const port = Number(process.env.PORT) || 3000
app.startServer(port)
