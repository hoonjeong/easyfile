import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/SEOHead';
import ProgressBar from '../../components/ProgressBar';
import ErrorDisplay from '../../components/ErrorDisplay';
import { downloadFile } from '../../utils/download';
import CoupangBanner from '../../components/CoupangBanner';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TOLERANCE = 50;
const DEFAULT_EDGE_SMOOTH = 2;
const DEFAULT_SPILL_REMOVAL = 30;

// ============================================================================
// Utility Functions
// ============================================================================

const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 255, b: 0 };
};

const colorDistance = (r1, g1, b1, r2, g2, b2) => {
  return Math.sqrt(
    Math.pow(r1 - r2, 2) +
    Math.pow(g1 - g2, 2) +
    Math.pow(b1 - b2, 2)
  );
};

// Check if image has transparency
const detectTransparency = async (imageUrl) => {
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = imageUrl;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Check for any transparent pixel
  let transparentPixels = 0;
  const totalPixels = data.length / 4;

  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) {
      transparentPixels++;
    }
  }

  // Consider image transparent if more than 1% of pixels are transparent
  const transparencyRatio = transparentPixels / totalPixels;
  return transparencyRatio > 0.01;
};

// Auto detect chromakey color from image edges
const detectChromaColor = async (imageUrl) => {
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = imageUrl;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Sample pixels from edges and corners
  const edgePixels = [];
  const sampleSize = Math.min(50, Math.floor(width / 10), Math.floor(height / 10));

  // Top edge
  for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 100))) {
    for (let y = 0; y < sampleSize; y++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] > 200) { // Only opaque pixels
        edgePixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
      }
    }
  }

  // Bottom edge
  for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 100))) {
    for (let y = height - sampleSize; y < height; y++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] > 200) {
        edgePixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
      }
    }
  }

  // Left edge
  for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 100))) {
    for (let x = 0; x < sampleSize; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] > 200) {
        edgePixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
      }
    }
  }

  // Right edge
  for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 100))) {
    for (let x = width - sampleSize; x < width; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] > 200) {
        edgePixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
      }
    }
  }

  // Four corners (more weight)
  const cornerSize = Math.min(30, Math.floor(width / 20), Math.floor(height / 20));
  const corners = [
    { startX: 0, startY: 0 },
    { startX: width - cornerSize, startY: 0 },
    { startX: 0, startY: height - cornerSize },
    { startX: width - cornerSize, startY: height - cornerSize }
  ];

  for (const corner of corners) {
    for (let y = corner.startY; y < corner.startY + cornerSize; y++) {
      for (let x = corner.startX; x < corner.startX + cornerSize; x++) {
        const i = (y * width + x) * 4;
        if (data[i + 3] > 200) {
          edgePixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
          edgePixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
        }
      }
    }
  }

  if (edgePixels.length === 0) {
    return null;
  }

  // Find the most common color using color clustering
  const colorGroups = [];
  const groupDistance = 40;

  for (const pixel of edgePixels) {
    let foundGroup = false;
    for (const group of colorGroups) {
      if (colorDistance(pixel.r, pixel.g, pixel.b, group.r, group.g, group.b) < groupDistance) {
        group.count++;
        group.totalR += pixel.r;
        group.totalG += pixel.g;
        group.totalB += pixel.b;
        group.r = Math.round(group.totalR / group.count);
        group.g = Math.round(group.totalG / group.count);
        group.b = Math.round(group.totalB / group.count);
        foundGroup = true;
        break;
      }
    }
    if (!foundGroup) {
      colorGroups.push({
        r: pixel.r,
        g: pixel.g,
        b: pixel.b,
        totalR: pixel.r,
        totalG: pixel.g,
        totalB: pixel.b,
        count: 1
      });
    }
  }

  colorGroups.sort((a, b) => b.count - a.count);

  if (colorGroups.length > 0) {
    const dominantColor = colorGroups[0];
    return rgbToHex(dominantColor.r, dominantColor.g, dominantColor.b);
  }

  return null;
};

