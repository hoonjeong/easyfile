import { useState, useCallback } from 'react';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import { convertIcoToPng, createPreviewUrl, revokePreviewUrl } from '../../utils/imageConverter';
import { downloadFile, getFilenameWithNewExtension } from '../../utils/download';

const IcoConverter = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
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
      const convertedBlob = await convertIcoToPng(file);
      setProgress(80);

      if (previewUrl) revokePreviewUrl(previewUrl);
      const newPreviewUrl = createPreviewUrl(convertedBlob);
      setPreviewUrl(newPreviewUrl);
      setResult(convertedBlob);
      setProgress(100);
    } catch (err) {
      console.error(err);
      setError('ICO 파일 변환 중 오류가 발생했습니다. 올바른 ICO 파일인지 확인해주세요.');
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
        title="ICO PNG 변환 - 아이콘 파일 변환기"
        description="ICO 아이콘 파일을 PNG 이미지로 무료 변환. 윈도우 아이콘, 파비콘을 일반 이미지로 변환하세요. 투명 배경을 유지합니다."
        keywords="ICO 변환, ICO PNG 변환, 아이콘 변환, 파비콘 변환, 온라인 ICO 변환기, 무료 ICO 변환"
      />

      <div className="page-header">
        <h1 className="page-title">ICO to PNG 변환기</h1>
        <p className="page-description">
          ICO 아이콘 파일을 PNG 이미지로 변환하세요.
          파비콘이나 윈도우 아이콘을 일반 이미지로 저장할 수 있습니다.
        </p>
      </div>

      <div className="converter-card">
        {!file ? (
          <DropZone
            onFileSelect={handleFileSelect}
            acceptedTypes={['.ico', 'image/x-icon', 'image/vnd.microsoft.icon']}
          />
        ) : (
          <>
            <FilePreview
              file={file}
              previewUrl={previewUrl}
              onRemove={handleRemoveFile}
            />

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
        <h2>ICO 파일이란?</h2>
        <p>
          ICO는 Windows 운영체제에서 사용하는 아이콘 파일 형식입니다.
          웹사이트의 파비콘(브라우저 탭에 표시되는 작은 아이콘)에도 사용됩니다.
          여러 크기의 이미지를 하나의 파일에 포함할 수 있는 특징이 있습니다.
        </p>

        <h2>ICO를 PNG로 변환하는 이유</h2>
        <ul>
          <li>아이콘을 일반 이미지로 사용하고 싶을 때</li>
          <li>이미지 편집 프로그램에서 수정하고 싶을 때</li>
          <li>문서나 프레젠테이션에 삽입할 때</li>
          <li>웹사이트에서 일반 이미지로 표시하고 싶을 때</li>
        </ul>

        <h2>투명 배경 유지</h2>
        <p>
          PNG 형식은 투명 배경을 지원하므로, ICO 파일의 투명 부분이 그대로 유지됩니다.
        </p>
      </div>
    </>
  );
};

export default IcoConverter;
