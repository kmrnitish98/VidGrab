// Spinner.jsx — CSS-only loading spinner

function Spinner({ size = 'normal' }) {
  return (
    <span
      className={`spinner spinner-${size}`}
      role="status"
      aria-label="Loading"
    ></span>
  );
}

export default Spinner;
