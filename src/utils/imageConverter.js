import heic2any from 'heic2any';

// HEIC to JPG/PNG
export const convertHeic = async (file, outputFormat = 'image/jpeg', quality = 0.92) => {
  const result = await heic2any({
    blob: file,
    toType: outputFormat,
    quality: quality
  });
  return result instanceof Blob ? result : result[0];
};

// WebP/AVIF to JPG/PNG using Canvas
export const convertImageWithCanvas = async (file, outputFormat = 'image/jpeg', quality = 0.92) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');

      // 흰색 배경 (JPEG용)
      if (outputFormat === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('이미지 변환에 실패했습니다.'));
          }
        },
        outputFormat,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지를 불러올 수 없습니다.'));
    };

    img.src = url;
  });
};

// SVG to PNG
export const convertSvgToPng = async (file, scale = 2) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const svgData = e.target.result;
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('SVG 변환에 실패했습니다.'));
            }
          },
          'image/png'
        );
      };

      img.onerror = () => {
        reject(new Error('SVG를 불러올 수 없습니다.'));
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
    reader.readAsText(file);
  });
};

// ICO to PNG
export const convertIcoToPng = async (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width || 256;
      canvas.height = img.height || 256;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('ICO 변환에 실패했습니다.'));
          }
        },
        'image/png'
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('ICO 파일을 불러올 수 없습니다.'));
    };

    img.src = url;
  });
};

// Create image preview URL
export const createPreviewUrl = (file) => {
  return URL.createObjectURL(file);
};

// Revoke preview URL
export const revokePreviewUrl = (url) => {
  URL.revokeObjectURL(url);
};
