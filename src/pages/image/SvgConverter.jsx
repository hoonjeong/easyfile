import { useState, useCallback } from 'react';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import { convertSvgToPng, createPreviewUrl, revokePreviewUrl } from '../../utils/imageConverter';
import { downloadFile, getFilenameWithNewExtension } from '../../utils/download';

const SvgConverter = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scale, setScale] = useState(2);
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
      const convertedBlob = await convertSvgToPng(file, scale);
      setProgress(80);

      if (previewUrl) revokePreviewUrl(previewUrl);
      const newPreviewUrl = createPreviewUrl(convertedBlob);
      setPreviewUrl(newPreviewUrl);
      setResult(convertedBlob);
      setProgress(100);
    } catch (err) {
      console.error(err);
      setError('SVG 파일 변환 중 오류가 발생했습니다. 올바른 SVG 파일인지 확인해주세요.');
    } finally {
      setConverting(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const filename = getFilenameWithNewExtension(file.name, 'png');
    downloadFile(result, filename);
  };

  return (
    <>
      <SEOHead
        title="SVG PNG 변환 - 온라인 SVG 변환기"
        description="SVG 벡터 파일을 PNG 이미지로 무료 변환. 투명 배경 유지, 고해상도 출력 지원. PPT, 워드 문서에 삽입 가능한 이미지로 변환하세요."
        keywords="SVG 변환, SVG PNG 변환, SVG to PNG, 벡터 이미지 변환, 온라인 SVG 변환기, 무료 SVG 변환"
      />

      <div className="page-header">
        <h1 className="page-title">SVG to PNG 변환기</h1>
        <p className="page-description">
          SVG 벡터 이미지를 PNG로 변환하세요. 투명 배경을 유지하며 고해상도 출력이 가능합니다.
          PPT, 워드 등에 삽입할 수 있습니다.
        </p>
      </div>

      <div className="converter-card">
        {!file ? (
          <DropZone
            onFileSelect={handleFileSelect}
            acceptedTypes={['.svg', 'image/svg+xml']}
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
                <label className="option-label">출력 크기 배율</label>
                <select
                  className="option-select"
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                >
                  <option value={1}>1x (원본 크기)</option>
                  <option value={2}>2x (권장 - 고해상도)</option>
                  <option value={3}>3x (매우 큰 이미지)</option>
                  <option value={4}>4x (인쇄용 최고 품질)</option>
                </select>
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
                  PNG 파일 다운로드
                </button>
              </div>
            )}

            {!result && !converting && (
              <button
                className="convert-button"
                onClick={handleConvert}
                disabled={!file}
              >
                PNG로 변환하기
              </button>
            )}
          </>
        )}
      </div>

      <div className="seo-content">
        <h2>SVG 파일이란?</h2>
        <p>
          SVG(Scalable Vector Graphics)는 확대해도 깨지지 않는 벡터 그래픽 형식입니다.
          로고, 아이콘, 일러스트레이션에 주로 사용되며, 웹사이트에서 많이 활용됩니다.
          하지만 PPT, 워드, 일부 SNS에서는 SVG를 직접 삽입할 수 없어 PNG 변환이 필요합니다.
        </p>

        <h2>SVG를 PNG로 변환하는 이유</h2>
        <ul>
          <li>PPT, 워드 문서에 이미지로 삽입할 때</li>
          <li>SNS나 메신저에 업로드할 때</li>
          <li>이미지 편집 프로그램에서 사용할 때</li>
          <li>인쇄용 고해상도 이미지가 필요할 때</li>
        </ul>

        <h2>투명 배경 유지</h2>
        <p>
          PNG 형식은 투명 배경을 지원하므로, SVG의 투명 배경이 그대로 유지됩니다.
          로고나 아이콘을 다른 배경 위에 자연스럽게 배치할 수 있습니다.
        </p>
      </div>
    </>
  );
};

export default SvgConverter;
