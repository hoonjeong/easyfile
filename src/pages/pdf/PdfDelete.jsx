import { useState, useCallback } from 'react';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import { deletePages, generateThumbnails } from '../../utils/pdfUtils';
import { downloadFile } from '../../utils/download';

const PdfDelete = () => {
  const [file, setFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [pagesToDelete, setPagesToDelete] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = useCallback(async (selectedFile) => {
    setFile(selectedFile);
    setThumbnails([]);
    setPagesToDelete(new Set());
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
    setPagesToDelete(new Set());
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  const togglePage = (pageNum) => {
    setPagesToDelete(prev => {
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

  const handleDelete = async () => {
    if (pagesToDelete.size === 0) {
      setError('삭제할 페이지를 선택해주세요.');
      return;
    }

    if (pagesToDelete.size >= thumbnails.length) {
      setError('모든 페이지를 삭제할 수 없습니다. 최소 1페이지는 남겨야 합니다.');
      return;
    }

    setDeleting(true);
    setError(null);
    setProgress(0);

    try {
      const pageNumbers = Array.from(pagesToDelete);
      const newPdf = await deletePages(file, pageNumbers, setProgress);
      setResult(newPdf);
    } catch (err) {
      console.error(err);
      setError('페이지 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const baseName = file.name.replace(/\.pdf$/i, '');
    downloadFile(result, `${baseName}_edited.pdf`);
  };

  return (
    <>
      <SEOHead
        title="PDF 페이지 삭제 - 특정 페이지 제거"
        description="PDF에서 불필요한 페이지를 삭제하세요. 썸네일을 보고 선택하여 간편하게 제거. 서버 업로드 없이 100% 브라우저에서 처리됩니다."
        keywords="PDF 페이지 삭제, PDF delete, PDF 페이지 제거, 온라인 PDF 도구, 무료 PDF 편집"
      />

      <div className="page-header">
        <h1 className="page-title">PDF 페이지 삭제</h1>
        <p className="page-description">
          PDF에서 불필요한 페이지를 선택하여 삭제하세요.
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
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    삭제할 페이지를 클릭하세요. 선택된 페이지는 빨간색으로 표시됩니다.
                  </p>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginTop: '4px' }}>
                    {pagesToDelete.size}개 선택됨 / 총 {thumbnails.length}페이지 (삭제 후 {thumbnails.length - pagesToDelete.size}페이지 남음)
                  </p>
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
                        border: pagesToDelete.has(thumb.pageNum)
                          ? '3px solid #ef4444'
                          : '3px solid transparent',
                        background: pagesToDelete.has(thumb.pageNum)
                          ? 'rgba(239, 68, 68, 0.1)'
                          : 'var(--bg-tertiary)',
                        opacity: pagesToDelete.has(thumb.pageNum) ? 0.6 : 1,
                        transition: 'all 0.2s',
                        position: 'relative'
                      }}
                    >
                      {pagesToDelete.has(thumb.pageNum) && (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          background: '#ef4444',
                          color: 'white',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          fontWeight: 'bold'
                        }}>
                          X
                        </div>
                      )}
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

            {deleting && <ProgressBar progress={progress} />}

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
                  삭제 완료! ({thumbnails.length - pagesToDelete.size}페이지 남음)
                </h4>
                <button className="download-button" onClick={handleDownload}>
                  수정된 PDF 다운로드
                </button>
              </div>
            )}

            {!result && !deleting && !loading && thumbnails.length > 0 && (
              <button
                className="convert-button"
                onClick={handleDelete}
                disabled={pagesToDelete.size === 0}
                style={{ background: pagesToDelete.size > 0 ? '#ef4444' : undefined }}
              >
                선택한 페이지 삭제하기
              </button>
            )}
          </>
        )}
      </div>

      <div className="seo-content">
        <h2>PDF 페이지 삭제란?</h2>
        <p>
          PDF 문서에서 불필요한 페이지를 제거하는 기능입니다.
          민감한 정보가 포함된 페이지를 삭제하거나 문서를 간소화할 때 유용합니다.
        </p>

        <h2>왜 EasyFile을 사용해야 하나요?</h2>
        <ul>
          <li><strong>100% 무료</strong> - 회원가입이나 결제 없이 무제한 사용</li>
          <li><strong>완벽한 개인정보 보호</strong> - 파일이 서버로 전송되지 않음</li>
          <li><strong>시각적 선택</strong> - 썸네일을 보고 쉽게 선택</li>
          <li><strong>안전한 편집</strong> - 원본 파일은 그대로 유지</li>
        </ul>
      </div>
    </>
  );
};

export default PdfDelete;
