import { saveAs } from 'file-saver';
import { sanitizeFilename } from './fileValidation';

// Re-export for backward compatibility
export { sanitizeFilename };

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
