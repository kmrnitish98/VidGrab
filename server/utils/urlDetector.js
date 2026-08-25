// urlDetector.js — Detects the type of URL: direct / youtube / instagram / invalid
// This helps the controller decide which downloader to use.

/**
 * Checks if a URL is a direct video link (.mp4, .webm, .mov)
 */
function isDirectVideoUrl(url) {
  const videoExtensions = /\.(mp4|webm|mov)(\?.*)?$/i;
  return videoExtensions.test(url);
}

/**
 * Checks if a URL is a YouTube video link
 * Supports: youtube.com/watch, youtu.be, youtube.com/shorts, youtube.com/embed
 */
function isYoutubeUrl(url) {
  const youtubePatterns = [
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?/i,
    /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\//i,
    /^(https?:\/\/)?(www\.)?youtube\.com\/embed\//i,
    /^(https?:\/\/)?youtu\.be\//i,
    /^(https?:\/\/)?(www\.)?youtube\.com\/v\//i,
  ];
  return youtubePatterns.some((pattern) => pattern.test(url));
}

/**
 * Checks if a URL is an Instagram post/reel link
 */
function isInstagramUrl(url) {
  const instagramPatterns = [
    /^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel|reels|tv)\//i,
  ];
  return instagramPatterns.some((pattern) => pattern.test(url));
}

/**
 * Checks if a URL is an m3u8 stream
 */
function isM3u8Url(url) {
  return /\.m3u8(\?.*)?$/i.test(url);
}

/**
 * Detects URL type. Returns: 'direct' | 'youtube' | 'instagram' | 'm3u8' | 'invalid'
 */
function detectUrlType(url) {
  if (!url || typeof url !== 'string') return 'invalid';

  const trimmed = url.trim();

  // Must be http or https
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return 'invalid';
  }

  // Try to parse as a valid URL
  try {
    new URL(trimmed);
  } catch {
    return 'invalid';
  }

  // Check in priority order
  if (isDirectVideoUrl(trimmed)) return 'direct';
  if (isYoutubeUrl(trimmed)) return 'youtube';
  if (isInstagramUrl(trimmed)) return 'instagram';
  if (isM3u8Url(trimmed)) return 'm3u8';

  return 'invalid';
}

module.exports = { detectUrlType, isDirectVideoUrl, isYoutubeUrl, isInstagramUrl, isM3u8Url };
