import { saveAs } from 'file-saver';

/**
 * Sanitize filename to prevent path traversal and special character attacks
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
export const sanitizeFilename = (filename) => {
  if (!filename || typeof filename !== 'string') {
    return 'download';
  }

  // Remove path traversal patterns
  let sanitized = filename
    .replace(/\.\./g, '')           // Remove ..
    .replace(/[\/\\]/g, '_')        // Replace path separators with underscore
    .replace(/^\.+/, '')            // Remove leading dots
    .replace(/[\x00-\x1f\x80-\x9f]/g, '') // Remove control characters
    .replace(/[<>:"|?*]/g, '_')     // Replace Windows invalid chars
    .replace(/\s+/g, '_')           // Replace whitespace with underscore
    .trim();

  // Ensure filename is not empty after sanitization
  if (!sanitized || sanitized === '.' || sanitized === '..') {
    sanitized = 'download';
  }

  // Limit filename length (255 is common filesystem limit)
  if (sanitized.length > 200) {
    const ext = sanitized.match(/\.[^.]+$/)?.[0] || '';
    sanitized = sanitized.substring(0, 200 - ext.length) + ext;
  }

  return sanitized;
};

export const downloadFile = (blob, filename) => {
  const safeFilename = sanitizeFilename(filename);
  saveAs(blob, safeFilename);
};

export const getFilenameWithNewExtension = (originalName, newExtension) => {
  const sanitized = sanitizeFilename(originalName);
  const nameWithoutExt = sanitized.replace(/\.[^/.]+$/, '');
  // Sanitize extension too
  const safeExt = newExtension.replace(/[^a-zA-Z0-9]/g, '');
  return `${nameWithoutExt}.${safeExt}`;
};

export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const base64ToBlob = (base64, type) => {
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type });
};
