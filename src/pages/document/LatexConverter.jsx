import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import SEOHead from '../../components/SEOHead';
import ProgressBar from '../../components/ProgressBar';
import { downloadFile } from '../../utils/download';

const LatexConverter = () => {
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

  // Load MathJax
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
      setError('MathJax 로딩에 실패했습니다. 페이지를 새로고침해주세요.');
      setLoadingMathJax(false);
    };
    document.head.appendChild(script);
  }, []);

  // Update preview when input changes
  useEffect(() => {
    if (!mathJaxReady || !latexInput || !previewRef.current) return;

    const updatePreview = async () => {
      try {
        previewRef.current.innerHTML = `$$${latexInput}$$`;
        await window.MathJax.typesetPromise([previewRef.current]);
        setError(null);
      } catch (err) {
        console.error('Preview error:', err);
        previewRef.current.innerHTML = '<span style="color: #EF4444;">LaTeX 문법 오류</span>';
      }
    };

    const debounce = setTimeout(updatePreview, 300);
    return () => clearTimeout(debounce);
  }, [latexInput, fontSize, mathJaxReady]);

  const handleConvert = async () => {
    if (!latexInput || !mathJaxReady || !renderRef.current) return;

    setConverting(true);
    setError(null);
    setResult(null);
    setProgress(10);

    try {
      // Render to hidden element for capture
      renderRef.current.innerHTML = `$$${latexInput}$$`;
      renderRef.current.style.fontSize = `${fontSize}px`;
      await window.MathJax.typesetPromise([renderRef.current]);

      setProgress(50);

      // Use html2canvas to capture
      const canvas = await html2canvas(renderRef.current, {
        backgroundColor: '#ffffff',
        scale: 3,
        logging: false,
        useCORS: true
      });

      setProgress(80);

      if (outputFormat === 'png') {
        canvas.toBlob((blob) => {
          if (blob) {
            setResult(blob);
            setProgress(100);
          } else {
            setError('PNG 생성에 실패했습니다.');
          }
          setConverting(false);
        }, 'image/png');
      } else {
        // SVG: Get from MathJax directly
        const svgElement = renderRef.current.querySelector('svg');
        if (svgElement) {
          const svgClone = svgElement.cloneNode(true);
          svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

          // Create wrapper with background
          const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          const width = parseFloat(svgElement.style.width) || svgElement.getBoundingClientRect().width || 200;
          const height = parseFloat(svgElement.style.height) || svgElement.getBoundingClientRect().height || 100;

          wrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
          wrapper.setAttribute('width', width + 40);
          wrapper.setAttribute('height', height + 40);
          wrapper.setAttribute('viewBox', `0 0 ${width + 40} ${height + 40}`);

          // Background
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('width', '100%');
          rect.setAttribute('height', '100%');
          rect.setAttribute('fill', 'white');
          wrapper.appendChild(rect);

          // Position the math SVG
          const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          g.setAttribute('transform', 'translate(20, 20)');
          g.innerHTML = svgClone.innerHTML;
          wrapper.appendChild(g);

          const svgData = new XMLSerializer().serializeToString(wrapper);
          const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          setResult(blob);
          setProgress(100);
        } else {
          setError('SVG 생성에 실패했습니다.');
        }
        setConverting(false);
      }
    } catch (err) {
      console.error('Convert error:', err);
      setError('변환 중 오류가 발생했습니다: ' + err.message);
      setConverting(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const extension = outputFormat;
    downloadFile(result, `latex-formula.${extension}`);
  };

  const exampleFormulas = [
    { label: '이차방정식', formula: '\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}' },
    { label: '피타고라스', formula: 'a^2 + b^2 = c^2' },
    { label: '적분', formula: '\\int_{a}^{b} f(x) \\, dx' },
    { label: '시그마', formula: '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}' },
    { label: '행렬', formula: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
    { label: '극한', formula: '\\lim_{x \\to \\infty} \\frac{1}{x} = 0' }
  ];

  return (
    <>
      <SEOHead
        title="LaTeX 수식 이미지 변환 - 수식 PNG SVG 변환기"
        description="LaTeX 수식 코드를 PNG, SVG 이미지로 무료 변환. 논문, 문서에 삽입할 수 있는 고품질 수식 이미지를 만드세요."
        keywords="LaTeX 변환, 수식 이미지 변환, LaTeX PNG 변환, LaTeX SVG 변환, 수식 변환기, MathJax"
      />

      <div className="page-header">
        <h1 className="page-title">LaTeX to PNG/SVG 변환기</h1>
        <p className="page-description">
          LaTeX 수식 코드를 이미지로 변환하세요.
          워드, PPT, 논문에 삽입할 수 있는 고품질 수식 이미지를 생성합니다.
        </p>
      </div>

      <div className="converter-card">
        <div className="option-group">
          <label className="option-label">LaTeX 수식 코드</label>
          <textarea
            value={latexInput}
            onChange={(e) => setLatexInput(e.target.value)}
            placeholder="LaTeX 수식을 입력하세요... (예: \frac{1}{2})"
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
          <label className="option-label">예제 수식</label>
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
          <div style={{
            textAlign: 'center',
            padding: '30px',
            color: 'var(--text-secondary)',
            background: 'var(--background-color)',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <div style={{ marginBottom: '8px' }}>MathJax 로딩 중...</div>
            <div style={{ fontSize: '12px' }}>수식 렌더링 엔진을 불러오고 있습니다</div>
          </div>
        )}

        {!loadingMathJax && (
          <div style={{
            marginTop: '16px',
            marginBottom: '16px',
            padding: '30px',
            background: 'white',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            textAlign: 'center',
            minHeight: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'auto',
            fontSize: `${fontSize}px`
          }}>
            <div ref={previewRef} />
          </div>
        )}

        {/* Hidden render area for capture */}
        <div
          ref={renderRef}
          style={{
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            padding: '20px',
            background: 'white',
            fontSize: `${fontSize}px`
          }}
        />

        <div className="options">
          <h4 className="options-title">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            변환 옵션
          </h4>

          <div className="option-group">
            <label className="option-label">출력 형식</label>
            <select
              className="option-select"
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
            >
              <option value="png">PNG (권장 - 범용 호환)</option>
              <option value="svg">SVG (벡터 - 확대해도 선명)</option>
            </select>
          </div>

          <div className="option-group">
            <label className="option-label">크기: {fontSize}px</label>
            <input
              type="range"
              className="option-slider"
              min="16"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            />
          </div>
        </div>

        {converting && <ProgressBar progress={progress} />}

        {error && (
          <div className="error">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {result && (
          <div className="result">
            <h4 className="result-title">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              변환 완료!
            </h4>
            <button className="download-button" onClick={handleDownload}>
              {outputFormat.toUpperCase()} 파일 다운로드
            </button>
          </div>
        )}

        {!result && !converting && latexInput && mathJaxReady && (
          <button
            className="convert-button"
            onClick={handleConvert}
            disabled={!latexInput || !mathJaxReady}
          >
            {outputFormat.toUpperCase()}로 변환하기
          </button>
        )}
      </div>

      <div className="seo-content">
        <h2>LaTeX란?</h2>
        <p>
          LaTeX는 수학 공식과 과학 문서를 작성하기 위한 조판 시스템입니다.
          복잡한 수식을 텍스트로 표현할 수 있어 학술 논문, 기술 문서에서 표준으로 사용됩니다.
        </p>

        <h2>수식 이미지가 필요한 경우</h2>
        <ul>
          <li>워드나 한글 문서에 수식을 삽입할 때</li>
          <li>PPT 발표 자료에 수식을 넣을 때</li>
          <li>블로그나 웹사이트에 수식을 표시할 때</li>
          <li>교육 자료를 만들 때</li>
        </ul>

        <h2>기본 LaTeX 문법</h2>
        <ul>
          <li>분수: \frac&#123;분자&#125;&#123;분모&#125;</li>
          <li>제곱: x^2, 아래첨자: x_i</li>
          <li>루트: \sqrt&#123;x&#125;</li>
          <li>적분: \int_&#123;a&#125;^&#123;b&#125;</li>
          <li>시그마: \sum_&#123;i=1&#125;^&#123;n&#125;</li>
        </ul>
      </div>
    </>
  );
};

export default LatexConverter;
