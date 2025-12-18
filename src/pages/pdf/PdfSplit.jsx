import { useState, useCallback } from 'react';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import { splitPdf, getPdfPageCount } from '../../utils/pdfUtils';
import { downloadFile } from '../../utils/download';
import JSZip from 'jszip';

const PdfSplit = () => {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [splitMode, setSplitMode] = useState('each');
  const [customRanges, setCustomRanges] = useState('');
  const [splitting, setSplitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const handleFileSelect = useCallback(async (selectedFile) => {
    setFile(selectedFile);
    setResults([]);
    setError(null);
    setProgress(0);

    try {
      const count = await getPdfPageCount(selectedFile);
      setPageCount(count);
    } catch (err) {
      console.error(err);
      setError('PDF 파일을 읽는 중 오류가 발생했습니다.');
    }
  }, []);

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setPageCount(0);
    setResults([]);
    setError(null);
    setProgress(0);
  }, []);

  const parseRanges = () => {
    if (splitMode === 'each') {
      return Array.from({ length: pageCount }, (_, i) => ({
        start: i + 1,
        end: i + 1
      }));
    }

    if (splitMode === 'half') {
      const mid = Math.ceil(pageCount / 2);
      return [
        { start: 1, end: mid },
        { start: mid + 1, end: pageCount }
      ].filter(r => r.start <= r.end);
    }

    // Custom ranges
    const ranges = [];
    const parts = customRanges.split(',').map(s => s.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(s => parseInt(s.trim()));
        if (!isNaN(start) && !isNaN(end) && start >= 1 && end <= pageCount && start <= end) {
          ranges.push({ start, end });
        }
      } else {
        const num = parseInt(part);
        if (!isNaN(num) && num >= 1 && num <= pageCount) {
          ranges.push({ start: num, end: num });
        }
      }
    }

    return ranges;
  };

  const handleSplit = async () => {
    if (!file) return;

    const ranges = parseRanges();
    if (ranges.length === 0) {
      setError('유효한 페이지 범위를 입력해주세요.');
      return;
    }

    setSplitting(true);
    setError(null);
    setProgress(0);

    try {
      const splitResults = await splitPdf(file, ranges, setProgress);
      setResults(splitResults);
    } catch (err) {
      console.error(err);
      setError('PDF 분할 중 오류가 발생했습니다.');
    } finally {
      setSplitting(false);
    }
  };

  const handleDownloadSingle = (result, index) => {
    const baseName = file.name.replace(/\.pdf$/i, '');
    downloadFile(result.blob, `${baseName}_${result.range}.pdf`);
  };

  const handleDownloadAll = async () => {
    if (results.length === 1) {
      handleDownloadSingle(results[0], 0);
      return;
    }

    const zip = new JSZip();
    const baseName = file.name.replace(/\.pdf$/i, '');

    results.forEach((result) => {
      zip.file(`${baseName}_${result.range}.pdf`, result.blob);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadFile(zipBlob, `${baseName}_split.zip`);
  };

  return (
    <>
      <SEOHead
        title="PDF 분할 - PDF를 여러 파일로 나누기"
        description="PDF 파일을 여러 파일로 분할하세요. 페이지별, 범위별로 나눌 수 있습니다. 서버 업로드 없이 100% 브라우저에서 처리됩니다."
        keywords="PDF 분할, PDF 나누기, PDF split, 온라인 PDF 분할, 무료 PDF 분할"
      />

      <div className="page-header">
        <h1 className="page-title">PDF 분할</h1>
        <p className="page-description">
          PDF 파일을 여러 파일로 나누세요.
          페이지별 또는 원하는 범위로 분할할 수 있습니다.
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

            {pageCount > 0 && (
              <div className="options">
                <h4 className="options-title">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  분할 옵션 (총 {pageCount} 페이지)
                </h4>

                <div className="option-group">
                  <label className="option-label">분할 방식</label>
                  <select
                    className="option-select"
                    value={splitMode}
                    onChange={(e) => setSplitMode(e.target.value)}
                  >
                    <option value="each">페이지별 분할 (각 페이지를 개별 파일로)</option>
                    <option value="half">반으로 분할</option>
                    <option value="custom">사용자 지정 범위</option>
                  </select>
                </div>

                {splitMode === 'custom' && (
                  <div className="option-group">
                    <label className="option-label">페이지 범위 (예: 1-3, 5, 7-10)</label>
                    <input
                      type="text"
                      value={customRanges}
                      onChange={(e) => setCustomRanges(e.target.value)}
                      placeholder="1-3, 5, 7-10"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {splitting && <ProgressBar progress={progress} />}

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
                  분할 완료! ({results.length}개 파일)
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {results.map((result, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '8px',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>페이지 {result.range}</span>
                      <button
                        onClick={() => handleDownloadSingle(result, index)}
                        style={{
                          padding: '6px 12px',
                          cursor: 'pointer',
                          background: 'var(--primary-color)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}
                      >
                        다운로드
                      </button>
                    </div>
                  ))}
                </div>

                <button className="download-button" onClick={handleDownloadAll}>
                  {results.length > 1 ? '전체 다운로드 (ZIP)' : 'PDF 다운로드'}
                </button>
              </div>
            )}

            {results.length === 0 && !splitting && pageCount > 0 && (
              <button
                className="convert-button"
                onClick={handleSplit}
              >
                PDF 분할하기
              </button>
            )}
          </>
        )}
      </div>

      <div className="seo-content">
        <h2>PDF 분할이란?</h2>
        <p>
          하나의 PDF 파일을 여러 개의 작은 PDF 파일로 나누는 기능입니다.
          특정 페이지만 추출하거나, 큰 문서를 관리하기 쉬운 크기로 나눌 때 유용합니다.
        </p>

        <h2>왜 EasyFile을 사용해야 하나요?</h2>
        <ul>
          <li><strong>100% 무료</strong> - 회원가입이나 결제 없이 무제한 사용</li>
          <li><strong>완벽한 개인정보 보호</strong> - 파일이 서버로 전송되지 않음</li>
          <li><strong>다양한 분할 옵션</strong> - 페이지별, 범위별 분할</li>
          <li><strong>일괄 다운로드</strong> - ZIP으로 한번에 다운로드</li>
        </ul>
      </div>
    </>
  );
};

export default PdfSplit;
