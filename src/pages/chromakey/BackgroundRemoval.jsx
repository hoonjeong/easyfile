import { useState, useCallback, useRef, useEffect } from 'react';
import { AutoModel, AutoProcessor, RawImage, env } from '@huggingface/transformers';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/SEOHead';
import CoupangBanner from '../../components/CoupangBanner';

// ============================================================================
// Constants & Configuration
// ============================================================================

const MODEL_ID = 'briaai/RMBG-1.4';
const MASK_THRESHOLD = 30;

// Model cache (singleton)
let modelInstance = null;
let processorInstance = null;
let modelLoadingPromise = null;

// ============================================================================
// Device Detection
// ============================================================================

const isMobile = () => {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);
};

const isIOS = () => {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const hasSharedArrayBuffer = () => {
  try {
    return typeof SharedArrayBuffer !== 'undefined';
  } catch {
    return false;
  }
};

// ============================================================================
// Model Loading
// ============================================================================

const resetModelState = () => {
  modelInstance = null;
  processorInstance = null;
  modelLoadingPromise = null;
};

const loadModel = async (onProgress) => {
  if (modelInstance && processorInstance) {
    return { model: modelInstance, processor: processorInstance };
  }

  if (modelLoadingPromise) {
    try {
      return await modelLoadingPromise;
    } catch {
      resetModelState();
    }
  }

  modelLoadingPromise = (async () => {
    onProgress?.('loading', 0);

    let model;
    const mobile = isMobile();

    // Configure WASM for compatibility
    if (!hasSharedArrayBuffer()) {
      env.backends.onnx.wasm.numThreads = 1;
    }

    // Try WebGPU first (desktop only)
    if (!mobile) {
      try {
        model = await AutoModel.from_pretrained(MODEL_ID, {
          device: 'webgpu',
          dtype: 'fp32',
          progress_callback: (progress) => {
            if (progress.status === 'progress') {
              onProgress?.('downloading', Math.round((progress.loaded / progress.total) * 50));
            }
          },
        });
      } catch {
        model = null;
      }
    }

    // Fallback to WASM
    if (!model) {
      try {
        model = await AutoModel.from_pretrained(MODEL_ID, {
          device: 'wasm',
          progress_callback: (progress) => {
            if (progress.status === 'progress') {
              onProgress?.('downloading', Math.round((progress.loaded / progress.total) * 50));
            }
          },
        });
      } catch (err) {
        throw new Error(`모델 로딩 실패: ${err.message}`);
      }
    }

    onProgress?.('loading', 50);

    const processor = await AutoProcessor.from_pretrained(MODEL_ID, {
      progress_callback: (progress) => {
        if (progress.status === 'progress') {
          onProgress?.('downloading', 50 + Math.round((progress.loaded / progress.total) * 20));
        }
      },
    });

    onProgress?.('loading', 70);

    modelInstance = model;
    processorInstance = processor;

    return { model, processor };
  })();

  try {
    return await modelLoadingPromise;
  } catch (error) {
    resetModelState();
    throw error;
  }
};

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
  button: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
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

const buttonStyles = {
  primary: { ...styles.button, backgroundColor: '#4F46E5', color: 'white' },
  secondary: { ...styles.button, backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' },
  success: { ...styles.button, backgroundColor: '#10B981', color: 'white' },
  warning: { ...styles.button, backgroundColor: '#F59E0B', color: 'white' },
  indigo: { ...styles.button, backgroundColor: '#6366F1', color: 'white' },
  disabled: { ...styles.button, backgroundColor: '#ccc', color: 'white', cursor: 'not-allowed' },
};

// ============================================================================
// Utility Functions
// ============================================================================

const loadImage = (url) => new Promise((resolve, reject) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = url;
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

const drawBackgroundCover = (ctx, bgImg, canvasWidth, canvasHeight) => {
  const scale = Math.max(canvasWidth / bgImg.width, canvasHeight / bgImg.height);
  const width = bgImg.width * scale;
  const height = bgImg.height * scale;
  ctx.drawImage(bgImg, (canvasWidth - width) / 2, (canvasHeight - height) / 2, width, height);
};

// ============================================================================
// Sub-Components
// ============================================================================

const UploadArea = ({ image, onUpload, inputRef, icon, uploadText, subText, maxHeight = '300px' }) => (
  <div className="upload-area" onClick={() => inputRef.current?.click()} style={{ cursor: 'pointer' }}>
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
    <input ref={inputRef} type="file" accept="image/*" onChange={onUpload} style={{ display: 'none' }} />
  </div>
);

const ProgressBar = ({ progress, message }) => (
  <div className="progress-section" style={{ marginBottom: '20px' }}>
    <div style={{ width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#4F46E5', transition: 'width 0.3s ease' }} />
    </div>
    <p style={{ marginTop: '8px', color: '#6b7280', fontSize: '14px' }}>{message} ({progress}%)</p>
  </div>
);

const BrushControls = ({ brushMode, setBrushMode, brushSize, setBrushSize, t }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px', padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
    <div style={{ display: 'flex', gap: '10px' }}>
      <button
        onClick={() => setBrushMode('restore')}
        style={{ ...styles.brushButton, backgroundColor: brushMode === 'restore' ? '#10B981' : '#e5e7eb', color: brushMode === 'restore' ? 'white' : '#374151' }}
      >
        {t('bgRemoval.brushRestore', '복원 브러시')}
      </button>
      <button
        onClick={() => setBrushMode('erase')}
        style={{ ...styles.brushButton, backgroundColor: brushMode === 'erase' ? '#EF4444' : '#e5e7eb', color: brushMode === 'erase' ? 'white' : '#374151' }}
      >
        {t('bgRemoval.brushErase', '제거 브러시')}
      </button>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontSize: '14px', color: '#374151' }}>{t('bgRemoval.brushSize', '브러시 크기')}: {brushSize}px</span>
      <input type="range" min="5" max="100" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} style={{ width: '120px' }} />
    </div>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

const BackgroundRemoval = () => {
  const { t } = useTranslation();

  // States
  const [sourceImage, setSourceImage] = useState(null);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [removedBgImage, setRemovedBgImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState(null);
  const [useNewBackground, setUseNewBackground] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [brushMode, setBrushMode] = useState('restore');
  const [brushSize, setBrushSize] = useState(30);
  const [isDrawing, setIsDrawing] = useState(false);
  const [originalImageData, setOriginalImageData] = useState(null);
  const [maskHistory, setMaskHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Refs
  const sourceInputRef = useRef(null);
  const backgroundInputRef = useRef(null);
  const canvasRef = useRef(null);
  const editCanvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const originalCanvasRef = useRef(null);
  const cursorCanvasRef = useRef(null);

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

    setImage({ file, url: URL.createObjectURL(file), name: file.name });
    setError(null);

    if (resetStates) {
      setResultImage(null);
      setRemovedBgImage(null);
      setIsEditMode(false);
      setOriginalImageData(null);
    }
  }, [t]);

  const handleSourceUpload = useCallback((e) => handleImageUpload(e, setSourceImage, true), [handleImageUpload]);
  const handleBackgroundUpload = useCallback((e) => handleImageUpload(e, setBackgroundImage), [handleImageUpload]);

  // ============================================================================
  // Background Removal Processing
  // ============================================================================

  const processRemoval = useCallback(async () => {
    if (!sourceImage) return;

    // iOS does not support ONNX Runtime WASM
    if (isIOS()) {
      setError('iOS에서는 AI 배경 제거를 지원하지 않습니다. PC 또는 Android를 이용해주세요.');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setProgressMessage(t('bgRemoval.progress.loadingModel'));
    setError(null);
    setIsEditMode(false);

    try {
      const { model, processor } = await loadModel((stage, percent) => {
        setProgress(percent);
        if (stage === 'downloading') setProgressMessage(t('bgRemoval.progress.loadingModel'));
      });

      setProgress(70);
      setProgressMessage(t('bgRemoval.progress.processing'));

      const image = await RawImage.fromURL(sourceImage.url);
      const { pixel_values } = await processor(image);

      setProgress(80);

      const { output } = await model({ input: pixel_values });

      setProgress(90);

      const maskTensor = output[0].mul(255).to('uint8');
      const maskImage = await RawImage.fromTensor(maskTensor);
      const resizedMask = await maskImage.resize(image.width, image.height);

      const origImg = await loadImage(sourceImage.url);

      // Store original image data
      const origCanvas = originalCanvasRef.current;
      origCanvas.width = origImg.width;
      origCanvas.height = origImg.height;
      const origCtx = origCanvas.getContext('2d');
      origCtx.drawImage(origImg, 0, 0);
      setOriginalImageData(origCtx.getImageData(0, 0, origImg.width, origImg.height));

      // Create result with alpha channel
      const resultCanvas = document.createElement('canvas');
      resultCanvas.width = origImg.width;
      resultCanvas.height = origImg.height;
      const resultCtx = resultCanvas.getContext('2d');
      resultCtx.drawImage(origImg, 0, 0);
      const resultData = resultCtx.getImageData(0, 0, resultCanvas.width, resultCanvas.height);

      const maskData = resizedMask.data;
      for (let i = 0; i < maskData.length; i++) {
        resultData.data[i * 4 + 3] = maskData[i];
      }
      resultCtx.putImageData(resultData, 0, 0);

      const resultBlob = await new Promise(resolve => resultCanvas.toBlob(resolve, 'image/png'));
      const resultUrl = URL.createObjectURL(resultBlob);
      setRemovedBgImage(resultUrl);

      // Create mask canvas for editing
      const maskCanvas = maskCanvasRef.current;
      maskCanvas.width = origImg.width;
      maskCanvas.height = origImg.height;
      const maskCtx = maskCanvas.getContext('2d');
      const maskImageData = maskCtx.createImageData(origImg.width, origImg.height);
      for (let i = 0; i < maskData.length; i++) {
        maskImageData.data[i * 4] = maskData[i];
        maskImageData.data[i * 4 + 1] = maskData[i];
        maskImageData.data[i * 4 + 2] = maskData[i];
        maskImageData.data[i * 4 + 3] = 255;
      }
      maskCtx.putImageData(maskImageData, 0, 0);

      // Composite with background if needed
      if (useNewBackground && backgroundImage) {
        setProgressMessage(t('bgRemoval.progress.compositing'));
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const bgImg = await loadImage(backgroundImage.url);
        const resultImg = await loadImage(resultUrl);

        canvas.width = resultImg.width;
        canvas.height = resultImg.height;
        drawBackgroundCover(ctx, bgImg, canvas.width, canvas.height);
        ctx.drawImage(resultImg, 0, 0);

        const compositeBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        setResultImage(URL.createObjectURL(compositeBlob));
      } else {
        setResultImage(resultUrl);
      }

      setProgress(100);
      setProgressMessage(t('bgRemoval.progress.complete'));
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('memory') || msg.includes('OOM')) {
        setError('메모리가 부족합니다. 더 작은 이미지를 사용해주세요.');
      } else if (msg.includes('fetch') || msg.includes('network')) {
        setError('모델 다운로드에 실패했습니다. 인터넷 연결을 확인해주세요.');
      } else {
        setError('처리 중 오류가 발생했습니다. 페이지를 새로고침 후 다시 시도해주세요.');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [sourceImage, backgroundImage, useNewBackground, t]);

  // ============================================================================
  // Mask Editing
  // ============================================================================

  const updateEditPreview = useCallback(() => {
    const editCanvas = editCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const origCanvas = originalCanvasRef.current;
    if (!editCanvas || !maskCanvas || !origCanvas) return;

    const editCtx = editCanvas.getContext('2d');
    editCtx.drawImage(origCanvas, 0, 0);
    const maskData = maskCanvas.getContext('2d').getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const editData = editCtx.getImageData(0, 0, editCanvas.width, editCanvas.height);
    editCtx.putImageData(applyMaskVisualization(editData, maskData), 0, 0);
  }, []);

  const saveMaskToHistory = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;

    const maskData = maskCanvas.getContext('2d').getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const newHistory = maskHistory.slice(0, historyIndex + 1);
    newHistory.push(maskData);
    if (newHistory.length > 50) newHistory.shift();

    setMaskHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [maskHistory, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    maskCanvasRef.current?.getContext('2d').putImageData(maskHistory[newIndex], 0, 0);
    setHistoryIndex(newIndex);
    updateEditPreview();
  }, [historyIndex, maskHistory, updateEditPreview]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= maskHistory.length - 1) return;
    const newIndex = historyIndex + 1;
    maskCanvasRef.current?.getContext('2d').putImageData(maskHistory[newIndex], 0, 0);
    setHistoryIndex(newIndex);
    updateEditPreview();
  }, [historyIndex, maskHistory, updateEditPreview]);

  const drawCursor = useCallback((x, y) => {
    const cursorCanvas = cursorCanvasRef.current;
    const editCanvas = editCanvasRef.current;
    if (!cursorCanvas || !editCanvas) return;

    const ctx = cursorCanvas.getContext('2d');
    ctx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);

    const rect = editCanvas.getBoundingClientRect();
    const scaledBrushSize = brushSize * (rect.width / editCanvas.width);

    ctx.beginPath();
    ctx.arc(x, y, scaledBrushSize, 0, Math.PI * 2);
    ctx.strokeStyle = brushMode === 'restore' ? '#10B981' : '#EF4444';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fillStyle = brushMode === 'restore' ? '#10B981' : '#EF4444';
    ctx.fill();
  }, [brushSize, brushMode]);

  useEffect(() => {
    if (isEditMode && maskCanvasRef.current && editCanvasRef.current && originalImageData) {
      const editCanvas = editCanvasRef.current;
      const maskCanvas = maskCanvasRef.current;

      editCanvas.width = maskCanvas.width;
      editCanvas.height = maskCanvas.height;
      updateEditPreview();

      const initialMaskData = maskCanvas.getContext('2d').getImageData(0, 0, maskCanvas.width, maskCanvas.height);
      setMaskHistory([initialMaskData]);
      setHistoryIndex(0);
    }
  }, [isEditMode, originalImageData, updateEditPreview]);

  useEffect(() => {
    const updateCursorCanvasSize = () => {
      const editCanvas = editCanvasRef.current;
      const cursorCanvas = cursorCanvasRef.current;
      if (!editCanvas || !cursorCanvas || !isEditMode) return;

      const rect = editCanvas.getBoundingClientRect();
      cursorCanvas.width = rect.width;
      cursorCanvas.height = rect.height;
    };

    updateCursorCanvasSize();
    window.addEventListener('resize', updateCursorCanvasSize);
    return () => window.removeEventListener('resize', updateCursorCanvasSize);
  }, [isEditMode]);

  const getCanvasCoords = useCallback((e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  const drawOnMask = useCallback((x, y) => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;

    const ctx = maskCanvas.getContext('2d');
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fillStyle = brushMode === 'restore' ? 'white' : 'black';
    ctx.fill();
    updateEditPreview();
  }, [brushSize, brushMode, updateEditPreview]);

  const handleMouseDown = useCallback((e) => {
    if (!isEditMode) return;
    e.preventDefault();
    saveMaskToHistory();
    setIsDrawing(true);
    drawOnMask(...Object.values(getCanvasCoords(e, editCanvasRef.current)));
  }, [isEditMode, getCanvasCoords, drawOnMask, saveMaskToHistory]);

  const handleMouseMove = useCallback((e) => {
    if (!isEditMode) return;
    e.preventDefault();

    const editCanvas = editCanvasRef.current;
    if (editCanvas) {
      const rect = editCanvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      drawCursor(clientX - rect.left, clientY - rect.top);
    }

    if (isDrawing) {
      drawOnMask(...Object.values(getCanvasCoords(e, editCanvasRef.current)));
    }
  }, [isDrawing, isEditMode, getCanvasCoords, drawOnMask, drawCursor]);

  const handleMouseUp = useCallback(() => setIsDrawing(false), []);

  const handleMouseLeave = useCallback(() => {
    setIsDrawing(false);
    cursorCanvasRef.current?.getContext('2d').clearRect(0, 0, cursorCanvasRef.current.width, cursorCanvasRef.current.height);
  }, []);

  const applyMaskAndGenerateResult = useCallback(async () => {
    if (!originalImageData || !maskCanvasRef.current) return;

    const maskCanvas = maskCanvasRef.current;
    const maskData = maskCanvas.getContext('2d').getImageData(0, 0, maskCanvas.width, maskCanvas.height);

    const resultCanvas = canvasRef.current;
    resultCanvas.width = maskCanvas.width;
    resultCanvas.height = maskCanvas.height;
    const resultCtx = resultCanvas.getContext('2d');

    const resultData = resultCtx.createImageData(maskCanvas.width, maskCanvas.height);
    for (let i = 0; i < originalImageData.data.length; i += 4) {
      resultData.data[i] = originalImageData.data[i];
      resultData.data[i + 1] = originalImageData.data[i + 1];
      resultData.data[i + 2] = originalImageData.data[i + 2];
      resultData.data[i + 3] = maskData.data[i] > MASK_THRESHOLD ? 255 : 0;
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
  const exitEditMode = useCallback(async () => { await applyMaskAndGenerateResult(); setIsEditMode(false); }, [applyMaskAndGenerateResult]);
  const cancelEditMode = useCallback(() => setIsEditMode(false), []);

  // ============================================================================
  // Download & Reset
  // ============================================================================

  const handleDownload = useCallback(() => {
    if (resultImage) downloadFile(resultImage, `${getBaseName(sourceImage?.name)}_bg_removed.png`);
  }, [resultImage, sourceImage]);

  const handleDownloadTransparent = useCallback(() => {
    if (removedBgImage) downloadFile(removedBgImage, `${getBaseName(sourceImage?.name)}_transparent.png`);
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
  // Render
  // ============================================================================

  const canProcess = sourceImage && !isProcessing && (!useNewBackground || backgroundImage);

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
        {!isEditMode && (
          <>
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

            <div className="option-section" style={{ margin: '20px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input type="checkbox" checked={useNewBackground} onChange={(e) => setUseNewBackground(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                <span>{t('bgRemoval.useNewBackground')}</span>
              </label>
            </div>

            {useNewBackground && (
              <div className="upload-section" style={{ marginBottom: '20px' }}>
                <h3>{t('bgRemoval.backgroundImage')}</h3>
                <UploadArea image={backgroundImage} onUpload={handleBackgroundUpload} inputRef={backgroundInputRef} icon="🏞️" uploadText={t('bgRemoval.uploadBackground')} maxHeight="200px" />
              </div>
            )}
          </>
        )}

        {error && <div style={{ color: '#ef4444', padding: '10px', marginBottom: '20px' }}>{error}</div>}

        {!isEditMode && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button onClick={processRemoval} disabled={!canProcess} style={canProcess ? buttonStyles.primary : buttonStyles.disabled}>
              {isProcessing ? t('bgRemoval.processing') : t('bgRemoval.removeBackground')}
            </button>
            {(sourceImage || resultImage) && <button onClick={reset} style={buttonStyles.secondary}>{t('bgRemoval.reset')}</button>}
          </div>
        )}

        {isProcessing && <ProgressBar progress={progress} message={progressMessage} />}

        {isEditMode && (
          <div className="edit-mode-section">
            <h3>{t('bgRemoval.editMask', '마스크 편집')}</h3>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '15px' }}>{t('bgRemoval.editMaskDesc', '빨간색 영역은 제거됩니다. 브러시로 수정하세요.')}</p>

            <BrushControls brushMode={brushMode} setBrushMode={setBrushMode} brushSize={brushSize} setBrushSize={setBrushSize} t={t} />

            <div style={{ ...styles.checkerboard, padding: '20px', borderRadius: '8px', textAlign: 'center', marginBottom: '20px', position: 'relative', display: 'inline-block', width: '100%' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <canvas
                  ref={editCanvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                  onTouchStart={handleMouseDown}
                  onTouchMove={handleMouseMove}
                  onTouchEnd={handleMouseUp}
                  style={{ maxWidth: '100%', maxHeight: '500px', cursor: 'none', touchAction: 'none', display: 'block' }}
                />
                <canvas ref={cursorCanvasRef} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', maxWidth: '100%', maxHeight: '500px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              <button onClick={exitEditMode} style={buttonStyles.success}>{t('bgRemoval.applyEdit', '편집 적용')}</button>
              <button onClick={handleUndo} disabled={historyIndex <= 0} style={historyIndex <= 0 ? buttonStyles.disabled : buttonStyles.secondary}>{t('bgRemoval.undo', '↩ 실행취소')}</button>
              <button onClick={handleRedo} disabled={historyIndex >= maskHistory.length - 1} style={historyIndex >= maskHistory.length - 1 ? buttonStyles.disabled : buttonStyles.secondary}>{t('bgRemoval.redo', '↪ 다시실행')}</button>
              <button onClick={cancelEditMode} style={buttonStyles.secondary}>{t('bgRemoval.cancelEdit', '취소')}</button>
            </div>
          </div>
        )}

        {resultImage && !isEditMode && (
          <div className="result-section">
            <h3>{t('bgRemoval.result')}</h3>
            <div style={{ ...styles.checkerboard, padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <img src={resultImage} alt="Result" style={{ maxWidth: '100%', maxHeight: '500px' }} />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px' }}>
              <button onClick={handleDownload} style={buttonStyles.success}>{useNewBackground ? t('bgRemoval.downloadComposite') : t('bgRemoval.downloadTransparent')}</button>
              {useNewBackground && removedBgImage && <button onClick={handleDownloadTransparent} style={buttonStyles.indigo}>{t('bgRemoval.downloadTransparentOnly')}</button>}
              {originalImageData && <button onClick={enterEditMode} style={buttonStyles.warning}>{t('bgRemoval.editMaskBtn', '배경 추가 삭제/복원')}</button>}
            </div>
          </div>
        )}

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
