/**
 * Common convert button component
 * Used across all converter pages for consistent convert button UI
 */
const ConvertButton = ({
  onClick,
  disabled,
  converting,
  result,
  children
}) => {
  // Don't show button if converting or result exists
  if (converting || result) return null;

  return (
    <button
      className="convert-button"
      onClick={onClick}
      disabled={disabled}
    >
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      {children}
    </button>
  );
};

export default ConvertButton;
