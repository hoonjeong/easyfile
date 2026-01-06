import { useState, useCallback, useRef } from 'react';
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

const AudioConverter = () => {
  const { t } = useTranslation();
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
        setProgressText(`${t('media.converting')} ${percent}%`);
      });

      setProgressText(t('media.preparingFile'));
      setProgress(10);

      const inputName = 'input' + file.name.substring(file.name.lastIndexOf('.'));
      const outputName = `output.${outputFormat}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      setProgressText(t('media.converting'));

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

      setProgressText(t('media.creatingFile'));
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
      setProgressText(t('common.conversionComplete'));

      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch (err) {
      console.error(err);
      setError(t('media.audio.error'));
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
      <SEOHead title={t('media.audio.pageTitle')} description={t('media.audio.pageDescription')} keywords={t('media.audio.seoKeywords')} />

      <div className="page-header">
        <h1 className="page-title">{t('media.audio.pageTitle')}</h1>
        <p className="page-description">{t('media.audio.pageDescription')}</p>
      </div>

      <CoupangBanner type="top" />

      <div className="converter-card">
        {!file ? (
          <DropZone onFileSelect={handleFileSelect} acceptedTypes={['.m4a', '.aac', '.wav', '.ogg', '.flac', 'audio/*']} fileCategory="audio" />
        ) : (
          <>
            <FilePreview file={file} onRemove={handleRemoveFile} />

            <div className="options">
              <h4 className="options-title">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {t('common.options')}
              </h4>

              <div className="option-group">
                <label className="option-label">{t('common.outputFormat')}</label>
                <select className="option-select" value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)}>
                  <option value="mp3">{t('media.audio.mp3Recommended')}</option>
                  <option value="wav">{t('media.audio.wav')}</option>
                  <option value="ogg">{t('media.audio.ogg')}</option>
                </select>
              </div>

              {outputFormat !== 'wav' && (
                <div className="option-group">
                  <label className="option-label">{t('media.bitrate')}</label>
                  <select className="option-select" value={bitrate} onChange={(e) => setBitrate(e.target.value)}>
                    <option value="128">{t('media.bitrate128')}</option>
                    <option value="192">{t('media.bitrate192')}</option>
                    <option value="256">{t('media.bitrate256')}</option>
                    <option value="320">{t('media.bitrate320')}</option>
                  </select>
                </div>
              )}
            </div>

            {converting && <ProgressBar progress={progress} text={progressText} />}
            <ErrorDisplay error={error} />

            <ResultDisplay
              result={result}
              onDownload={handleDownload}
              downloadLabel={t('media.downloadFormat', { format: outputFormat.toUpperCase() })}
            />

            {!result && !converting && (
              <button className="convert-button" onClick={handleConvert} disabled={!file}>{t('media.convertToFormat', { format: outputFormat.toUpperCase() })}</button>
            )}
          </>
        )}
      </div>

      <div className="seo-content">
        <h2>{t('media.audio.whatIs')}</h2>
        <p>{t('media.audio.whatIsDesc')}</p>

        <h2>{t('media.audio.howToUse')}</h2>
        <ol>
          <li>{t('media.audio.step1')}</li>
          <li>{t('media.audio.step2')}</li>
          <li>{t('media.audio.step3')}</li>
          <li>{t('media.audio.step4')}</li>
        </ol>

        <h2>{t('media.audio.formatGuide')}</h2>
        <ul>
          <li><strong>{t('media.audio.mp3Guide')}</strong></li>
          <li><strong>{t('media.audio.wavGuide')}</strong></li>
          <li><strong>{t('media.audio.oggGuide')}</strong></li>
        </ul>

        <h2>{t('media.audio.bitrateGuide')}</h2>
        <ul>
          <li><strong>{t('media.audio.bitrate128Desc')}</strong></li>
          <li><strong>{t('media.audio.bitrate192Desc')}</strong></li>
          <li><strong>{t('media.audio.bitrate320Desc')}</strong></li>
        </ul>

        <h2>{t('media.audio.useCases')}</h2>
        <ul>
          <li><strong>{t('media.audio.useCase1')}</strong></li>
          <li><strong>{t('media.audio.useCase2')}</strong></li>
          <li><strong>{t('media.audio.useCase3')}</strong></li>
          <li><strong>{t('media.audio.useCase4')}</strong></li>
        </ul>

        <h2>{t('media.audio.features')}</h2>
        <ul>
          <li><strong>{t('media.audio.feature1')}</strong></li>
          <li><strong>{t('media.audio.feature2')}</strong></li>
          <li><strong>{t('media.audio.feature3')}</strong></li>
          <li><strong>{t('media.audio.feature4')}</strong></li>
        </ul>

        <h2>{t('media.audio.faq')}</h2>
        <h3>{t('media.audio.faq1Q')}</h3>
        <p>{t('media.audio.faq1A')}</p>
        <h3>{t('media.audio.faq2Q')}</h3>
        <p>{t('media.audio.faq2A')}</p>
        <h3>{t('media.audio.faq3Q')}</h3>
        <p>{t('media.audio.faq3A')}</p>
      </div>
    </>
  );
};

export default AudioConverter;
