import { useState, useCallback } from 'react';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import { rotatePages, generateThumbnails } from '../../utils/pdfUtils';
import { downloadFile } from '../../utils/download';

const PdfRotate = () => {
  const [file, setFile] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [rotations, setRotations] = useState({});
  const [loading, setLoading] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = useCallback(async (selectedFile) => {
    setFile(selectedFile);
    setThumbnails([]);
    setRotations({});
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
    setRotations({});
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  const rotatePage = (pageNum, angle) => {
    setRotations(prev => {
      const currentRotation = prev[pageNum] || 0;
      const newRotation = (currentRotation + angle) % 360;
      if (newRotation === 0) {
        const { [pageNum]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [pageNum]: newRotation };
    });
    setResult(null);
  };

  const rotateAllPages = (angle) => {
    const newRotations = {};
    thumbnails.forEach(thumb => {
      const currentRotation = rotations[thumb.pageNum] || 0;
      const newRotation = (currentRotation + angle) % 360;
      if (newRotation !== 0) {
        newRotations[thumb.pageNum] = newRotation;
      }
    });
    setRotations(newRotations);
    setResult(null);
  };

  const resetRotations = () => {
    setRotations({});
    setResult(null);
  };

  const hasRotations = () => {
    return Object.keys(rotations).length > 0;
  };

  const handleRotate = async () => {
    if (!hasRotations()) {
      setError('회전할 페이지를 선택해주세요.');
      return;
    }

    setRotating(true);
    setError(null);
    setProgress(0);

    try {
      const newPdf = await rotatePages(file, rotations, setProgress);
      setResult(newPdf);
    } catch (err) {
      console.error(err);
      setError('페이지 회전 중 오류가 발생했습니다.');
    } finally {
      setRotating(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const baseName = file.name.replace(/\.pdf$/i, '');
    downloadFile(result, `${baseName}_rotated.pdf`);
  };

  const getRotationStyle = (pageNum) => {
    const rotation = rotations[pageNum] || 0;
    return {
      transform: `rotate(${rotation}deg)`,
      transition: 'transform 0.3s ease'
    };
  };

  return (
    <>
      <SEOHead
        title="PDF 페이지 회전 - 90도/180도/270도 회전"
        description="PDF 페이지를 원하는 각도로 회전하세요. 개별 페이지 또는 전체 페이지 회전 지원. 서버 업로드 없이 100% 브라우저에서 처리됩니다."
        keywords="PDF 페이지 회전, PDF rotate, PDF 90도 회전, 온라인 PDF 도구, 무료 PDF 편집"
      />

      <div className="page-header">
        <h1 className="page-title">PDF 페이지 회전</h1>
        <p className="page-description">
          PDF 페이지를 90°, 180°, 270° 회전하세요.
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    각 페이지 아래 버튼을 클릭하여 회전하세요
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => rotateAllPages(90)}
                      style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    >
                      전체 90° 회전
                    </button>
                    <button
                      onClick={resetRotations}
                      style={{ padding: '6px 12px', fontSize: '12px', cursor: 'pointer', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    >
                      초기화
                    </button>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: '16px',
                  marginBottom: '20px',
                  maxHeight: '450px',
                  overflow: 'auto',
                  padding: '4px'
                }}>
                  {thumbnails.map((thumb) => (
                    <div
                      key={thumb.pageNum}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        background: rotations[thumb.pageNum] ? 'var(--primary-color-alpha)' : 'var(--bg-tertiary)',
                        border: rotations[thumb.pageNum] ? '2px solid var(--primary-color)' : '2px solid transparent'
                      }}
                    >
                      <div style={{
                        width: '100%',
                        aspectRatio: '1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        marginBottom: '8px'
                      }}>
                        <img
                          src={thumb.url}
                          alt={`Page ${thumb.pageNum}`}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            borderRadius: '4px',
                            ...getRotationStyle(thumb.pageNum)
                          }}
                        />
                      </div>
                      <p style={{ textAlign: 'center', fontSize: '12px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                        페이지 {thumb.pageNum}
                        {rotations[thumb.pageNum] && (
                          <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
                            {' '}({rotations[thumb.pageNum]}°)
                          </span>
                        )}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                        <button
                          onClick={() => rotatePage(thumb.pageNum, -90)}
                          title="반시계 방향 90°"
                          style={{
                            padding: '6px 10px',
                            fontSize: '14px',
                            cursor: 'pointer',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px'
                          }}
                        >
                          ↺
                        </button>
                        <button
                          onClick={() => rotatePage(thumb.pageNum, 90)}
                          title="시계 방향 90°"
                          style={{
                            padding: '6px 10px',
                            fontSize: '14px',
                            cursor: 'pointer',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px'
                          }}
                        >
                          ↻
                        </button>
                        <button
                          onClick={() => rotatePage(thumb.pageNum, 180)}
                          title="180° 회전"
                          style={{
                            padding: '6px 10px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px'
                          }}
                        >
                          180°
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {rotating && <ProgressBar progress={progress} />}

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
                  회전 완료!
                </h4>
                <button className="download-button" onClick={handleDownload}>
                  회전된 PDF 다운로드
                </button>
              </div>
            )}

            {!result && !rotating && !loading && thumbnails.length > 0 && (
              <button
                className="convert-button"
                onClick={handleRotate}
                disabled={!hasRotations()}
              >
                회전 적용하기
              </button>
            )}
          </>
        )}
      </div>

      <div className="seo-content">
        <h2>PDF 페이지 회전이란?</h2>
        <p>
          PDF 문서의 페이지 방향을 변경하는 기능입니다.
          스캔한 문서의 방향이 잘못되었거나, 가로/세로 방향을 변경할 때 유용합니다.
        </p>

        <h2>왜 EasyFile을 사용해야 하나요?</h2>
        <ul>
          <li><strong>100% 무료</strong> - 회원가입이나 결제 없이 무제한 사용</li>
          <li><strong>완벽한 개인정보 보호</strong> - 파일이 서버로 전송되지 않음</li>
          <li><strong>개별/전체 회전</strong> - 원하는 페이지만 선택적으로 회전</li>
          <li><strong>실시간 미리보기</strong> - 회전 결과를 즉시 확인</li>
        </ul>
      </div>
    </>
  );
};

export default PdfRotate;
