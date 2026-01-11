import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchFile } from '@ffmpeg/util';
import SEOHead from '../../components/SEOHead';
import ProgressBar from '../../components/ProgressBar';
import ErrorDisplay from '../../components/ErrorDisplay';
import { downloadFile } from '../../utils/download';
import useFFmpeg from '../../hooks/useFFmpeg';
import CoupangBanner from '../../components/CoupangBanner';
import Breadcrumb from '../../components/Breadcrumb';

const VideoChromakey = () => {
  const { t } = useTranslation();
  const { ffmpeg, loadFFmpeg, setProgressHandler } = useFFmpeg();

  const [videoFile, setVideoFile] = useState(null);
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [chromaColor, setChromaColor] = useState('green');
  const [detectedColor, setDetectedColor] = useState(null);
  const [isAutoDetect, setIsAutoDetect] = useState(true);
  const [detecting, setDetecting] = useState(false);
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

  const rgbToHex = (r, g, b) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const colorDistance = (r1, g1, b1, r2, g2, b2) => {
    return Math.sqrt(
      Math.pow(r1 - r2, 2) +
      Math.pow(g1 - g2, 2) +
      Math.pow(b1 - b2, 2)
    );
  };

  // Auto detect chromakey color from video first frame
  const detectChromaColor = useCallback(async (videoUrl) => {
    setDetecting(true);
    try {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;

      await new Promise((resolve, reject) => {
        video.onloadeddata = resolve;
        video.onerror = reject;
        video.src = videoUrl;
        video.load();
      });

      // Seek to first frame
      video.currentTime = 0;
      await new Promise((resolve) => {
        video.onseeked = resolve;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;

      // Sample pixels from edges
      const edgePixels = [];
      const sampleSize = Math.min(50, Math.floor(width / 10), Math.floor(height / 10));

      // Top edge
      for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 100))) {
        for (let y = 0; y < sampleSize; y++) {
          const i = (y * width + x) * 4;
          edgePixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
        }
      }

      // Bottom edge
      for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 100))) {
        for (let y = height - sampleSize; y < height; y++) {
          const i = (y * width + x) * 4;
          edgePixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
        }
      }

      // Left edge
      for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 100))) {
        for (let x = 0; x < sampleSize; x++) {
          const i = (y * width + x) * 4;
          edgePixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
        }
      }

      // Right edge
      for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 100))) {
        for (let x = width - sampleSize; x < width; x++) {
          const i = (y * width + x) * 4;
          edgePixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
        }
      }

      // Four corners (more weight)
      const cornerSize = Math.min(30, Math.floor(width / 20), Math.floor(height / 20));
      const corners = [
        { startX: 0, startY: 0 },
        { startX: width - cornerSize, startY: 0 },
        { startX: 0, startY: height - cornerSize },
        { startX: width - cornerSize, startY: height - cornerSize }
      ];

      for (const corner of corners) {
        for (let y = corner.startY; y < corner.startY + cornerSize; y++) {
          for (let x = corner.startX; x < corner.startX + cornerSize; x++) {
            const i = (y * width + x) * 4;
            edgePixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
            edgePixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
          }
        }
      }

      // Find the most common color using color clustering
      const colorGroups = [];
      const groupDistance = 40;

      for (const pixel of edgePixels) {
        let foundGroup = false;
        for (const group of colorGroups) {
          if (colorDistance(pixel.r, pixel.g, pixel.b, group.r, group.g, group.b) < groupDistance) {
            group.count++;
            group.totalR += pixel.r;
            group.totalG += pixel.g;
            group.totalB += pixel.b;
            group.r = Math.round(group.totalR / group.count);
            group.g = Math.round(group.totalG / group.count);
            group.b = Math.round(group.totalB / group.count);
            foundGroup = true;
            break;
          }
        }
        if (!foundGroup) {
          colorGroups.push({
            r: pixel.r,
            g: pixel.g,
            b: pixel.b,
            totalR: pixel.r,
            totalG: pixel.g,
            totalB: pixel.b,
            count: 1
          });
        }
      }

      colorGroups.sort((a, b) => b.count - a.count);

      if (colorGroups.length > 0) {
        const dominantColor = colorGroups[0];
        const hex = rgbToHex(dominantColor.r, dominantColor.g, dominantColor.b);
        setDetectedColor(hex);
        if (isAutoDetect) {
          setChromaColor(hex);
        }
      }
    } catch (err) {
      console.error('Color detection error:', err);
    } finally {
      setDetecting(false);
    }
  }, [isAutoDetect]);

  const handleVideoSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (videoPreview) URL.revokeObjectURL(videoPreview);
    const previewUrl = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoPreview(previewUrl);
    setResult(null);
    setResultPreview(null);
    setError(null);
    setDetectedColor(null);

    // Auto detect color
    detectChromaColor(previewUrl);
  }, [videoPreview, detectChromaColor]);

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
    setDetectedColor(null);
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
      if (chromaColor === 'green') {
        colorKey = '0x00FF00';
      } else if (chromaColor === 'blue') {
        colorKey = '0x0000FF';
      } else {
        colorKey = chromaColor.replace('#', '0x').toUpperCase();
      }

      // Run FFmpeg with chromakey filter
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

  const handleAutoDetectToggle = () => {
    setIsAutoDetect(!isAutoDetect);
    if (!isAutoDetect && detectedColor) {
      setChromaColor(detectedColor);
    }
  };

  return (
    <>
      <SEOHead
        title={t('chromakey.video.pageTitle')}
        description={t('chromakey.video.pageDescription')}
        keywords={t('chromakey.video.seoKeywords')}
      />

      <Breadcrumb category="chromakey" currentPage={t('chromakey.video.title')} />

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
                {detecting && (
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {t('chromakey.detecting')}...
                  </div>
                )}
                {detectedColor && !detecting && (
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '3px',
                      background: detectedColor,
                      border: '1px solid white'
                    }} />
                    {t('chromakey.detected')}
                  </div>
                )}
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
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={handleAutoDetectToggle}
                  style={{
                    padding: '8px 16px',
                    background: isAutoDetect ? 'var(--primary-color)' : 'var(--bg-secondary)',
                    color: isAutoDetect ? '#fff' : 'var(--text-primary)',
                    border: '2px solid var(--primary-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: isAutoDetect ? 'bold' : 'normal',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {detectedColor && (
                    <span style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '3px',
                      background: detectedColor,
                      border: '1px solid rgba(255,255,255,0.5)'
                    }} />
                  )}
                  {t('chromakey.autoDetect')}
                </button>
                <button
                  onClick={() => { setIsAutoDetect(false); setChromaColor('green'); }}
                  style={{
                    padding: '8px 16px',
                    background: !isAutoDetect && chromaColor === 'green' ? '#00ff00' : 'var(--bg-secondary)',
                    color: !isAutoDetect && chromaColor === 'green' ? '#000' : 'var(--text-primary)',
                    border: '2px solid #00ff00',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: !isAutoDetect && chromaColor === 'green' ? 'bold' : 'normal'
                  }}
                >
                  {t('chromakey.greenScreen')}
                </button>
                <button
                  onClick={() => { setIsAutoDetect(false); setChromaColor('blue'); }}
                  style={{
                    padding: '8px 16px',
                    background: !isAutoDetect && chromaColor === 'blue' ? '#0000ff' : 'var(--bg-secondary)',
                    color: !isAutoDetect && chromaColor === 'blue' ? '#fff' : 'var(--text-primary)',
                    border: '2px solid #0000ff',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: !isAutoDetect && chromaColor === 'blue' ? 'bold' : 'normal'
                  }}
                >
                  {t('chromakey.blueScreen')}
                </button>
                {isAutoDetect && detectedColor && (
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                    {detectedColor.toUpperCase()}
                  </span>
                )}
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

        <h2>{t('chromakey.video.whyUse')}</h2>
        <p>{t('chromakey.video.whyUseDesc')}</p>
        <ul>
          <li><strong>{t('chromakey.video.whyUseReason1')}</strong></li>
          <li><strong>{t('chromakey.video.whyUseReason2')}</strong></li>
          <li><strong>{t('chromakey.video.whyUseReason3')}</strong></li>
          <li><strong>{t('chromakey.video.whyUseReason4')}</strong></li>
        </ul>

        <h2>{t('chromakey.video.howToUse')}</h2>
        <ol>
          <li>{t('chromakey.video.step1')}</li>
          <li>{t('chromakey.video.step2')}</li>
          <li>{t('chromakey.video.step3')}</li>
          <li>{t('chromakey.video.step4')}</li>
        </ol>

        <h2>{t('chromakey.video.features')}</h2>
        <ul>
          <li><strong>{t('chromakey.video.feature1')}</strong></li>
          <li><strong>{t('chromakey.video.feature2')}</strong></li>
          <li><strong>{t('chromakey.video.feature3')}</strong></li>
          <li><strong>{t('chromakey.video.feature4')}</strong></li>
        </ul>

        <h2>{t('chromakey.video.faq')}</h2>
        <h3>{t('chromakey.video.faq1Q')}</h3>
        <p>{t('chromakey.video.faq1A')}</p>
        <h3>{t('chromakey.video.faq2Q')}</h3>
        <p>{t('chromakey.video.faq2A')}</p>
        <h3>{t('chromakey.video.faq3Q')}</h3>
        <p>{t('chromakey.video.faq3A')}</p>
      </div>
    </>
  );
};

export default VideoChromakey;
