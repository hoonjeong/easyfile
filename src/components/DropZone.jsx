import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  validateFileType,
  securityCheck,
  formatFileSize,
  MAX_FILE_SIZES
} from '../utils/fileValidation';

const DropZone = ({
  onFileSelect,
  acceptedTypes,
  fileCategory,
  maxSize,
  multiple = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const { t } = useTranslation();

  // Get max size from category or use provided value or default
  const getMaxSize = () => {
    if (maxSize) return maxSize;
    if (fileCategory && MAX_FILE_SIZES[fileCategory]) {
      return MAX_FILE_SIZES[fileCategory];
    }
    return 100 * 1024 * 1024; // 100MB default
  };

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
    setError(null);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      if (multiple) {
        files.forEach(file => validateAndSelect(file));
      } else {
        validateAndSelect(files[0]);
      }
    }
  }, [onFileSelect, acceptedTypes, fileCategory, multiple]);

  const handleFileInput = useCallback((e) => {
    setError(null);
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      if (multiple) {
        files.forEach(file => validateAndSelect(file));
      } else {
        validateAndSelect(files[0]);
      }
    }
    // Reset input to allow selecting same file again
    e.target.value = '';
  }, [onFileSelect, acceptedTypes, fileCategory, multiple]);

  const validateAndSelect = (file) => {
    const currentMaxSize = getMaxSize();

    // Step 1: Basic security check (blocks dangerous files)
    const securityResult = securityCheck(file);
    if (!securityResult.valid) {
      const errorMsg = t(securityResult.error);
      setError(errorMsg);
      return;
    }

    // Step 2: File size check
    if (file.size > currentMaxSize) {
      setError(t('validation.fileTooLarge', { max: formatFileSize(currentMaxSize) }));
      return;
    }

    // Step 3: File type validation (if category specified)
    if (fileCategory) {
      const typeResult = validateFileType(file, fileCategory);
      if (!typeResult.valid) {
        const errorMsg = t(typeResult.error, { allowed: typeResult.allowed || '' });
        setError(errorMsg);
        return;
      }
    }

    // All validations passed
    setError(null);
    onFileSelect(file);
  };

  const handleClick = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  const formatAcceptedTypes = () => {
    if (!acceptedTypes) return '*';
    return acceptedTypes.join(',');
  };

  return (
    <div className="drop-zone-wrapper">
      <div
        className={`drop-zone ${isDragging ? 'active' : ''} ${error ? 'has-error' : ''}`}
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
      {error && (
        <div className="drop-zone-error">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default DropZone;
