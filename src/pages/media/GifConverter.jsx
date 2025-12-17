import { useState, useCallback, useRef } from 'react';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import { downloadFile, getFilenameWithNewExtension } from '../../utils/download';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const GifConverter = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [quality, setQuality] = useState('medium');
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [result, setResult] = useState(null);
  const [resultSize, setResultSize] = useState(null);
  const [error, setError] = useState(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());

  const loadFfmpeg = async () => {
    const ffmpeg = ffmpegRef.current;
    if (ffmpegLoaded) return;

    setProgressText('FFmpeg 로딩 중...');
    setProgress(5);

    try {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      setFfmpegLoaded(true);
    } catch (err) {
      console.error('FFmpeg load error:', err);
      throw new Error('FFmpeg 로딩에 실패했습니다. 페이지를 새로고침해주세요.');
    }
  };

  const handleFileSelect = useCallback((selectedFile) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    setFile(selectedFile);
    setResult(null);
    setResultSize(null);
    setError(null);
    setProgress(0);
    setProgressText('');
  }, [previewUrl]);

  const handleRemoveFile = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFile(null);
    setResult(null);
    setResultSize(null);
    setError(null);
    setProgress(0);
    setProgressText('');
  }, [previewUrl]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleConvert = async () => {
    if (!file) return;

    setConverting(true);
    setError(null);

    try {
      await loadFfmpeg();

      const ffmpeg = ffmpegRef.current;

      ffmpeg.on('progress', ({ progress: p }) => {
        const percent = Math.round(p * 100);
        setProgress(Math.min(10 + percent * 0.85, 95));
        setProgressText(`변환 중... ${percent}%`);
      });

      setProgressText('파일 준비 중...');
      setProgress(10);

      const inputName = 'input.gif';
      const outputName = 'output.mp4';

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      setProgressText('변환 중...');

      const qualitySettings = {
        low: '28',
        medium: '23',
        high: '18'
      };

      const crf = qualitySettings[quality] || '23';

      // GIF to MP4 conversion with proper settings
      await ffmpeg.exec([
        '-i', inputName,
        '-movflags', 'faststart',
        '-pix_fmt', 'yuv420p',
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        '-c:v', 'libx264',
        '-crf', crf,
        '-preset', 'medium',
        outputName
      ]);

      setProgressText('파일 생성 중...');
      setProgress(95);

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      setResult(blob);
      setResultSize(blob.size);
      setProgress(100);
      setProgressText('변환 완료!');

      // Cleanup
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch (err) {
      console.error(err);
      setError('GIF 변환 중 오류가 발생했습니다. 파일 형식을 확인해주세요.');
    } finally {
      setConverting(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const filename = getFilenameWithNewExtension(file.name, 'mp4');
    downloadFile(result, filename);
  };

  const compressionRatio = file && resultSize
    ? Math.round((1 - resultSize / file.size) * 100)
    : null;

  return (
    <>
      <SEOHead
        title="GIF MP4 변환 - GIF 용량 줄이기"
        description="GIF 파일을 MP4로 변환하여 용량을 1/10로 줄이세요. 큰 GIF 파일을 작은 MP4 비디오로 변환. 카카오톡, SNS에 공유하기 쉬워집니다."
        keywords="GIF 변환, GIF MP4 변환, GIF 용량 줄이기, 움짤 변환, GIF 압축, 온라인 GIF 변환기"
      />

      <div className="page-header">
        <h1 className="page-title">GIF to MP4 변환기</h1>
        <p className="page-description">
          용량이 큰 GIF 파일을 MP4로 변환하여 파일 크기를 대폭 줄이세요.
          보통 원본의 1/10 수준으로 용량이 감소합니다.
        </p>
      </div>

      <div className="converter-card">
        {!file ? (
          <DropZone
            onFileSelect={handleFileSelect}
            acceptedTypes={['.gif', 'image/gif']}
          />
        ) : (
          <>
            <FilePreview
              file={file}
              onRemove={handleRemoveFile}
            />

            {previewUrl && (
              <div style={{
                marginTop: '16px',
                textAlign: 'center',
                padding: '20px',
                background: 'var(--background-color)',
                borderRadius: '8px'
              }}>
                <img
                  src={previewUrl}
                  alt="GIF 미리보기"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '250px',
                    borderRadius: '4px'
                  }}
                />
              </div>
            )}

            <div className="options">
              <h4 className="options-title">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                변환 옵션
              </h4>

              <div className="option-group">
                <label className="option-label">품질</label>
                <select
                  className="option-select"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                >
                  <option value="low">낮음 (가장 작은 파일)</option>
                  <option value="medium">보통 (권장)</option>
                  <option value="high">높음 (최고 품질)</option>
                </select>
              </div>
            </div>

            {converting && <ProgressBar progress={progress} text={progressText} />}

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

                {compressionRatio !== null && compressionRatio > 0 && (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontWeight: '600', color: 'var(--success-color)', fontSize: '1.25rem' }}>
                      {compressionRatio}% 용량 감소!
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
                      {formatFileSize(file.size)} → {formatFileSize(resultSize)}
                    </div>
                  </div>
                )}

                <button className="download-button" onClick={handleDownload}>
                  MP4 파일 다운로드
                </button>
              </div>
            )}

            {!result && !converting && (
              <button
                className="convert-button"
                onClick={handleConvert}
                disabled={!file}
              >
                MP4로 변환하기
              </button>
            )}
          </>
        )}
      </div>

      <div className="seo-content">
        <h2>GIF를 MP4로 변환하면 좋은 이유</h2>
        <p>
          GIF는 애니메이션을 표현할 수 있지만, 비효율적인 압축 방식으로 파일 크기가 매우 큽니다.
          MP4로 변환하면 화질은 유지하면서 파일 크기를 1/10 이하로 줄일 수 있습니다.
        </p>

        <h2>용량이 줄어드는 원리</h2>
        <ul>
          <li>GIF: 프레임마다 전체 이미지를 저장 (비효율적)</li>
          <li>MP4: 변화된 부분만 저장하는 현대적 압축 (효율적)</li>
          <li>결과: 같은 애니메이션을 훨씬 작은 용량으로 저장</li>
        </ul>

        <h2>활용 사례</h2>
        <ul>
          <li>카카오톡, 텔레그램 등 메신저로 공유</li>
          <li>웹사이트에 애니메이션 삽입</li>
          <li>저장 공간 절약</li>
          <li>SNS 업로드 용량 제한 회피</li>
        </ul>
      </div>
    </>
  );
};

export default GifConverter;
