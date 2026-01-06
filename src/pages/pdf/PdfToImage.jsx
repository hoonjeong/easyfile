import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import ErrorDisplay from '../../components/ErrorDisplay';
import CoupangBanner from '../../components/CoupangBanner';
import { pdfToImages } from '../../utils/pdfUtils';
import { downloadFile, getFilenameWithNewExtension, sanitizeFilename } from '../../utils/download';
import JSZip from 'jszip';

const PdfToImage = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [outputFormat, setOutputFormat] = useState('image/png');
  const [scale, setScale] = useState(2);
  const [quality, setQuality] = useState(0.85);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const handleFileSelect = useCallback((selectedFile) => {
    setFile(selectedFile);
    setResults([]);
    setError(null);
    setProgress(0);
  }, []);

  const handleRemoveFile = useCallback(() => {
    results.forEach(r => URL.revokeObjectURL(r.url));
    setFile(null);
    setResults([]);
    setError(null);
    setProgress(0);
  }, [results]);

  const handleConvert = async () => {
    if (!file) return;

    setConverting(true);
    setError(null);
    setProgress(0);

    try {
      const images = await pdfToImages(file, scale, outputFormat, quality, setProgress);
      setResults(images);
    } catch (err) {
      console.error(err);
      setError(t('pdf.toImage.error'));
    } finally {
      setConverting(false);
    }
  };

  const handleDownloadSingle = (image) => {
    const extension = outputFormat === 'image/jpeg' ? 'jpg' : 'png';
    const baseName = sanitizeFilename(file.name.replace(/\.pdf$/i, ''));
    const filename = `${baseName}_page${image.pageNum}.${extension}`;
    downloadFile(image.blob, filename);
  };

  const handleDownloadAll = async () => {
    if (results.length === 1) {
      handleDownloadSingle(results[0]);
      return;
    }

    const zip = new JSZip();
    const extension = outputFormat === 'image/jpeg' ? 'jpg' : 'png';
    // Sanitize filename to prevent Zip Slip and path traversal attacks
    const baseName = sanitizeFilename(file.name.replace(/\.pdf$/i, ''));

    results.forEach((image) => {
      // Use sanitized filename inside ZIP
      zip.file(`${baseName}_page${image.pageNum}.${extension}`, image.blob);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadFile(zipBlob, `${baseName}_images.zip`);
  };

  return (
    <>
      <SEOHead
        title={t('pdf.toImage.pageTitle')}
        description={t('pdf.toImage.pageDescription')}
        keywords={t('pdf.toImage.seoKeywords')}
      />

      <div className="page-header">
        <h1 className="page-title">{t('pdf.toImage.pageTitle')}</h1>
        <p className="page-description">{t('pdf.toImage.pageDescription')}</p>
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
                <label className="option-label">{t('common.outputFormat')}</label>
                <select
                  className="option-select"
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                >
                  <option value="image/png">{t('format.pngHigh')}</option>
                  <option value="image/jpeg">{t('format.jpgSmall')}</option>
                </select>
              </div>

              <div className="option-group">
                <label className="option-label">{t('pdf.toImage.resolution')}: {scale}x ({scale * 72} {t('pdf.toImage.dpi')})</label>
                <input
                  type="range"
                  className="option-slider"
                  min="1"
                  max="4"
                  step="0.5"
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                />
              </div>

              {outputFormat === 'image/jpeg' && (
                <div className="option-group">
                  <label className="option-label">{t('pdf.toImage.quality')}: {Math.round(quality * 100)}%</label>
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
                    <span>{t('pdf.toImage.qualityLow')}</span>
                    <span>{t('pdf.toImage.qualityHigh')}</span>
                  </div>
                </div>
              )}
            </div>

            {converting && <ProgressBar progress={progress} />}

            <ErrorDisplay error={error} />

            {results.length > 0 && (
              <div className="result">
                <h4 className="result-title">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('common.conversionComplete')} ({results.length} {t('common.pages')})
                </h4>

                <div className="thumbnail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  {results.map((image) => (
                    <div key={image.pageNum} className="thumbnail-item" style={{ textAlign: 'center' }}>
                      <img
                        src={image.url}
                        alt={`Page ${image.pageNum}`}
                        style={{ width: '100%', height: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                      />
                      <p style={{ fontSize: '12px', marginTop: '4px', color: 'var(--text-secondary)' }}>{t('common.page')} {image.pageNum}</p>
                      <button
                        onClick={() => handleDownloadSingle(image)}
                        style={{ fontSize: '11px', padding: '4px 8px', marginTop: '4px', cursor: 'pointer', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                      >
                        {t('common.download')}
                      </button>
                    </div>
                  ))}
                </div>

                <button className="download-button" onClick={handleDownloadAll}>
                  {results.length > 1 ? t('common.downloadAll') : t('common.download')}
                </button>
              </div>
            )}

            {results.length === 0 && !converting && (
              <button className="convert-button" onClick={handleConvert} disabled={!file}>
                {t('pdf.toImage.convertToImage')}
              </button>
            )}
          </>
        )}
      </div>

      <div className="seo-content">
        <h2>{t('pdf.toImage.whatIs')}</h2>
        <p>{t('pdf.toImage.whatIsDesc')}</p>

        <h2>{t('pdf.toImage.whyConvert')}</h2>
        <p>{t('pdf.toImage.whyConvertDesc')}</p>
        <ul>
          <li><strong>{t('pdf.toImage.whyConvertReason1')}</strong></li>
          <li><strong>{t('pdf.toImage.whyConvertReason2')}</strong></li>
          <li><strong>{t('pdf.toImage.whyConvertReason3')}</strong></li>
          <li><strong>{t('pdf.toImage.whyConvertReason4')}</strong></li>
        </ul>

        <h2>{t('pdf.toImage.howToUse')}</h2>
        <ol>
          <li>{t('pdf.toImage.step1')}</li>
          <li>{t('pdf.toImage.step2')}</li>
          <li>{t('pdf.toImage.step3')}</li>
          <li>{t('pdf.toImage.step4')}</li>
        </ol>

        <h2>{t('pdf.toImage.features')}</h2>
        <ul>
          <li><strong>{t('pdf.toImage.feature1')}</strong></li>
          <li><strong>{t('pdf.toImage.feature2')}</strong></li>
          <li><strong>{t('pdf.toImage.feature3')}</strong></li>
          <li><strong>{t('pdf.toImage.feature4')}</strong></li>
        </ul>

        <h2>{t('pdf.toImage.faq')}</h2>
        <h3>{t('pdf.toImage.faq1Q')}</h3>
        <p>{t('pdf.toImage.faq1A')}</p>
        <h3>{t('pdf.toImage.faq2Q')}</h3>
        <p>{t('pdf.toImage.faq2A')}</p>
        <h3>{t('pdf.toImage.faq3Q')}</h3>
        <p>{t('pdf.toImage.faq3A')}</p>
      </div>
    </>
  );
};

export default PdfToImage;
