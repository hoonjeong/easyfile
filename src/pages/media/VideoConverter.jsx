import { useState, useCallback, useRef } from 'react';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import { downloadFile, getFilenameWithNewExtension } from '../../utils/download';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const VideoConverter = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [quality, setQuality] = useState('medium');
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());

  const loadFfmpeg = async () => {
    const ffmpeg = ffmpegRef.current;
    if (ffmpegLoaded) return;

    setProgressText('FFmpeg 로딩 중... (첫 변환 시에만 소요)');
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
    setError(null);
    setProgress(0);
    setProgressText('');
  }, [previewUrl]);

  const handleRemoveFile = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setProgressText('');
  }, [previewUrl]);

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

      const inputName = 'input.webm';
      const outputName = 'output.mp4';

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      setProgressText('변환 중...');

      const qualitySettings = {
        low: '28',
        medium: '23',
        high: '18'
      };

      const crf = qualitySettings[quality] || '23';

      await ffmpeg.exec([
        '-i', inputName,
        '-c:v', 'libx264',
        '-crf', crf,
        '-preset', 'medium',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        outputName
      ]);

      setProgressText('파일 생성 중...');
      setProgress(95);

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      setResult(blob);
      setProgress(100);
      setProgressText('변환 완료!');

      // Cleanup
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch (err) {
      console.error(err);
      setError('비디오 변환 중 오류가 발생했습니다. 파일 형식을 확인해주세요.');
    } finally {
      setConverting(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const filename = getFilenameWithNewExtension(file.name, 'mp4');
    downloadFile(result, filename);
  };

  return (
    <>
      <SEOHead
        title="WebM MP4 변환 - 온라인 비디오 변환기"
        description="WebM 비디오를 MP4로 무료 변환. 웹 녹화 파일을 프리미어, 편집 프로그램에서 사용할 수 있는 MP4로 변환하세요. 서버 업로드 없이 브라우저에서 변환됩니다."
        keywords="WebM 변환, WebM MP4 변환, 비디오 변환기, 온라인 비디오 변환, 웹 녹화 변환"
      />

      <div className="page-header">
        <h1 className="page-title">WebM to MP4 변환기</h1>
        <p className="page-description">
          WebM 비디오 파일을 MP4로 변환하세요.
          프리미어 프로, 다빈치 리졸브 등 편집 프로그램에서 사용할 수 있습니다.
        </p>
      </div>

      <div className="converter-card">
        {!file ? (
          <DropZone
            onFileSelect={handleFileSelect}
            acceptedTypes={['.webm', 'video/webm']}
          />
        ) : (
          <>
            <FilePreview
              file={file}
              onRemove={handleRemoveFile}
            />

            {previewUrl && (
              <video
                src={previewUrl}
                controls
                style={{
                  width: '100%',
                  maxHeight: '300px',
                  marginTop: '16px',
                  borderRadius: '8px',
                  background: '#000'
                }}
              />
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
                  <option value="low">낮음 (작은 파일 크기)</option>
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
        <h2>WebM 파일이란?</h2>
        <p>
          WebM은 Google에서 개발한 웹 최적화 비디오 형식입니다.
          브라우저에서 화면을 녹화하면 주로 WebM 형식으로 저장됩니다.
          하지만 프리미어 프로, 다빈치 리졸브 등 일부 편집 프로그램에서는 WebM을 직접 불러올 수 없습니다.
        </p>

        <h2>MP4로 변환해야 하는 경우</h2>
        <ul>
          <li>영상 편집 프로그램에서 편집할 때</li>
          <li>소셜 미디어에 업로드할 때</li>
          <li>스마트폰에서 재생할 때</li>
          <li>프레젠테이션에 삽입할 때</li>
        </ul>

        <h2>변환 시간 안내</h2>
        <p>
          비디오 변환은 파일 크기에 따라 시간이 걸릴 수 있습니다.
          긴 영상의 경우 몇 분이 소요될 수 있으니 잠시 기다려주세요.
        </p>
      </div>
    </>
  );
};

export default VideoConverter;
