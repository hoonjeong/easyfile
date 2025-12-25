import { useState, useCallback, useRef } from 'react';
import { removeBackground } from '@imgly/background-removal';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/SEOHead';
import CoupangBanner from '../../components/CoupangBanner';

const BackgroundRemoval = () => {
  const { t } = useTranslation();
  const [sourceImage, setSourceImage] = useState(null);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [removedBgImage, setRemovedBgImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState(null);
  const [useNewBackground, setUseNewBackground] = useState(false);

  const sourceInputRef = useRef(null);
  const backgroundInputRef = useRef(null);
  const canvasRef = useRef(null);

  const handleSourceUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(t('bgRemoval.error.invalidImage'));
      return;
    }

    const url = URL.createObjectURL(file);
    setSourceImage({ file, url, name: file.name });
    setResultImage(null);
    setRemovedBgImage(null);
    setError(null);
  }, [t]);

  const handleBackgroundUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(t('bgRemoval.error.invalidImage'));
      return;
    }

    const url = URL.createObjectURL(file);
    setBackgroundImage({ file, url, name: file.name });
    setError(null);
  }, [t]);

  const processRemoval = useCallback(async () => {
    if (!sourceImage) return;

    setIsProcessing(true);
    setProgress(0);
    setProgressMessage(t('bgRemoval.progress.loading'));
    setError(null);

    try {
      // Remove background using AI
      const blob = await removeBackground(sourceImage.file, {
        model: 'small',
        output: {
          format: 'image/png',
          quality: 0.8
        },
        progress: (key, current, total) => {
          const percentage = Math.round((current / total) * 100);
          setProgress(percentage);
          if (key === 'compute:inference') {
            setProgressMessage(t('bgRemoval.progress.processing'));
          } else if (key === 'fetch:model') {
            setProgressMessage(t('bgRemoval.progress.loadingModel'));
          }
        }
      });

      const removedUrl = URL.createObjectURL(blob);
      setRemovedBgImage(removedUrl);

      // If using new background, composite the images
      if (useNewBackground && backgroundImage) {
        setProgressMessage(t('bgRemoval.progress.compositing'));

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Load both images
        const [fgImg, bgImg] = await Promise.all([
          loadImage(removedUrl),
          loadImage(backgroundImage.url)
        ]);

        // Set canvas size to foreground image size
        canvas.width = fgImg.width;
        canvas.height = fgImg.height;

        // Draw background (scaled to fit)
        const bgScale = Math.max(canvas.width / bgImg.width, canvas.height / bgImg.height);
        const bgWidth = bgImg.width * bgScale;
        const bgHeight = bgImg.height * bgScale;
        const bgX = (canvas.width - bgWidth) / 2;
        const bgY = (canvas.height - bgHeight) / 2;
        ctx.drawImage(bgImg, bgX, bgY, bgWidth, bgHeight);

        // Draw foreground (removed background image)
        ctx.drawImage(fgImg, 0, 0);

        // Convert to blob
        const resultBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const resultUrl = URL.createObjectURL(resultBlob);
        setResultImage(resultUrl);
      } else {
        setResultImage(removedUrl);
      }

      setProgress(100);
      setProgressMessage(t('bgRemoval.progress.complete'));
    } catch (err) {
      console.error('Background removal failed:', err);
      console.error('Error details:', err.message, err.stack);
      // Show more specific error message
      if (err.message?.includes('SharedArrayBuffer')) {
        setError('이 기능은 보안 컨텍스트(HTTPS)가 필요합니다. 로컬 개발 서버에서는 작동하지 않을 수 있습니다.');
      } else if (err.message?.includes('fetch')) {
        setError('AI 모델을 다운로드할 수 없습니다. 인터넷 연결을 확인해주세요.');
      } else {
        setError(t('bgRemoval.error.processingFailed') + ' (' + (err.message || 'Unknown error') + ')');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [sourceImage, backgroundImage, useNewBackground, t]);

  const loadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  const handleDownload = useCallback(() => {
    if (!resultImage) return;

    const link = document.createElement('a');
    link.href = resultImage;
    const baseName = sourceImage?.name?.replace(/\.[^/.]+$/, '') || 'image';
    link.download = `${baseName}_bg_removed.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [resultImage, sourceImage]);

  const handleDownloadTransparent = useCallback(() => {
    if (!removedBgImage) return;

    const link = document.createElement('a');
    link.href = removedBgImage;
    const baseName = sourceImage?.name?.replace(/\.[^/.]+$/, '') || 'image';
    link.download = `${baseName}_transparent.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [removedBgImage, sourceImage]);

  const reset = useCallback(() => {
    setSourceImage(null);
    setBackgroundImage(null);
    setResultImage(null);
    setRemovedBgImage(null);
    setProgress(0);
    setProgressMessage('');
    setError(null);
    if (sourceInputRef.current) sourceInputRef.current.value = '';
    if (backgroundInputRef.current) backgroundInputRef.current.value = '';
  }, []);

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
        <div className="upload-section">
          <h3>{t('bgRemoval.sourceImage')}</h3>
          <div
            className="upload-area"
            onClick={() => sourceInputRef.current?.click()}
            style={{ cursor: 'pointer' }}
          >
            {sourceImage ? (
              <div className="preview-container">
                <img src={sourceImage.url} alt="Source" style={{ maxWidth: '100%', maxHeight: '300px' }} />
                <p>{sourceImage.name}</p>
              </div>
            ) : (
              <div className="upload-placeholder">
                <span className="upload-icon">🖼️</span>
                <p>{t('bgRemoval.uploadSource')}</p>
                <small>{t('bgRemoval.supportedFormats')}</small>
              </div>
            )}
          </div>
          <input
            ref={sourceInputRef}
            type="file"
            accept="image/*"
            onChange={handleSourceUpload}
            style={{ display: 'none' }}
          />
        </div>

        {/* Background Option */}
        <div className="option-section" style={{ margin: '20px 0' }}>
          <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={useNewBackground}
              onChange={(e) => setUseNewBackground(e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            <span>{t('bgRemoval.useNewBackground')}</span>
          </label>
        </div>

        {/* Background Image Upload */}
        {useNewBackground && (
          <div className="upload-section" style={{ marginBottom: '20px' }}>
            <h3>{t('bgRemoval.backgroundImage')}</h3>
            <div
              className="upload-area"
              onClick={() => backgroundInputRef.current?.click()}
              style={{ cursor: 'pointer' }}
            >
              {backgroundImage ? (
                <div className="preview-container">
                  <img src={backgroundImage.url} alt="Background" style={{ maxWidth: '100%', maxHeight: '200px' }} />
                  <p>{backgroundImage.name}</p>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <span className="upload-icon">🏞️</span>
                  <p>{t('bgRemoval.uploadBackground')}</p>
                </div>
              )}
            </div>
            <input
              ref={backgroundInputRef}
              type="file"
              accept="image/*"
              onChange={handleBackgroundUpload}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="error-message" style={{ color: '#ef4444', padding: '10px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* Process Button */}
        <div className="button-group" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            className="primary-button"
            onClick={processRemoval}
            disabled={!sourceImage || isProcessing || (useNewBackground && !backgroundImage)}
            style={{
              padding: '12px 24px',
              backgroundColor: (!sourceImage || isProcessing || (useNewBackground && !backgroundImage)) ? '#ccc' : '#4F46E5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: (!sourceImage || isProcessing || (useNewBackground && !backgroundImage)) ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {isProcessing ? t('bgRemoval.processing') : t('bgRemoval.removeBackground')}
          </button>

          {(sourceImage || resultImage) && (
            <button
              className="secondary-button"
              onClick={reset}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              {t('bgRemoval.reset')}
            </button>
          )}
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="progress-section" style={{ marginBottom: '20px' }}>
            <div className="progress-bar" style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div
                className="progress-fill"
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: '#4F46E5',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
            <p style={{ marginTop: '8px', color: '#6b7280', fontSize: '14px' }}>
              {progressMessage} ({progress}%)
            </p>
          </div>
        )}

        {/* Result Display */}
        {resultImage && (
          <div className="result-section">
            <h3>{t('bgRemoval.result')}</h3>
            <div className="result-preview" style={{
              backgroundColor: '#f0f0f0',
              backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <img
                src={resultImage}
                alt="Result"
                style={{ maxWidth: '100%', maxHeight: '500px' }}
              />
            </div>

            <div className="download-buttons" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={handleDownload}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                {useNewBackground ? t('bgRemoval.downloadComposite') : t('bgRemoval.downloadTransparent')}
              </button>

              {useNewBackground && removedBgImage && (
                <button
                  onClick={handleDownloadTransparent}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#6366F1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  {t('bgRemoval.downloadTransparentOnly')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Hidden Canvas for Compositing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

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
    </>
  );
};

export default BackgroundRemoval;
