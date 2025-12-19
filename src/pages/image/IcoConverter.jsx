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

      <div className="page-header">
        <h1 className="page-title">{t('image.ico.pageTitle')}</h1>
        <p className="page-description">{t('image.ico.pageDescription')}</p>
      </div>

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

export default IcoConverter;
