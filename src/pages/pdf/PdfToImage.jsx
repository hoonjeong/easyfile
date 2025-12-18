import { useState, useCallback } from 'react';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import { pdfToImages } from '../../utils/pdfUtils';
import { downloadFile, getFilenameWithNewExtension } from '../../utils/download';
import JSZip from 'jszip';

const PdfToImage = () => {
  const [file, setFile] = useState(null);
  const [outputFormat, setOutputFormat] = useState('image/png');
  const [scale, setScale] = useState(2);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const handleFileSelect = useCallback((selectedFile) => {
    setFile(selectedFile);
    setResults([]);
    setError(null);
    setProgress(0);
  }, []);

  const handleRemoveFile = useCallback(() => {
    results.forEach(r => URL.revokeObjectURL(r.url));
    setFile(null);
    setResults([]);
    setError(null);
    setProgress(0);
  }, [results]);

  const handleConvert = async () => {
    if (!file) return;

    setConverting(true);
    setError(null);
    setProgress(0);

    try {
      const images = await pdfToImages(file, scale, outputFormat, setProgress);
      setResults(images);
    } catch (err) {
      console.error(err);
      setError('PDF 변환 중 오류가 발생했습니다. 올바른 PDF 파일인지 확인해주세요.');
    } finally {
      setConverting(false);
    }
  };

  const handleDownloadSingle = (image) => {
    const extension = outputFormat === 'image/jpeg' ? 'jpg' : 'png';
    const filename = getFilenameWithNewExtension(file.name, `page${image.pageNum}.${extension}`);
    downloadFile(image.blob, filename);
  };

  const handleDownloadAll = async () => {
    if (results.length === 1) {
      handleDownloadSingle(results[0]);
      return;
    }

    const zip = new JSZip();
    const extension = outputFormat === 'image/jpeg' ? 'jpg' : 'png';
    const baseName = file.name.replace(/\.pdf$/i, '');

    results.forEach((image) => {
      zip.file(`${baseName}_page${image.pageNum}.${extension}`, image.blob);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadFile(zipBlob, `${baseName}_images.zip`);
  };

  return (
    <>
      <SEOHead
        title="PDF to Image 변환 - PDF를 JPG, PNG로 변환"
        description="PDF 파일을 JPG, PNG 이미지로 무료 변환. 고품질 이미지로 각 페이지를 변환하세요. 서버 업로드 없이 100% 브라우저에서 처리됩니다."
        keywords="PDF 변환, PDF JPG 변환, PDF PNG 변환, PDF 이미지 변환, 온라인 PDF 변환기, 무료 PDF 변환"
      />

      <div className="page-header">
        <h1 className="page-title">PDF to Image 변환기</h1>
        <p className="page-description">
          PDF 파일의 각 페이지를 고품질 JPG 또는 PNG 이미지로 변환하세요.
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
                  <option value="image/png">PNG (고품질, 투명 배경)</option>
                  <option value="image/jpeg">JPG (작은 파일 크기)</option>
                </select>
              </div>

              <div className="option-group">
                <label className="option-label">해상도: {scale}x ({scale * 72} DPI)</label>
                <input
                  type="range"
                  className="option-slider"
                  min="1"
                  max="4"
                  step="0.5"
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
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

            {results.length > 0 && (
              <div className="result">
                <h4 className="result-title">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  변환 완료! ({results.length}페이지)
                </h4>

                <div className="thumbnail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  {results.map((image) => (
                    <div key={image.pageNum} className="thumbnail-item" style={{ textAlign: 'center' }}>
                      <img
                        src={image.url}
                        alt={`Page ${image.pageNum}`}
                        style={{ width: '100%', height: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                      />
                      <p style={{ fontSize: '12px', marginTop: '4px', color: 'var(--text-secondary)' }}>페이지 {image.pageNum}</p>
                      <button
                        onClick={() => handleDownloadSingle(image)}
                        style={{ fontSize: '11px', padding: '4px 8px', marginTop: '4px', cursor: 'pointer', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                      >
                        다운로드
                      </button>
                    </div>
                  ))}
                </div>

                <button className="download-button" onClick={handleDownloadAll}>
                  {results.length > 1 ? '전체 다운로드 (ZIP)' : '이미지 다운로드'}
                </button>
              </div>
            )}

            {results.length === 0 && !converting && (
              <button
                className="convert-button"
                onClick={handleConvert}
                disabled={!file}
              >
                이미지로 변환하기
              </button>
            )}
          </>
        )}
      </div>

      <div className="seo-content">
        <h2>PDF를 이미지로 변환하는 이유</h2>
        <p>
          PDF 파일을 이미지로 변환하면 소셜 미디어에 공유하거나, 프레젠테이션에 삽입하거나,
          이미지 편집 소프트웨어에서 수정할 수 있습니다. 각 페이지가 개별 이미지 파일로 변환됩니다.
        </p>

        <h2>왜 EasyFile을 사용해야 하나요?</h2>
        <ul>
          <li><strong>100% 무료</strong> - 회원가입이나 결제 없이 무제한 사용</li>
          <li><strong>완벽한 개인정보 보호</strong> - 파일이 서버로 전송되지 않음</li>
          <li><strong>고품질 변환</strong> - 최대 4배 해상도 지원</li>
          <li><strong>일괄 다운로드</strong> - 여러 페이지를 ZIP으로 한번에 다운로드</li>
        </ul>
      </div>
    </>
  );
};

export default PdfToImage;
