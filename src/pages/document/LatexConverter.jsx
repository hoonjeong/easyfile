import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';
import SEOHead from '../../components/SEOHead';
import ProgressBar from '../../components/ProgressBar';
import ErrorDisplay from '../../components/ErrorDisplay';
import ResultDisplay from '../../components/ResultDisplay';
import { downloadFile } from '../../utils/download';
import CoupangBanner from '../../components/CoupangBanner';
import Breadcrumb from '../../components/Breadcrumb';

/**
 * Sanitize LaTeX input to prevent XSS attacks
 * Removes HTML tags and dangerous patterns while preserving LaTeX syntax
 */
const sanitizeLatexInput = (input) => {
  if (!input || typeof input !== 'string') return '';

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Remove script-like patterns
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  // Remove potentially dangerous URL patterns
  sanitized = sanitized.replace(/data:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');

  return sanitized;
};

const LatexConverter = () => {
  const { t } = useTranslation();
  const [latexInput, setLatexInput] = useState('\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}');
  const [outputFormat, setOutputFormat] = useState('png');
  const [fontSize, setFontSize] = useState(24);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [mathJaxReady, setMathJaxReady] = useState(false);
  const [loadingMathJax, setLoadingMathJax] = useState(true);
  const previewRef = useRef(null);
  const renderRef = useRef(null);

  useEffect(() => {
    if (window.MathJax && window.MathJax.typesetPromise) {
      setMathJaxReady(true);
      setLoadingMathJax(false);
      return;
    }

    delete window.MathJax;

    window.MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']]
      },
      svg: {
        fontCache: 'global'
      },
      startup: {
        ready: () => {
          window.MathJax.startup.defaultReady();
          setMathJaxReady(true);
          setLoadingMathJax(false);
        }
      }
    };

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js';
    script.async = true;
    script.onerror = () => {
      setError(t('document.latex.mathJaxError'));
      setLoadingMathJax(false);
    };
    document.head.appendChild(script);
  }, [t]);

  useEffect(() => {
    if (!mathJaxReady || !latexInput || !previewRef.current) return;

    const updatePreview = async () => {
      try {
        // Sanitize input to prevent XSS
        const safeLatex = sanitizeLatexInput(latexInput);
        previewRef.current.textContent = `$$${safeLatex}$$`;
        previewRef.current.style.color = '';  // Reset error color
        await window.MathJax.typesetPromise([previewRef.current]);
        setError(null);
      } catch (err) {
        console.error('Preview error:', err);
        // Use textContent for safe error display
        previewRef.current.textContent = t('document.latex.syntaxError');
        previewRef.current.style.color = '#EF4444';
      }
    };

    const debounce = setTimeout(updatePreview, 300);
    return () => clearTimeout(debounce);
  }, [latexInput, fontSize, mathJaxReady, t]);

  const handleConvert = async () => {
    if (!latexInput || !mathJaxReady || !renderRef.current) return;

    setConverting(true);
    setError(null);
    setResult(null);
    setProgress(10);

    try {
      // Sanitize input to prevent XSS
      const safeLatex = sanitizeLatexInput(latexInput);
      renderRef.current.textContent = `$$${safeLatex}$$`;
      renderRef.current.style.fontSize = `${fontSize}px`;
      await window.MathJax.typesetPromise([renderRef.current]);

      setProgress(50);

      const canvas = await html2canvas(renderRef.current, {
        backgroundColor: '#ffffff',
        scale: 3,
        logging: false,
        useCORS: true
      });

      setProgress(80);

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const dataUrl = canvas.toDataURL('image/png');

      if (outputFormat === 'png') {
        canvas.toBlob((blob) => {
          if (blob) {
            setResult(blob);
            setProgress(100);
          } else {
            setError(t('document.latex.pngError'));
          }
          setConverting(false);
        }, 'image/png');
      } else {
        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">
  <rect width="100%" height="100%" fill="white"/>
  <image width="${canvasWidth}" height="${canvasHeight}" xlink:href="${dataUrl}"/>
</svg>`;

        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        setResult(blob);
        setProgress(100);
        setConverting(false);
      }
    } catch (err) {
      // Don't expose internal error details to users
      console.error('LaTeX conversion error:', err);
      setError(t('document.latex.error'));
      setConverting(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const extension = outputFormat;
    downloadFile(result, `latex-formula.${extension}`);
  };

  const exampleFormulas = [
    { label: t('document.latex.examples.quadratic'), formula: '\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}' },
    { label: t('document.latex.examples.pythagorean'), formula: 'a^2 + b^2 = c^2' },
    { label: t('document.latex.examples.integral'), formula: '\\int_{a}^{b} f(x) \\, dx' },
    { label: t('document.latex.examples.sigma'), formula: '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}' },
    { label: t('document.latex.examples.matrix'), formula: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
    { label: t('document.latex.examples.limit'), formula: '\\lim_{x \\to \\infty} \\frac{1}{x} = 0' }
  ];

  return (
    <>
      <SEOHead title={t('document.latex.pageTitle')} description={t('document.latex.pageDescription')} keywords={t('document.latex.seoKeywords')} />

      <Breadcrumb category="document" currentPage={t('document.latex.title')} />

      <div className="page-header">
        <h1 className="page-title">{t('document.latex.pageTitle')}</h1>
        <p className="page-description">{t('document.latex.pageDescription')}</p>
      </div>

      <CoupangBanner type="top" />

      <div className="converter-card">
        <div className="option-group">
          <label className="option-label">{t('document.latex.inputLabel')}</label>
          <textarea
            value={latexInput}
            onChange={(e) => setLatexInput(e.target.value)}
            placeholder={t('document.latex.inputPlaceholder')}
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '16px',
              border: '2px solid var(--border-color)',
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '14px',
              resize: 'vertical',
              background: 'var(--background-color)'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label className="option-label">{t('document.latex.examplesLabel')}</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {exampleFormulas.map((example) => (
              <button
                key={example.label}
                onClick={() => setLatexInput(example.formula)}
                className="converter-tag"
                style={{ cursor: 'pointer' }}
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>

        {loadingMathJax && (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)', background: 'var(--background-color)', borderRadius: '8px', marginBottom: '16px' }}>
            <div style={{ marginBottom: '8px' }}>{t('document.latex.loadingMathJax')}</div>
            <div style={{ fontSize: '12px' }}>{t('document.latex.loadingDesc')}</div>
          </div>
        )}

        {!loadingMathJax && (
          <div style={{ marginTop: '16px', marginBottom: '16px', padding: '30px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', textAlign: 'center', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', fontSize: `${fontSize}px` }}>
            <div ref={previewRef} />
          </div>
        )}

        <div ref={renderRef} style={{ position: 'absolute', left: '-9999px', top: '-9999px', padding: '20px', background: 'white', fontSize: `${fontSize}px` }} />

        <div className="options">
          <h4 className="options-title">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {t('common.options')}
          </h4>

          <div className="option-group">
            <label className="option-label">{t('common.outputFormat')}</label>
            <select className="option-select" value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)}>
              <option value="png">{t('document.latex.pngOption')}</option>
              <option value="svg">{t('document.latex.svgOption')}</option>
            </select>
          </div>

          <div className="option-group">
            <label className="option-label">{t('document.latex.sizeLabel')}: {fontSize}px</label>
            <input type="range" className="option-slider" min="16" max="72" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} />
          </div>
        </div>

        {converting && <ProgressBar progress={progress} />}
        <ErrorDisplay error={error} />

        <ResultDisplay
          result={result}
          onDownload={handleDownload}
          downloadLabel={t('document.downloadFormat', { format: outputFormat.toUpperCase() })}
        />

        {!result && !converting && latexInput && mathJaxReady && (
          <button className="convert-button" onClick={handleConvert} disabled={!latexInput || !mathJaxReady}>{t('document.convertToFormat', { format: outputFormat.toUpperCase() })}</button>
        )}
      </div>

      <div className="seo-content">
        <h2>{t('document.latex.whatIs')}</h2>
        <p>{t('document.latex.whatIsDesc')}</p>

        <h2>{t('document.latex.whyConvert')}</h2>
        <p>{t('document.latex.whyConvertDesc')}</p>
        <ul>
          <li><strong>{t('document.latex.whyConvertReason1')}</strong></li>
          <li><strong>{t('document.latex.whyConvertReason2')}</strong></li>
          <li><strong>{t('document.latex.whyConvertReason3')}</strong></li>
          <li><strong>{t('document.latex.whyConvertReason4')}</strong></li>
        </ul>

        <h2>{t('document.latex.howToUse')}</h2>
        <ol>
          <li>{t('document.latex.step1')}</li>
          <li>{t('document.latex.step2')}</li>
          <li>{t('document.latex.step3')}</li>
          <li>{t('document.latex.step4')}</li>
        </ol>

        <h2>{t('document.latex.features')}</h2>
        <ul>
          <li><strong>{t('document.latex.feature1')}</strong></li>
          <li><strong>{t('document.latex.feature2')}</strong></li>
          <li><strong>{t('document.latex.feature3')}</strong></li>
          <li><strong>{t('document.latex.feature4')}</strong></li>
        </ul>

        <h2>{t('document.latex.faq')}</h2>
        <h3>{t('document.latex.faq1Q')}</h3>
        <p>{t('document.latex.faq1A')}</p>
        <h3>{t('document.latex.faq2Q')}</h3>
        <p>{t('document.latex.faq2A')}</p>
        <h3>{t('document.latex.faq3Q')}</h3>
        <p>{t('document.latex.faq3A')}</p>
      </div>
    </>
  );
};

export default LatexConverter;
