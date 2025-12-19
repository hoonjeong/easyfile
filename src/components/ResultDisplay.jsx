import { useTranslation } from 'react-i18next';

/**
 * Common result display component
 * Used across all converter pages for consistent success/download UI
 */
const ResultDisplay = ({
  result,
  onDownload,
  downloadLabel,
  title,
  children
}) => {
  const { t } = useTranslation();

  if (!result) return null;

  return (
    <div className="result">
      <h4 className="result-title">
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {title || t('common.conversionComplete')}
      </h4>
      {children}
      <button className="download-button" onClick={onDownload}>
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        {downloadLabel || t('common.download')}
      </button>
    </div>
  );
};

export default ResultDisplay;
