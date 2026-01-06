import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import ErrorDisplay from '../../components/ErrorDisplay';
import { downloadFile, sanitizeFilename } from '../../utils/download';
import CoupangBanner from '../../components/CoupangBanner';

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ImageCompress = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState(0.7);
  const [maxWidth, setMaxWidth] = useState(1920);
  const [outputFormat, setOutputFormat] = useState('image/jpeg');
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileSelect = useCallback((selectedFile) => {
    setFile(selectedFile);
    setResult(null);
    setError(null);
    setProgress(0);
    // Create preview
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  }, []);

  const handleRemoveFile = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setProgress(0);
  }, [previewUrl, result]);

  const compressImage = async () => {
    if (!file) return;

    setCompressing(true);
    setError(null);
    setProgress(10);

    try {
      const img = new Image();
      const loadPromise = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      img.src = URL.createObjectURL(file);
      await loadPromise;
      setProgress(30);

      // Calculate new dimensions
      let newWidth = img.width;
      let newHeight = img.height;

      if (img.width > maxWidth) {
        const ratio = maxWidth / img.width;
        newWidth = maxWidth;
        newHeight = Math.round(img.height * ratio);
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');

      // Use high quality resizing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      setProgress(60);

      // Convert to blob
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, outputFormat, quality);
      });
      setProgress(90);

      const originalSize = file.size;
      const compressedSize = blob.size;
      const reduction = Math.round((1 - compressedSize / originalSize) * 100);

      setResult({
        blob,
        url: URL.createObjectURL(blob),
        originalSize,
        compressedSize,
        reduction,
        originalDimensions: { width: img.width, height: img.height },
        newDimensions: { width: newWidth, height: newHeight }
      });

      URL.revokeObjectURL(img.src);
      setProgress(100);
    } catch (err) {
      console.error(err);
      setError(t('image.compress.error'));
    } finally {
      setCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const ext = outputFormat === 'image/jpeg' ? 'jpg' :
                outputFormat === 'image/webp' ? 'webp' : 'png';
    const baseName = sanitizeFilename(file.name.replace(/\.[^/.]+$/, ''));
    downloadFile(result.blob, `${baseName}_compressed.${ext}`);
  };

  return (
    <>
      <SEOHead
        title={t('image.compress.pageTitle')}
        description={t('image.compress.pageDescription')}
        keywords={t('image.compress.seoKeywords')}
      />

      <div className="page-header">
        <h1 className="page-title">{t('image.compress.pageTitle')}</h1>
        <p className="page-description">{t('image.compress.pageDescription')}</p>
      </div>

      <CoupangBanner type="top" />

      <div className="converter-card">
        {!file ? (
          <DropZone
            onFileSelect={handleFileSelect}
            acceptedTypes={['.jpg', '.jpeg', '.png', '.webp', 'image/jpeg', 'image/png', 'image/webp']}
            fileCategory="image"
          />
        ) : (
          <>
            <FilePreview file={file} onRemove={handleRemoveFile} />

            {previewUrl && (
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}
                />
              </div>
            )}

            <div className="options">
              <h4 className="options-title">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('common.options')}
              </h4>

              <div className="option-group">
                <label className="option-label">{t('common.outputFormat')}</label>
                <select
                  className="option-select"
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                >
                  <option value="image/jpeg">{t('image.compress.formatJpg')}</option>
                  <option value="image/webp">{t('image.compress.formatWebp')}</option>
                  <option value="image/png">{t('image.compress.formatPng')}</option>
                </select>
              </div>

              <div className="option-group">
                <label className="option-label">{t('image.compress.quality')}: {Math.round(quality * 100)}%</label>
                <input
                  type="range"
                  className="option-slider"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                />
                <div className="quality-labels" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span>{t('image.compress.smallerFile')}</span>
                  <span>{t('image.compress.betterQuality')}</span>
                </div>
              </div>

              <div className="option-group">
                <label className="option-label">{t('image.compress.maxWidth')}: {maxWidth}px</label>
                <input
                  type="range"
                  className="option-slider"
                  min="320"
                  max="4096"
                  step="64"
                  value={maxWidth}
                  onChange={(e) => setMaxWidth(Number(e.target.value))}
                />
                <div className="quality-labels" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span>320px</span>
                  <span>4096px</span>
                </div>
              </div>
            </div>

            {compressing && <ProgressBar progress={progress} />}

            <ErrorDisplay error={error} />

            {result && (
              <div className="result">
                <h4 className="result-title">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('image.compress.complete')}
                </h4>

                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                  <img
                    src={result.url}
                    alt="Compressed"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}
                  />
                </div>

                <div className="compression-stats" style={{
                  background: 'var(--bg-tertiary)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '16px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '16px',
                  textAlign: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      {t('image.compress.original')}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>
                      {formatFileSize(result.originalSize)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {result.originalDimensions.width}x{result.originalDimensions.height}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      {t('image.compress.compressed')}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--primary-color)' }}>
                      {formatFileSize(result.compressedSize)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {result.newDimensions.width}x{result.newDimensions.height}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      {t('image.compress.reduction')}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: result.reduction > 0 ? '#22c55e' : '#ef4444' }}>
                      {result.reduction > 0 ? `-${result.reduction}%` : `+${Math.abs(result.reduction)}%`}
                    </div>
                  </div>
                </div>

                <button className="download-button" onClick={handleDownload}>
                  {t('image.compress.downloadCompressed')}
                </button>
              </div>
            )}

            {!result && !compressing && (
              <button className="convert-button" onClick={compressImage} disabled={!file}>
                {t('image.compress.compressImage')}
              </button>
            )}
          </>
        )}
      </div>

      <div className="seo-content">
        <h2>{t('image.compress.what')}</h2>
        <p>{t('image.compress.whatDesc')}</p>

        <h2>{t('image.compress.whyCompress')}</h2>
        <p>{t('image.compress.whyCompressDesc')}</p>
        <ul>
          <li><strong>{t('image.compress.whyCompressReason1')}</strong></li>
          <li><strong>{t('image.compress.whyCompressReason2')}</strong></li>
          <li><strong>{t('image.compress.whyCompressReason3')}</strong></li>
          <li><strong>{t('image.compress.whyCompressReason4')}</strong></li>
        </ul>

        <h2>{t('image.compress.howToUse')}</h2>
        <ol>
          <li>{t('image.compress.step1')}</li>
          <li>{t('image.compress.step2')}</li>
          <li>{t('image.compress.step3')}</li>
          <li>{t('image.compress.step4')}</li>
        </ol>

        <h2>{t('image.compress.formatGuide')}</h2>
        <p>{t('image.compress.formatGuideDesc')}</p>
        <ul>
          <li><strong>{t('image.compress.jpgGuide')}</strong></li>
          <li><strong>{t('image.compress.pngGuide')}</strong></li>
          <li><strong>{t('image.compress.webpGuide')}</strong></li>
        </ul>

        <h2>{t('image.compress.qualityTips')}</h2>
        <ul>
          <li><strong>{t('image.compress.qualityTip1')}</strong></li>
          <li><strong>{t('image.compress.qualityTip2')}</strong></li>
          <li><strong>{t('image.compress.qualityTip3')}</strong></li>
        </ul>

        <h2>{t('image.compress.features')}</h2>
        <ul>
          <li><strong>{t('image.compress.feature1')}</strong></li>
          <li><strong>{t('image.compress.feature2')}</strong></li>
          <li><strong>{t('image.compress.feature3')}</strong></li>
          <li><strong>{t('image.compress.feature4')}</strong></li>
        </ul>

        <h2>{t('image.compress.faq')}</h2>
        <h3>{t('image.compress.faq1Q')}</h3>
        <p>{t('image.compress.faq1A')}</p>
        <h3>{t('image.compress.faq2Q')}</h3>
        <p>{t('image.compress.faq2A')}</p>
        <h3>{t('image.compress.faq3Q')}</h3>
        <p>{t('image.compress.faq3A')}</p>
      </div>
    </>
  );
};

export default ImageCompress;
