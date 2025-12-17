import { useState, useRef, useCallback } from 'react';

const DropZone = ({ onFileSelect, acceptedTypes, maxSize = 100 * 1024 * 1024 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

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
      validateAndSelect(files[0]);
    }
  }, [onFileSelect, acceptedTypes, maxSize]);

  const handleFileInput = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      validateAndSelect(files[0]);
    }
  }, [onFileSelect, acceptedTypes, maxSize]);

  const validateAndSelect = (file) => {
    if (file.size > maxSize) {
      alert(`파일 크기가 너무 큽니다. 최대 ${Math.round(maxSize / 1024 / 1024)}MB까지 지원됩니다.`);
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
        style={{ display: 'none' }}
      />
      <svg className="drop-zone-icon" fill="none" viewBox="0 0 64 64" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M32 12v28m0 0l-10-10m10 10l10-10M12 44v4a4 4 0 004 4h32a4 4 0 004-4v-4" />
      </svg>
      <h3 className="drop-zone-title">파일을 드래그하거나 클릭하세요</h3>
      <p className="drop-zone-subtitle">또는 클릭하여 파일을 선택하세요</p>
      <span className="drop-zone-button">파일 선택</span>
    </div>
  );
};

export default DropZone;
