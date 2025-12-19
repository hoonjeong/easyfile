/**
 * Common error display component
 * Used across all converter pages for consistent error UI
 */
const ErrorDisplay = ({ error }) => {
  if (!error) return null;

  return (
    <div className="error">
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      {error}
    </div>
  );
};

export default ErrorDisplay;
