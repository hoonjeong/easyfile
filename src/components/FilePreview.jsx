import { formatFileSize, getFileExtension } from '../utils/fileValidation';

const FilePreview = ({ file, previewUrl, onRemove }) => {
  const getExtensionDisplay = (filename) => {
    const ext = getFileExtension(filename);
    return ext ? ext.toUpperCase().replace('.', '') : 'FILE';
  };

  return (
    <div className="file-preview">
      <div className="file-info">
        <div className="file-icon">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="file-details">
          <h4>{file.name}</h4>
          <span>{getExtensionDisplay(file.name)} • {formatFileSize(file.size)}</span>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            style={{
              marginLeft: 'auto',
              padding: '8px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#EF4444',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.2)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {previewUrl && (
        <img src={previewUrl} alt="미리보기" className="preview-image" />
      )}
    </div>
  );
};

export default FilePreview;
