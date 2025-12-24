import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import ErrorDisplay from '../../components/ErrorDisplay';
import CoupangBanner from '../../components/CoupangBanner';
import { compressPdf } from '../../utils/pdfUtils';
import { downloadFile, sanitizeFilename } from '../../utils/download';

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const PdfCompress = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [compressionLevel, setCompressionLevel] = useState('medium');
  const [imageQuality, setImageQuality] = useState(0.7);
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = useCallback((selectedFile) => {
    setFile(selectedFile);
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  const handleRemoveFile = useCallback(() => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
  }, [result]);

  const handleCompress = async () => {
    if (!file) return;

    setCompressing(true);
    setError(null);
    setProgress(0);

    try {
      const qualityMap = {
        low: 0.5,
        medium: 0.7,
        high: 0.85
      };
      const quality = compressionLevel === 'custom' ? imageQuality : qualityMap[compressionLevel];

      const compressedBlob = await compressPdf(file, quality, setProgress);
      const originalSize = file.size;
      const compressedSize = compressedBlob.size;
      const reduction = Math.round((1 - compressedSize / originalSize) * 100);

      setResult({
        blob: compressedBlob,
        url: URL.createObjectURL(compressedBlob),
        originalSize,
        compressedSize,
        reduction
      });
    } catch (err) {
      console.error(err);
      setError(t('pdf.compress.error'));
    } finally {
      setCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const baseName = sanitizeFilename(file.name.replace(/\.pdf$/i, ''));
    downloadFile(result.blob, `${baseName}_compressed.pdf`);
  };

  return (
    <>
      <SEOHead
        title={t('pdf.compress.pageTitle')}
        description={t('pdf.compress.pageDescription')}
        keywords={t('pdf.compress.seoKeywords')}
      />

      <div className="page-header">
        <h1 className="page-title">{t('pdf.compress.pageTitle')}</h1>
        <p className="page-description">{t('pdf.compress.pageDescription')}</p>
      </div>

      <CoupangBanner type="top" />

      <div className="converter-card">
        {!file ? (
          <DropZone
            onFileSelect={handleFileSelect}
            acceptedTypes={['.pdf', 'application/pdf']}
            fileCategory="pdf"
          />
        ) : (
          <>
            <FilePreview file={file} onRemove={handleRemoveFile} />

            <div className="options">
              <h4 className="options-title">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('common.options')}
              </h4>

              <div className="option-group">
                <label className="option-label">{t('pdf.compress.compressionLevel')}</label>
                <select
                  className="option-select"
                  value={compressionLevel}
                  onChange={(e) => setCompressionLevel(e.target.value)}
                >
                  <option value="low">{t('pdf.compress.levelLow')}</option>
                  <option value="medium">{t('pdf.compress.levelMedium')}</option>
                  <option value="high">{t('pdf.compress.levelHigh')}</option>
                  <option value="custom">{t('pdf.compress.levelCustom')}</option>
                </select>
              </div>

              {compressionLevel === 'custom' && (
                <div className="option-group">
                  <label className="option-label">{t('pdf.compress.imageQuality')}: {Math.round(imageQuality * 100)}%</label>
                  <input
                    type="range"
                    className="option-slider"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={imageQuality}
                    onChange={(e) => setImageQuality(Number(e.target.value))}
                  />
                  <div className="quality-labels" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span>{t('pdf.compress.smallerFile')}</span>
                    <span>{t('pdf.compress.betterQuality')}</span>
                  </div>
                </div>
              )}
            </div>

            {compressing && <ProgressBar progress={progress} />}

            <ErrorDisplay error={error} />

            {result && (
              <div className="result">
                <h4 className="result-title">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('pdf.compress.complete')}
                </h4>

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
                      {t('pdf.compress.original')}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>
                      {formatFileSize(result.originalSize)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      {t('pdf.compress.compressed')}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--primary-color)' }}>
                      {formatFileSize(result.compressedSize)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      {t('pdf.compress.reduction')}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: result.reduction > 0 ? '#22c55e' : '#ef4444' }}>
                      {result.reduction > 0 ? `-${result.reduction}%` : `+${Math.abs(result.reduction)}%`}
                    </div>
                  </div>
                </div>

                <button className="download-button" onClick={handleDownload}>
                  {t('pdf.compress.downloadCompressed')}
                </button>
              </div>
            )}

            {!result && !compressing && (
              <button className="convert-button" onClick={handleCompress} disabled={!file}>
                {t('pdf.compress.compressPdf')}
              </button>
            )}
          </>
        )}
      </div>

      <div className="seo-content">
        <h2>{t('pdf.compress.what')}</h2>
        <p>{t('pdf.compress.whatDesc')}</p>

        <h2>{t('whyUse.title')}</h2>
        <ul>
          <li><strong>{t('whyUse.free')}</strong></li>
          <li><strong>{t('whyUse.privacy')}</strong></li>
          <li><strong>{t('pdf.compress.whyPreserve')}</strong></li>
          <li><strong>{t('pdf.compress.whyAdjustable')}</strong></li>
        </ul>
      </div>
    </>
  );
};

export default PdfCompress;
