import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import ErrorDisplay from '../../components/ErrorDisplay';
import { deletePages, generateThumbnails } from '../../utils/pdfUtils';
import { downloadFile, sanitizeFilename } from '../../utils/download';

const PdfDelete = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [pagesToDelete, setPagesToDelete] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = useCallback(async (selectedFile) => {
    setFile(selectedFile);
    setThumbnails([]);
    setPagesToDelete(new Set());
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
    setPagesToDelete(new Set());
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  const togglePage = (pageNum) => {
    setPagesToDelete(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageNum)) newSet.delete(pageNum);
      else newSet.add(pageNum);
      return newSet;
    });
    setResult(null);
  };

  const handleDelete = async () => {
    if (pagesToDelete.size === 0) {
      setError(t('pdf.delete.selectPages'));
      return;
    }
    if (pagesToDelete.size >= thumbnails.length) {
      setError(t('pdf.delete.cannotDeleteAll'));
      return;
    }
    setDeleting(true);
    setError(null);
    setProgress(0);
    try {
      const pageNumbers = Array.from(pagesToDelete);
      const newPdf = await deletePages(file, pageNumbers, setProgress);
      setResult(newPdf);
    } catch (err) {
      console.error(err);
      setError(t('pdf.delete.error'));
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    // Sanitize filename to prevent path traversal attacks
    const baseName = sanitizeFilename(file.name.replace(/\.pdf$/i, ''));
    downloadFile(result, `${baseName}_edited.pdf`);
  };

  return (
    <>
      <SEOHead
        title={t('pdf.delete.pageTitle')}
        description={t('pdf.delete.pageDescription')}
        keywords={t('pdf.delete.seoKeywords')}
      />

      <div className="page-header">
        <h1 className="page-title">{t('pdf.delete.pageTitle')}</h1>
        <p className="page-description">{t('pdf.delete.pageDescription')}</p>
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
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{t('pdf.delete.clickToDelete')}</p>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginTop: '4px' }}>
                    {pagesToDelete.size} {t('common.selected')} / {t('common.total')} {thumbnails.length} {t('common.pages')} ({t('pdf.delete.remaining')} {thumbnails.length - pagesToDelete.size} {t('pdf.delete.pagesRemaining')})
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px', marginBottom: '20px', maxHeight: '400px', overflow: 'auto', padding: '4px' }}>
                  {thumbnails.map((thumb) => (
                    <div
                      key={thumb.pageNum}
                      onClick={() => togglePage(thumb.pageNum)}
                      style={{
                        cursor: 'pointer', padding: '8px', borderRadius: '8px', position: 'relative',
                        border: pagesToDelete.has(thumb.pageNum) ? '3px solid #ef4444' : '3px solid transparent',
                        background: pagesToDelete.has(thumb.pageNum) ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-tertiary)',
                        opacity: pagesToDelete.has(thumb.pageNum) ? 0.6 : 1,
                        transition: 'all 0.2s'
                      }}
                    >
                      {pagesToDelete.has(thumb.pageNum) && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#ef4444', color: 'white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}>X</div>
                      )}
                      <img src={thumb.url} alt={`Page ${thumb.pageNum}`} style={{ width: '100%', height: 'auto', borderRadius: '4px' }} />
                      <p style={{ textAlign: 'center', fontSize: '12px', marginTop: '4px', color: 'var(--text-secondary)' }}>{thumb.pageNum}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {deleting && <ProgressBar progress={progress} />}

            <ErrorDisplay error={error} />

            {result && (
              <div className="result">
                <h4 className="result-title">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('pdf.delete.deleteComplete')} ({thumbnails.length - pagesToDelete.size} {t('pdf.delete.pagesRemaining')})
                </h4>
                <button className="download-button" onClick={handleDownload}>{t('pdf.delete.downloadEdited')}</button>
              </div>
            )}

            {!result && !deleting && !loading && thumbnails.length > 0 && (
              <button className="convert-button" onClick={handleDelete} disabled={pagesToDelete.size === 0} style={{ background: pagesToDelete.size > 0 ? '#ef4444' : undefined }}>{t('pdf.delete.deletePages')}</button>
            )}
          </>
        )}
      </div>

      <div className="seo-content">
        <h2>{t('pdf.delete.what')}</h2>
        <p>{t('pdf.delete.whatDesc')}</p>

        <h2>{t('whyUse.title')}</h2>
        <ul>
          <li><strong>{t('whyUse.free')}</strong></li>
          <li><strong>{t('whyUse.privacy')}</strong></li>
          <li><strong>{t('whyUse.visual')}</strong></li>
          <li><strong>{t('whyUse.safe')}</strong></li>
        </ul>
      </div>
    </>
  );
};

export default PdfDelete;
