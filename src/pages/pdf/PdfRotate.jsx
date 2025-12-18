import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import { rotatePages, generateThumbnails } from '../../utils/pdfUtils';
import { downloadFile, sanitizeFilename } from '../../utils/download';

const PdfRotate = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [rotations, setRotations] = useState({});
  const [loading, setLoading] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = useCallback(async (selectedFile) => {
    setFile(selectedFile);
    setThumbnails([]);
    setRotations({});
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
    setRotations({});
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  const rotatePage = (pageNum, angle) => {
    setRotations(prev => {
      const currentRotation = prev[pageNum] || 0;
      const newRotation = (currentRotation + angle + 360) % 360;
      if (newRotation === 0) {
        const { [pageNum]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [pageNum]: newRotation };
    });
    setResult(null);
  };

  const rotateAllPages = (angle) => {
    const newRotations = {};
    thumbnails.forEach(thumb => {
      const currentRotation = rotations[thumb.pageNum] || 0;
      const newRotation = (currentRotation + angle + 360) % 360;
      if (newRotation !== 0) newRotations[thumb.pageNum] = newRotation;
    });
    setRotations(newRotations);
    setResult(null);
  };

  const resetRotations = () => { setRotations({}); setResult(null); };
  const hasRotations = () => Object.keys(rotations).length > 0;

  const handleRotate = async () => {
    if (!hasRotations()) {
      setError(t('pdf.rotate.selectPages'));
      return;
    }
    setRotating(true);
    setError(null);
    setProgress(0);
    try {
      const newPdf = await rotatePages(file, rotations, setProgress);
      setResult(newPdf);
    } catch (err) {
      console.error(err);
      setError(t('pdf.rotate.error'));
    } finally {
      setRotating(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    // Sanitize filename to prevent path traversal attacks
    const baseName = sanitizeFilename(file.name.replace(/\.pdf$/i, ''));
    downloadFile(result, `${baseName}_rotated.pdf`);
  };

  const getRotationStyle = (pageNum) => ({ transform: `rotate(${rotations[pageNum] || 0}deg)`, transition: 'transform 0.3s ease' });

  return (
    <>
      <SEOHead title={t('pdf.rotate.pageTitle')} description={t('pdf.rotate.pageDescription')} keywords={t('pdf.rotate.seoKeywords')} />

      <div className="page-header">
        <h1 className="page-title">{t('pdf.rotate.pageTitle')}</h1>
        <p className="page-description">{t('pdf.rotate.pageDescription')}</p>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{t('pdf.rotate.clickToRotate')}</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => rotateAllPages(90)} style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>{t('pdf.rotate.rotateAll')}</button>
                    <button onClick={resetRotations} style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>{t('pdf.rotate.reset')}</button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px', marginBottom: '20px', maxHeight: '450px', overflow: 'auto', padding: '4px' }}>
                  {thumbnails.map((thumb) => (
                    <div key={thumb.pageNum} style={{ padding: '12px', borderRadius: '8px', background: rotations[thumb.pageNum] ? 'var(--primary-color-alpha)' : 'var(--bg-tertiary)', border: rotations[thumb.pageNum] ? '2px solid var(--primary-color)' : '2px solid transparent' }}>
                      <div style={{ width: '100%', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '8px' }}>
                        <img src={thumb.url} alt={`Page ${thumb.pageNum}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px', ...getRotationStyle(thumb.pageNum) }} />
                      </div>
                      <p style={{ textAlign: 'center', fontSize: '12px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                        {t('common.page')} {thumb.pageNum}
                        {rotations[thumb.pageNum] && <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}> ({rotations[thumb.pageNum]}°)</span>}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                        <button onClick={() => rotatePage(thumb.pageNum, -90)} title="-90°" style={{ padding: '6px 10px', fontSize: '14px', cursor: 'pointer', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>↺</button>
                        <button onClick={() => rotatePage(thumb.pageNum, 90)} title="+90°" style={{ padding: '6px 10px', fontSize: '14px', cursor: 'pointer', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>↻</button>
                        <button onClick={() => rotatePage(thumb.pageNum, 180)} title="180°" style={{ padding: '6px 10px', fontSize: '12px', cursor: 'pointer', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>180°</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {rotating && <ProgressBar progress={progress} />}
            {error && <div className="error"><svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{error}</div>}

            {result && (
              <div className="result">
                <h4 className="result-title"><svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{t('pdf.rotate.rotateComplete')}</h4>
                <button className="download-button" onClick={handleDownload}>{t('pdf.rotate.downloadRotated')}</button>
              </div>
            )}

            {!result && !rotating && !loading && thumbnails.length > 0 && (
              <button className="convert-button" onClick={handleRotate} disabled={!hasRotations()}>{t('pdf.rotate.applyRotation')}</button>
            )}
          </>
        )}
      </div>

      <div className="seo-content">
        <h2>{t('pdf.rotate.what')}</h2>
        <p>{t('pdf.rotate.whatDesc')}</p>
        <h2>{t('whyUse.title')}</h2>
        <ul>
          <li><strong>{t('whyUse.free')}</strong></li>
          <li><strong>{t('whyUse.privacy')}</strong></li>
          <li><strong>{t('whyUse.individual')}</strong></li>
          <li><strong>{t('whyUse.preview')}</strong></li>
        </ul>
      </div>
    </>
  );
};

export default PdfRotate;
