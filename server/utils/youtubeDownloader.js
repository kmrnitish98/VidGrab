// youtubeDownloader.js — Downloads YouTube videos using yt-dlp
// Solves issues with outdated or broken @distube/ytdl-core

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DOWNLOADS_DIR = path.join(__dirname, '..', 'downloads');
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
const DOWNLOAD_TIMEOUT = 1800 * 1000; // 30 minutes

// Path to yt-dlp binary (assumes it is in the server folder)
const YTDLP_PATH = process.platform === 'win32'
  ? path.join(__dirname, '..', 'yt-dlp.exe')
  : path.join(__dirname, '..', 'yt-dlp');

/**
 * Streams a video directly to the Express response using yt-dlp.
 * @param {string} url - The video URL
 * @returns {Promise<{stream: import('stream').Readable, fileName: string, mimeType: string}>}
 */
async function downloadYoutube(url) {
  // Ensure yt-dlp.exe is available
  if (!fs.existsSync(YTDLP_PATH)) {
    const binaryName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';

    throw new Error(
      `${binaryName} not found. ` +
      'Please make sure yt-dlp is installed and available on the server.'
      );
  }

  const ext = 'mp4';
  
  return new Promise((resolve, reject) => {
    // 1. First, fetch the video title
    const titleProcess = spawn(YTDLP_PATH, ['--get-title', url]);
    let title = 'video';
    
    titleProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        title = output.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 50);
      }
    });

    titleProcess.on('close', () => {
      const fileName = `${title}-${Date.now()}.${ext}`;

      // 2. Stream the video to stdout
      const args = [
        url,
        '-f', 'best[ext=mp4]/best', // pre-merged format to allow stdout streaming
        '-o', '-', // Output to stdout
        '--no-playlist',
        '--max-filesize', '500M' // Enforce max size in yt-dlp
      ];

      const child = spawn(YTDLP_PATH, args);
      
      child.stderr.on('data', (data) => {
        console.error(`yt-dlp stderr: ${data.toString()}`);
      });

      resolve({
        stream: child.stdout,
        fileName,
        mimeType: `video/${ext}`,
        cancel: () => {
          if (child && !child.killed) child.kill('SIGKILL');
        }
      });
    });
    
    titleProcess.on('error', (err) => {
      reject(new Error('Failed to fetch video info with yt-dlp: ' + err.message));
    });
  });
}

module.exports = { downloadYoutube };
