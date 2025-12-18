import { useState, useCallback } from 'react';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import { extractPages, generateThumbnails } from '../../utils/pdfUtils';
import { downloadFile } from '../../utils/download';

const PdfExtract = () => {
  const [file, setFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = useCallback(async (selectedFile) => {
    setFile(selectedFile);
    setThumbnails([]);
    setSelectedPages(new Set());
    setResult(null);
    setError(null);
    setLoading(true);

    try {
      const thumbs = await generateThumbnails(selectedFile, 0.3, setProgress);
      setThumbnails(thumbs);
    } catch (err) {
      console.error(err);
      setError('PDF 파일을 읽는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  }, []);

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setThumbnails([]);
    setSelectedPages(new Set());
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  const togglePage = (pageNum) => {
    setSelectedPages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageNum)) {
        newSet.delete(pageNum);
      } else {
        newSet.add(pageNum);
      }
      return newSet;
    });
    setResult(null);
  };

  const selectAll = () => {
    setSelectedPages(new Set(thumbnails.map(t => t.pageNum)));
    setResult(null);
  };

  const deselectAll = () => {
    setSelectedPages(new Set());
    setResult(null);
  };

  const handleExtract = async () => {
    if (selectedPages.size === 0) {
      setError('추출할 페이지를 선택해주세요.');
      return;
    }

    setExtracting(true);
    setError(null);
    setProgress(0);

    try {
      const pageNumbers = Array.from(selectedPages).sort((a, b) => a - b);
      const extractedPdf = await extractPages(file, pageNumbers, setProgress);
      setResult(extractedPdf);
    } catch (err) {
      console.error(err);
      setError('페이지 추출 중 오류가 발생했습니다.');
    } finally {
      setExtracting(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const baseName = file.name.replace(/\.pdf$/i, '');
    downloadFile(result, `${baseName}_extracted.pdf`);
  };

  return (
    <>
      <SEOHead
        title="PDF 페이지 추출 - 특정 페이지 추출"
        description="PDF에서 원하는 페이지만 추출하세요. 썸네일을 보고 선택하여 새 PDF로 저장. 서버 업로드 없이 100% 브라우저에서 처리됩니다."
        keywords="PDF 페이지 추출, PDF extract, PDF 페이지 선택, 온라인 PDF 도구, 무료 PDF 추출"
      />

      <div className="page-header">
        <h1 className="page-title">PDF 페이지 추출</h1>
        <p className="page-description">
          PDF에서 원하는 페이지만 선택하여 새 PDF로 추출하세요.
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

            {loading && <ProgressBar progress={progress} />}

            {thumbnails.length > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    {selectedPages.size}개 선택됨 / 총 {thumbnails.length}페이지
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={selectAll}
                      style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    >
                      전체 선택
                    </button>
                    <button
                      onClick={deselectAll}
                      style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    >
                      선택 해제
                    </button>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                  gap: '12px',
                  marginBottom: '20px',
                  maxHeight: '400px',
                  overflow: 'auto',
                  padding: '4px'
                }}>
                  {thumbnails.map((thumb) => (
                    <div
                      key={thumb.pageNum}
                      onClick={() => togglePage(thumb.pageNum)}
                      style={{
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '8px',
                        border: selectedPages.has(thumb.pageNum)
                          ? '3px solid var(--primary-color)'
                          : '3px solid transparent',
                        background: selectedPages.has(thumb.pageNum)
                          ? 'var(--primary-color-alpha)'
                          : 'var(--bg-tertiary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <img
                        src={thumb.url}
                        alt={`Page ${thumb.pageNum}`}
                        style={{ width: '100%', height: 'auto', borderRadius: '4px' }}
                      />
                      <p style={{ textAlign: 'center', fontSize: '12px', marginTop: '4px', color: 'var(--text-secondary)' }}>
                        {thumb.pageNum}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {extracting && <ProgressBar progress={progress} />}

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
                  추출 완료! ({selectedPages.size}페이지)
                </h4>
                <button className="download-button" onClick={handleDownload}>
                  추출된 PDF 다운로드
                </button>
              </div>
            )}

            {!result && !extracting && !loading && thumbnails.length > 0 && (
              <button
                className="convert-button"
                onClick={handleExtract}
                disabled={selectedPages.size === 0}
              >
                선택한 페이지 추출하기
              </button>
            )}
          </>
        )}
      </div>

      <div className="seo-content">
        <h2>PDF 페이지 추출이란?</h2>
        <p>
          PDF 문서에서 필요한 페이지만 선택하여 새로운 PDF 파일로 저장하는 기능입니다.
          불필요한 페이지를 제외하고 필요한 부분만 공유할 때 유용합니다.
        </p>

        <h2>왜 EasyFile을 사용해야 하나요?</h2>
        <ul>
          <li><strong>100% 무료</strong> - 회원가입이나 결제 없이 무제한 사용</li>
          <li><strong>완벽한 개인정보 보호</strong> - 파일이 서버로 전송되지 않음</li>
          <li><strong>시각적 선택</strong> - 썸네일을 보고 쉽게 선택</li>
          <li><strong>다중 선택</strong> - 여러 페이지 동시 선택</li>
        </ul>
      </div>
    </>
  );
};

export default PdfExtract;
