import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/SEOHead';
import ProgressBar from '../../components/ProgressBar';
import ErrorDisplay from '../../components/ErrorDisplay';
import { downloadFile } from '../../utils/download';
import CoupangBanner from '../../components/CoupangBanner';

const ImageChromakey = () => {
  const { t } = useTranslation();
  const [chromakeyFile, setChromakeyFile] = useState(null);
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [chromakeyPreview, setChromakeyPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [chromaColor, setChromaColor] = useState('#00ff00');
  const [tolerance, setTolerance] = useState(50);
  const [edgeSmooth, setEdgeSmooth] = useState(2);
  const [spillRemoval, setSpillRemoval] = useState(30);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [resultPreview, setResultPreview] = useState(null);
  const [error, setError] = useState(null);

  const canvasRef = useRef(null);
  const chromakeyInputRef = useRef(null);
  const backgroundInputRef = useRef(null);

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      if (chromakeyPreview) URL.revokeObjectURL(chromakeyPreview);
      if (backgroundPreview) URL.revokeObjectURL(backgroundPreview);
      if (resultPreview) URL.revokeObjectURL(resultPreview);
    };
  }, []);

  const handleChromakeySelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (chromakeyPreview) URL.revokeObjectURL(chromakeyPreview);
    setChromakeyFile(file);
    setChromakeyPreview(URL.createObjectURL(file));
    setResult(null);
    setResultPreview(null);
    setError(null);
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

  const handleComposite = async () => {
    if (!chromakeyFile || !backgroundFile) return;

    setProcessing(true);
    setError(null);
    setProgress(10);

    try {
      // Load images
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

      setProgress(30);

      // Create canvas with chromakey image size
      const canvas = canvasRef.current || document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      canvas.width = chromakeyImg.width;
      canvas.height = chromakeyImg.height;

      // Draw background (scaled to fit)
      ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
      const bgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      setProgress(50);

      // Draw chromakey image
      ctx.drawImage(chromakeyImg, 0, 0);
      const chromaData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      setProgress(60);

      // Process chromakey
      const keyColor = hexToRgb(chromaColor);
      const maxDistance = (tolerance / 100) * 441.67; // Max RGB distance is sqrt(255^2 * 3) ≈ 441.67
      const smoothRange = (edgeSmooth / 100) * 50;
      const spillFactor = spillRemoval / 100;

      for (let i = 0; i < chromaData.data.length; i += 4) {
        const r = chromaData.data[i];
        const g = chromaData.data[i + 1];
        const b = chromaData.data[i + 2];

        const distance = colorDistance(r, g, b, keyColor.r, keyColor.g, keyColor.b);

        if (distance < maxDistance) {
          // Fully transparent - use background
          chromaData.data[i] = bgData.data[i];
          chromaData.data[i + 1] = bgData.data[i + 1];
          chromaData.data[i + 2] = bgData.data[i + 2];
          chromaData.data[i + 3] = 255;
        } else if (distance < maxDistance + smoothRange) {
          // Edge smoothing - blend with background
          const blendFactor = (distance - maxDistance) / smoothRange;
          chromaData.data[i] = Math.round(bgData.data[i] * (1 - blendFactor) + r * blendFactor);
          chromaData.data[i + 1] = Math.round(bgData.data[i + 1] * (1 - blendFactor) + g * blendFactor);
          chromaData.data[i + 2] = Math.round(bgData.data[i + 2] * (1 - blendFactor) + b * blendFactor);
          chromaData.data[i + 3] = 255;
        } else {
          // Spill removal - reduce green/blue tint from edges
          if (spillFactor > 0) {
            if (chromaColor === '#00ff00' || chromaColor === '#00FF00') {
              // Green screen spill removal
              const greenSpill = g - Math.max(r, b);
              if (greenSpill > 0) {
                chromaData.data[i + 1] = Math.round(g - greenSpill * spillFactor);
              }
            } else if (chromaColor === '#0000ff' || chromaColor === '#0000FF') {
              // Blue screen spill removal
              const blueSpill = b - Math.max(r, g);
              if (blueSpill > 0) {
                chromaData.data[i + 2] = Math.round(b - blueSpill * spillFactor);
              }
            }
          }
        }
      }

      setProgress(90);

      // Put processed image back
      ctx.putImageData(chromaData, 0, 0);

      // Convert to blob
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png', 1.0);
      });

      setResult(blob);
      setResultPreview(URL.createObjectURL(blob));
      setProgress(100);

    } catch (err) {
      console.error('Chromakey error:', err);
      setError(t('chromakey.image.error'));
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const originalName = chromakeyFile?.name || 'image';
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    downloadFile(result, `${baseName}_chromakey.png`);
  };

  const handleReset = () => {
    removeChromakey();
    removeBackground();
    setResult(null);
    setResultPreview(null);
    setError(null);
    setProgress(0);
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
                  style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-color)' }}
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

        {/* Options */}
        {chromakeyFile && backgroundFile && (
          <div className="options">
            <h4 className="options-title">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {t('common.options')}
            </h4>

            <div className="option-group">
              <label className="option-label">{t('chromakey.chromaColor')}</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => setChromaColor('#00ff00')}
                  style={{
                    padding: '8px 16px',
                    background: chromaColor === '#00ff00' ? '#00ff00' : 'var(--bg-secondary)',
                    color: chromaColor === '#00ff00' ? '#000' : 'var(--text-primary)',
                    border: '2px solid #00ff00',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: chromaColor === '#00ff00' ? 'bold' : 'normal'
                  }}
                >
                  {t('chromakey.greenScreen')}
                </button>
                <button
                  onClick={() => setChromaColor('#0000ff')}
                  style={{
                    padding: '8px 16px',
                    background: chromaColor === '#0000ff' ? '#0000ff' : 'var(--bg-secondary)',
                    color: chromaColor === '#0000ff' ? '#fff' : 'var(--text-primary)',
                    border: '2px solid #0000ff',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: chromaColor === '#0000ff' ? 'bold' : 'normal'
                  }}
                >
                  {t('chromakey.blueScreen')}
                </button>
                <input
                  type="color"
                  value={chromaColor}
                  onChange={(e) => setChromaColor(e.target.value)}
                  style={{ width: '40px', height: '36px', padding: '2px', cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                  title={t('chromakey.customColor')}
                />
              </div>
            </div>

            <div className="option-group">
              <label className="option-label">{t('chromakey.tolerance')}: {tolerance}%</label>
              <input
                type="range"
                className="option-slider"
                min="10"
                max="100"
                value={tolerance}
                onChange={(e) => setTolerance(Number(e.target.value))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span>{t('chromakey.strict')}</span>
                <span>{t('chromakey.loose')}</span>
              </div>
            </div>

            <div className="option-group">
              <label className="option-label">{t('chromakey.edgeSmooth')}: {edgeSmooth}</label>
              <input
                type="range"
                className="option-slider"
                min="0"
                max="10"
                value={edgeSmooth}
                onChange={(e) => setEdgeSmooth(Number(e.target.value))}
              />
            </div>

            <div className="option-group">
              <label className="option-label">{t('chromakey.spillRemoval')}: {spillRemoval}%</label>
              <input
                type="range"
                className="option-slider"
                min="0"
                max="100"
                value={spillRemoval}
                onChange={(e) => setSpillRemoval(Number(e.target.value))}
              />
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

        {/* Convert Button */}
        {chromakeyFile && backgroundFile && !result && !processing && (
          <button
            className="convert-button"
            onClick={handleComposite}
            style={{ marginTop: '20px' }}
          >
            {t('chromakey.composite')}
          </button>
        )}
      </div>

      <div className="seo-content">
        <h2>{t('chromakey.image.whatIs')}</h2>
        <p>{t('chromakey.image.whatIsDesc')}</p>
        <h2>{t('whyUse.title')}</h2>
        <ul>
          <li><strong>{t('whyUse.free')}</strong></li>
          <li><strong>{t('whyUse.privacy')}</strong></li>
          <li><strong>{t('whyUse.fast')}</strong></li>
          <li><strong>{t('chromakey.features.adjustable')}</strong></li>
        </ul>
      </div>
    </>
  );
};

export default ImageChromakey;
