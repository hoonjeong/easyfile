import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import SEOHead from '../../components/SEOHead';
import { marked } from 'marked';
import CoupangBanner from '../../components/CoupangBanner';

const MarkdownToHtml = () => {
  const { t } = useTranslation();
  const [markdownText, setMarkdownText] = useState('');
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('preview'); // 'preview' or 'code'

  const htmlContent = useMemo(() => {
    if (!markdownText.trim()) return '';
    const rawHtml = marked(markdownText);
    return DOMPurify.sanitize(rawHtml);
  }, [markdownText]);

  const fullHtmlDocument = useMemo(() => {
    if (!htmlContent) return '';
    return `<!DOCTYPE html>
<html lang="ko">
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
    h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 16px; font-weight: 600; }
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
  }, [htmlContent]);

  const handleCopy = useCallback(async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, []);

  const defaultMarkdown = `# ${t('document.markdownHtml.exampleTitle')}

${t('document.markdownHtml.exampleIntro')}

## ${t('document.markdownHtml.exampleFeatures')}

- **${t('document.markdownHtml.feature1')}**
- *${t('document.markdownHtml.feature2')}*
- \`${t('document.markdownHtml.feature3')}\`

## ${t('document.markdownHtml.exampleCode')}

\`\`\`javascript
console.log('Hello, World!');
\`\`\`

> ${t('document.markdownHtml.exampleQuote')}

| ${t('document.markdownHtml.tableHeader1')} | ${t('document.markdownHtml.tableHeader2')} |
|------|------|
| ${t('document.markdownHtml.tableRow1Col1')} | ${t('document.markdownHtml.tableRow1Col2')} |
| ${t('document.markdownHtml.tableRow2Col1')} | ${t('document.markdownHtml.tableRow2Col2')} |`;

  return (
    <>
      <SEOHead
        title={t('document.markdownHtml.pageTitle')}
        description={t('document.markdownHtml.pageDescription')}
        keywords={t('document.markdownHtml.seoKeywords')}
      />

      <div className="page-header">
        <h1 className="page-title">{t('document.markdownHtml.pageTitle')}</h1>
        <p className="page-description">{t('document.markdownHtml.pageDescription')}</p>
      </div>

      <CoupangBanner type="top" />

      <div className="converter-card" style={{ padding: '20px', maxWidth: '100%' }}>
        {/* Example Button */}
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setMarkdownText(defaultMarkdown)}
            style={{
              padding: '8px 16px',
              background: 'var(--background-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {t('document.markdownHtml.loadExample')}
          </button>
        </div>

        {/* Split Layout */}
        <div className="markdown-split-layout" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          minHeight: '500px'
        }}>
          {/* Left: Markdown Input */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                {t('document.markdownHtml.inputLabel')}
              </h3>
            </div>
            <textarea
              value={markdownText}
              onChange={(e) => setMarkdownText(e.target.value)}
              placeholder={t('document.markdownHtml.placeholder')}
              style={{
                flex: 1,
                width: '100%',
                padding: '16px',
                border: '2px solid var(--border-color)',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '14px',
                resize: 'none',
                background: 'var(--background-color)',
                lineHeight: '1.6'
              }}
            />
          </div>

          {/* Right: Result */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                {t('document.markdownHtml.outputLabel')}
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setViewMode('preview')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: viewMode === 'preview' ? 'var(--primary-color)' : 'var(--background-color)',
                    color: viewMode === 'preview' ? 'white' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  {t('document.markdownHtml.preview')}
                </button>
                <button
                  onClick={() => setViewMode('code')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: viewMode === 'code' ? 'var(--primary-color)' : 'var(--background-color)',
                    color: viewMode === 'code' ? 'white' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  {t('document.markdownHtml.htmlCode')}
                </button>
              </div>
            </div>

            <div style={{
              flex: 1,
              border: '2px solid var(--border-color)',
              borderRadius: '8px',
              overflow: 'auto',
              background: 'white'
            }}>
              {viewMode === 'preview' ? (
                <div
                  style={{ padding: '20px', lineHeight: '1.6' }}
                  dangerouslySetInnerHTML={{ __html: htmlContent || `<p style="color: #999">${t('document.markdownHtml.emptyPreview')}</p>` }}
                />
              ) : (
                <pre style={{
                  padding: '16px',
                  margin: 0,
                  fontSize: '13px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  fontFamily: 'monospace',
                  background: '#f6f8fa'
                }}>
                  {htmlContent || t('document.markdownHtml.emptyCode')}
                </pre>
              )}
            </div>

            {/* Copy Buttons */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginTop: '12px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => handleCopy(htmlContent)}
                disabled={!htmlContent}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: htmlContent ? 'var(--primary-color)' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: htmlContent ? 'pointer' : 'not-allowed',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                {copied ? t('common.copiedToClipboard') : t('document.markdownHtml.copyHtmlBody')}
              </button>
              <button
                onClick={() => handleCopy(fullHtmlDocument)}
                disabled={!htmlContent}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: htmlContent ? '#28a745' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: htmlContent ? 'pointer' : 'not-allowed',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                {t('document.markdownHtml.copyFullHtml')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="seo-content">
        <h2>{t('document.markdownHtml.whatIs')}</h2>
        <p>{t('document.markdownHtml.whatIsDesc')}</p>
        <h2>{t('whyUse.title')}</h2>
        <ul>
          <li><strong>{t('whyUse.free')}</strong></li>
          <li><strong>{t('whyUse.privacy')}</strong></li>
          <li><strong>{t('whyUse.fast')}</strong></li>
        </ul>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .markdown-split-layout {
            grid-template-columns: 1fr !important;
          }
          .markdown-split-layout > div {
            min-height: 300px;
          }
        }
      `}</style>
    </>
  );
};

export default MarkdownToHtml;
