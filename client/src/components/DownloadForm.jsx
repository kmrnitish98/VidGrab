// DownloadForm.jsx — Main form component
// User pastes a URL, clicks Download, gets the video file saved to their computer.

import { useState } from 'react';
import Spinner from './Spinner';
import StatusMessage from './StatusMessage';

const API_URL = import.meta.env.VITE_API_URL;

function DownloadForm() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState(null); // { type: 'success'|'error'|'loading', message: '' }
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!url.trim()) {
      setStatus({ type: 'error', message: 'Please paste a video URL first.' });
      return;
    }

    setLoading(true);
    setStatus({ type: 'loading', message: 'Verifying URL...' });

    try {
      // 1. Check if the URL is valid
      const response = await fetch(`${API_URL}/api/download`,  {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), checkOnly: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        setStatus({ type: 'error', message: data.error || 'Invalid URL or server error.' });
        setLoading(false);
        return;
      }

      // 2. Start the actual download using the browser's native downloader
      setStatus({ type: 'success', message: 'Download started! The file will be saved by your browser when ready. This may take a few minutes for large files.' });
      
      const downloadUrl = `${API_URL}/api/download?url=${encodeURIComponent(url.trim())}`;
      window.location.href = downloadUrl;
      
      // Clear the input after starting
      setTimeout(() => {
        setUrl('');
        setLoading(false);
      }, 1000);

    } catch (err) {
      setStatus({
        type: 'error',
        message: 'Cannot reach server. Make sure the backend is running on port 5000.',
      });
      setLoading(false);
    }
  };

  return (
    <form className="download-form" onSubmit={handleSubmit} id="download-form">
      <div className="input-group">
        <input
          type="text"
          id="url-input"
          className="url-input"
          placeholder="Paste YouTube / Instagram / Direct video URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          autoComplete="off"
          spellCheck="false"
        />
        <button
          type="submit"
          id="download-btn"
          className="download-btn"
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner size="small" />
              <span>Downloading...</span>
            </>
          ) : (
            '⬇ Download'
          )}
        </button>
      </div>

      {status && <StatusMessage type={status.type} message={status.message} />}

      <p className="supported-sources">
        Supports: YouTube · Instagram Reels · Direct .mp4 / .webm / .m3u8 streams
      </p>
    </form>
  );
}

export default DownloadForm;
