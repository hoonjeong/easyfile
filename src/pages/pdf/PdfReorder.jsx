import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import ErrorDisplay from '../../components/ErrorDisplay';
import CoupangBanner from '../../components/CoupangBanner';
import Breadcrumb from '../../components/Breadcrumb';
import { reorderPages, generateThumbnails } from '../../utils/pdfUtils';
import { downloadFile, sanitizeFilename } from '../../utils/download';

const PdfReorder = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [pageOrder, setPageOrder] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleFileSelect = useCallback(async (selectedFile) => {
    setFile(selectedFile);
    setThumbnails([]);
    setPageOrder([]);
    setResult(null);
    setError(null);
    setLoading(true);
    try {
      const thumbs = await generateThumbnails(selectedFile, 0.3, setProgress);
      setThumbnails(thumbs);
      setPageOrder(thumbs.map(t => t.pageNum));
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
    setPageOrder([]);
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  const handleDragStart = (index) => setDraggedIndex(index);
  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newOrder = [...pageOrder];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);
    setPageOrder(newOrder);
    setDraggedIndex(index);
    setResult(null);
  };
  const handleDragEnd = () => setDraggedIndex(null);

  const moveUp = (index) => {
    if (index === 0) return;
    const newOrder = [...pageOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setPageOrder(newOrder);
    setResult(null);
  };

  const moveDown = (index) => {
    if (index === pageOrder.length - 1) return;
    const newOrder = [...pageOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setPageOrder(newOrder);
    setResult(null);
  };

  const resetOrder = () => { setPageOrder(thumbnails.map(t => t.pageNum)); setResult(null); };
  const reverseOrder = () => { setPageOrder([...pageOrder].reverse()); setResult(null); };
  const isOrderChanged = () => pageOrder.some((page, index) => page !== index + 1);

  const handleReorder = async () => {
    if (!isOrderChanged()) {
      setError(t('pdf.reorder.noChange'));
      return;
    }
    setReordering(true);
    setError(null);
    setProgress(0);
    try {
      const newPdf = await reorderPages(file, pageOrder, setProgress);
      setResult(newPdf);
    } catch (err) {
      console.error(err);
      setError(t('pdf.reorder.error'));
    } finally {
      setReordering(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    // Sanitize filename to prevent path traversal attacks
    const baseName = sanitizeFilename(file.name.replace(/\.pdf$/i, ''));
    downloadFile(result, `${baseName}_reordered.pdf`);
  };

  const getThumbnailByPageNum = (pageNum) => thumbnails.find(t => t.pageNum === pageNum);

  return (
    <>
      <SEOHead title={t('pdf.reorder.pageTitle')} description={t('pdf.reorder.pageDescription')} keywords={t('pdf.reorder.seoKeywords')} />

      <Breadcrumb category="pdf" currentPage={t('pdf.reorder.title')} />

      <div className="page-header">
        <h1 className="page-title">{t('pdf.reorder.pageTitle')}</h1>
        <p className="page-description">{t('pdf.reorder.pageDescription')}</p>
      </div>

      <CoupangBanner type="top" />

      <div className="converter-card">
        {!file ? (
          <DropZone onFileSelect={handleFileSelect} acceptedTypes={['.pdf', 'application/pdf']} fileCategory="pdf" />
        ) : (
          <>
            <FilePreview file={file} onRemove={handleRemoveFile} />
            {loading && <ProgressBar progress={progress} />}

            {pageOrder.length > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{t('pdf.reorder.dragToReorder')}</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={reverseOrder} style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>{t('pdf.reorder.reverse')}</button>
                    <button onClick={resetOrder} style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>{t('pdf.reorder.resetOrder')}</button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px', marginBottom: '20px', maxHeight: '400px', overflow: 'auto', padding: '4px' }}>
                  {pageOrder.map((pageNum, index) => {
                    const thumb = getThumbnailByPageNum(pageNum);
                    return (
                      <div
                        key={`${pageNum}-${index}`}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        style={{
                          cursor: 'grab', padding: '8px', borderRadius: '8px',
                          background: draggedIndex === index ? 'var(--primary-color-alpha)' : 'var(--bg-tertiary)',
                          border: draggedIndex === index ? '2px solid var(--primary-color)' : '2px solid transparent',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                          <button onClick={() => moveUp(index)} disabled={index === 0} style={{ padding: '2px 6px', fontSize: '10px', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.5 : 1, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>^</button>
                          <button onClick={() => moveDown(index)} disabled={index === pageOrder.length - 1} style={{ padding: '2px 6px', fontSize: '10px', cursor: index === pageOrder.length - 1 ? 'not-allowed' : 'pointer', opacity: index === pageOrder.length - 1 ? 0.5 : 1, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>v</button>
                        </div>
                        {thumb && <img src={thumb.url} alt={`Page ${pageNum}`} style={{ width: '100%', height: 'auto', borderRadius: '4px', pointerEvents: 'none' }} />}
                        <p style={{ textAlign: 'center', fontSize: '12px', marginTop: '4px', color: 'var(--text-secondary)' }}>
                          <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{index + 1}.</span> ({t('pdf.reorder.original')}: {pageNum})
                        </p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {reordering && <ProgressBar progress={progress} />}
            <ErrorDisplay error={error} />

            {result && (
              <div className="result">
                <h4 className="result-title"><svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{t('pdf.reorder.reorderComplete')}</h4>
                <button className="download-button" onClick={handleDownload}>{t('pdf.reorder.downloadReordered')}</button>
              </div>
            )}

            {!result && !reordering && !loading && pageOrder.length > 0 && (
              <button className="convert-button" onClick={handleReorder} disabled={!isOrderChanged()}>{t('pdf.reorder.applyReorder')}</button>
            )}
          </>
        )}
      </div>

      <div className="seo-content">
        <h2>{t('pdf.reorder.whatIs')}</h2>
        <p>{t('pdf.reorder.whatIsDesc')}</p>

        <h2>{t('pdf.reorder.whyReorder')}</h2>
        <p>{t('pdf.reorder.whyReorderDesc')}</p>
        <ul>
          <li><strong>{t('pdf.reorder.whyReorderReason1')}</strong></li>
          <li><strong>{t('pdf.reorder.whyReorderReason2')}</strong></li>
          <li><strong>{t('pdf.reorder.whyReorderReason3')}</strong></li>
          <li><strong>{t('pdf.reorder.whyReorderReason4')}</strong></li>
        </ul>

        <h2>{t('pdf.reorder.howToUse')}</h2>
        <ol>
          <li>{t('pdf.reorder.step1')}</li>
          <li>{t('pdf.reorder.step2')}</li>
          <li>{t('pdf.reorder.step3')}</li>
          <li>{t('pdf.reorder.step4')}</li>
        </ol>

        <h2>{t('pdf.reorder.features')}</h2>
        <ul>
          <li><strong>{t('pdf.reorder.feature1')}</strong></li>
          <li><strong>{t('pdf.reorder.feature2')}</strong></li>
          <li><strong>{t('pdf.reorder.feature3')}</strong></li>
          <li><strong>{t('pdf.reorder.feature4')}</strong></li>
        </ul>

        <h2>{t('pdf.reorder.faq')}</h2>
        <h3>{t('pdf.reorder.faq1Q')}</h3>
        <p>{t('pdf.reorder.faq1A')}</p>
        <h3>{t('pdf.reorder.faq2Q')}</h3>
        <p>{t('pdf.reorder.faq2A')}</p>
        <h3>{t('pdf.reorder.faq3Q')}</h3>
        <p>{t('pdf.reorder.faq3A')}</p>
      </div>
    </>
  );
};

export default PdfReorder;
