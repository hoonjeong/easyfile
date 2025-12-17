import { useState, useCallback } from 'react';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import { createPreviewUrl, revokePreviewUrl } from '../../utils/imageConverter';
import { downloadFile, getFilenameWithNewExtension } from '../../utils/download';
import * as UTIF from 'utif2';

const TiffConverter = () => {
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

      const ifds = UTIF.decode(arrayBuffer);
      if (ifds.length === 0) {
        throw new Error('TIFF 파일을 디코딩할 수 없습니다.');
      }

      setProgress(50);

      UTIF.decodeImage(arrayBuffer, ifds[0]);
      const rgba = UTIF.toRGBA8(ifds[0]);

      setProgress(70);

      const canvas = document.createElement('canvas');
      canvas.width = ifds[0].width;
      canvas.height = ifds[0].height;
      const ctx = canvas.getContext('2d');

      const imageData = ctx.createImageData(canvas.width, canvas.height);
      imageData.data.set(rgba);
      ctx.putImageData(imageData, 0, 0);

      setProgress(85);

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

      if (previewUrl) revokePreviewUrl(previewUrl);
      const newPreviewUrl = createPreviewUrl(blob);
      setPreviewUrl(newPreviewUrl);
      setResult(blob);
      setProgress(100);
    } catch (err) {
      console.error(err);
      setError('TIFF 파일 변환 중 오류가 발생했습니다. 올바른 TIFF 파일인지 확인해주세요.');
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
        title="TIFF JPG 변환 - 온라인 TIF 변환기"
        description="TIFF/TIF 파일을 JPG, PNG로 무료 변환. 스캔 문서나 고해상도 TIFF 이미지를 웹이나 메신저에서 사용할 수 있는 형식으로 변환하세요."
        keywords="TIFF 변환, TIF 변환, TIFF JPG 변환, TIF PNG 변환, 온라인 TIFF 변환기, 무료 TIFF 변환"
      />

      <div className="page-header">
        <h1 className="page-title">TIFF to JPG/PNG 변환기</h1>
        <p className="page-description">
          고해상도 TIFF/TIF 이미지를 JPG 또는 PNG로 변환하세요.
          웹, 메신저, SNS에 업로드하기 적합한 형식으로 만들 수 있습니다.
        </p>
      </div>

      <div className="converter-card">
        {!file ? (
          <DropZone
            onFileSelect={handleFileSelect}
            acceptedTypes={['.tiff', '.tif', 'image/tiff']}
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
                  <option value="image/png">PNG (무손실 압축)</option>
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
        <h2>TIFF/TIF 파일이란?</h2>
        <p>
          TIFF(Tagged Image File Format)는 고품질 무손실 이미지 저장에 사용되는 형식입니다.
          스캐너, 인쇄소, 전문 사진 작업에서 주로 사용됩니다.
          뛰어난 품질을 자랑하지만 파일 크기가 매우 크고 웹에서 직접 사용하기 어렵습니다.
        </p>

        <h2>TIFF를 JPG로 변환하는 이유</h2>
        <ul>
          <li>카카오톡이나 이메일로 이미지를 보낼 때</li>
          <li>웹사이트나 SNS에 업로드할 때</li>
          <li>파일 크기를 줄여 저장 공간을 절약할 때</li>
          <li>다양한 프로그램에서 호환성이 필요할 때</li>
        </ul>

        <h2>지원하는 변환</h2>
        <p>TIFF → JPG, TIFF → PNG, TIF → JPG, TIF → PNG</p>
      </div>
    </>
  );
};

export default TiffConverter;
