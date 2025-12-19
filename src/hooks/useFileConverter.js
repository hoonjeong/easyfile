import { useState, useCallback } from 'react';
import usePreviewUrl from './usePreviewUrl';

/**
 * Custom hook for managing file converter state
 * Provides common state and handlers for all file converters
 */
const useFileConverter = (options = {}) => {
  const { createPreview = true } = options;

  const [file, setFile] = useState(null);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const { previewUrl, createPreviewUrl, revokePreviewUrl } = usePreviewUrl();

  const handleFileSelect = useCallback((selectedFile) => {
    revokePreviewUrl();
    setFile(selectedFile);
    setResult(null);
    setError(null);
    setProgress(0);
    setProgressText('');

    if (createPreview && selectedFile) {
      createPreviewUrl(selectedFile);
    }
  }, [createPreview, createPreviewUrl, revokePreviewUrl]);

  const handleRemoveFile = useCallback(() => {
    revokePreviewUrl();
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setProgressText('');
  }, [revokePreviewUrl]);

  const resetState = useCallback(() => {
    revokePreviewUrl();
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setProgressText('');
    setConverting(false);
  }, [revokePreviewUrl]);

  const startConverting = useCallback(() => {
    setConverting(true);
    setError(null);
    setProgress(0);
  }, []);

  const finishConverting = useCallback((resultBlob) => {
    setResult(resultBlob);
    setProgress(100);
    setConverting(false);
  }, []);

  const setConversionError = useCallback((errorMessage) => {
    setError(errorMessage);
    setConverting(false);
  }, []);

  return {
    // State
    file,
    previewUrl,
    converting,
    progress,
    progressText,
    result,
    error,

    // Setters
    setFile,
    setProgress,
    setProgressText,
    setResult,
    setError,
    setConverting,

    // Handlers
    handleFileSelect,
    handleRemoveFile,
    resetState,
    startConverting,
    finishConverting,
    setConversionError,

    // Preview URL helpers
    createPreviewUrl,
    revokePreviewUrl
  };
};

export default useFileConverter;
