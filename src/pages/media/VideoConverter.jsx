import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import ErrorDisplay from '../../components/ErrorDisplay';
import ResultDisplay from '../../components/ResultDisplay';
import { downloadFile, getFilenameWithNewExtension } from '../../utils/download';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import CoupangBanner from '../../components/CoupangBanner';

const VideoConverter = () => {
  const { t } = useTranslation();
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

  // Cleanup Blob URLs on component unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const loadFfmpeg = async () => {
    const ffmpeg = ffmpegRef.current;
    if (ffmpegLoaded) return;

    setProgressText(t('media.loadingFFmpeg'));
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
      throw new Error(t('media.ffmpegLoadError'));
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
        setProgressText(`${t('media.converting')} ${percent}%`);
      });

      setProgressText(t('media.preparingFile'));
      setProgress(10);

      const inputName = 'input.webm';
      const outputName = 'output.mp4';

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      setProgressText(t('media.converting'));

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

      setProgressText(t('media.creatingFile'));
      setProgress(95);

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      setResult(blob);
      setProgress(100);
      setProgressText(t('common.conversionComplete'));

      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch (err) {
      console.error(err);
      setError(t('media.video.error'));
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
      <SEOHead title={t('media.video.pageTitle')} description={t('media.video.pageDescription')} keywords={t('media.video.seoKeywords')} />

      <div className="page-header">
        <h1 className="page-title">{t('media.video.pageTitle')}</h1>
        <p className="page-description">{t('media.video.pageDescription')}</p>
      </div>

      <CoupangBanner type="top" />

      <div className="converter-card">
        {!file ? (
          <DropZone onFileSelect={handleFileSelect} acceptedTypes={['.webm', 'video/webm']} fileCategory="video" />
        ) : (
          <>
            <FilePreview file={file} onRemove={handleRemoveFile} />

            {previewUrl && (
              <video src={previewUrl} controls style={{ width: '100%', maxHeight: '300px', marginTop: '16px', borderRadius: '8px', background: '#000' }} />
            )}

            <div className="options">
              <h4 className="options-title">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {t('common.options')}
              </h4>

              <div className="option-group">
                <label className="option-label">{t('common.quality')}</label>
                <select className="option-select" value={quality} onChange={(e) => setQuality(e.target.value)}>
                  <option value="low">{t('media.video.qualityLow')}</option>
                  <option value="medium">{t('media.video.qualityMedium')}</option>
                  <option value="high">{t('media.video.qualityHigh')}</option>
                </select>
              </div>
            </div>

            {converting && <ProgressBar progress={progress} text={progressText} />}
            <ErrorDisplay error={error} />

            <ResultDisplay
              result={result}
              onDownload={handleDownload}
              downloadLabel={t('media.downloadFormat', { format: 'MP4' })}
            />

            {!result && !converting && (
              <button className="convert-button" onClick={handleConvert} disabled={!file}>{t('media.convertToFormat', { format: 'MP4' })}</button>
            )}
          </>
        )}
      </div>

      <div className="seo-content">
        <h2>{t('media.video.whatIs')}</h2>
        <p>{t('media.video.whatIsDesc')}</p>

        <h2>{t('media.video.howToUse')}</h2>
        <ol>
          <li>{t('media.video.step1')}</li>
          <li>{t('media.video.step2')}</li>
          <li>{t('media.video.step3')}</li>
          <li>{t('media.video.step4')}</li>
        </ol>

        <h2>{t('media.video.qualityGuide')}</h2>
        <ul>
          <li><strong>{t('media.video.qualityLowDesc')}</strong></li>
          <li><strong>{t('media.video.qualityMediumDesc')}</strong></li>
          <li><strong>{t('media.video.qualityHighDesc')}</strong></li>
        </ul>

        <h2>{t('media.video.useCases')}</h2>
        <ul>
          <li><strong>{t('media.video.useCase1')}</strong></li>
          <li><strong>{t('media.video.useCase2')}</strong></li>
          <li><strong>{t('media.video.useCase3')}</strong></li>
          <li><strong>{t('media.video.useCase4')}</strong></li>
        </ul>

        <h2>{t('media.video.features')}</h2>
        <ul>
          <li><strong>{t('media.video.feature1')}</strong></li>
          <li><strong>{t('media.video.feature2')}</strong></li>
          <li><strong>{t('media.video.feature3')}</strong></li>
          <li><strong>{t('media.video.feature4')}</strong></li>
        </ul>

        <h2>{t('media.video.faq')}</h2>
        <h3>{t('media.video.faq1Q')}</h3>
        <p>{t('media.video.faq1A')}</p>
        <h3>{t('media.video.faq2Q')}</h3>
        <p>{t('media.video.faq2A')}</p>
        <h3>{t('media.video.faq3Q')}</h3>
        <p>{t('media.video.faq3A')}</p>
      </div>
    </>
  );
};

export default VideoConverter;
