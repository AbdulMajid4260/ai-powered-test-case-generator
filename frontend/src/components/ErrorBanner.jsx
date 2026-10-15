export default function ErrorBanner({ error, onDismiss }) {
  if (!error) return null;
  return (
    <div className="banner" role="alert">
      <div>
        <strong>{error.title}</strong>
        <p>{error.message}</p>
      </div>
      <button type="button" className="banner-close" onClick={onDismiss} aria-label="Dismiss error">
        &times;
      </button>
    </div>
  );
}
