// downloadRoute.js — Express router for /api/download

const express = require('express');
const router = express.Router();
const { handleDownload } = require('../controllers/downloadController');

// POST /api/download — download a video from the given URL (for API clients)
router.post('/download', handleDownload);

// GET /api/download?url=... — download a video (for browser native download)
router.get('/download', handleDownload);

module.exports = router;
