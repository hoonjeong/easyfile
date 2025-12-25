import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchFile } from '@ffmpeg/util';
import SEOHead from '../../components/SEOHead';
import ProgressBar from '../../components/ProgressBar';
import ErrorDisplay from '../../components/ErrorDisplay';
import { downloadFile } from '../../utils/download';
import useFFmpeg from '../../hooks/useFFmpeg';
import CoupangBanner from '../../components/CoupangBanner';

const VideoChromakey = () => {
  const { t } = useTranslation();
  const { ffmpeg, ffmpegLoaded, loading: ffmpegLoading, loadFFmpeg, setProgressHandler } = useFFmpeg();

  const [videoFile, setVideoFile] = useState(null);
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [chromaColor, setChromaColor] = useState('green');
  const [similarity, setSimilarity] = useState(0.3);
  const [blend, setBlend] = useState(0.1);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [result, setResult] = useState(null);
  const [resultPreview, setResultPreview] = useState(null);
  const [error, setError] = useState(null);

  const videoInputRef = useRef(null);
  const backgroundInputRef = useRef(null);
  const previewVideoRef = useRef(null);
  const resultVideoRef = useRef(null);

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      if (backgroundPreview) URL.revokeObjectURL(backgroundPreview);
      if (resultPreview) URL.revokeObjectURL(resultPreview);
    };
  }, []);

  const handleVideoSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setResult(null);
    setResultPreview(null);
    setError(null);
  }, [videoPreview]);

  const handleBackgroundSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (backgroundPreview) URL.revokeObjectURL(backgroundPreview);
    setBackgroundFile(file);
    setBackgroundPreview(URL.createObjectURL(file));
    setResult(null);
    setResultPreview(null);
    setError(null);
  }, [backgroundPreview]);

  const removeVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview(null);
    setResult(null);
    setResultPreview(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const removeBackground = () => {
    if (backgroundPreview) URL.revokeObjectURL(backgroundPreview);
    setBackgroundFile(null);
    setBackgroundPreview(null);
    setResult(null);
    setResultPreview(null);
    if (backgroundInputRef.current) backgroundInputRef.current.value = '';
  };

  const handleComposite = async () => {
    if (!videoFile || !backgroundFile) return;

    setProcessing(true);
    setError(null);
    setProgress(0);
    setProgressText(t('media.loadingFFmpeg'));

    try {
      // Load FFmpeg
      await loadFFmpeg((p) => setProgress(p));
      setProgress(10);
      setProgressText(t('media.preparingFile'));

      // Set up progress handler
      const unsubscribe = setProgressHandler(({ progress: p }) => {
        if (p > 0 && p <= 1) {
          setProgress(10 + p * 80);
        }
      });

      // Write files to FFmpeg virtual filesystem
      const videoData = await fetchFile(videoFile);
      const bgData = await fetchFile(backgroundFile);

      await ffmpeg.writeFile('input.mp4', videoData);
      await ffmpeg.writeFile('background.png', bgData);

      setProgressText(t('media.converting'));

      // Determine color key based on selection
      let colorKey;
      switch (chromaColor) {
        case 'green':
          colorKey = '0x00FF00';
          break;
        case 'blue':
          colorKey = '0x0000FF';
          break;
        default:
          colorKey = chromaColor.replace('#', '0x');
      }

      // Run FFmpeg with chromakey filter
      // Using colorkey filter for green/blue screen removal
      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-i', 'background.png',
        '-filter_complex',
        `[1:v]scale=iw:ih:force_original_aspect_ratio=increase,crop=iw:ih[bg];[0:v]colorkey=${colorKey}:${similarity}:${blend}[fg];[bg][fg]overlay=shortest=1`,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        '-y',
        'output.mp4'
      ]);

      unsubscribe();

      setProgressText(t('media.creatingFile'));
      setProgress(95);

      // Read output file
      const outputData = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([outputData], { type: 'video/mp4' });

      // Cleanup
      await ffmpeg.deleteFile('input.mp4');
      await ffmpeg.deleteFile('background.png');
      await ffmpeg.deleteFile('output.mp4');

      setResult(blob);
      setResultPreview(URL.createObjectURL(blob));
      setProgress(100);

    } catch (err) {
      console.error('Video chromakey error:', err);
      setError(t('chromakey.video.error'));
    } finally {
      setProcessing(false);
      setProgressText('');
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const originalName = videoFile?.name || 'video';
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    downloadFile(result, `${baseName}_chromakey.mp4`);
  };

  const handleReset = () => {
    removeVideo();
    removeBackground();
    setResult(null);
    setResultPreview(null);
    setError(null);
    setProgress(0);
  };

  return (
    <>
      <SEOHead
        title={t('chromakey.video.pageTitle')}
        description={t('chromakey.video.pageDescription')}
        keywords={t('chromakey.video.seoKeywords')}
      />

      <div className="page-header">
        <h1 className="page-title">{t('chromakey.video.pageTitle')}</h1>
        <p className="page-description">{t('chromakey.video.pageDescription')}</p>
      </div>

      <CoupangBanner type="top" />

      <div className="converter-card">
        {/* File Selection Area */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          {/* Video File */}
          <div>
            <h4 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>
              {t('chromakey.video.chromakeyVideo')}
            </h4>
            {!videoFile ? (
              <div
                className="dropzone"
                onClick={() => videoInputRef.current?.click()}
                style={{ minHeight: '200px', cursor: 'pointer' }}
              >
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  style={{ display: 'none' }}
                />
                <div className="dropzone-content">
                  <div className="dropzone-icon" style={{ fontSize: '48px' }}>🎬</div>
                  <p className="dropzone-text">{t('chromakey.video.selectVideo')}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>MP4, WebM, MOV</p>
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <video
                  ref={previewVideoRef}
                  src={videoPreview}
                  style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                  controls
                  muted
                />
                <button
                  onClick={removeVideo}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(239, 68, 68, 0.9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Background Image */}
          <div>
            <h4 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>
              {t('chromakey.image.backgroundImage')}
            </h4>
            {!backgroundFile ? (
              <div
                className="dropzone"
                onClick={() => backgroundInputRef.current?.click()}
                style={{ minHeight: '200px', cursor: 'pointer' }}
              >
                <input
                  ref={backgroundInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundSelect}
                  style={{ display: 'none' }}
                />
                <div className="dropzone-content">
                  <div className="dropzone-icon" style={{ fontSize: '48px' }}>🏞️</div>
                  <p className="dropzone-text">{t('chromakey.image.selectBackground')}</p>
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <img
                  src={backgroundPreview}
                  alt="Background"
                  style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                />
                <button
                  onClick={removeBackground}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(239, 68, 68, 0.9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Options */}
        {videoFile && backgroundFile && (
          <div className="options">
            <h4 className="options-title">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {t('common.options')}
            </h4>

            <div className="option-group">
              <label className="option-label">{t('chromakey.chromaColor')}</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => setChromaColor('green')}
                  style={{
                    padding: '8px 16px',
                    background: chromaColor === 'green' ? '#00ff00' : 'var(--bg-secondary)',
                    color: chromaColor === 'green' ? '#000' : 'var(--text-primary)',
                    border: '2px solid #00ff00',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: chromaColor === 'green' ? 'bold' : 'normal'
                  }}
                >
                  {t('chromakey.greenScreen')}
                </button>
                <button
                  onClick={() => setChromaColor('blue')}
                  style={{
                    padding: '8px 16px',
                    background: chromaColor === 'blue' ? '#0000ff' : 'var(--bg-secondary)',
                    color: chromaColor === 'blue' ? '#fff' : 'var(--text-primary)',
                    border: '2px solid #0000ff',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: chromaColor === 'blue' ? 'bold' : 'normal'
                  }}
                >
                  {t('chromakey.blueScreen')}
                </button>
              </div>
            </div>

            <div className="option-group">
              <label className="option-label">{t('chromakey.similarity')}: {(similarity * 100).toFixed(0)}%</label>
              <input
                type="range"
                className="option-slider"
                min="0.01"
                max="0.9"
                step="0.01"
                value={similarity}
                onChange={(e) => setSimilarity(parseFloat(e.target.value))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span>{t('chromakey.strict')}</span>
                <span>{t('chromakey.loose')}</span>
              </div>
            </div>

            <div className="option-group">
              <label className="option-label">{t('chromakey.blend')}: {(blend * 100).toFixed(0)}%</label>
              <input
                type="range"
                className="option-slider"
                min="0"
                max="0.5"
                step="0.01"
                value={blend}
                onChange={(e) => setBlend(parseFloat(e.target.value))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span>{t('chromakey.sharp')}</span>
                <span>{t('chromakey.smooth')}</span>
              </div>
            </div>
          </div>
        )}

        {processing && (
          <div style={{ marginTop: '20px' }}>
            <ProgressBar progress={progress} />
            {progressText && (
              <p style={{ textAlign: 'center', marginTop: '10px', color: 'var(--text-secondary)' }}>
                {progressText}
              </p>
            )}
          </div>
        )}
        <ErrorDisplay error={error} />

        {/* Result Preview */}
        {resultPreview && (
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>
              {t('chromakey.result')}
            </h4>
            <video
              ref={resultVideoRef}
              src={resultPreview}
              style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              controls
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button className="convert-button" onClick={handleDownload}>
                {t('chromakey.downloadResult')}
              </button>
              <button
                className="convert-button"
                onClick={handleReset}
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                {t('common.reset')}
              </button>
            </div>
          </div>
        )}

        {/* Convert Button */}
        {videoFile && backgroundFile && !result && !processing && (
          <button
            className="convert-button"
            onClick={handleComposite}
            style={{ marginTop: '20px' }}
          >
            {t('chromakey.composite')}
          </button>
        )}
      </div>

      <div className="seo-content">
        <h2>{t('chromakey.video.whatIs')}</h2>
        <p>{t('chromakey.video.whatIsDesc')}</p>
        <h2>{t('whyUse.title')}</h2>
        <ul>
          <li><strong>{t('whyUse.free')}</strong></li>
          <li><strong>{t('whyUse.privacy')}</strong></li>
          <li><strong>{t('chromakey.features.realtime')}</strong></li>
          <li><strong>{t('chromakey.features.adjustable')}</strong></li>
        </ul>
      </div>
    </>
  );
};

export default VideoChromakey;
