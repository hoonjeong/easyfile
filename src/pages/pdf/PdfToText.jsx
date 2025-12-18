import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import { extractTextFromPdf } from '../../utils/pdfUtils';
import { downloadFile, getFilenameWithNewExtension } from '../../utils/download';

const PdfToText = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [outputMode, setOutputMode] = useState('combined');

  const handleFileSelect = useCallback((selectedFile) => {
    setFile(selectedFile);
    setResults([]);
    setError(null);
    setProgress(0);
  }, []);

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setResults([]);
    setError(null);
    setProgress(0);
  }, []);

  const handleConvert = async () => {
    if (!file) return;

    setConverting(true);
    setError(null);
    setProgress(0);

    try {
      const textContent = await extractTextFromPdf(file, setProgress);
      setResults(textContent);
    } catch (err) {
      console.error(err);
      setError(t('pdf.toText.error'));
    } finally {
      setConverting(false);
    }
  };

  const getCombinedText = () => {
    return results.map(r => `=== ${t('common.page')} ${r.pageNum} ===\n${r.text}`).join('\n\n');
  };

  const handleDownload = () => {
    const text = getCombinedText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const filename = getFilenameWithNewExtension(file.name, 'txt');
    downloadFile(blob, filename);
  };

  const handleCopyToClipboard = async () => {
    const text = getCombinedText();
    try {
      await navigator.clipboard.writeText(text);
      alert(t('common.copiedToClipboard'));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <SEOHead
        title={t('pdf.toText.pageTitle')}
        description={t('pdf.toText.pageDescription')}
        keywords="PDF text extract, PDF to text, PDF converter, text extraction, online PDF converter, free PDF converter"
      />

      <div className="page-header">
        <h1 className="page-title">{t('pdf.toText.pageTitle')}</h1>
        <p className="page-description">{t('pdf.toText.pageDescription')}</p>
      </div>

      <div className="converter-card">
        {!file ? (
          <DropZone
            onFileSelect={handleFileSelect}
            acceptedTypes={['.pdf', 'application/pdf']}
          />
        ) : (
          <>
            <FilePreview file={file} onRemove={handleRemoveFile} />

            {converting && <ProgressBar progress={progress} />}

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
                  {t('pdf.toText.extractComplete')} ({results.length} {t('common.pages')})
                </h4>

                <div className="options" style={{ marginBottom: '16px' }}>
                  <div className="option-group">
                    <label className="option-label">{t('pdf.toText.viewMode')}</label>
                    <select
                      className="option-select"
                      value={outputMode}
                      onChange={(e) => setOutputMode(e.target.value)}
                    >
                      <option value="combined">{t('pdf.toText.allText')}</option>
                      <option value="pages">{t('pdf.toText.byPage')}</option>
                    </select>
                  </div>
                </div>

                <div style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '16px',
                  maxHeight: '400px',
                  overflow: 'auto',
                  marginBottom: '16px'
                }}>
                  {outputMode === 'combined' ? (
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, fontFamily: 'inherit', fontSize: '14px', lineHeight: '1.6' }}>
                      {getCombinedText()}
                    </pre>
                  ) : (
                    results.map((page) => (
                      <div key={page.pageNum} style={{ marginBottom: '24px' }}>
                        <h5 style={{ color: 'var(--primary-color)', marginBottom: '8px', fontSize: '14px' }}>
                          {t('common.page')} {page.pageNum}
                        </h5>
                        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, fontFamily: 'inherit', fontSize: '14px', lineHeight: '1.6', paddingLeft: '12px', borderLeft: '3px solid var(--border-color)' }}>
                          {page.text || t('pdf.toText.noText')}
                        </pre>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button className="download-button" onClick={handleDownload}>
                    {t('pdf.toText.downloadTxt')}
                  </button>
                  <button
                    className="download-button"
                    onClick={handleCopyToClipboard}
                    style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                  >
                    {t('common.copyToClipboard')}
                  </button>
                </div>
              </div>
            )}

            {results.length === 0 && !converting && (
              <button className="convert-button" onClick={handleConvert} disabled={!file}>
                {t('pdf.toText.extractText')}
              </button>
            )}
          </>
        )}
      </div>

      <div className="seo-content">
        <h2>{t('pdf.toText.what')}</h2>
        <p>{t('pdf.toText.whatDesc')}</p>

        <h2>{t('whyUse.title')}</h2>
        <ul>
          <li><strong>{t('whyUse.free')}</strong></li>
          <li><strong>{t('whyUse.privacy')}</strong></li>
          <li><strong>{t('whyUse.fast')}</strong></li>
          <li><strong>{t('whyUse.output')}</strong></li>
        </ul>
      </div>
    </>
  );
};

export default PdfToText;
