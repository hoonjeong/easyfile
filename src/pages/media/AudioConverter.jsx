import { useState, useCallback, useRef } from 'react';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import { downloadFile, getFilenameWithNewExtension } from '../../utils/download';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const AudioConverter = () => {
  const [file, setFile] = useState(null);
  const [outputFormat, setOutputFormat] = useState('mp3');
  const [bitrate, setBitrate] = useState('192');
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
    setFile(selectedFile);
    setResult(null);
    setError(null);
    setProgress(0);
    setProgressText('');
  }, []);

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setProgressText('');
  }, []);

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

      const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
      const outputName = `output.${outputFormat}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      setProgressText('변환 중...');

      const ffmpegArgs = ['-i', inputName];

      if (outputFormat === 'mp3') {
        ffmpegArgs.push('-b:a', `${bitrate}k`, '-vn');
      } else if (outputFormat === 'wav') {
        ffmpegArgs.push('-vn');
      } else if (outputFormat === 'ogg') {
        ffmpegArgs.push('-c:a', 'libvorbis', '-b:a', `${bitrate}k`, '-vn');
      }

      ffmpegArgs.push(outputName);

      await ffmpeg.exec(ffmpegArgs);

      setProgressText('파일 생성 중...');
      setProgress(95);

      const data = await ffmpeg.readFile(outputName);
      const mimeTypes = {
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        ogg: 'audio/ogg'
      };

      const blob = new Blob([data.buffer], { type: mimeTypes[outputFormat] || 'audio/mpeg' });
      setResult(blob);
      setProgress(100);
      setProgressText('변환 완료!');

      // Cleanup
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch (err) {
      console.error(err);
      setError('오디오 변환 중 오류가 발생했습니다. 파일 형식을 확인해주세요.');
    } finally {
      setConverting(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const filename = getFilenameWithNewExtension(file.name, outputFormat);
    downloadFile(result, filename);
  };

  return (
    <>
      <SEOHead
        title="M4A MP3 변환 - 오디오 변환기"
        description="M4A, AAC, WAV 오디오 파일을 MP3로 무료 변환. 아이폰 음성메모를 MP3로 변환하세요. 브라우저에서 직접 변환되어 안전합니다."
        keywords="M4A 변환, M4A MP3 변환, AAC MP3 변환, 오디오 변환기, 음성메모 변환, 온라인 오디오 변환"
      />

      <div className="page-header">
        <h1 className="page-title">M4A/AAC to MP3 변환기</h1>
        <p className="page-description">
          M4A, AAC, WAV 등 오디오 파일을 MP3로 변환하세요.
          아이폰 음성메모도 안드로이드에서 재생할 수 있는 MP3로 변환됩니다.
        </p>
      </div>

      <div className="converter-card">
        {!file ? (
          <DropZone
            onFileSelect={handleFileSelect}
            acceptedTypes={['.m4a', '.aac', '.wav', '.ogg', '.flac', 'audio/*']}
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
                  <option value="mp3">MP3 (권장 - 최고 호환성)</option>
                  <option value="wav">WAV (무손실)</option>
                  <option value="ogg">OGG (오픈소스)</option>
                </select>
              </div>

              {outputFormat !== 'wav' && (
                <div className="option-group">
                  <label className="option-label">비트레이트</label>
                  <select
                    className="option-select"
                    value={bitrate}
                    onChange={(e) => setBitrate(e.target.value)}
                  >
                    <option value="128">128 kbps (작은 파일)</option>
                    <option value="192">192 kbps (권장)</option>
                    <option value="256">256 kbps (고품질)</option>
                    <option value="320">320 kbps (최고 품질)</option>
                  </select>
                </div>
              )}
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
                  {outputFormat.toUpperCase()} 파일 다운로드
                </button>
              </div>
            )}

            {!result && !converting && (
              <button
                className="convert-button"
                onClick={handleConvert}
                disabled={!file}
              >
                {outputFormat.toUpperCase()}로 변환하기
              </button>
            )}
          </>
        )}
      </div>

      <div className="seo-content">
        <h2>M4A 파일이란?</h2>
        <p>
          M4A는 Apple에서 사용하는 오디오 파일 형식으로, AAC 코덱으로 압축됩니다.
          아이폰 음성메모 앱에서 녹음한 파일이 M4A 형식입니다.
          일부 안드로이드 기기나 구형 플레이어에서는 재생이 안 될 수 있습니다.
        </p>

        <h2>MP3로 변환해야 하는 경우</h2>
        <ul>
          <li>안드로이드 기기에서 재생할 때</li>
          <li>오래된 MP3 플레이어에서 사용할 때</li>
          <li>다양한 프로그램과 호환이 필요할 때</li>
          <li>메신저로 음성 파일을 공유할 때</li>
        </ul>

        <h2>첫 변환 시 안내</h2>
        <p>
          처음 변환 시 FFmpeg 라이브러리를 다운로드하므로 약간의 시간이 소요됩니다.
          이후 변환은 더 빠르게 처리됩니다.
        </p>
      </div>
    </>
  );
};

export default AudioConverter;
