import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import SEOHead from '../../components/SEOHead';
import { marked } from 'marked';
import CoupangBanner from '../../components/CoupangBanner';

// Naver Blog optimized inline styles
const naverStyles = {
  h1: 'font-size: 28px; font-weight: bold; margin: 24px 0 16px 0; color: #333;',
  h2: 'font-size: 24px; font-weight: bold; margin: 20px 0 14px 0; color: #333;',
  h3: 'font-size: 20px; font-weight: bold; margin: 18px 0 12px 0; color: #333;',
  h4: 'font-size: 18px; font-weight: bold; margin: 16px 0 10px 0; color: #333;',
  h5: 'font-size: 16px; font-weight: bold; margin: 14px 0 8px 0; color: #333;',
  h6: 'font-size: 14px; font-weight: bold; margin: 12px 0 6px 0; color: #333;',
  p: 'margin: 0 0 16px 0; line-height: 1.8; color: #333;',
  blockquote: 'margin: 16px 0; padding: 12px 20px; background-color: #f8f9fa; border-left: 4px solid #03c75a; color: #555;',
  inlineCode: 'background-color: #f1f1f1; padding: 2px 6px; border-radius: 4px; font-family: Consolas, Monaco, monospace; font-size: 14px; color: #c7254e;',
  // 코드 블록 - 연한 회색 배경, 검은 글씨
  codeBlock: 'display: block; background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0; overflow-x: auto; border: 1px solid #e0e0e0;',
  codeBlockCode: 'font-family: Consolas, Monaco, "Courier New", monospace; font-size: 14px; line-height: 1.6; color: #333; white-space: pre-wrap; word-break: break-all;',
  ul: 'margin: 0 0 16px 0; padding-left: 24px; color: #333;',
  ol: 'margin: 0 0 16px 0; padding-left: 24px; color: #333;',
  li: 'margin: 4px 0; line-height: 1.8;',
  a: 'color: #03c75a; text-decoration: underline;',
  table: 'border-collapse: collapse; width: 100%; margin: 16px 0;',
  th: 'border: 1px solid #e0e0e0; padding: 12px; background-color: #f8f9fa; font-weight: bold; text-align: left; color: #333;',
  td: 'border: 1px solid #e0e0e0; padding: 12px; text-align: left; color: #333;',
  hr: 'border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;',
  img: 'max-width: 100%; height: auto;',
  strong: 'font-weight: bold;',
  em: 'font-style: italic;'
};

