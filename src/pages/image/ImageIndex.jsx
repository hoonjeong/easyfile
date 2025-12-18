import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/SEOHead';

const ImageIndex = () => {
  const { t } = useTranslation();

  const converters = [
    { path: '/image/heic-to-jpg', titleKey: 'image.heic.title', descKey: 'image.heic.description', tags: ['HEIC', 'HEIF', 'iPhone', 'JPG', 'PNG'], icon: '📱' },
    { path: '/image/webp-to-jpg', titleKey: 'image.webp.title', descKey: 'image.webp.description', tags: ['WebP', 'JPG', 'PNG', 'Google'], icon: '🌐' },
    { path: '/image/psd-to-jpg', titleKey: 'image.psd.title', descKey: 'image.psd.description', tags: ['PSD', 'Photoshop', 'JPG', 'PNG'], icon: '🎨' },
    { path: '/image/tiff-to-jpg', titleKey: 'image.tiff.title', descKey: 'image.tiff.description', tags: ['TIFF', 'TIF', 'JPG', 'PNG'], icon: '🖼️' },
    { path: '/image/svg-to-png', titleKey: 'image.svg.title', descKey: 'image.svg.description', tags: ['SVG', 'PNG'], icon: '✨' },
    { path: '/image/ico-to-png', titleKey: 'image.ico.title', descKey: 'image.ico.description', tags: ['ICO', 'PNG'], icon: '🔷' }
  ];

  return (
    <>
      <SEOHead title={t('image.seoTitle')} description={t('image.seoDescription')} keywords="image converter, HEIC converter, WebP converter, PSD converter, TIFF converter, SVG converter, ICO converter, online image converter" />

      <div className="page-header">
        <h1 className="page-title">{t('image.pageTitle')}</h1>
        <p className="page-description">{t('image.pageDescription')}</p>
      </div>

      <div className="categories" style={{ marginTop: '20px' }}>
        {converters.map((converter) => (
          <Link key={converter.path} to={converter.path} className="category-card" style={{ textDecoration: 'none' }}>
            <div className="category-icon image">{converter.icon}</div>
            <h3 className="category-title">{t(converter.titleKey)}</h3>
            <p className="category-description">{t(converter.descKey)}</p>
            <div className="converter-list">
              {converter.tags.map((tag) => (<span key={tag} className="converter-tag">{tag}</span>))}
            </div>
          </Link>
        ))}
      </div>

      <div className="seo-content">
        <h2>{t('image.features.title')}</h2>
        <ul>
          <li><strong>{t('image.features.free')}</strong></li>
          <li><strong>{t('image.features.secure')}</strong></li>
          <li><strong>{t('image.features.fast')}</strong></li>
          <li><strong>{t('image.features.quality')}</strong></li>
          <li><strong>{t('image.features.formats')}</strong></li>
        </ul>
      </div>
    </>
  );
};

export default ImageIndex;
