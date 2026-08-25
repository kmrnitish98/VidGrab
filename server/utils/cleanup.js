// cleanup.js — Deletes temp files after download completes or fails

const fs = require('fs');
const path = require('path');

/**
 * Deletes a temp file. Logs errors but doesn't throw.
 * @param {string} filePath - Absolute path to the file to delete
 */
function cleanupFile(filePath) {
  if (!filePath) return;

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Cleaned up: ${path.basename(filePath)}`);
    }
  } catch (err) {
    console.error(`⚠️  Failed to clean up ${path.basename(filePath)}:`, err.message);
  }
}

module.exports = { cleanupFile };
