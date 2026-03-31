const express = require('express')
const { handleGenerateNewShortURL, handleGetNewShortURL } = require('../controller/url.controller')

const router = express.Router()

router.post('/', handleGenerateNewShortURL)

router.get('/:shortId', handleGetNewShortURL)

module.exports = router