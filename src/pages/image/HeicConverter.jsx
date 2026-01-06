import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import ErrorDisplay from '../../components/ErrorDisplay';
import ResultDisplay from '../../components/ResultDisplay';
import { convertHeic, createPreviewUrl, revokePreviewUrl } from '../../utils/imageConverter';
import { downloadFile, getFilenameWithNewExtension } from '../../utils/download';
import CoupangBanner from '../../components/CoupangBanner';

const HeicConverter = () => {
  const { t } = useTranslation();
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
      setProgress(30);
      const convertedBlob = await convertHeic(file, outputFormat, quality / 100);
      setProgress(80);
      setPreviewUrl(createPreviewUrl(convertedBlob));
      setResult(convertedBlob);
      setProgress(100);
    } catch (err) {
      console.error(err);
      setError(t('image.heic.error'));
    } finally {
      setConverting(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const extension = outputFormat === 'image/jpeg' ? 'jpg' : 'png';
    downloadFile(result, getFilenameWithNewExtension(file.name, extension));
  };

  return (
    <>
      <SEOHead title={t('image.heic.pageTitle')} description={t('image.heic.pageDescription')} keywords={t('image.heic.seoKeywords')} />

      <div className="page-header">
        <h1 className="page-title">{t('image.heic.pageTitle')}</h1>
        <p className="page-description">{t('image.heic.pageDescription')}</p>
      </div>

      <CoupangBanner type="top" />

      <div className="converter-card">
        {!file ? (
          <DropZone onFileSelect={handleFileSelect} acceptedTypes={['.heic', '.heif', 'image/heic', 'image/heif']} fileCategory="heic" />
        ) : (
          <>
            <FilePreview file={file} previewUrl={previewUrl} onRemove={handleRemoveFile} />

            <div className="options">
              <h4 className="options-title">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {t('common.options')}
              </h4>
              <div className="option-group">
                <label className="option-label">{t('common.outputFormat')}</label>
                <select className="option-select" value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)}>
                  <option value="image/jpeg">{t('image.jpgRecommended')}</option>
                  <option value="image/png">{t('image.pngTransparent')}</option>
                </select>
              </div>
              <div className="option-group">
                <label className="option-label">{t('common.quality')}: {quality}%</label>
                <input type="range" className="option-slider" min="10" max="100" value={quality} onChange={(e) => setQuality(Number(e.target.value))} />
              </div>
            </div>

            {converting && <ProgressBar progress={progress} />}
            <ErrorDisplay error={error} />
            <ResultDisplay
              result={result}
              onDownload={handleDownload}
              downloadLabel={outputFormat === 'image/jpeg' ? t('image.downloadJpg') : t('image.downloadPng')}
            />

            {!result && !converting && (
              <button className="convert-button" onClick={handleConvert} disabled={!file}>{outputFormat === 'image/jpeg' ? t('image.convertToJpg') : t('image.convertToPng')}</button>
            )}
          </>
        )}
      </div>

      <div className="seo-content">
        <h2>{t('image.heic.whatIs')}</h2>
        <p>{t('image.heic.whatIsDesc')}</p>

        <h2>{t('image.heic.whyConvert')}</h2>
        <p>{t('image.heic.whyConvertDesc')}</p>
        <ul>
          <li><strong>{t('image.heic.whyConvertReason1')}</strong></li>
          <li><strong>{t('image.heic.whyConvertReason2')}</strong></li>
          <li><strong>{t('image.heic.whyConvertReason3')}</strong></li>
          <li><strong>{t('image.heic.whyConvertReason4')}</strong></li>
        </ul>

        <h2>{t('image.heic.howToUse')}</h2>
        <ol>
          <li>{t('image.heic.step1')}</li>
          <li>{t('image.heic.step2')}</li>
          <li>{t('image.heic.step3')}</li>
          <li>{t('image.heic.step4')}</li>
        </ol>

        <h2>{t('image.heic.jpgVsPng')}</h2>
        <p>{t('image.heic.jpgVsPngDesc')}</p>
        <ul>
          <li><strong>{t('image.heic.jpgAdvantage')}</strong></li>
          <li><strong>{t('image.heic.pngAdvantage')}</strong></li>
        </ul>

        <h2>{t('image.heic.features')}</h2>
        <ul>
          <li><strong>{t('image.heic.feature1')}</strong></li>
          <li><strong>{t('image.heic.feature2')}</strong></li>
          <li><strong>{t('image.heic.feature3')}</strong></li>
          <li><strong>{t('image.heic.feature4')}</strong></li>
        </ul>

        <h2>{t('image.heic.faq')}</h2>
        <h3>{t('image.heic.faq1Q')}</h3>
        <p>{t('image.heic.faq1A')}</p>
        <h3>{t('image.heic.faq2Q')}</h3>
        <p>{t('image.heic.faq2A')}</p>
        <h3>{t('image.heic.faq3Q')}</h3>
        <p>{t('image.heic.faq3A')}</p>
      </div>
    </>
  );
};

export default HeicConverter;
