import { useState, useCallback } from 'react';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import { reorderPages, generateThumbnails } from '../../utils/pdfUtils';
import { downloadFile } from '../../utils/download';

const PdfReorder = () => {
  const [file, setFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [pageOrder, setPageOrder] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleFileSelect = useCallback(async (selectedFile) => {
    setFile(selectedFile);
    setThumbnails([]);
    setPageOrder([]);
    setResult(null);
    setError(null);
    setLoading(true);

    try {
      const thumbs = await generateThumbnails(selectedFile, 0.3, setProgress);
      setThumbnails(thumbs);
      setPageOrder(thumbs.map(t => t.pageNum));
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
    setPageOrder([]);
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...pageOrder];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);

    setPageOrder(newOrder);
    setDraggedIndex(index);
    setResult(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const newOrder = [...pageOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setPageOrder(newOrder);
    setResult(null);
  };

  const moveDown = (index) => {
    if (index === pageOrder.length - 1) return;
    const newOrder = [...pageOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setPageOrder(newOrder);
    setResult(null);
  };

  const resetOrder = () => {
    setPageOrder(thumbnails.map(t => t.pageNum));
    setResult(null);
  };

  const reverseOrder = () => {
    setPageOrder([...pageOrder].reverse());
    setResult(null);
  };

  const isOrderChanged = () => {
    return pageOrder.some((page, index) => page !== index + 1);
  };

  const handleReorder = async () => {
    if (!isOrderChanged()) {
      setError('페이지 순서가 변경되지 않았습니다.');
      return;
    }

    setReordering(true);
    setError(null);
    setProgress(0);

    try {
      const newPdf = await reorderPages(file, pageOrder, setProgress);
      setResult(newPdf);
    } catch (err) {
      console.error(err);
      setError('페이지 순서 변경 중 오류가 발생했습니다.');
    } finally {
      setReordering(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const baseName = file.name.replace(/\.pdf$/i, '');
    downloadFile(result, `${baseName}_reordered.pdf`);
  };

  const getThumbnailByPageNum = (pageNum) => {
    return thumbnails.find(t => t.pageNum === pageNum);
  };

  return (
    <>
      <SEOHead
        title="PDF 페이지 순서 변경 - 페이지 재정렬"
        description="PDF 페이지 순서를 자유롭게 변경하세요. 드래그 앤 드롭으로 간편하게 재정렬. 서버 업로드 없이 100% 브라우저에서 처리됩니다."
        keywords="PDF 페이지 순서, PDF reorder, PDF 페이지 정렬, 온라인 PDF 도구, 무료 PDF 편집"
      />

      <div className="page-header">
        <h1 className="page-title">PDF 페이지 순서 변경</h1>
        <p className="page-description">
          PDF 페이지 순서를 드래그 앤 드롭으로 자유롭게 변경하세요.
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

            {pageOrder.length > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    드래그하거나 버튼을 사용하여 순서를 변경하세요
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={reverseOrder}
                      style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    >
                      순서 뒤집기
                    </button>
                    <button
                      onClick={resetOrder}
                      style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    >
                      원래 순서로
                    </button>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '12px',
                  marginBottom: '20px',
                  maxHeight: '400px',
                  overflow: 'auto',
                  padding: '4px'
                }}>
                  {pageOrder.map((pageNum, index) => {
                    const thumb = getThumbnailByPageNum(pageNum);
                    return (
                      <div
                        key={`${pageNum}-${index}`}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        style={{
                          cursor: 'grab',
                          padding: '8px',
                          borderRadius: '8px',
                          background: draggedIndex === index ? 'var(--primary-color-alpha)' : 'var(--bg-tertiary)',
                          border: draggedIndex === index ? '2px solid var(--primary-color)' : '2px solid transparent',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                          <button
                            onClick={() => moveUp(index)}
                            disabled={index === 0}
                            style={{ padding: '2px 6px', fontSize: '10px', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.5 : 1, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                          >
                            ^
                          </button>
                          <button
                            onClick={() => moveDown(index)}
                            disabled={index === pageOrder.length - 1}
                            style={{ padding: '2px 6px', fontSize: '10px', cursor: index === pageOrder.length - 1 ? 'not-allowed' : 'pointer', opacity: index === pageOrder.length - 1 ? 0.5 : 1, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                          >
                            v
                          </button>
                        </div>
                        {thumb && (
                          <img
                            src={thumb.url}
                            alt={`Page ${pageNum}`}
                            style={{ width: '100%', height: 'auto', borderRadius: '4px', pointerEvents: 'none' }}
                          />
                        )}
                        <p style={{ textAlign: 'center', fontSize: '12px', marginTop: '4px', color: 'var(--text-secondary)' }}>
                          <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{index + 1}.</span> (원본: {pageNum})
                        </p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {reordering && <ProgressBar progress={progress} />}

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
                  순서 변경 완료!
                </h4>
                <button className="download-button" onClick={handleDownload}>
                  변경된 PDF 다운로드
                </button>
              </div>
            )}

            {!result && !reordering && !loading && pageOrder.length > 0 && (
              <button
                className="convert-button"
                onClick={handleReorder}
                disabled={!isOrderChanged()}
              >
                순서 변경 적용하기
              </button>
            )}
          </>
        )}
      </div>

      <div className="seo-content">
        <h2>PDF 페이지 순서 변경이란?</h2>
        <p>
          PDF 문서의 페이지 순서를 원하는 대로 재정렬하는 기능입니다.
          프레젠테이션 순서를 변경하거나 문서를 재구성할 때 유용합니다.
        </p>

        <h2>왜 EasyFile을 사용해야 하나요?</h2>
        <ul>
          <li><strong>100% 무료</strong> - 회원가입이나 결제 없이 무제한 사용</li>
          <li><strong>완벽한 개인정보 보호</strong> - 파일이 서버로 전송되지 않음</li>
          <li><strong>드래그 앤 드롭</strong> - 직관적인 인터페이스</li>
          <li><strong>실시간 미리보기</strong> - 변경 사항 즉시 확인</li>
        </ul>
      </div>
    </>
  );
};

export default PdfReorder;
