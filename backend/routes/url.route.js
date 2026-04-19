const express = require('express')
const { handleGenerateNewShortURL, handleGetNewShortURL, handleGetAnalytics } = require('../controller/url.controller')

const router = express.Router()

router.post('/', handleGenerateNewShortURL)

router.get('/analytics/:shortId', handleGetAnalytics)  

router.get('/:shortId', handleGetNewShortURL)

module.exports = router