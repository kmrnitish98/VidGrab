// App.jsx — Root component for VidGrab
// Step 2: Shows the app header + download form, connected to backend

import DownloadForm from './components/DownloadForm';

function App() {
  return (
    <div className="app">
      <div className="container">
        <header className="app-header">
          <h1 className="app-logo">⬇ VidGrab</h1>
          <p className="app-tagline">Download videos from anywhere — fast &amp; free</p>
        </header>

        <main className="app-main">
          <DownloadForm />
        </main>

        <footer className="app-footer">
          <p>For personal use only. Only download content you have rights to.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
