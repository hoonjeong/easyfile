import { useState, useCallback } from 'react';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import { convertImageWithCanvas, createPreviewUrl, revokePreviewUrl } from '../../utils/imageConverter';
import { downloadFile, getFilenameWithNewExtension } from '../../utils/download';

const WebpConverter = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [outputFormat, setOutputFormat] = useState('image/jpeg');
  const [quality, setQuality] = useState(92);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = useCallback((selectedFile) => {
    if (previewUrl) revokePreviewUrl(previewUrl);
    const url = createPreviewUrl(selectedFile);
    setFile(selectedFile);
    setPreviewUrl(url);
    setResult(null);
    setError(null);
    setProgress(0);
  }, [previewUrl]);

  const handleRemoveFile = useCallback(() => {
    if (previewUrl) revokePreviewUrl(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setProgress(0);
  }, [previewUrl]);

  const handleConvert = async () => {
    if (!file) return;

    setConverting(true);
    setError(null);
    setProgress(10);

    try {
      setProgress(30);
      const qualityValue = quality / 100;
      const convertedBlob = await convertImageWithCanvas(file, outputFormat, qualityValue);
      setProgress(80);

      if (previewUrl) revokePreviewUrl(previewUrl);
      const newPreviewUrl = createPreviewUrl(convertedBlob);
      setPreviewUrl(newPreviewUrl);
      setResult(convertedBlob);
      setProgress(100);
    } catch (err) {
      console.error(err);
      setError('WebP 파일 변환 중 오류가 발생했습니다. 올바른 WebP 파일인지 확인해주세요.');
    } finally {
      setConverting(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const extension = outputFormat === 'image/jpeg' ? 'jpg' : 'png';
    const filename = getFilenameWithNewExtension(file.name, extension);
    downloadFile(result, filename);
  };

  return (
    <>
      <SEOHead
        title="WebP JPG 변환 - 온라인 WebP 변환기"
        description="WebP 파일을 JPG, PNG로 무료 변환. 웹용 WebP 이미지를 편집 가능한 JPG, PNG로 온라인에서 바로 변환하세요. 서버 업로드 없이 안전하게 변환됩니다."
        keywords="WebP 변환, WebP JPG 변환, WebP PNG 변환, 온라인 WebP 변환기, 무료 WebP 변환, WebP to JPG"
      />

      <div className="page-header">
        <h1 className="page-title">WebP to JPG/PNG 변환기</h1>
        <p className="page-description">
          웹 최적화된 WebP 이미지를 JPG 또는 PNG로 변환하세요.
          포토샵이나 다른 편집 프로그램에서 사용할 수 있습니다.
        </p>
      </div>

      <div className="converter-card">
        {!file ? (
          <DropZone
            onFileSelect={handleFileSelect}
            acceptedTypes={['.webp', 'image/webp']}
          />
        ) : (
          <>
            <FilePreview
              file={file}
              previewUrl={previewUrl}
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
                  <option value="image/jpeg">JPG (권장 - 작은 파일 크기)</option>
                  <option value="image/png">PNG (투명 배경 유지)</option>
                </select>
              </div>

              <div className="option-group">
                <label className="option-label">품질: {quality}%</label>
                <input
                  type="range"
                  className="option-slider"
                  min="10"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
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
                  {outputFormat === 'image/jpeg' ? 'JPG' : 'PNG'} 파일 다운로드
                </button>
              </div>
            )}

            {!result && !converting && (
              <button
                className="convert-button"
                onClick={handleConvert}
                disabled={!file}
              >
                {outputFormat === 'image/jpeg' ? 'JPG' : 'PNG'}로 변환하기
              </button>
            )}
          </>
        )}
      </div>

      <div className="seo-content">
        <h2>WebP 파일이란?</h2>
        <p>
          WebP는 Google에서 개발한 차세대 이미지 포맷으로, 웹사이트 로딩 속도를 개선하기 위해 만들어졌습니다.
          JPEG보다 약 25-34% 더 작은 파일 크기를 제공하면서도 유사한 품질을 유지합니다.
          하지만 일부 구형 브라우저나 이미지 편집 프로그램에서는 WebP를 지원하지 않습니다.
        </p>

        <h2>왜 WebP를 JPG로 변환해야 하나요?</h2>
        <ul>
          <li>포토샵 구버전에서 WebP 편집이 불가능할 때</li>
          <li>이메일이나 문서에 이미지를 첨부할 때</li>
          <li>인쇄용 파일이 필요할 때</li>
          <li>소셜 미디어에 업로드할 때 호환성 문제가 있을 때</li>
        </ul>

        <h2>지원하는 변환</h2>
        <p>WebP → JPG, WebP → PNG</p>
      </div>
    </>
  );
};

export default WebpConverter;
