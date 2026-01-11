import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/SEOHead';
import DropZone from '../../components/DropZone';
import FilePreview from '../../components/FilePreview';
import ProgressBar from '../../components/ProgressBar';
import ErrorDisplay from '../../components/ErrorDisplay';
import ResultDisplay from '../../components/ResultDisplay';
import { convertIcoToPng, createPreviewUrl, revokePreviewUrl } from '../../utils/imageConverter';
import { downloadFile, getFilenameWithNewExtension } from '../../utils/download';
import CoupangBanner from '../../components/CoupangBanner';
import Breadcrumb from '../../components/Breadcrumb';

const IcoConverter = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = useCallback((selectedFile) => {
    if (previewUrl) revokePreviewUrl(previewUrl);
    const url = createPreviewUrl(selectedFile);
    setFile(selectedFile);
    setPreviewUrl(url);
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
      const convertedBlob = await convertIcoToPng(file);
      setProgress(80);

      if (previewUrl) revokePreviewUrl(previewUrl);
      const newPreviewUrl = createPreviewUrl(convertedBlob);
      setPreviewUrl(newPreviewUrl);
      setResult(convertedBlob);
      setProgress(100);
    } catch (err) {
      console.error(err);
      setError(t('image.ico.error'));
    } finally {
      setConverting(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const filename = getFilenameWithNewExtension(file.name, 'png');
    downloadFile(result, filename);
  };

  return (
    <>
      <SEOHead title={t('image.ico.pageTitle')} description={t('image.ico.pageDescription')} keywords={t('image.ico.seoKeywords')} />

      <Breadcrumb category="image" currentPage={t('image.ico.title')} />

      <div className="page-header">
        <h1 className="page-title">{t('image.ico.pageTitle')}</h1>
        <p className="page-description">{t('image.ico.pageDescription')}</p>
      </div>

      <CoupangBanner type="top" />

      <div className="converter-card">
        {!file ? (
          <DropZone onFileSelect={handleFileSelect} acceptedTypes={['.ico', 'image/x-icon', 'image/vnd.microsoft.icon']} fileCategory="ico" />
        ) : (
          <>
            <FilePreview file={file} previewUrl={previewUrl} onRemove={handleRemoveFile} />

            {converting && <ProgressBar progress={progress} />}
            <ErrorDisplay error={error} />
            <ResultDisplay
              result={result}
              onDownload={handleDownload}
              downloadLabel={t('image.downloadPng')}
            />

            {!result && !converting && (
              <button className="convert-button" onClick={handleConvert} disabled={!file}>{t('image.convertToPng')}</button>
            )}
          </>
        )}
      </div>

      <div className="seo-content">
        <h2>{t('image.ico.whatIs')}</h2>
        <p>{t('image.ico.whatIsDesc')}</p>

        <h2>{t('image.ico.whyConvert')}</h2>
        <p>{t('image.ico.whyConvertDesc')}</p>
        <ul>
          <li><strong>{t('image.ico.whyConvertReason1')}</strong></li>
          <li><strong>{t('image.ico.whyConvertReason2')}</strong></li>
          <li><strong>{t('image.ico.whyConvertReason3')}</strong></li>
          <li><strong>{t('image.ico.whyConvertReason4')}</strong></li>
        </ul>

        <h2>{t('image.ico.howToUse')}</h2>
        <ol>
          <li>{t('image.ico.step1')}</li>
          <li>{t('image.ico.step2')}</li>
          <li>{t('image.ico.step3')}</li>
          <li>{t('image.ico.step4')}</li>
        </ol>

        <h2>{t('image.ico.features')}</h2>
        <ul>
          <li><strong>{t('image.ico.feature1')}</strong></li>
          <li><strong>{t('image.ico.feature2')}</strong></li>
          <li><strong>{t('image.ico.feature3')}</strong></li>
          <li><strong>{t('image.ico.feature4')}</strong></li>
        </ul>

        <h2>{t('image.ico.faq')}</h2>
        <h3>{t('image.ico.faq1Q')}</h3>
        <p>{t('image.ico.faq1A')}</p>
        <h3>{t('image.ico.faq2Q')}</h3>
        <p>{t('image.ico.faq2A')}</p>
        <h3>{t('image.ico.faq3Q')}</h3>
        <p>{t('image.ico.faq3A')}</p>
      </div>
    </>
  );
};

export default IcoConverter;
