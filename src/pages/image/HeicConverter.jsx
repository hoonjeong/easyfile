import { useState, useCallback } from 'react';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import { convertHeic, createPreviewUrl, revokePreviewUrl } from '../../utils/imageConverter';
import { downloadFile, getFilenameWithNewExtension } from '../../utils/download';

const HeicConverter = () => {
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
    setFile(selectedFile);
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
      const convertedBlob = await convertHeic(file, outputFormat, qualityValue);
      setProgress(80);

      const newPreviewUrl = createPreviewUrl(convertedBlob);
      setPreviewUrl(newPreviewUrl);
      setResult(convertedBlob);
      setProgress(100);
    } catch (err) {
      console.error(err);
      setError('HEIC 파일 변환 중 오류가 발생했습니다. 올바른 HEIC/HEIF 파일인지 확인해주세요.');
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
        title="HEIC JPG 변환 - 아이폰 사진 변환기"
        description="HEIC 파일을 JPG, PNG로 무료 변환. 아이폰에서 촬영한 HEIC/HEIF 사진을 온라인에서 바로 변환하세요. 서버 업로드 없이 100% 브라우저에서 처리됩니다."
        keywords="HEIC 변환, HEIC JPG 변환, HEIC PNG 변환, 아이폰 사진 변환, HEIF 변환, 온라인 HEIC 변환기, 무료 HEIC 변환"
      />

      <div className="page-header">
        <h1 className="page-title">HEIC to JPG/PNG 변환기</h1>
        <p className="page-description">
          아이폰에서 촬영한 HEIC/HEIF 사진을 JPG 또는 PNG로 쉽게 변환하세요.
          모든 변환은 브라우저에서 처리되어 개인정보가 안전합니다.
        </p>
      </div>

      <div className="converter-card">
        {!file ? (
          <DropZone
            onFileSelect={handleFileSelect}
            acceptedTypes={['.heic', '.heif', 'image/heic', 'image/heif']}
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
                  <option value="image/png">PNG (투명 배경 지원)</option>
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
        <h2>HEIC 파일이란?</h2>
        <p>
          HEIC(High Efficiency Image Container)는 Apple이 iOS 11부터 도입한 이미지 포맷입니다.
          JPEG보다 더 효율적인 압축을 제공하여 같은 화질에서 파일 크기가 약 50% 작습니다.
          하지만 Windows나 일부 구형 소프트웨어에서는 HEIC 파일을 열 수 없어 JPG나 PNG로 변환이 필요합니다.
        </p>

        <h2>왜 EasyFile을 사용해야 하나요?</h2>
        <ul>
          <li><strong>100% 무료</strong> - 회원가입이나 결제 없이 무제한 사용</li>
          <li><strong>완벽한 개인정보 보호</strong> - 파일이 서버로 전송되지 않음</li>
          <li><strong>빠른 변환</strong> - 브라우저에서 즉시 처리</li>
          <li><strong>고품질 유지</strong> - 원본 화질 그대로 변환</li>
        </ul>

        <h2>지원하는 변환</h2>
        <p>HEIC → JPG, HEIC → PNG, HEIF → JPG, HEIF → PNG</p>
      </div>
    </>
  );
};

export default HeicConverter;
