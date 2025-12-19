import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import ErrorDisplay from '../../components/ErrorDisplay';
import { extractPages, generateThumbnails } from '../../utils/pdfUtils';
import { downloadFile, sanitizeFilename } from '../../utils/download';

const PdfExtract = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = useCallback(async (selectedFile) => {
    setFile(selectedFile);
    setThumbnails([]);
    setSelectedPages(new Set());
    setResult(null);
    setError(null);
    setLoading(true);
    try {
      const thumbs = await generateThumbnails(selectedFile, 0.3, setProgress);
      setThumbnails(thumbs);
    } catch (err) {
      console.error(err);
      setError(t('pdf.common.loadError'));
    } finally {
      setLoading(false);
      setProgress(0);
    }
  }, [t]);

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setThumbnails([]);
    setSelectedPages(new Set());
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  const togglePage = (pageNum) => {
    setSelectedPages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageNum)) newSet.delete(pageNum);
      else newSet.add(pageNum);
      return newSet;
    });
    setResult(null);
  };

  const selectAll = () => { setSelectedPages(new Set(thumbnails.map(t => t.pageNum))); setResult(null); };
  const deselectAll = () => { setSelectedPages(new Set()); setResult(null); };

  const handleExtract = async () => {
    if (selectedPages.size === 0) {
      setError(t('pdf.extract.selectPages'));
      return;
    }
    setExtracting(true);
    setError(null);
    setProgress(0);
    try {
      const pageNumbers = Array.from(selectedPages).sort((a, b) => a - b);
      const extractedPdf = await extractPages(file, pageNumbers, setProgress);
      setResult(extractedPdf);
    } catch (err) {
      console.error(err);
      setError(t('pdf.extract.error'));
    } finally {
      setExtracting(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    // Sanitize filename to prevent path traversal attacks
    const baseName = sanitizeFilename(file.name.replace(/\.pdf$/i, ''));
    downloadFile(result, `${baseName}_extracted.pdf`);
  };

  return (
    <>
      <SEOHead
        title={t('pdf.extract.pageTitle')}
        description={t('pdf.extract.pageDescription')}
        keywords={t('pdf.extract.seoKeywords')}
      />

      <div className="page-header">
        <h1 className="page-title">{t('pdf.extract.pageTitle')}</h1>
        <p className="page-description">{t('pdf.extract.pageDescription')}</p>
      </div>

      <div className="converter-card">
        {!file ? (
          <DropZone onFileSelect={handleFileSelect} acceptedTypes={['.pdf', 'application/pdf']} fileCategory="pdf" />
        ) : (
          <>
            <FilePreview file={file} onRemove={handleRemoveFile} />

            {loading && <ProgressBar progress={progress} />}

            {thumbnails.length > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    {selectedPages.size} {t('common.selected')} / {t('common.total')} {thumbnails.length} {t('common.pages')}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={selectAll} style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>{t('pdf.extract.selectAll')}</button>
                    <button onClick={deselectAll} style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>{t('pdf.extract.deselectAll')}</button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px', marginBottom: '20px', maxHeight: '400px', overflow: 'auto', padding: '4px' }}>
                  {thumbnails.map((thumb) => (
                    <div
                      key={thumb.pageNum}
                      onClick={() => togglePage(thumb.pageNum)}
                      style={{
                        cursor: 'pointer', padding: '8px', borderRadius: '8px',
                        border: selectedPages.has(thumb.pageNum) ? '3px solid var(--primary-color)' : '3px solid transparent',
                        background: selectedPages.has(thumb.pageNum) ? 'var(--primary-color-alpha)' : 'var(--bg-tertiary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <img src={thumb.url} alt={`Page ${thumb.pageNum}`} style={{ width: '100%', height: 'auto', borderRadius: '4px' }} />
                      <p style={{ textAlign: 'center', fontSize: '12px', marginTop: '4px', color: 'var(--text-secondary)' }}>{thumb.pageNum}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {extracting && <ProgressBar progress={progress} />}

            <ErrorDisplay error={error} />

            {result && (
              <div className="result">
                <h4 className="result-title">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('pdf.extract.extractComplete')} ({selectedPages.size} {t('common.pages')})
                </h4>
                <button className="download-button" onClick={handleDownload}>{t('pdf.extract.downloadExtracted')}</button>
              </div>
            )}

            {!result && !extracting && !loading && thumbnails.length > 0 && (
              <button className="convert-button" onClick={handleExtract} disabled={selectedPages.size === 0}>{t('pdf.extract.extractPages')}</button>
            )}
          </>
        )}
      </div>

      <div className="seo-content">
        <h2>{t('pdf.extract.what')}</h2>
        <p>{t('pdf.extract.whatDesc')}</p>

        <h2>{t('whyUse.title')}</h2>
        <ul>
          <li><strong>{t('whyUse.free')}</strong></li>
          <li><strong>{t('whyUse.privacy')}</strong></li>
          <li><strong>{t('whyUse.visual')}</strong></li>
          <li><strong>{t('whyUse.multi')}</strong></li>
        </ul>
      </div>
    </>
  );
};

export default PdfExtract;
