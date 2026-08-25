// downloadController.js — Handles the POST /api/download request
// Validates URL, detects type, downloads video, streams it to client, cleans up.

const { detectUrlType } = require('../utils/urlDetector');
const { downloadDirect } = require('../utils/directDownloader');
const { downloadYoutube } = require('../utils/youtubeDownloader');
const { downloadInstagram } = require('../utils/instagramDownloader');

/**
 * POST /api/download
 * Expects: { url: "https://..." }
 * Returns: binary video stream (or JSON error)
 */
async function handleDownload(req, res) {
  try {
    const url = req.body.url || req.query.url;

    // ── Validate URL ─────────────────────────────────────
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid URL.',
      });
    }

    const trimmedUrl = url.trim();

    // ── Detect URL type ──────────────────────────────────
    const urlType = detectUrlType(trimmedUrl);
    console.log(`📥 URL: ${trimmedUrl} → Type: ${urlType}`);

    if (urlType === 'invalid') {
      return res.status(400).json({
        success: false,
        error: 'Unsupported URL. Please provide a YouTube, Instagram, or direct video link (http/https only).',
      });
    }

    if (req.body.checkOnly || req.query.checkOnly) {
      return res.json({ success: true, message: 'URL is valid, ready to download.' });
    }

    // ── Download based on type ───────────────────────────
    let result;

    switch (urlType) {
      case 'direct':
        console.log('⬇️  Streaming direct video...');
        result = await downloadDirect(trimmedUrl);
        break;

      case 'youtube':
        console.log('⬇️  Streaming YouTube video...');
        result = await downloadYoutube(trimmedUrl);
        break;

      case 'm3u8':
        console.log('⬇️  Streaming m3u8 stream using yt-dlp...');
        result = await downloadYoutube(trimmedUrl);
        break;

      case 'instagram':
        console.log('⬇️  Streaming Instagram video...');
        result = await downloadInstagram(trimmedUrl);
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Unsupported URL type.',
        });
    }

    if (!result || !result.stream) {
      return res.status(500).json({
        success: false,
        error: 'Failed to start download stream.',
      });
    }

    console.log(`✅ Streaming: ${result.fileName}`);

    // ── Stream file to client ────────────────────────────
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    if (result.size) {
      res.setHeader('Content-Length', result.size);
    }

    result.stream.pipe(res);

    result.stream.on('error', (err) => {
      console.error('Stream error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Error streaming file.',
        });
      }
    });

    res.on('close', () => {
      // If the client aborts the download, stop the underlying process/stream
      if (result && result.cancel) {
        try {
          result.cancel();
          console.log(`⏹️ Stream cancelled by client: ${result.fileName}`);
        } catch (e) {
          // ignore error
        }
      }
    });

  } catch (err) {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'An unexpected error occurred.';

    console.error(`❌ Error (${statusCode}): ${message}`);

    if (!res.headersSent) {
      res.status(statusCode).json({
        success: false,
        error: message,
      });
    }
  }
}

module.exports = { handleDownload };
