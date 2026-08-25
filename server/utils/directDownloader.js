// directDownloader.js — Downloads direct video URLs (.mp4, .webm, .mov)
// Uses axios to stream the file directly to the client.

const axios = require('axios');
const path = require('path');
const mime = require('mime-types');

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
const DOWNLOAD_TIMEOUT = 1800 * 1000; // 30 minutes

/**
 * Streams a direct video URL.
 * @param {string} url - The direct video URL
 * @returns {Promise<{stream: import('stream').Readable, fileName: string, mimeType: string, size?: number}>}
 */
async function downloadDirect(url) {
  // Make a HEAD request first to check content-type and size
  let contentType = 'video/mp4';
  try {
    const headResponse = await axios.head(url, { timeout: 10000 });
    const contentLength = parseInt(headResponse.headers['content-length'], 10);
    if (contentLength && contentLength > MAX_FILE_SIZE) {
      const error = new Error(`File too large (${Math.round(contentLength / 1024 / 1024)}MB). Max is 500MB.`);
      error.statusCode = 413;
      throw error;
    }
    if (headResponse.headers['content-type']) {
      contentType = headResponse.headers['content-type'].split(';')[0].trim();
    }
  } catch (err) {
    if (err.statusCode) throw err;
    // HEAD might not be supported, continue with GET
  }

  // Determine file extension from content type or URL
  let ext = mime.extension(contentType) || 'mp4';
  const urlPath = new URL(url).pathname;
  const urlExt = path.extname(urlPath).replace('.', '');
  if (['mp4', 'webm', 'mov'].includes(urlExt)) {
    ext = urlExt;
  }

  const fileName = `video-${Date.now()}.${ext}`;

  // Stream download
  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'stream',
    timeout: DOWNLOAD_TIMEOUT,
    maxContentLength: MAX_FILE_SIZE,
    maxBodyLength: MAX_FILE_SIZE,
  });

  // Check content-length from GET response
  const contentLength = parseInt(response.headers['content-length'], 10);
  if (contentLength && contentLength > MAX_FILE_SIZE) {
    response.data.destroy();
    const error = new Error(`File too large (${Math.round(contentLength / 1024 / 1024)}MB). Max is 500MB.`);
    error.statusCode = 413;
    throw error;
  }

  return { 
    stream: response.data, 
    fileName, 
    mimeType: mime.lookup(ext) || 'video/mp4',
    size: contentLength,
    cancel: () => {
      if (response && response.data) response.data.destroy();
    }
  };
}

module.exports = { downloadDirect };

