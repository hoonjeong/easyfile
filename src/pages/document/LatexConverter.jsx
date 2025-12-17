import { useState, useEffect, useRef } from 'react';
import SEOHead from '../../components/SEOHead';
import ProgressBar from '../../components/ProgressBar';
import { downloadFile } from '../../utils/download';

const LatexConverter = () => {
  const [latexInput, setLatexInput] = useState('\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}');
  const [outputFormat, setOutputFormat] = useState('svg');
  const [fontSize, setFontSize] = useState(20);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState(null);
  const [mathJaxReady, setMathJaxReady] = useState(false);
  const previewRef = useRef(null);

  // Load MathJax
  useEffect(() => {
    if (window.MathJax) {
      setMathJaxReady(true);
      return;
    }

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
        }
      }
    };

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Update preview when input changes
  useEffect(() => {
    if (!mathJaxReady || !latexInput) return;

    const updatePreview = async () => {
      try {
        const html = await window.MathJax.tex2svgPromise(latexInput, { display: true });
        const svg = html.querySelector('svg');
        if (svg) {
          svg.style.fontSize = `${fontSize}px`;
          setPreview(svg.outerHTML);
        }
      } catch (err) {
        setPreview('<p style="color: red;">LaTeX 문법 오류</p>');
      }
    };

    const debounce = setTimeout(updatePreview, 300);
    return () => clearTimeout(debounce);
  }, [latexInput, fontSize, mathJaxReady]);

  const handleConvert = async () => {
    if (!latexInput || !mathJaxReady) return;

    setConverting(true);
    setError(null);
    setProgress(10);

    try {
      setProgress(30);

      const html = await window.MathJax.tex2svgPromise(latexInput, { display: true });
      const svg = html.querySelector('svg');

      if (!svg) {
        throw new Error('SVG 생성에 실패했습니다.');
      }

      setProgress(60);

      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.style.fontSize = `${fontSize}px`;

      if (outputFormat === 'svg') {
        const svgData = svg.outerHTML;
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        setResult(blob);
        setProgress(100);
      } else if (outputFormat === 'png') {
        // Convert SVG to PNG using canvas
        const svgData = svg.outerHTML;
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
          const scale = 2; // For high resolution
          const canvas = document.createElement('canvas');
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          const ctx = canvas.getContext('2d');
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0);

          canvas.toBlob((blob) => {
            URL.revokeObjectURL(url);
            setResult(blob);
            setProgress(100);
          }, 'image/png');
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          throw new Error('PNG 변환에 실패했습니다.');
        };

        img.src = url;
      }
    } catch (err) {
      console.error(err);
      setError('LaTeX 변환 중 오류가 발생했습니다. 문법을 확인해주세요.');
      setConverting(false);
    }
  };

  useEffect(() => {
    if (result) {
      setConverting(false);
    }
  }, [result]);

  const handleDownload = () => {
    if (!result) return;
    const extension = outputFormat === 'svg' ? 'svg' : 'png';
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

        {preview && (
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
            justifyContent: 'center'
          }}>
            <div
              ref={previewRef}
              dangerouslySetInnerHTML={{ __html: preview }}
            />
          </div>
        )}

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
              <option value="svg">SVG (벡터 - 확대해도 선명)</option>
              <option value="png">PNG (래스터 - 범용 호환)</option>
            </select>
          </div>

          <div className="option-group">
            <label className="option-label">크기: {fontSize}px</label>
            <input
              type="range"
              className="option-slider"
              min="12"
              max="48"
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
            disabled={!latexInput}
          >
            {outputFormat.toUpperCase()}로 변환하기
          </button>
        )}

        {!mathJaxReady && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
            MathJax 로딩 중...
          </div>
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
          <li>분수: \frac{'{분자}'}{'{분모}'}</li>
          <li>제곱: x^2, 아래첨자: x_i</li>
          <li>루트: \sqrt{'{x}'}</li>
          <li>적분: \int_{'{a}'}^{'{b}'}</li>
          <li>시그마: \sum_{'{i=1}'}^{'{n}'}</li>
        </ul>
      </div>
    </>
  );
};

export default LatexConverter;