// ============================================================================
// Main Component
// ============================================================================

const ImageChromakey = () => {
  const { t } = useTranslation();
  const [chromakeyFile, setChromakeyFile] = useState(null);
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [chromakeyPreview, setChromakeyPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [isTransparentImage, setIsTransparentImage] = useState(false);
  const [chromaColor, setChromaColor] = useState('#00ff00');
  const [detecting, setDetecting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [resultPreview, setResultPreview] = useState(null);
  const [error, setError] = useState(null);

  // Chromakey options
  const [tolerance, setTolerance] = useState(DEFAULT_TOLERANCE);
  const [edgeSmooth, setEdgeSmooth] = useState(DEFAULT_EDGE_SMOOTH);
  const [spillRemoval, setSpillRemoval] = useState(DEFAULT_SPILL_REMOVAL);

  const canvasRef = useRef(null);
  const chromakeyInputRef = useRef(null);
  const backgroundInputRef = useRef(null);
  const previewTimeoutRef = useRef(null);

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      if (chromakeyPreview) URL.revokeObjectURL(chromakeyPreview);
      if (backgroundPreview) URL.revokeObjectURL(backgroundPreview);
      if (resultPreview) URL.revokeObjectURL(resultPreview);
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    };
  }, []);

  // Generate preview function (used for real-time updates)
  const generatePreview = useCallback(async () => {
    if (!chromakeyPreview || !backgroundPreview) return;

    try {
      const chromakeyImg = new Image();
      const backgroundImg = new Image();

      await Promise.all([
        new Promise((resolve, reject) => {
          chromakeyImg.onload = resolve;
          chromakeyImg.onerror = reject;
          chromakeyImg.src = chromakeyPreview;
        }),
        new Promise((resolve, reject) => {
          backgroundImg.onload = resolve;
          backgroundImg.onerror = reject;
          backgroundImg.src = backgroundPreview;
        })
      ]);

      const canvas = canvasRef.current || document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      canvas.width = chromakeyImg.width;
      canvas.height = chromakeyImg.height;

      // Draw background (scaled to cover)
      const bgScale = Math.max(canvas.width / backgroundImg.width, canvas.height / backgroundImg.height);
      const bgWidth = backgroundImg.width * bgScale;
      const bgHeight = backgroundImg.height * bgScale;
      const bgX = (canvas.width - bgWidth) / 2;
      const bgY = (canvas.height - bgHeight) / 2;
      ctx.drawImage(backgroundImg, bgX, bgY, bgWidth, bgHeight);

      if (isTransparentImage) {
        // For transparent images: just draw on top
        ctx.drawImage(chromakeyImg, 0, 0);
      } else {
        // For chromakey images: process color replacement
        const bgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        ctx.drawImage(chromakeyImg, 0, 0);
        const chromaData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const keyColor = hexToRgb(chromaColor);
        const maxDistance = (tolerance / 100) * 441.67;
        const smoothRange = (edgeSmooth / 100) * 50;
        const spillFactor = spillRemoval / 100;

        const isGreenDominant = keyColor.g > keyColor.r && keyColor.g > keyColor.b;
        const isBlueDominant = keyColor.b > keyColor.r && keyColor.b > keyColor.g;

        for (let i = 0; i < chromaData.data.length; i += 4) {
          const r = chromaData.data[i];
          const g = chromaData.data[i + 1];
          const b = chromaData.data[i + 2];

          const distance = colorDistance(r, g, b, keyColor.r, keyColor.g, keyColor.b);

          if (distance < maxDistance) {
            chromaData.data[i] = bgData.data[i];
            chromaData.data[i + 1] = bgData.data[i + 1];
            chromaData.data[i + 2] = bgData.data[i + 2];
            chromaData.data[i + 3] = 255;
          } else if (distance < maxDistance + smoothRange) {
            const blendFactor = (distance - maxDistance) / smoothRange;
            chromaData.data[i] = Math.round(bgData.data[i] * (1 - blendFactor) + r * blendFactor);
            chromaData.data[i + 1] = Math.round(bgData.data[i + 1] * (1 - blendFactor) + g * blendFactor);
            chromaData.data[i + 2] = Math.round(bgData.data[i + 2] * (1 - blendFactor) + b * blendFactor);
            chromaData.data[i + 3] = 255;
          } else {
            if (spillFactor > 0) {
              if (isGreenDominant) {
                const greenSpill = g - Math.max(r, b);
                if (greenSpill > 0) {
                  chromaData.data[i + 1] = Math.round(g - greenSpill * spillFactor);
                }
              } else if (isBlueDominant) {
                const blueSpill = b - Math.max(r, g);
                if (blueSpill > 0) {
                  chromaData.data[i + 2] = Math.round(b - blueSpill * spillFactor);
                }
              }
            }
          }
        }

        ctx.putImageData(chromaData, 0, 0);
      }

      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png', 1.0);
      });

      if (resultPreview) URL.revokeObjectURL(resultPreview);
      setResult(blob);
      setResultPreview(URL.createObjectURL(blob));

    } catch (err) {
      console.error('Preview generation error:', err);
    }
  }, [chromakeyPreview, backgroundPreview, isTransparentImage, chromaColor, tolerance, edgeSmooth, spillRemoval, resultPreview]);

  // Real-time preview update with debouncing
  useEffect(() => {
    if (!chromakeyPreview || !backgroundPreview || detecting) return;

    // Clear previous timeout
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }

    // Debounce preview generation (100ms delay)
    previewTimeoutRef.current = setTimeout(() => {
      generatePreview();
    }, 100);

    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, [chromakeyPreview, backgroundPreview, chromaColor, tolerance, edgeSmooth, spillRemoval, isTransparentImage, detecting]);

  const handleChromakeySelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (chromakeyPreview) URL.revokeObjectURL(chromakeyPreview);
    const previewUrl = URL.createObjectURL(file);
    setChromakeyFile(file);
    setChromakeyPreview(previewUrl);
    setResult(null);
    setResultPreview(null);
    setError(null);

    setDetecting(true);
    try {
      // Check if image has transparency
      const hasTransparency = await detectTransparency(previewUrl);
      setIsTransparentImage(hasTransparency);

      if (!hasTransparency) {
        // Only detect chromakey color for non-transparent images
        const detectedColor = await detectChromaColor(previewUrl);
        if (detectedColor) {
          setChromaColor(detectedColor);
        }
      }
    } catch (err) {
      console.error('Detection error:', err);
    } finally {
      setDetecting(false);
    }
  }, [chromakeyPreview]);

  const handleBackgroundSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (backgroundPreview) URL.revokeObjectURL(backgroundPreview);
    setBackgroundFile(file);
    setBackgroundPreview(URL.createObjectURL(file));
    setResult(null);
    setResultPreview(null);
    setError(null);
  }, [backgroundPreview]);

  const removeChromakey = () => {
    if (chromakeyPreview) URL.revokeObjectURL(chromakeyPreview);
    setChromakeyFile(null);
    setChromakeyPreview(null);
    setResult(null);
    setResultPreview(null);
    setIsTransparentImage(false);
    if (chromakeyInputRef.current) chromakeyInputRef.current.value = '';
  };

  const removeBackground = () => {
    if (backgroundPreview) URL.revokeObjectURL(backgroundPreview);
    setBackgroundFile(null);
    setBackgroundPreview(null);
    setResult(null);
    setResultPreview(null);
    if (backgroundInputRef.current) backgroundInputRef.current.value = '';
  };

  const handleDownload = () => {
    if (!result) return;
    const originalName = chromakeyFile?.name || 'image';
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    downloadFile(result, `${baseName}_composite.png`);
  };

  const handleReset = () => {
    removeChromakey();
    removeBackground();
    setResult(null);
    setResultPreview(null);
    setError(null);
    setProgress(0);
    setTolerance(DEFAULT_TOLERANCE);
    setEdgeSmooth(DEFAULT_EDGE_SMOOTH);
    setSpillRemoval(DEFAULT_SPILL_REMOVAL);
  };

  return (
    <>
      <SEOHead
        title={t('chromakey.image.pageTitle')}
        description={t('chromakey.image.pageDescription')}
        keywords={t('chromakey.image.seoKeywords')}
      />

      <div className="page-header">
        <h1 className="page-title">{t('chromakey.image.pageTitle')}</h1>
        <p className="page-description">{t('chromakey.image.pageDescription')}</p>
      </div>

      <CoupangBanner type="top" />

      <div className="converter-card">
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* File Selection Area */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          {/* Chromakey Image */}
          <div>
            <h4 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>
              {t('chromakey.image.chromakeyImage')}
            </h4>
            {!chromakeyFile ? (
              <div
                className="dropzone"
                onClick={() => chromakeyInputRef.current?.click()}
                style={{ minHeight: '200px', cursor: 'pointer' }}
              >
                <input
                  ref={chromakeyInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleChromakeySelect}
                  style={{ display: 'none' }}
                />
                <div className="dropzone-content">
                  <div className="dropzone-icon" style={{ fontSize: '48px' }}>🟢</div>
                  <p className="dropzone-text">{t('chromakey.image.selectChromakey')}</p>
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <img
                  src={chromakeyPreview}
                  alt="Chromakey"
                  style={{
                    width: '100%',
                    maxHeight: '200px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 16px 16px'
                  }}
                />
                <button
                  onClick={removeChromakey}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(239, 68, 68, 0.9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  ×
                </button>
                {detecting && (
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {t('chromakey.detecting')}...
                  </div>
                )}
                {!detecting && (
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    background: isTransparentImage ? 'rgba(16, 185, 129, 0.9)' : 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {isTransparentImage ? (
                      <>
                        <span>✓</span>
                        {t('chromakey.transparentDetected', '투명 이미지 감지됨')}
                      </>
                    ) : (
                      <>
                        <span style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '3px',
                          background: chromaColor,
                          border: '1px solid white'
                        }} />
                        {t('chromakey.detected')}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Background Image */}
          <div>
            <h4 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>
              {t('chromakey.image.backgroundImage')}
            </h4>
            {!backgroundFile ? (
              <div
                className="dropzone"
                onClick={() => backgroundInputRef.current?.click()}
                style={{ minHeight: '200px', cursor: 'pointer' }}
              >
                <input
                  ref={backgroundInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundSelect}
                  style={{ display: 'none' }}
                />
                <div className="dropzone-content">
                  <div className="dropzone-icon" style={{ fontSize: '48px' }}>🏞️</div>
                  <p className="dropzone-text">{t('chromakey.image.selectBackground')}</p>
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <img
                  src={backgroundPreview}
                  alt="Background"
                  style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                />
                <button
                  onClick={removeBackground}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(239, 68, 68, 0.9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info Message */}
        {chromakeyFile && !detecting && (
          <div style={{
            padding: '12px 16px',
            background: isTransparentImage ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            color: 'var(--text-secondary)'
          }}>
            {isTransparentImage ? (
              <>
                <strong style={{ color: '#10B981' }}>✓ {t('chromakey.transparentMode', '투명 이미지 모드')}</strong>
                <br />
                {t('chromakey.transparentModeDesc', '투명 영역에 배경 이미지가 자동으로 합성됩니다.')}
              </>
            ) : (
              <>
                <strong style={{ color: '#3B82F6' }}>🎨 {t('chromakey.chromakeyMode', '크로마키 모드')}</strong>
                <br />
                {t('chromakey.chromakeyModeDesc', '감지된 배경색이 새 배경으로 교체됩니다.')}
              </>
            )}
          </div>
        )}

        {/* Chromakey Options (only for non-transparent images) */}
        {chromakeyFile && !detecting && !isTransparentImage && (
          <div style={{
            padding: '16px',
            background: 'var(--bg-secondary)',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h4 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>
              {t('chromakey.options', '크로마키 옵션')}
            </h4>

            {/* Chroma Color Picker */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <span>{t('chromakey.chromaColor', '크로마키 색상')}:</span>
                <input
                  type="color"
                  value={chromaColor}
                  onChange={(e) => setChromaColor(e.target.value)}
                  style={{
                    width: '40px',
                    height: '30px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{
                  padding: '4px 8px',
                  background: chromaColor,
                  color: '#fff',
                  borderRadius: '4px',
                  fontSize: '12px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}>
                  {chromaColor.toUpperCase()}
                </span>
              </label>
            </div>

            {/* Tolerance Slider */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <span style={{ minWidth: '100px' }}>{t('chromakey.tolerance', '허용 범위')}: {tolerance}%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  style={{ flex: 1, cursor: 'pointer' }}
                />
              </label>
            </div>

            {/* Edge Smooth Slider */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <span style={{ minWidth: '100px' }}>{t('chromakey.edgeSmooth', '엣지 스무딩')}: {edgeSmooth}%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={edgeSmooth}
                  onChange={(e) => setEdgeSmooth(Number(e.target.value))}
                  style={{ flex: 1, cursor: 'pointer' }}
                />
              </label>
            </div>

            {/* Spill Removal Slider */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <span style={{ minWidth: '100px' }}>{t('chromakey.spillRemoval', '색 번짐 제거')}: {spillRemoval}%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={spillRemoval}
                  onChange={(e) => setSpillRemoval(Number(e.target.value))}
                  style={{ flex: 1, cursor: 'pointer' }}
                />
              </label>
            </div>
          </div>
        )}

        {processing && <ProgressBar progress={progress} />}
        <ErrorDisplay error={error} />

        {/* Result Preview */}
        {resultPreview && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>
              {t('chromakey.result')}
            </h4>
            <img
              src={resultPreview}
              alt="Result"
              style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-color)' }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button className="convert-button" onClick={handleDownload}>
                {t('chromakey.downloadResult')}
              </button>
              <button
                className="convert-button"
                onClick={handleReset}
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                {t('common.reset')}
              </button>
            </div>
          </div>
        )}

      </div>

      <div className="seo-content">
        <h2>{t('chromakey.image.whatIs')}</h2>
        <p>{t('chromakey.image.whatIsDesc')}</p>

        <h2>{t('chromakey.image.whyUse')}</h2>
        <p>{t('chromakey.image.whyUseDesc')}</p>
        <ul>
          <li><strong>{t('chromakey.image.whyUseReason1')}</strong></li>
          <li><strong>{t('chromakey.image.whyUseReason2')}</strong></li>
          <li><strong>{t('chromakey.image.whyUseReason3')}</strong></li>
          <li><strong>{t('chromakey.image.whyUseReason4')}</strong></li>
        </ul>

        <h2>{t('chromakey.image.howToUse')}</h2>
        <ol>
          <li>{t('chromakey.image.step1')}</li>
          <li>{t('chromakey.image.step2')}</li>
          <li>{t('chromakey.image.step3')}</li>
          <li>{t('chromakey.image.step4')}</li>
        </ol>

        <h2>{t('chromakey.image.features')}</h2>
        <ul>
          <li><strong>{t('chromakey.image.feature1')}</strong></li>
          <li><strong>{t('chromakey.image.feature2')}</strong></li>
          <li><strong>{t('chromakey.image.feature3')}</strong></li>
          <li><strong>{t('chromakey.image.feature4')}</strong></li>
        </ul>

        <h2>{t('chromakey.image.faq')}</h2>
        <h3>{t('chromakey.image.faq1Q')}</h3>
        <p>{t('chromakey.image.faq1A')}</p>
        <h3>{t('chromakey.image.faq2Q')}</h3>
        <p>{t('chromakey.image.faq2A')}</p>
        <h3>{t('chromakey.image.faq3Q')}</h3>
        <p>{t('chromakey.image.faq3A')}</p>
      </div>
    </>
  );
};

export default ImageChromakey;
