import { useState, useCallback } from 'react';
import SEOHead from '../../components/SEOHead';
import ProgressBar from '../../components/ProgressBar';
import { mergePdfs } from '../../utils/pdfUtils';
import { downloadFile } from '../../utils/download';

const PdfMerge = () => {
  const [files, setFiles] = useState([]);
  const [merging, setMerging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);
    const pdfFiles = selectedFiles.filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    setFiles(prev => [...prev, ...pdfFiles]);
    setResult(null);
    setError(null);
    e.target.value = '';
  }, []);

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
      setError('병합하려면 최소 2개의 PDF 파일이 필요합니다.');
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
      setError('PDF 병합 중 오류가 발생했습니다. 올바른 PDF 파일인지 확인해주세요.');
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
        title="PDF 병합 - 여러 PDF를 하나로 합치기"
        description="여러 PDF 파일을 하나로 병합하세요. 무료 온라인 PDF 병합 도구. 서버 업로드 없이 100% 브라우저에서 처리됩니다."
        keywords="PDF 병합, PDF 합치기, PDF merge, 온라인 PDF 병합, 무료 PDF 병합"
      />

      <div className="page-header">
        <h1 className="page-title">PDF 병합</h1>
        <p className="page-description">
          여러 PDF 파일을 하나로 합치세요.
          순서를 드래그하여 변경할 수 있습니다.
        </p>
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
            <span style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>PDF 파일 추가</span>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>클릭하여 파일 선택</span>
            <input
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {files.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              선택된 파일 ({files.length}개) - 순서대로 병합됩니다
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
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    style={{ padding: '4px 8px', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.5 : 1, background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                  >
                    ^
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === files.length - 1}
                    style={{ padding: '4px 8px', cursor: index === files.length - 1 ? 'not-allowed' : 'pointer', opacity: index === files.length - 1 ? 0.5 : 1, background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                  >
                    v
                  </button>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    style={{ padding: '4px 8px', cursor: 'pointer', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#ef4444' }}
                  >
                    X
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {merging && <ProgressBar progress={progress} />}

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
              병합 완료!
            </h4>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="download-button" onClick={handleDownload}>
                병합된 PDF 다운로드
              </button>
              <button
                className="download-button"
                onClick={handleReset}
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              >
                새로 시작
              </button>
            </div>
          </div>
        )}

        {!result && !merging && files.length >= 2 && (
          <button
            className="convert-button"
            onClick={handleMerge}
          >
            PDF 병합하기
          </button>
        )}
      </div>

      <div className="seo-content">
        <h2>PDF 병합이란?</h2>
        <p>
          여러 PDF 파일을 하나의 PDF로 합치는 기능입니다.
          문서를 정리하거나 여러 문서를 하나로 묶을 때 유용합니다.
        </p>

        <h2>왜 EasyFile을 사용해야 하나요?</h2>
        <ul>
          <li><strong>100% 무료</strong> - 회원가입이나 결제 없이 무제한 사용</li>
          <li><strong>완벽한 개인정보 보호</strong> - 파일이 서버로 전송되지 않음</li>
          <li><strong>순서 조절</strong> - 파일 순서를 쉽게 변경</li>
          <li><strong>무제한 파일</strong> - 파일 개수 제한 없음</li>
        </ul>
      </div>
    </>
  );
};

export default PdfMerge;
