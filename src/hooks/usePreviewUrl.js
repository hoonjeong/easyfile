import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for managing object URLs with automatic cleanup
 * Prevents memory leaks by revoking URLs when they're no longer needed
 */
const usePreviewUrl = () => {
  const [previewUrl, setPreviewUrl] = useState(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const createPreviewUrl = useCallback((file) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return url;
    }
    setPreviewUrl(null);
    return null;
  }, [previewUrl]);

  const revokePreviewUrl = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl]);

  return {
    previewUrl,
    createPreviewUrl,
    revokePreviewUrl
  };
};

export default usePreviewUrl;
