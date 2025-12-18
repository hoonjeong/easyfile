import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import { splitPdf, getPdfPageCount } from '../../utils/pdfUtils';
import { downloadFile, sanitizeFilename } from '../../utils/download';
import JSZip from 'jszip';

const PdfSplit = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [splitMode, setSplitMode] = useState('each');
  const [customRanges, setCustomRanges] = useState('');
  const [splitting, setSplitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const handleFileSelect = useCallback(async (selectedFile) => {
    setFile(selectedFile);
    setResults([]);
    setError(null);
    setProgress(0);
    try {
      const count = await getPdfPageCount(selectedFile);
      setPageCount(count);
    } catch (err) {
      console.error(err);
      setError(t('pdf.common.loadError'));
    }
  }, [t]);

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setPageCount(0);
    setResults([]);
    setError(null);
    setProgress(0);
  }, []);

  const parseRanges = () => {
    if (splitMode === 'each') {
      return Array.from({ length: pageCount }, (_, i) => ({ start: i + 1, end: i + 1 }));
    }
    if (splitMode === 'half') {
      const mid = Math.ceil(pageCount / 2);
      return [{ start: 1, end: mid }, { start: mid + 1, end: pageCount }].filter(r => r.start <= r.end);
    }
    const ranges = [];
    const parts = customRanges.split(',').map(s => s.trim());
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(s => parseInt(s.trim()));
        if (!isNaN(start) && !isNaN(end) && start >= 1 && end <= pageCount && start <= end) {
          ranges.push({ start, end });
        }
      } else {
        const num = parseInt(part);
        if (!isNaN(num) && num >= 1 && num <= pageCount) {
          ranges.push({ start: num, end: num });
        }
      }
    }
    return ranges;
  };

  const handleSplit = async () => {
    if (!file) return;
    const ranges = parseRanges();
    if (ranges.length === 0) {
      setError(t('pdf.split.invalidRange'));
      return;
    }
    setSplitting(true);
    setError(null);
    setProgress(0);
    try {
      const splitResults = await splitPdf(file, ranges, setProgress);
      setResults(splitResults);
    } catch (err) {
      console.error(err);
      setError(t('pdf.split.error'));
    } finally {
      setSplitting(false);
    }
  };

  const handleDownloadSingle = (result) => {
    // Sanitize filename to prevent path traversal attacks
    const baseName = sanitizeFilename(file.name.replace(/\.pdf$/i, ''));
    downloadFile(result.blob, `${baseName}_${result.range}.pdf`);
  };

  const handleDownloadAll = async () => {
    if (results.length === 1) {
      handleDownloadSingle(results[0]);
      return;
    }
    const zip = new JSZip();
    // Sanitize filename to prevent Zip Slip and path traversal attacks
    const baseName = sanitizeFilename(file.name.replace(/\.pdf$/i, ''));
    results.forEach((result) => {
      zip.file(`${baseName}_${result.range}.pdf`, result.blob);
    });
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadFile(zipBlob, `${baseName}_split.zip`);
  };

  return (
    <>
      <SEOHead
        title={t('pdf.split.pageTitle')}
        description={t('pdf.split.pageDescription')}
        keywords={t('pdf.split.seoKeywords')}
      />

      <div className="page-header">
        <h1 className="page-title">{t('pdf.split.pageTitle')}</h1>
        <p className="page-description">{t('pdf.split.pageDescription')}</p>
      </div>

      <div className="converter-card">
        {!file ? (
          <DropZone onFileSelect={handleFileSelect} acceptedTypes={['.pdf', 'application/pdf']} fileCategory="pdf" />
        ) : (
          <>
            <FilePreview file={file} onRemove={handleRemoveFile} />

            {pageCount > 0 && (
              <div className="options">
                <h4 className="options-title">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t('pdf.split.splitOptions')} ({t('common.total')} {pageCount} {t('common.pages')})
                </h4>

                <div className="option-group">
                  <label className="option-label">{t('pdf.split.splitMode')}</label>
                  <select className="option-select" value={splitMode} onChange={(e) => setSplitMode(e.target.value)}>
                    <option value="each">{t('pdf.split.eachPage')}</option>
                    <option value="half">{t('pdf.split.half')}</option>
                    <option value="custom">{t('pdf.split.custom')}</option>
                  </select>
                </div>

                {splitMode === 'custom' && (
                  <div className="option-group">
                    <label className="option-label">{t('pdf.split.customRange')}</label>
                    <input
                      type="text"
                      value={customRanges}
                      onChange={(e) => setCustomRanges(e.target.value)}
                      placeholder="1-3, 5, 7-10"
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '14px' }}
                    />
                  </div>
                )}
              </div>
            )}

            {splitting && <ProgressBar progress={progress} />}

            {error && (
              <div className="error">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {results.length > 0 && (
              <div className="result">
                <h4 className="result-title">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('pdf.split.splitComplete')} ({results.length} {t('pdf.split.files')})
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {results.map((result, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px', justifyContent: 'space-between' }}>
                      <span>{t('common.page')} {result.range}</span>
                      <button onClick={() => handleDownloadSingle(result)} style={{ padding: '6px 12px', cursor: 'pointer', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px' }}>{t('common.download')}</button>
                    </div>
                  ))}
                </div>

                <button className="download-button" onClick={handleDownloadAll}>
                  {results.length > 1 ? t('common.downloadAll') : t('common.download')}
                </button>
              </div>
            )}

            {results.length === 0 && !splitting && pageCount > 0 && (
              <button className="convert-button" onClick={handleSplit}>{t('pdf.split.splitPdf')}</button>
            )}
          </>
        )}
      </div>

      <div className="seo-content">
        <h2>{t('pdf.split.what')}</h2>
        <p>{t('pdf.split.whatDesc')}</p>

        <h2>{t('whyUse.title')}</h2>
        <ul>
          <li><strong>{t('whyUse.free')}</strong></li>
          <li><strong>{t('whyUse.privacy')}</strong></li>
          <li><strong>{t('whyUse.splitOptions')}</strong></li>
          <li><strong>{t('whyUse.batch')}</strong></li>
        </ul>
      </div>
    </>
  );
};

export default PdfSplit;
