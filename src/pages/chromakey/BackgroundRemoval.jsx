import { useState, useCallback, useRef, useEffect } from 'react';
import { removeBackground } from '@imgly/background-removal';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/SEOHead';
import CoupangBanner from '../../components/CoupangBanner';

// ============================================================================
// Constants
// ============================================================================

const CHROMAKEY_COLORS = [
  { value: 'transparent', title: 'Transparent' },
  { value: '#00FF00', title: 'Green Screen' },
  { value: '#0000FF', title: 'Blue Screen' },
  { value: '#FF00FF', title: 'Magenta' },
];

const QUALITY_OPTIONS = [
  { value: 'small', labelKey: 'bgRemoval.qualityFast', fallback: '빠름 (낮은 품질)' },
  { value: 'medium', labelKey: 'bgRemoval.qualityBalanced', fallback: '균형 (권장)' },
  { value: 'large', labelKey: 'bgRemoval.qualityHigh', fallback: '고품질 (느림)' },
];

const MASK_THRESHOLD = 128;

// ============================================================================
// Styles
// ============================================================================

const styles = {
  checkerboard: {
    backgroundColor: '#f0f0f0',
    backgroundImage: `
      linear-gradient(45deg, #ccc 25%, transparent 25%),
      linear-gradient(-45deg, #ccc 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #ccc 75%),
      linear-gradient(-45deg, transparent 75%, #ccc 75%)
    `,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
  },
  checkerboardSmall: {
    backgroundImage: `
      linear-gradient(45deg, #ccc 25%, transparent 25%),
      linear-gradient(-45deg, #ccc 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #ccc 75%),
      linear-gradient(-45deg, transparent 75%, #ccc 75%)
    `,
    backgroundSize: '10px 10px',
    backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
  },
  primaryButton: {
    padding: '12px 24px',
    backgroundColor: '#4F46E5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  secondaryButton: {
    padding: '12px 24px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  successButton: {
    padding: '12px 24px',
    backgroundColor: '#10B981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  warningButton: {
    padding: '12px 24px',
    backgroundColor: '#F59E0B',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  chromakeyButton: {
    padding: '12px 24px',
    backgroundColor: '#059669',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  indigoButton: {
    padding: '12px 24px',
    backgroundColor: '#6366F1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  disabledButton: {
    padding: '12px 24px',
    backgroundColor: '#ccc',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'not-allowed',
    fontSize: '16px',
  },
  colorButton: {
    width: '50px',
    height: '50px',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  select: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    cursor: 'pointer',
  },
  brushButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

const loadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

const parseHexColor = (hex) => ({
  r: parseInt(hex.slice(1, 3), 16),
  g: parseInt(hex.slice(3, 5), 16),
  b: parseInt(hex.slice(5, 7), 16),
});

const downloadFile = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const getBaseName = (filename) => filename?.replace(/\.[^/.]+$/, '') || 'image';

const applyMaskVisualization = (editData, maskData) => {
  for (let i = 0; i < editData.data.length; i += 4) {
    if (maskData.data[i] < MASK_THRESHOLD) {
      editData.data[i] = Math.min(255, editData.data[i] + 100);
      editData.data[i + 1] = Math.max(0, editData.data[i + 1] - 50);
      editData.data[i + 2] = Math.max(0, editData.data[i + 2] - 50);
      editData.data[i + 3] = 180;
    }
  }
  return editData;
};

const createMaskFromAlpha = (imageData) => {
  const maskData = new ImageData(imageData.width, imageData.height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const alpha = imageData.data[i + 3];
    maskData.data[i] = alpha;
    maskData.data[i + 1] = alpha;
    maskData.data[i + 2] = alpha;
    maskData.data[i + 3] = 255;
  }
  return maskData;
};

const drawBackgroundCover = (ctx, bgImg, canvasWidth, canvasHeight) => {
  const scale = Math.max(canvasWidth / bgImg.width, canvasHeight / bgImg.height);
  const width = bgImg.width * scale;
  const height = bgImg.height * scale;
  const x = (canvasWidth - width) / 2;
  const y = (canvasHeight - height) / 2;
  ctx.drawImage(bgImg, x, y, width, height);
};

// ============================================================================
// Sub-Components
// ============================================================================

const UploadArea = ({ image, onUpload, inputRef, icon, uploadText, subText, maxHeight = '300px' }) => (
  <div
    className="upload-area"
    onClick={() => inputRef.current?.click()}
    style={{ cursor: 'pointer' }}
  >
    {image ? (
      <div className="preview-container">
        <img src={image.url} alt="Preview" style={{ maxWidth: '100%', maxHeight }} />
        <p>{image.name}</p>
      </div>
    ) : (
      <div className="upload-placeholder">
        <span className="upload-icon">{icon}</span>
        <p>{uploadText}</p>
        {subText && <small>{subText}</small>}
      </div>
    )}
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      onChange={onUpload}
      style={{ display: 'none' }}
    />
  </div>
);

const ProgressBar = ({ progress, message }) => (
  <div className="progress-section" style={{ marginBottom: '20px' }}>
    <div style={{
      width: '100%',
      height: '8px',
      backgroundColor: '#e5e7eb',
      borderRadius: '4px',
      overflow: 'hidden',
    }}>
      <div style={{
        width: `${progress}%`,
        height: '100%',
        backgroundColor: '#4F46E5',
        transition: 'width 0.3s ease',
      }} />
    </div>
    <p style={{ marginTop: '8px', color: '#6b7280', fontSize: '14px' }}>
      {message} ({progress}%)
    </p>
  </div>
);

const BrushControls = ({ brushMode, setBrushMode, brushSize, setBrushSize, t }) => (
  <div style={{
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
  }}>
    <div style={{ display: 'flex', gap: '10px' }}>
      <button
        onClick={() => setBrushMode('restore')}
        style={{
          ...styles.brushButton,
          backgroundColor: brushMode === 'restore' ? '#10B981' : '#e5e7eb',
          color: brushMode === 'restore' ? 'white' : '#374151',
        }}
      >
        {t('bgRemoval.brushRestore', '복원 브러시')}
      </button>
      <button
        onClick={() => setBrushMode('erase')}
        style={{
          ...styles.brushButton,
          backgroundColor: brushMode === 'erase' ? '#EF4444' : '#e5e7eb',
          color: brushMode === 'erase' ? 'white' : '#374151',
        }}
      >
        {t('bgRemoval.brushErase', '제거 브러시')}
      </button>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontSize: '14px', color: '#374151' }}>
        {t('bgRemoval.brushSize', '브러시 크기')}: {brushSize}px
      </span>
      <input
        type="range"
        min="5"
        max="100"
        value={brushSize}
        onChange={(e) => setBrushSize(Number(e.target.value))}
        style={{ width: '120px' }}
      />
    </div>
  </div>
);

const ColorButton = ({ color, isSelected, onClick, title, isTransparent }) => {
  const baseStyle = {
    ...styles.colorButton,
    border: isSelected ? '3px solid #000' : '1px solid #ccc',
  };

  if (isTransparent) {
    return (
      <button
        onClick={onClick}
        style={{ ...baseStyle, ...styles.checkerboardSmall, position: 'relative' }}
        title={title}
      >
        <span style={{
          fontSize: '10px',
          position: 'absolute',
          bottom: '2px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#666',
        }}>
          투명
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      style={{ ...baseStyle, backgroundColor: color }}
      title={title}
    />
  );
};

const ChromakeyPanel = ({
  chromakeyColor,
  onColorChange,
  previewUrl,
  onDownload,
  onClose,
  t,
}) => {
  const isCustomColor = chromakeyColor !== 'transparent' &&
    !CHROMAKEY_COLORS.some(c => c.value === chromakeyColor);

  return (
    <div style={{
      marginTop: '20px',
      padding: '20px',
      backgroundColor: '#f9fafb',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
    }}>
      <h4 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>
        {t('bgRemoval.chromakeyTitle', '크로마키 배경 색상 선택')}
      </h4>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
        {CHROMAKEY_COLORS.map(({ value, title }) => (
          <ColorButton
            key={value}
            color={value}
            isSelected={chromakeyColor === value}
            onClick={() => onColorChange(value)}
            title={value === 'transparent' ? t('bgRemoval.transparent', '투명') : title}
            isTransparent={value === 'transparent'}
          />
        ))}
        <input
          type="color"
          value={chromakeyColor === 'transparent' ? '#ffffff' : chromakeyColor}
          onChange={(e) => onColorChange(e.target.value)}
          style={{
            ...styles.colorButton,
            border: isCustomColor ? '3px solid #000' : '1px solid #ccc',
            padding: '2px',
          }}
        />
      </div>

      {previewUrl && (
        <div style={{
          ...styles.checkerboard,
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: '15px',
        }}>
          <img
            src={previewUrl}
            alt="Chromakey Preview"
            style={{ maxWidth: '100%', maxHeight: '400px' }}
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={onDownload} style={styles.successButton}>
          {t('bgRemoval.downloadChromakey', '다운로드')}
        </button>
        <button onClick={onClose} style={styles.secondaryButton}>
          {t('bgRemoval.close', '닫기')}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const BackgroundRemoval = () => {
  const { t } = useTranslation();

  // Image states
  const [sourceImage, setSourceImage] = useState(null);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [removedBgImage, setRemovedBgImage] = useState(null);

  // Processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState(null);

  // Options
  const [useNewBackground, setUseNewBackground] = useState(false);
  const [modelQuality, setModelQuality] = useState('medium');

  // Mask editing states
  const [isEditMode, setIsEditMode] = useState(false);
  const [brushMode, setBrushMode] = useState('restore');
  const [brushSize, setBrushSize] = useState(30);
  const [isDrawing, setIsDrawing] = useState(false);
  const [originalImageData, setOriginalImageData] = useState(null);

  // Chromakey states
  const [showChromakeyPanel, setShowChromakeyPanel] = useState(false);
  const [chromakeyColor, setChromakeyColor] = useState('transparent');
  const [chromakeyPreviewUrl, setChromakeyPreviewUrl] = useState(null);

  // Refs
  const sourceInputRef = useRef(null);
  const backgroundInputRef = useRef(null);
  const canvasRef = useRef(null);
  const editCanvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const originalCanvasRef = useRef(null);

  // ============================================================================
  // Image Upload Handlers
  // ============================================================================

  const handleImageUpload = useCallback((e, setImage, resetStates = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(t('bgRemoval.error.invalidImage'));
      return;
    }

    const url = URL.createObjectURL(file);
    setImage({ file, url, name: file.name });
    setError(null);

    if (resetStates) {
      setResultImage(null);
      setRemovedBgImage(null);
      setIsEditMode(false);
      setOriginalImageData(null);
    }
  }, [t]);

  const handleSourceUpload = useCallback((e) => {
    handleImageUpload(e, setSourceImage, true);
  }, [handleImageUpload]);

  const handleBackgroundUpload = useCallback((e) => {
    handleImageUpload(e, setBackgroundImage);
  }, [handleImageUpload]);

  // ============================================================================
  // Background Removal Processing
  // ============================================================================

  const processRemoval = useCallback(async () => {
    if (!sourceImage) return;

    setIsProcessing(true);
    setProgress(0);
    setProgressMessage(t('bgRemoval.progress.loading'));
    setError(null);
    setIsEditMode(false);

    try {
      const blob = await removeBackground(sourceImage.file, {
        model: modelQuality,
        output: { format: 'image/png', quality: 1.0 },
        progress: (key, current, total) => {
          setProgress(Math.round((current / total) * 100));
          if (key === 'compute:inference') {
            setProgressMessage(t('bgRemoval.progress.processing'));
          } else if (key === 'fetch:model') {
            setProgressMessage(t('bgRemoval.progress.loadingModel'));
          }
        },
      });

      const removedUrl = URL.createObjectURL(blob);
      setRemovedBgImage(removedUrl);

      const [origImg, removedImg] = await Promise.all([
        loadImage(sourceImage.url),
        loadImage(removedUrl),
      ]);

      // Store original image data
      const origCanvas = originalCanvasRef.current;
      origCanvas.width = origImg.width;
      origCanvas.height = origImg.height;
      const origCtx = origCanvas.getContext('2d');
      origCtx.drawImage(origImg, 0, 0);
      setOriginalImageData(origCtx.getImageData(0, 0, origImg.width, origImg.height));

      // Create mask from alpha channel
      const maskCanvas = maskCanvasRef.current;
      maskCanvas.width = removedImg.width;
      maskCanvas.height = removedImg.height;
      const maskCtx = maskCanvas.getContext('2d');
      maskCtx.drawImage(removedImg, 0, 0);
      const removedData = maskCtx.getImageData(0, 0, removedImg.width, removedImg.height);
      const maskData = createMaskFromAlpha(removedData);
      maskCtx.putImageData(maskData, 0, 0);

      // Composite with background if needed
      if (useNewBackground && backgroundImage) {
        setProgressMessage(t('bgRemoval.progress.compositing'));
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const bgImg = await loadImage(backgroundImage.url);

        canvas.width = removedImg.width;
        canvas.height = removedImg.height;
        drawBackgroundCover(ctx, bgImg, canvas.width, canvas.height);
        ctx.drawImage(removedImg, 0, 0);

        const resultBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        setResultImage(URL.createObjectURL(resultBlob));
      } else {
        setResultImage(removedUrl);
      }

      setProgress(100);
      setProgressMessage(t('bgRemoval.progress.complete'));
    } catch (err) {
      console.error('Background removal failed:', err);
      if (err.message?.includes('SharedArrayBuffer')) {
        setError('이 기능은 보안 컨텍스트(HTTPS)가 필요합니다. 로컬 개발 서버에서는 작동하지 않을 수 있습니다.');
      } else if (err.message?.includes('fetch')) {
        setError('AI 모델을 다운로드할 수 없습니다. 인터넷 연결을 확인해주세요.');
      } else {
        setError(`${t('bgRemoval.error.processingFailed')} (${err.message || 'Unknown error'})`);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [sourceImage, backgroundImage, useNewBackground, modelQuality, t]);

  // ============================================================================
  // Mask Editing
  // ============================================================================

  const updateEditPreview = useCallback(() => {
    const editCanvas = editCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const origCanvas = originalCanvasRef.current;
    if (!editCanvas || !maskCanvas || !origCanvas) return;

    const editCtx = editCanvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');

    editCtx.drawImage(origCanvas, 0, 0);
    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const editData = editCtx.getImageData(0, 0, editCanvas.width, editCanvas.height);
    editCtx.putImageData(applyMaskVisualization(editData, maskData), 0, 0);
  }, []);

  useEffect(() => {
    if (isEditMode && maskCanvasRef.current && editCanvasRef.current && originalImageData) {
      const editCanvas = editCanvasRef.current;
      const maskCanvas = maskCanvasRef.current;

      editCanvas.width = maskCanvas.width;
      editCanvas.height = maskCanvas.height;
      updateEditPreview();
    }
  }, [isEditMode, originalImageData, updateEditPreview]);

  const getCanvasCoords = useCallback((e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const drawOnMask = useCallback((x, y) => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;

    const maskCtx = maskCanvas.getContext('2d');
    maskCtx.beginPath();
    maskCtx.arc(x, y, brushSize, 0, Math.PI * 2);
    maskCtx.fillStyle = brushMode === 'restore' ? 'white' : 'black';
    maskCtx.fill();
    updateEditPreview();
  }, [brushSize, brushMode, updateEditPreview]);

  const handleMouseDown = useCallback((e) => {
    if (!isEditMode) return;
    e.preventDefault();
    setIsDrawing(true);
    const coords = getCanvasCoords(e, editCanvasRef.current);
    drawOnMask(coords.x, coords.y);
  }, [isEditMode, getCanvasCoords, drawOnMask]);

  const handleMouseMove = useCallback((e) => {
    if (!isDrawing || !isEditMode) return;
    e.preventDefault();
    const coords = getCanvasCoords(e, editCanvasRef.current);
    drawOnMask(coords.x, coords.y);
  }, [isDrawing, isEditMode, getCanvasCoords, drawOnMask]);

  const handleMouseUp = useCallback(() => setIsDrawing(false), []);

  const applyMaskAndGenerateResult = useCallback(async () => {
    if (!originalImageData || !maskCanvasRef.current) return;

    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas.getContext('2d');
    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

    const resultCanvas = canvasRef.current;
    resultCanvas.width = maskCanvas.width;
    resultCanvas.height = maskCanvas.height;
    const resultCtx = resultCanvas.getContext('2d');

    const resultData = resultCtx.createImageData(maskCanvas.width, maskCanvas.height);
    for (let i = 0; i < originalImageData.data.length; i += 4) {
      resultData.data[i] = originalImageData.data[i];
      resultData.data[i + 1] = originalImageData.data[i + 1];
      resultData.data[i + 2] = originalImageData.data[i + 2];
      resultData.data[i + 3] = maskData.data[i];
    }
    resultCtx.putImageData(resultData, 0, 0);

    if (useNewBackground && backgroundImage) {
      const bgImg = await loadImage(backgroundImage.url);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = maskCanvas.width;
      tempCanvas.height = maskCanvas.height;
      const tempCtx = tempCanvas.getContext('2d');

      drawBackgroundCover(tempCtx, bgImg, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(resultCanvas, 0, 0);

      const resultBlob = await new Promise(resolve => tempCanvas.toBlob(resolve, 'image/png'));
      setResultImage(URL.createObjectURL(resultBlob));
    } else {
      const resultBlob = await new Promise(resolve => resultCanvas.toBlob(resolve, 'image/png'));
      const resultUrl = URL.createObjectURL(resultBlob);
      setResultImage(resultUrl);
      setRemovedBgImage(resultUrl);
    }
  }, [originalImageData, useNewBackground, backgroundImage]);

  const enterEditMode = useCallback(() => setIsEditMode(true), []);

  const exitEditMode = useCallback(async () => {
    await applyMaskAndGenerateResult();
    setIsEditMode(false);
  }, [applyMaskAndGenerateResult]);

  const cancelEditMode = useCallback(() => setIsEditMode(false), []);

  // ============================================================================
  // Chromakey
  // ============================================================================

  const generateChromakeyPreview = useCallback(async (color) => {
    if (!originalImageData || !maskCanvasRef.current) return;

    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas.getContext('2d');
    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

    const resultCanvas = canvasRef.current;
    resultCanvas.width = maskCanvas.width;
    resultCanvas.height = maskCanvas.height;
    const resultCtx = resultCanvas.getContext('2d');

    const resultData = resultCtx.createImageData(maskCanvas.width, maskCanvas.height);
    const isTransparent = color === 'transparent';
    const { r, g, b } = isTransparent ? { r: 0, g: 0, b: 0 } : parseHexColor(color);

    for (let i = 0; i < originalImageData.data.length; i += 4) {
      if (maskData.data[i] > MASK_THRESHOLD) {
        resultData.data[i] = originalImageData.data[i];
        resultData.data[i + 1] = originalImageData.data[i + 1];
        resultData.data[i + 2] = originalImageData.data[i + 2];
        resultData.data[i + 3] = 255;
      } else if (isTransparent) {
        resultData.data[i + 3] = 0;
      } else {
        resultData.data[i] = r;
        resultData.data[i + 1] = g;
        resultData.data[i + 2] = b;
        resultData.data[i + 3] = 255;
      }
    }
    resultCtx.putImageData(resultData, 0, 0);

    const resultBlob = await new Promise(resolve => resultCanvas.toBlob(resolve, 'image/png'));
    setChromakeyPreviewUrl(URL.createObjectURL(resultBlob));
  }, [originalImageData]);

  const handleChromakeyColorChange = useCallback((color) => {
    setChromakeyColor(color);
    generateChromakeyPreview(color);
  }, [generateChromakeyPreview]);

  const enterChromakeyMode = useCallback(() => {
    setShowChromakeyPanel(true);
    setChromakeyColor('transparent');
    generateChromakeyPreview('transparent');
  }, [generateChromakeyPreview]);

  const exitChromakeyMode = useCallback(() => {
    setShowChromakeyPanel(false);
    setChromakeyPreviewUrl(null);
  }, []);

  const downloadChromakeyImage = useCallback(() => {
    if (!chromakeyPreviewUrl) return;
    const baseName = getBaseName(sourceImage?.name);
    const suffix = chromakeyColor === 'transparent' ? 'transparent' : 'chromakey';
    downloadFile(chromakeyPreviewUrl, `${baseName}_${suffix}.png`);
  }, [chromakeyPreviewUrl, chromakeyColor, sourceImage]);

  // ============================================================================
  // Download & Reset
  // ============================================================================

  const handleDownload = useCallback(() => {
    if (!resultImage) return;
    downloadFile(resultImage, `${getBaseName(sourceImage?.name)}_bg_removed.png`);
  }, [resultImage, sourceImage]);

  const handleDownloadTransparent = useCallback(() => {
    if (!removedBgImage) return;
    downloadFile(removedBgImage, `${getBaseName(sourceImage?.name)}_transparent.png`);
  }, [removedBgImage, sourceImage]);

  const reset = useCallback(() => {
    setSourceImage(null);
    setBackgroundImage(null);
    setResultImage(null);
    setRemovedBgImage(null);
    setProgress(0);
    setProgressMessage('');
    setError(null);
    setIsEditMode(false);
    setOriginalImageData(null);
    if (sourceInputRef.current) sourceInputRef.current.value = '';
    if (backgroundInputRef.current) backgroundInputRef.current.value = '';
  }, []);

  // ============================================================================
  // Derived Values
  // ============================================================================

  const canProcess = sourceImage && !isProcessing && (!useNewBackground || backgroundImage);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      <SEOHead
        title={t('bgRemoval.seoTitle')}
        description={t('bgRemoval.seoDescription')}
        keywords="background removal, remove background, AI background remover, transparent image, image editing"
      />

      <div className="page-header">
        <h1 className="page-title">{t('bgRemoval.title')}</h1>
        <p className="page-description">{t('bgRemoval.description')}</p>
      </div>

      <CoupangBanner />

      <div className="converter-container" style={{ marginTop: '20px' }}>
        {/* Source Image Upload */}
        {!isEditMode && (
          <div className="upload-section">
            <h3>{t('bgRemoval.sourceImage')}</h3>
            <UploadArea
              image={sourceImage}
              onUpload={handleSourceUpload}
              inputRef={sourceInputRef}
              icon="🖼️"
              uploadText={t('bgRemoval.uploadSource')}
              subText={t('bgRemoval.supportedFormats')}
            />
          </div>
        )}

        {/* Quality Option */}
        {!isEditMode && (
          <div className="option-section" style={{ margin: '20px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: '500' }}>{t('bgRemoval.quality', '품질')}:</span>
              <select
                value={modelQuality}
                onChange={(e) => setModelQuality(e.target.value)}
                style={styles.select}
              >
                {QUALITY_OPTIONS.map(({ value, labelKey, fallback }) => (
                  <option key={value} value={value}>{t(labelKey, fallback)}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        {/* Background Option */}
        {!isEditMode && (
          <div className="option-section" style={{ margin: '20px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={useNewBackground}
                onChange={(e) => setUseNewBackground(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <span>{t('bgRemoval.useNewBackground')}</span>
            </label>
          </div>
        )}

        {/* Background Image Upload */}
        {!isEditMode && useNewBackground && (
          <div className="upload-section" style={{ marginBottom: '20px' }}>
            <h3>{t('bgRemoval.backgroundImage')}</h3>
            <UploadArea
              image={backgroundImage}
              onUpload={handleBackgroundUpload}
              inputRef={backgroundInputRef}
              icon="🏞️"
              uploadText={t('bgRemoval.uploadBackground')}
              maxHeight="200px"
            />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div style={{ color: '#ef4444', padding: '10px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* Process Button */}
        {!isEditMode && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button
              onClick={processRemoval}
              disabled={!canProcess}
              style={canProcess ? styles.primaryButton : styles.disabledButton}
            >
              {isProcessing ? t('bgRemoval.processing') : t('bgRemoval.removeBackground')}
            </button>

            {(sourceImage || resultImage) && (
              <button onClick={reset} style={styles.secondaryButton}>
                {t('bgRemoval.reset')}
              </button>
            )}
          </div>
        )}

        {/* Progress Bar */}
        {isProcessing && <ProgressBar progress={progress} message={progressMessage} />}

        {/* Mask Edit Mode */}
        {isEditMode && (
          <div className="edit-mode-section">
            <h3>{t('bgRemoval.editMask', '마스크 편집')}</h3>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '15px' }}>
              {t('bgRemoval.editMaskDesc', '빨간색 영역은 제거됩니다. 브러시로 수정하세요.')}
            </p>

            <BrushControls
              brushMode={brushMode}
              setBrushMode={setBrushMode}
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              t={t}
            />

            <div style={{
              ...styles.checkerboard,
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
              marginBottom: '20px',
            }}>
              <canvas
                ref={editCanvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
                style={{ maxWidth: '100%', maxHeight: '500px', cursor: 'crosshair', touchAction: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={exitEditMode} style={styles.successButton}>
                {t('bgRemoval.applyEdit', '편집 적용')}
              </button>
              <button onClick={cancelEditMode} style={styles.secondaryButton}>
                {t('bgRemoval.cancelEdit', '취소')}
              </button>
            </div>
          </div>
        )}

        {/* Result Display */}
        {resultImage && !isEditMode && (
          <div className="result-section">
            <h3>{t('bgRemoval.result')}</h3>
            <div style={{
              ...styles.checkerboard,
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              <img src={resultImage} alt="Result" style={{ maxWidth: '100%', maxHeight: '500px' }} />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px' }}>
              <button onClick={handleDownload} style={styles.successButton}>
                {useNewBackground ? t('bgRemoval.downloadComposite') : t('bgRemoval.downloadTransparent')}
              </button>

              {useNewBackground && removedBgImage && (
                <button onClick={handleDownloadTransparent} style={styles.indigoButton}>
                  {t('bgRemoval.downloadTransparentOnly')}
                </button>
              )}

              {originalImageData && (
                <button onClick={enterEditMode} style={styles.warningButton}>
                  {t('bgRemoval.editMaskBtn', '마스크 수정')}
                </button>
              )}

              {originalImageData && !showChromakeyPanel && (
                <button onClick={enterChromakeyMode} style={styles.chromakeyButton}>
                  {t('bgRemoval.chromakeyBtn', '크로마키 배경')}
                </button>
              )}
            </div>

            {showChromakeyPanel && (
              <ChromakeyPanel
                chromakeyColor={chromakeyColor}
                onColorChange={handleChromakeyColorChange}
                previewUrl={chromakeyPreviewUrl}
                onDownload={downloadChromakeyImage}
                onClose={exitChromakeyMode}
                t={t}
              />
            )}
          </div>
        )}

        {/* Hidden Canvases */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <canvas ref={maskCanvasRef} style={{ display: 'none' }} />
        <canvas ref={originalCanvasRef} style={{ display: 'none' }} />
      </div>

      {!isEditMode && (
        <div className="seo-content" style={{ marginTop: '40px' }}>
          <h2>{t('bgRemoval.features.title')}</h2>
          <ul>
            <li><strong>{t('bgRemoval.features.ai')}</strong></li>
            <li><strong>{t('bgRemoval.features.privacy')}</strong></li>
            <li><strong>{t('bgRemoval.features.composite')}</strong></li>
            <li><strong>{t('bgRemoval.features.transparent')}</strong></li>
            <li><strong>{t('bgRemoval.features.free')}</strong></li>
          </ul>
        </div>
      )}
    </>
  );
};

export default BackgroundRemoval;
