const express = require('express')
const connectDb = require('./config/db')
const urlRouter = require('./routes/url.route')

const app = express()

// Middleware
app.use(express.json())

// DB Connection
connectDb("mongodb://127.0.0.1:27017/short-url")
.then(() => console.log("Connect to MongoDB"))
.catch((err) => console.log("err", err))

// Route
app.use('/url', urlRouter)


app.listen(8001, () => console.log("Server is running on 8001"))