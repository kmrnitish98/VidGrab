// server.js — Entry point for the Express backend

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load .env variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure downloads directory exists
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  exposedHeaders: ['Content-Disposition']
}));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────
const downloadRoute = require('./routes/downloadRoute');
app.use('/api', downloadRoute);

// ── Start Server ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ VidGrab server running on http://localhost:${PORT}`);
});
