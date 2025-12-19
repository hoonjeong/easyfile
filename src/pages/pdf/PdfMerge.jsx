import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/SEOHead';
import ProgressBar from '../../components/ProgressBar';
import ErrorDisplay from '../../components/ErrorDisplay';
import { mergePdfs } from '../../utils/pdfUtils';
import { downloadFile } from '../../utils/download';
import { securityCheck, validateFileType } from '../../utils/fileValidation';

const PdfMerge = () => {
  const { t } = useTranslation();
  const [files, setFiles] = useState([]);
  const [merging, setMerging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);

  const handleFileSelect = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = [];

    for (const file of selectedFiles) {
      // Security check
      const secResult = securityCheck(file);
      if (!secResult.valid) {
        setValidationError(t(secResult.error));
        continue;
      }

      // Type validation
      const typeResult = validateFileType(file, 'pdf');
      if (!typeResult.valid) {
        setValidationError(t(typeResult.error, { allowed: typeResult.allowed || '' }));
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setResult(null);
      setError(null);
      setValidationError(null);
    }
    e.target.value = '';
  }, [t]);

  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setResult(null);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    setFiles(prev => {
      const newFiles = [...prev];
      [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
      return newFiles;
    });
  };

  const handleMoveDown = (index) => {
    if (index === files.length - 1) return;
    setFiles(prev => {
      const newFiles = [...prev];
      [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
      return newFiles;
    });
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError(t('pdf.merge.minTwoFiles'));
      return;
    }

    setMerging(true);
    setError(null);
    setProgress(0);

    try {
      const mergedPdf = await mergePdfs(files, setProgress);
      setResult(mergedPdf);
    } catch (err) {
      console.error(err);
      setError(t('pdf.merge.error'));
    } finally {
      setMerging(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadFile(result, 'merged.pdf');
  };

  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  return (
    <>
      <SEOHead
        title={t('pdf.merge.pageTitle')}
        description={t('pdf.merge.pageDescription')}
        keywords={t('pdf.merge.seoKeywords')}
      />

      <div className="page-header">
        <h1 className="page-title">{t('pdf.merge.pageTitle')}</h1>
        <p className="page-description">{t('pdf.merge.pageDescription')}</p>
      </div>

      <div className="converter-card">
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '40px',
              border: '2px dashed var(--border-color)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>{t('pdf.merge.addFiles')}</span>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>{t('pdf.merge.clickToSelect')}</span>
            <input
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {validationError && (
          <div className="drop-zone-error" style={{ marginBottom: '16px' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{validationError}</span>
          </div>
        )}

        {files.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              {t('pdf.merge.selectedFiles')} ({files.length}) - {t('pdf.merge.mergeOrder')}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {files.map((file, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: '8px',
                    gap: '12px'
                  }}
                >
                  <span style={{ fontWeight: '600', color: 'var(--primary-color)', minWidth: '24px' }}>
                    {index + 1}
                  </span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </span>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <button onClick={() => handleMoveUp(index)} disabled={index === 0} style={{ padding: '4px 8px', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.5 : 1, background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px' }}>^</button>
                  <button onClick={() => handleMoveDown(index)} disabled={index === files.length - 1} style={{ padding: '4px 8px', cursor: index === files.length - 1 ? 'not-allowed' : 'pointer', opacity: index === files.length - 1 ? 0.5 : 1, background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px' }}>v</button>
                  <button onClick={() => handleRemoveFile(index)} style={{ padding: '4px 8px', cursor: 'pointer', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#ef4444' }}>X</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {merging && <ProgressBar progress={progress} />}

        <ErrorDisplay error={error} />

        {result && (
          <div className="result">
            <h4 className="result-title">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('pdf.merge.mergeComplete')}
            </h4>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="download-button" onClick={handleDownload}>{t('pdf.merge.downloadMerged')}</button>
              <button className="download-button" onClick={handleReset} style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>{t('common.reset')}</button>
            </div>
          </div>
        )}

        {!result && !merging && files.length >= 2 && (
          <button className="convert-button" onClick={handleMerge}>{t('pdf.merge.mergePdf')}</button>
        )}
      </div>

      <div className="seo-content">
        <h2>{t('pdf.merge.what')}</h2>
        <p>{t('pdf.merge.whatDesc')}</p>

        <h2>{t('whyUse.title')}</h2>
        <ul>
          <li><strong>{t('whyUse.free')}</strong></li>
          <li><strong>{t('whyUse.privacy')}</strong></li>
          <li><strong>{t('whyUse.reorder')}</strong></li>
          <li><strong>{t('whyUse.unlimited')}</strong></li>
        </ul>
      </div>
    </>
  );
};

export default PdfMerge;
