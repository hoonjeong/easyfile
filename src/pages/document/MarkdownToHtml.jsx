import { useState, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import html2canvas from 'html2canvas';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import SEOHead from '../../components/SEOHead';
import { marked } from 'marked';
import Breadcrumb from '../../components/Breadcrumb';

const MarkdownToHtml = () => {
  const { t } = useTranslation();
  const [markdownText, setMarkdownText] = useState('');
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('preview'); // 'preview' or 'code'
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const pdfRenderRef = useRef(null);

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

  const handleDownloadPdf = useCallback(async () => {
    if (!htmlContent || !pdfRenderRef.current) return;
    setDownloadingPdf(true);
    try {
      const el = pdfRenderRef.current;

      // A4 in PDF points (1pt = 1/72 inch): 210mm x 297mm
      const A4_WIDTH_PT = 595.28;
      const A4_HEIGHT_PT = 841.89;
      const MARGIN_PT = 36; // ~12.7mm margin
      const contentWidthPt = A4_WIDTH_PT - 2 * MARGIN_PT;
      const contentHeightPt = A4_HEIGHT_PT - 2 * MARGIN_PT;

      const scale = 2;
      const canvas = await html2canvas(el, {
        scale,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });

      const cssWidth = el.offsetWidth;
      const cssHeight = el.offsetHeight;
      const pageCssHeight = (contentHeightPt * cssWidth) / contentWidthPt;

      // Collect break candidates from block-level children (snap page cuts to element bottoms)
      const containerTop = el.getBoundingClientRect().top;
      const breakPoints = new Set([0, cssHeight]);
      const collect = (parent) => {
        Array.from(parent.children).forEach((child) => {
          const rect = child.getBoundingClientRect();
          breakPoints.add(rect.bottom - containerTop);
          if (['UL', 'OL', 'TABLE', 'THEAD', 'TBODY', 'BLOCKQUOTE'].includes(child.tagName)) {
            collect(child);
          }
        });
      };
      collect(el);
      const sortedBreaks = [...breakPoints].sort((a, b) => a - b);

      // Determine page cuts in CSS pixels, snapping to nearest block break
      const cuts = [0];
      while (cuts[cuts.length - 1] < cssHeight - 0.5) {
        const top = cuts[cuts.length - 1];
        const maxBottom = top + pageCssHeight;
        let bestCut = null;
        for (const bp of sortedBreaks) {
          if (bp > top + 1 && bp <= maxBottom + 0.5) {
            bestCut = bp;
          }
        }
        // No break fits within page -> force cut at page boundary (element taller than page)
        if (bestCut === null) {
          bestCut = Math.min(maxBottom, cssHeight);
        }
        cuts.push(bestCut);
      }

      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < cuts.length - 1; i++) {
        const yStartCss = cuts[i];
        const yEndCss = cuts[i + 1];
        const yStart = Math.round(yStartCss * scale);
        const yEnd = Math.round(yEndCss * scale);
        const sliceHeight = yEnd - yStart;
        if (sliceHeight <= 0) continue;

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        const ctx = pageCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, sliceHeight);
        ctx.drawImage(canvas, 0, yStart, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

        const dataUrl = pageCanvas.toDataURL('image/png');
        const pngBytes = await fetch(dataUrl).then((r) => r.arrayBuffer());
        const pngImage = await pdfDoc.embedPng(pngBytes);

        const page = pdfDoc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT]);
        const imgWidthPt = contentWidthPt;
        const imgHeightPt = (sliceHeight / scale) * (contentWidthPt / cssWidth);
        page.drawImage(pngImage, {
          x: MARGIN_PT,
          y: A4_HEIGHT_PT - MARGIN_PT - imgHeightPt,
          width: imgWidthPt,
          height: imgHeightPt,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, 'markdown.pdf');
    } catch (err) {
      console.error('PDF download failed:', err);
    } finally {
      setDownloadingPdf(false);
    }
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

      <Breadcrumb category="document" currentPage={t('document.markdownHtml.title')} />

      <div className="page-header">
        <h1 className="page-title">{t('document.markdownHtml.pageTitle')}</h1>
        <p className="page-description">{t('document.markdownHtml.pageDescription')}</p>
      </div>

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
              <button
                onClick={handleDownloadPdf}
                disabled={!htmlContent || downloadingPdf}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: htmlContent && !downloadingPdf ? '#dc3545' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: htmlContent && !downloadingPdf ? 'pointer' : 'not-allowed',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                {downloadingPdf ? t('document.markdownHtml.generatingPdf') : t('document.markdownHtml.downloadPdf')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden A4-width render target for PDF export */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-10000px',
          top: 0,
          width: '760px',
          pointerEvents: 'none',
          opacity: 0,
        }}
      >
        <div
          ref={pdfRenderRef}
          style={{
            width: '760px',
            padding: '0',
            background: '#ffffff',
            color: '#333',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
            lineHeight: 1.6,
            fontSize: '14px',
            wordWrap: 'break-word',
          }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>

      <div className="seo-content">
        <h2>{t('document.markdownHtml.whatIs')}</h2>
        <p>{t('document.markdownHtml.whatIsDesc')}</p>

        <h2>{t('document.markdownHtml.whyConvert')}</h2>
        <p>{t('document.markdownHtml.whyConvertDesc')}</p>
        <ul>
          <li><strong>{t('document.markdownHtml.whyConvertReason1')}</strong></li>
          <li><strong>{t('document.markdownHtml.whyConvertReason2')}</strong></li>
          <li><strong>{t('document.markdownHtml.whyConvertReason3')}</strong></li>
          <li><strong>{t('document.markdownHtml.whyConvertReason4')}</strong></li>
        </ul>

        <h2>{t('document.markdownHtml.howToUse')}</h2>
        <ol>
          <li>{t('document.markdownHtml.step1')}</li>
          <li>{t('document.markdownHtml.step2')}</li>
          <li>{t('document.markdownHtml.step3')}</li>
          <li>{t('document.markdownHtml.step4')}</li>
        </ol>

        <h2>{t('document.markdownHtml.features')}</h2>
        <ul>
          <li><strong>{t('document.markdownHtml.feature1')}</strong></li>
          <li><strong>{t('document.markdownHtml.feature2')}</strong></li>
          <li><strong>{t('document.markdownHtml.feature3')}</strong></li>
          <li><strong>{t('document.markdownHtml.feature4')}</strong></li>
        </ul>

        <h2>{t('document.markdownHtml.faq')}</h2>
        <h3>{t('document.markdownHtml.faq1Q')}</h3>
        <p>{t('document.markdownHtml.faq1A')}</p>
        <h3>{t('document.markdownHtml.faq2Q')}</h3>
        <p>{t('document.markdownHtml.faq2A')}</p>
        <h3>{t('document.markdownHtml.faq3Q')}</h3>
        <p>{t('document.markdownHtml.faq3A')}</p>
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