const MarkdownToNaverBlog = () => {
  const { t } = useTranslation();
  const [markdownText, setMarkdownText] = useState('');
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('preview');

  const convertToNaverHtml = useCallback((markdown) => {
    if (!markdown.trim()) return '';

    // Remove Front Matter (Hugo/Jekyll) - only at the very beginning of the file
    // Front Matter starts with --- on first line, followed by metadata, then ---
    // Note: Do NOT use /m flag, so ^ matches only the start of the string
    let cleanMarkdown = markdown;
    if (markdown.startsWith('---\n')) {
      cleanMarkdown = markdown.replace(/^---\n[\s\S]*?\n---\n*/, '');
    }

    // Configure marked
    marked.setOptions({
      breaks: true,
      gfm: true
    });

    // Parse markdown to HTML
    let html = marked.parse(cleanMarkdown);

    // Post-process HTML to add Naver Blog styles

    // 1. Headers (h1-h6)
    html = html.replace(/<h1>([\s\S]*?)<\/h1>/gi, `<h1 style="${naverStyles.h1}">$1</h1>`);
    html = html.replace(/<h2>([\s\S]*?)<\/h2>/gi, `<h2 style="${naverStyles.h2}">$1</h2>`);
    html = html.replace(/<h3>([\s\S]*?)<\/h3>/gi, `<h3 style="${naverStyles.h3}">$1</h3>`);
    html = html.replace(/<h4>([\s\S]*?)<\/h4>/gi, `<h4 style="${naverStyles.h4}">$1</h4>`);
    html = html.replace(/<h5>([\s\S]*?)<\/h5>/gi, `<h5 style="${naverStyles.h5}">$1</h5>`);
    html = html.replace(/<h6>([\s\S]*?)<\/h6>/gi, `<h6 style="${naverStyles.h6}">$1</h6>`);

    // 2. Paragraphs
    html = html.replace(/<p>([\s\S]*?)<\/p>/gi, `<p style="${naverStyles.p}">$1</p>`);

    // 3. Strong/Bold
    html = html.replace(/<strong>([\s\S]*?)<\/strong>/gi, `<strong style="${naverStyles.strong}">$1</strong>`);
    html = html.replace(/<b>([\s\S]*?)<\/b>/gi, `<b style="${naverStyles.strong}">$1</b>`);

    // 4. Emphasis/Italic
    html = html.replace(/<em>([\s\S]*?)<\/em>/gi, `<em style="${naverStyles.em}">$1</em>`);
    html = html.replace(/<i>([\s\S]*?)<\/i>/gi, `<i style="${naverStyles.em}">$1</i>`);

    // 5. Code blocks (pre > code) - 네이버 블로그용 div 기반으로 변경
    html = html.replace(/<pre><code(?:\s+class="language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/gi, (match, lang, code) => {
      // 네이버 블로그 호환을 위해 div 사용, 코드는 그대로 유지 (이미 이스케이프됨)
      return `<div style="${naverStyles.codeBlock}"><code style="${naverStyles.codeBlockCode}">${code}</code></div>`;
    });

    // 6. Inline code (not inside pre)
    html = html.replace(/<code(?![^>]*style=)>([\s\S]*?)<\/code>/gi, `<code style="${naverStyles.inlineCode}">$1</code>`);

    // 7. Blockquotes
    html = html.replace(/<blockquote>([\s\S]*?)<\/blockquote>/gi, `<blockquote style="${naverStyles.blockquote}">$1</blockquote>`);

    // 8. Lists
    html = html.replace(/<ul>([\s\S]*?)<\/ul>/gi, `<ul style="${naverStyles.ul}">$1</ul>`);
    html = html.replace(/<ol>([\s\S]*?)<\/ol>/gi, `<ol style="${naverStyles.ol}">$1</ol>`);
    html = html.replace(/<li>([\s\S]*?)<\/li>/gi, `<li style="${naverStyles.li}">$1</li>`);

    // 9. Tables
    html = html.replace(/<table>/gi, `<table style="${naverStyles.table}">`);
    html = html.replace(/<th>([\s\S]*?)<\/th>/gi, `<th style="${naverStyles.th}">$1</th>`);
    html = html.replace(/<td>([\s\S]*?)<\/td>/gi, `<td style="${naverStyles.td}">$1</td>`);

    // 10. Links
    html = html.replace(/<a\s+href="([^"]*)">([\s\S]*?)<\/a>/gi, `<a href="$1" style="${naverStyles.a}" target="_blank">$2</a>`);

    // 11. Images
    html = html.replace(/<img\s+src="([^"]*)"(?:\s+alt="([^"]*)")?[^>]*>/gi, `<img src="$1" alt="$2" style="${naverStyles.img}">`);

    // 12. Horizontal rules
    html = html.replace(/<hr\s*\/?>/gi, `<hr style="${naverStyles.hr}">`);

    return DOMPurify.sanitize(html, {
      ADD_ATTR: ['target', 'style'],
      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'blockquote',
                     'pre', 'code', 'ul', 'ol', 'li', 'a', 'img', 'table', 'thead',
                     'tbody', 'tr', 'th', 'td', 'strong', 'em', 'b', 'i', 'span', 'div']
    });
  }, []);

  const htmlContent = useMemo(() => {
    return convertToNaverHtml(markdownText);
  }, [markdownText, convertToNaverHtml]);

  const handleCopy = useCallback(async () => {
    try {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const clipboardItem = new ClipboardItem({
        'text/html': blob,
        'text/plain': new Blob([htmlContent], { type: 'text/plain' })
      });
      await navigator.clipboard.write([clipboardItem]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback to text copy
      await navigator.clipboard.writeText(htmlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [htmlContent]);

  const defaultMarkdown = `# ${t('document.markdownNaver.exampleTitle')}

${t('document.markdownNaver.exampleIntro')}

## ${t('document.markdownNaver.exampleFeatures')}

- **${t('document.markdownNaver.feature1')}**
- *${t('document.markdownNaver.feature2')}*
- \`${t('document.markdownNaver.feature3')}\`

## ${t('document.markdownNaver.exampleCode')}

\`\`\`javascript
function hello() {
  console.log('Hello, Naver Blog!');
  return true;
}
\`\`\`

> ${t('document.markdownNaver.exampleQuote')}

| ${t('document.markdownNaver.tableHeader1')} | ${t('document.markdownNaver.tableHeader2')} |
|------|------|
| ${t('document.markdownNaver.tableRow1Col1')} | ${t('document.markdownNaver.tableRow1Col2')} |
| ${t('document.markdownNaver.tableRow2Col1')} | ${t('document.markdownNaver.tableRow2Col2')} |

---

${t('document.markdownNaver.exampleFooter')}`;

  return (
    <>
      <SEOHead
        title={t('document.markdownNaver.pageTitle')}
        description={t('document.markdownNaver.pageDescription')}
        keywords={t('document.markdownNaver.seoKeywords')}
      />

      <div className="page-header">
        <h1 className="page-title">{t('document.markdownNaver.pageTitle')}</h1>
        <p className="page-description">{t('document.markdownNaver.pageDescription')}</p>
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
            {t('document.markdownNaver.loadExample')}
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
                {t('document.markdownNaver.inputLabel')}
              </h3>
            </div>
            <textarea
              value={markdownText}
              onChange={(e) => setMarkdownText(e.target.value)}
              placeholder={t('document.markdownNaver.placeholder')}
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
                {t('document.markdownNaver.outputLabel')}
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setViewMode('preview')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: viewMode === 'preview' ? '#03c75a' : 'var(--background-color)',
                    color: viewMode === 'preview' ? 'white' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  {t('document.markdownNaver.preview')}
                </button>
                <button
                  onClick={() => setViewMode('code')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: viewMode === 'code' ? '#03c75a' : 'var(--background-color)',
                    color: viewMode === 'code' ? 'white' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                >
                  {t('document.markdownNaver.htmlCode')}
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
                  dangerouslySetInnerHTML={{ __html: htmlContent || `<p style="color: #999">${t('document.markdownNaver.emptyPreview')}</p>` }}
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
                  {htmlContent || t('document.markdownNaver.emptyCode')}
                </pre>
              )}
            </div>

            {/* Copy Button */}
            <div style={{ marginTop: '12px' }}>
              <button
                onClick={handleCopy}
                disabled={!htmlContent}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: htmlContent ? '#03c75a' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: htmlContent ? 'pointer' : 'not-allowed',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                {copied ? t('common.copiedToClipboard') : t('document.markdownNaver.copy')}
              </button>
            </div>
          </div>
        </div>

        {/* Usage Guide */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '600' }}>
            {t('document.markdownNaver.howToUse')}
          </h4>
          <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8', fontSize: '14px', color: '#555' }}>
            <li>{t('document.markdownNaver.step1')}</li>
            <li>{t('document.markdownNaver.step2')}</li>
            <li>{t('document.markdownNaver.step3')}</li>
            <li>{t('document.markdownNaver.step4')}</li>
          </ol>
        </div>
      </div>

      <div className="seo-content">
        <h2>{t('document.markdownNaver.whatIs')}</h2>
        <p>{t('document.markdownNaver.whatIsDesc')}</p>
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

export default MarkdownToNaverBlog;
