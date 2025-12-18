import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import { downloadFile, getFilenameWithNewExtension } from '../../utils/download';
import { marked } from 'marked';

const MarkdownConverter = () => {
  const { t, i18n } = useTranslation();
  const [file, setFile] = useState(null);
  const [markdownText, setMarkdownText] = useState('');
  const [outputFormat, setOutputFormat] = useState('html');
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [inputMode, setInputMode] = useState('file');

  const handleFileSelect = useCallback((selectedFile) => {
    setFile(selectedFile);
    setMarkdownText('');
    setResult(null);
    setPreview(null);
    setError(null);
    setProgress(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      setMarkdownText(e.target.result);
    };
    reader.readAsText(selectedFile);
  }, []);

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setMarkdownText('');
    setResult(null);
    setPreview(null);
    setError(null);
    setProgress(0);
  }, []);

  const handleConvert = async () => {
    if (!markdownText) return;

    setConverting(true);
    setError(null);
    setProgress(10);

    try {
      setProgress(30);

      const rawHtml = marked(markdownText);
      const htmlContent = DOMPurify.sanitize(rawHtml);
      setProgress(60);

      let outputData;
      let mimeType;
      let extension;
      const lang = i18n.language === 'ko' ? 'ko' : 'en';

      if (outputFormat === 'html') {
        outputData = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Document</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.6;
      color: #333;
    }
    h1, h2, h3 { margin-top: 24px; margin-bottom: 16px; font-weight: 600; }
    h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    h3 { font-size: 1.25em; }
    p { margin-bottom: 16px; }
    code { background: #f6f8fa; padding: 2px 6px; border-radius: 4px; font-size: 85%; }
    pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #dfe2e5; padding-left: 16px; margin-left: 0; color: #6a737d; }
    ul, ol { padding-left: 2em; margin-bottom: 16px; }
    li { margin-bottom: 4px; }
    a { color: #0366d6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
    th, td { border: 1px solid #dfe2e5; padding: 8px 12px; text-align: left; }
    th { background: #f6f8fa; font-weight: 600; }
    img { max-width: 100%; height: auto; }
    hr { border: none; border-top: 1px solid #eaecef; margin: 24px 0; }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`;
        mimeType = 'text/html';
        extension = 'html';
        setPreview(htmlContent);
      } else {
        outputData = htmlContent;
        mimeType = 'text/html';
        extension = 'html';
        setPreview(htmlContent);
      }

      setProgress(90);

      const blob = new Blob([outputData], { type: mimeType });
      setResult(blob);
      setProgress(100);
    } catch (err) {
      console.error(err);
      setError(t('document.markdown.error'));
    } finally {
      setConverting(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const filename = file
      ? getFilenameWithNewExtension(file.name, 'html')
      : 'markdown-converted.html';
    downloadFile(result, filename);
  };

  return (
    <>
      <SEOHead title={t('document.markdown.pageTitle')} description={t('document.markdown.pageDescription')} keywords={t('document.markdown.seoKeywords')} />

      <div className="page-header">
        <h1 className="page-title">{t('document.markdown.pageTitle')}</h1>
        <p className="page-description">{t('document.markdown.pageDescription')}</p>
      </div>

      <div className="converter-card">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button
            onClick={() => { setInputMode('file'); handleRemoveFile(); }}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: inputMode === 'file' ? 'var(--primary-color)' : 'var(--background-color)',
              color: inputMode === 'file' ? 'white' : 'var(--text-secondary)',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            {t('document.markdown.fileUpload')}
          </button>
          <button
            onClick={() => { setInputMode('text'); handleRemoveFile(); }}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: inputMode === 'text' ? 'var(--primary-color)' : 'var(--background-color)',
              color: inputMode === 'text' ? 'white' : 'var(--text-secondary)',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            {t('document.markdown.directInput')}
          </button>
        </div>

        {inputMode === 'file' && !file ? (
          <DropZone onFileSelect={handleFileSelect} acceptedTypes={['.md', '.markdown', 'text/markdown']} fileCategory="markdown" />
        ) : inputMode === 'text' ? (
          <textarea
            value={markdownText}
            onChange={(e) => setMarkdownText(e.target.value)}
            placeholder={t('document.markdown.placeholder')}
            style={{
              width: '100%',
              minHeight: '200px',
              padding: '16px',
              border: '2px solid var(--border-color)',
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '14px',
              resize: 'vertical',
              background: 'var(--background-color)'
            }}
          />
        ) : (
          <FilePreview file={file} onRemove={handleRemoveFile} />
        )}

        {(file || markdownText) && (
          <>
            {converting && <ProgressBar progress={progress} />}
            {error && <div className="error"><svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{error}</div>}

            {preview && (
              <div style={{ marginTop: '16px', padding: '20px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', maxHeight: '300px', overflow: 'auto' }}>
                <div dangerouslySetInnerHTML={{ __html: preview }} />
              </div>
            )}

            {result && (
              <div className="result">
                <h4 className="result-title"><svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{t('common.conversionComplete')}</h4>
                <button className="download-button" onClick={handleDownload}>{t('document.downloadFormat', { format: 'HTML' })}</button>
              </div>
            )}

            {!result && !converting && markdownText && (
              <button className="convert-button" onClick={handleConvert} disabled={!markdownText}>{t('document.convertToFormat', { format: 'HTML' })}</button>
            )}
          </>
        )}
      </div>

      <div className="seo-content">
        <h2>{t('document.markdown.whatIs')}</h2>
        <p>{t('document.markdown.whatIsDesc')}</p>
        <h2>{t('whyUse.title')}</h2>
        <ul>
          <li><strong>{t('whyUse.free')}</strong></li>
          <li><strong>{t('whyUse.privacy')}</strong></li>
          <li><strong>{t('whyUse.fast')}</strong></li>
          <li><strong>{t('whyUse.quality')}</strong></li>
        </ul>
      </div>
    </>
  );
};

export default MarkdownConverter;
