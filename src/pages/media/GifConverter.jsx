import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import { downloadFile, getFilenameWithNewExtension } from '../../utils/download';
import { formatFileSize } from '../../utils/fileValidation';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const GifConverter = () => {
  const { t } = useTranslation();
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

      const inputName = 'input.gif';
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
        '-movflags', 'faststart',
        '-pix_fmt', 'yuv420p',
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        '-c:v', 'libx264',
        '-crf', crf,
        '-preset', 'medium',
        outputName
      ]);

      setProgressText(t('media.creatingFile'));
      setProgress(95);

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      setResult(blob);
      setResultSize(blob.size);
      setProgress(100);
      setProgressText(t('common.conversionComplete'));

      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch (err) {
      console.error(err);
      setError(t('media.gif.error'));
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
      <SEOHead title={t('media.gif.pageTitle')} description={t('media.gif.pageDescription')} keywords={t('media.gif.seoKeywords')} />

      <div className="page-header">
        <h1 className="page-title">{t('media.gif.pageTitle')}</h1>
        <p className="page-description">{t('media.gif.pageDescription')}</p>
      </div>

      <div className="converter-card">
        {!file ? (
          <DropZone onFileSelect={handleFileSelect} acceptedTypes={['.gif', 'image/gif']} fileCategory="gif" />
        ) : (
          <>
            <FilePreview file={file} onRemove={handleRemoveFile} />

            {previewUrl && (
              <div style={{ marginTop: '16px', textAlign: 'center', padding: '20px', background: 'var(--background-color)', borderRadius: '8px' }}>
                <img src={previewUrl} alt={t('media.gif.preview')} style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '4px' }} />
              </div>
            )}

            <div className="options">
              <h4 className="options-title">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {t('common.options')}
              </h4>

              <div className="option-group">
                <label className="option-label">{t('common.quality')}</label>
                <select className="option-select" value={quality} onChange={(e) => setQuality(e.target.value)}>
                  <option value="low">{t('media.gif.qualityLow')}</option>
                  <option value="medium">{t('media.gif.qualityMedium')}</option>
                  <option value="high">{t('media.gif.qualityHigh')}</option>
                </select>
              </div>
            </div>

            {converting && <ProgressBar progress={progress} text={progressText} />}
            {error && <div className="error"><svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{error}</div>}

            {result && (
              <div className="result">
                <h4 className="result-title"><svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{t('common.conversionComplete')}</h4>

                {compressionRatio !== null && compressionRatio > 0 && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center' }}>
                    <div style={{ fontWeight: '600', color: 'var(--success-color)', fontSize: '1.25rem' }}>{t('media.gif.compressionResult', { percent: compressionRatio })}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>{formatFileSize(file.size)} → {formatFileSize(resultSize)}</div>
                  </div>
                )}

                <button className="download-button" onClick={handleDownload}>{t('media.downloadFormat', { format: 'MP4' })}</button>
              </div>
            )}

            {!result && !converting && (
              <button className="convert-button" onClick={handleConvert} disabled={!file}>{t('media.convertToFormat', { format: 'MP4' })}</button>
            )}
          </>
        )}
      </div>

      <div className="seo-content">
        <h2>{t('media.gif.whatIs')}</h2>
        <p>{t('media.gif.whatIsDesc')}</p>
        <h2>{t('whyUse.title')}</h2>
        <ul>
          <li><strong>{t('whyUse.free')}</strong></li>
          <li><strong>{t('whyUse.privacy')}</strong></li>
          <li><strong>{t('whyUse.fast')}</strong></li>
          <li><strong>{t('whyUse.quality')}</strong></li>
        </ul>
      </div>
    </>
  );
};

export default GifConverter;
