import { useState, useCallback } from 'react';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import { createPreviewUrl, revokePreviewUrl } from '../../utils/imageConverter';
import { downloadFile, getFilenameWithNewExtension } from '../../utils/download';
import { readPsd } from 'ag-psd';

const PsdConverter = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [outputFormat, setOutputFormat] = useState('image/png');
  const [quality, setQuality] = useState(92);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = useCallback((selectedFile) => {
    if (previewUrl) revokePreviewUrl(previewUrl);
    setFile(selectedFile);
    setPreviewUrl(null);
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
      const arrayBuffer = await file.arrayBuffer();
      setProgress(30);

      const psd = readPsd(arrayBuffer);
      setProgress(50);

      if (!psd.canvas) {
        throw new Error('PSD 파일에서 이미지를 추출할 수 없습니다.');
      }

      setProgress(70);

      const canvas = psd.canvas;
      const qualityValue = quality / 100;

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('이미지 생성에 실패했습니다.'));
            }
          },
          outputFormat,
          qualityValue
        );
      });

      setProgress(90);

      if (previewUrl) revokePreviewUrl(previewUrl);
      const newPreviewUrl = createPreviewUrl(blob);
      setPreviewUrl(newPreviewUrl);
      setResult(blob);
      setProgress(100);
    } catch (err) {
      console.error(err);
      setError('PSD 파일 변환 중 오류가 발생했습니다. 올바른 PSD 파일인지 확인해주세요.');
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
        title="PSD JPG PNG 변환 - 포토샵 파일 변환기"
        description="PSD 포토샵 파일을 JPG, PNG로 무료 변환. 포토샵 없이 PSD 파일을 열고 이미지로 저장하세요. 레이어 병합된 최종 이미지를 추출합니다."
        keywords="PSD 변환, PSD JPG 변환, PSD PNG 변환, 포토샵 파일 변환, PSD 열기, 무료 PSD 변환기"
      />

      <div className="page-header">
        <h1 className="page-title">PSD to JPG/PNG 변환기</h1>
        <p className="page-description">
          포토샵 PSD 파일을 JPG 또는 PNG 이미지로 변환하세요.
          포토샵이 없어도 PSD 파일의 내용을 확인하고 저장할 수 있습니다.
        </p>
      </div>

      <div className="converter-card">
        {!file ? (
          <DropZone
            onFileSelect={handleFileSelect}
            acceptedTypes={['.psd', 'image/vnd.adobe.photoshop']}
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
                  <option value="image/png">PNG (투명 배경 유지)</option>
                  <option value="image/jpeg">JPG (작은 파일 크기)</option>
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
        <h2>PSD 파일이란?</h2>
        <p>
          PSD(Photoshop Document)는 Adobe Photoshop의 기본 파일 형식입니다.
          레이어, 마스크, 효과 등 포토샵의 모든 편집 기능을 저장할 수 있습니다.
          하지만 포토샵이 설치되지 않은 컴퓨터에서는 열어볼 수 없습니다.
        </p>

        <h2>포토샵 없이 PSD 파일 열기</h2>
        <p>
          EasyFile을 사용하면 포토샵 없이도 PSD 파일의 내용을 확인하고 이미지로 저장할 수 있습니다.
          모든 레이어가 병합된 최종 결과물을 JPG나 PNG로 추출합니다.
        </p>

        <h2>주의사항</h2>
        <ul>
          <li>매우 큰 PSD 파일은 변환에 시간이 걸릴 수 있습니다</li>
          <li>일부 고급 효과는 정확히 렌더링되지 않을 수 있습니다</li>
          <li>개별 레이어 추출은 지원하지 않습니다</li>
        </ul>
      </div>
    </>
  );
};

export default PsdConverter;
