import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const DropZone = ({ onFileSelect, acceptedTypes, maxSize = 100 * 1024 * 1024, multiple = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const { t } = useTranslation();

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      if (multiple) {
        files.forEach(file => validateAndSelect(file));
      } else {
        validateAndSelect(files[0]);
      }
    }
  }, [onFileSelect, acceptedTypes, maxSize, multiple]);

  const handleFileInput = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      if (multiple) {
        files.forEach(file => validateAndSelect(file));
      } else {
        validateAndSelect(files[0]);
      }
    }
  }, [onFileSelect, acceptedTypes, maxSize, multiple]);

  const validateAndSelect = (file) => {
    if (file.size > maxSize) {
      alert(`File size too large. Maximum ${Math.round(maxSize / 1024 / 1024)}MB allowed.`);
      return;
    }
    onFileSelect(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const formatAcceptedTypes = () => {
    if (!acceptedTypes) return '*';
    return acceptedTypes.join(',');
  };

  return (
    <div
      className={`drop-zone ${isDragging ? 'active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={formatAcceptedTypes()}
        onChange={handleFileInput}
        multiple={multiple}
        style={{ display: 'none' }}
      />
      <svg className="drop-zone-icon" fill="none" viewBox="0 0 64 64" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M32 12v28m0 0l-10-10m10 10l10-10M12 44v4a4 4 0 004 4h32a4 4 0 004-4v-4" />
      </svg>
      <h3 className="drop-zone-title">{t('common.dragOrClick')}</h3>
      <p className="drop-zone-subtitle">{t('common.clickToSelect')}</p>
      <span className="drop-zone-button">{t('common.selectFile')}</span>
    </div>
  );
};

export default DropZone;
