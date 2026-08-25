// StatusMessage.jsx — Displays success, error, or loading messages

function StatusMessage({ type, message }) {
  if (!message) return null;

  return (
    <div className={`status-message status-${type}`} id="status-message">
      {type === 'loading' && <span className="spinner spinner-small"></span>}
      <span>{message}</span>
    </div>
  );
}

export default StatusMessage;
