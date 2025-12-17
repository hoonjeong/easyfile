import { saveAs } from 'file-saver';

export const downloadFile = (blob, filename) => {
  saveAs(blob, filename);
};

export const getFilenameWithNewExtension = (originalName, newExtension) => {
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  return `${nameWithoutExt}.${newExtension}`;
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
