// instagramDownloader.js — Downloads Instagram Reels/Posts (best-effort)
//
// ⚠️  IMPORTANT: Instagram has no official download API. This uses web scraping
// which WILL break when Instagram changes their page structure.
// This is expected and acceptable for a personal-use tool.
//
// Approach: Fetch the Instagram page HTML and extract the video URL from
// the embedded meta tags (og:video).

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DOWNLOADS_DIR = path.join(__dirname, '..', 'downloads');
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
const DOWNLOAD_TIMEOUT = 1800 * 1000; // 30 minutes

/**
 * Tries to extract a video URL from an Instagram page.
 * Uses og:video meta tag from HTML.
 * @param {string} url - Instagram post/reel URL
 * @returns {Promise<string>} - Direct video URL
 */
async function extractInstagramVideoUrl(url) {
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
      },
      maxRedirects: 5,
    });

    const html = response.data;

    // Try og:video meta tag
    const ogVideoMatch = html.match(/<meta\s+property=["']og:video["']\s+content=["']([^"']+)["']/i)
      || html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:video["']/i);

    if (ogVideoMatch && ogVideoMatch[1]) {
      // Decode HTML entities
      return ogVideoMatch[1].replace(/&amp;/g, '&');
    }

    // Try to find video_url in embedded JSON data
    const jsonMatch = html.match(/"video_url"\s*:\s*"([^"]+)"/);
    if (jsonMatch && jsonMatch[1]) {
      return jsonMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
    }

    // If we got HTML but no video URL, the post might be an image or private
    if (html.includes('Login') || html.includes('log in')) {
      const error = new Error('This Instagram post appears to be private or requires login.');
      error.statusCode = 403;
      throw error;
    }

    const error = new Error(
      'Could not extract video from this Instagram URL. ' +
      'The post may be an image (not a video), private, or Instagram may have changed their page structure.'
    );
    error.statusCode = 404;
    throw error;
  } catch (err) {
    if (err.statusCode) throw err;

    if (err.response && err.response.status === 404) {
      const error = new Error('Instagram post not found.');
      error.statusCode = 404;
      throw error;
    }

    const error = new Error('Failed to access Instagram: ' + err.message);
    error.statusCode = 500;
    throw error;
  }
}

/**
 * Streams an Instagram video.
 * @param {string} url - The Instagram post/reel URL
 * @returns {Promise<{stream: import('stream').Readable, fileName: string, mimeType: string, size?: number}>}
 */
async function downloadInstagram(url) {
  // Step 1: Extract the actual video URL from the Instagram page
  const videoUrl = await extractInstagramVideoUrl(url);

  // Step 2: Stream the video file
  const fileName = `instagram-${Date.now()}.mp4`;

  const response = await axios({
    method: 'GET',
    url: videoUrl,
    responseType: 'stream',
    timeout: DOWNLOAD_TIMEOUT,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.instagram.com/',
    },
  });
  
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
    mimeType: 'video/mp4',
    size: contentLength,
    cancel: () => {
      if (response && response.data) response.data.destroy();
    }
  };
}

module.exports = { downloadInstagram };
