import { useState, useCallback } from 'react';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import { extractTextFromPdf } from '../../utils/pdfUtils';
import { downloadFile, getFilenameWithNewExtension } from '../../utils/download';

const PdfToText = () => {
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
      setError('PDF 텍스트 추출 중 오류가 발생했습니다. 올바른 PDF 파일인지 확인해주세요.');
    } finally {
      setConverting(false);
    }
  };

  const getCombinedText = () => {
    return results.map(r => `=== 페이지 ${r.pageNum} ===\n${r.text}`).join('\n\n');
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
      alert('클립보드에 복사되었습니다!');
    } catch (err) {
      console.error(err);
      alert('복사에 실패했습니다.');
    }
  };

  return (
    <>
      <SEOHead
        title="PDF to Text 변환 - PDF 텍스트 추출"
        description="PDF 파일에서 텍스트를 무료로 추출. PDF 문서의 텍스트 내용을 복사하거나 TXT 파일로 저장하세요. 서버 업로드 없이 100% 브라우저에서 처리됩니다."
        keywords="PDF 텍스트 추출, PDF to Text, PDF 변환, 텍스트 추출, 온라인 PDF 변환기, 무료 PDF 변환"
      />

      <div className="page-header">
        <h1 className="page-title">PDF to Text 변환기</h1>
        <p className="page-description">
          PDF 파일에서 텍스트를 추출하세요.
          모든 변환은 브라우저에서 처리되어 개인정보가 안전합니다.
        </p>
      </div>

      <div className="converter-card">
        {!file ? (
          <DropZone
            onFileSelect={handleFileSelect}
            acceptedTypes={['.pdf', 'application/pdf']}
          />
        ) : (
          <>
            <FilePreview
              file={file}
              onRemove={handleRemoveFile}
            />

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
                  텍스트 추출 완료! ({results.length}페이지)
                </h4>

                <div className="options" style={{ marginBottom: '16px' }}>
                  <div className="option-group">
                    <label className="option-label">보기 모드</label>
                    <select
                      className="option-select"
                      value={outputMode}
                      onChange={(e) => setOutputMode(e.target.value)}
                    >
                      <option value="combined">전체 텍스트</option>
                      <option value="pages">페이지별 보기</option>
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
                          페이지 {page.pageNum}
                        </h5>
                        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, fontFamily: 'inherit', fontSize: '14px', lineHeight: '1.6', paddingLeft: '12px', borderLeft: '3px solid var(--border-color)' }}>
                          {page.text || '(텍스트 없음)'}
                        </pre>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button className="download-button" onClick={handleDownload}>
                    TXT 파일 다운로드
                  </button>
                  <button
                    className="download-button"
                    onClick={handleCopyToClipboard}
                    style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                  >
                    클립보드에 복사
                  </button>
                </div>
              </div>
            )}

            {results.length === 0 && !converting && (
              <button
                className="convert-button"
                onClick={handleConvert}
                disabled={!file}
              >
                텍스트 추출하기
              </button>
            )}
          </>
        )}
      </div>

      <div className="seo-content">
        <h2>PDF 텍스트 추출이란?</h2>
        <p>
          PDF 파일에서 텍스트를 추출하면 내용을 복사하거나 편집할 수 있습니다.
          스캔된 PDF(이미지로 된 PDF)는 텍스트 추출이 불가능할 수 있습니다.
          텍스트 기반 PDF에서 가장 잘 작동합니다.
        </p>

        <h2>왜 EasyFile을 사용해야 하나요?</h2>
        <ul>
          <li><strong>100% 무료</strong> - 회원가입이나 결제 없이 무제한 사용</li>
          <li><strong>완벽한 개인정보 보호</strong> - 파일이 서버로 전송되지 않음</li>
          <li><strong>빠른 추출</strong> - 브라우저에서 즉시 처리</li>
          <li><strong>다양한 출력</strong> - TXT 다운로드 또는 클립보드 복사</li>
        </ul>
      </div>
    </>
  );
};

export default PdfToText;
