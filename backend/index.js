const express = require('express')
const connectDb = require('./config/db')
const cors = require('cors')
const urlRouter = require('./routes/url.route')
const { handleGetNewShortURL } = require('./controller/url.controller')
require('dotenv').config()

const app = express()

// Middleware
app.use(express.json())
app.use(cors())

// DB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/short-url" // if have connetion string in env, if not then the local will get connected
connectDb(MONGO_URI)
  .then(() => console.log("Connect to MongoDB"))
  .catch((err) => console.log("err", err))

// Route
app.use('/url', urlRouter)

// Redirect Route
app.get('/:shortId', handleGetNewShortURL)

const PORT = process.env.PORT || 8001;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => console.log(`Server is running on ${PORT}`))
}

module.exports = app;