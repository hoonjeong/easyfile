import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/SEOHead';

const MediaIndex = () => {
  const { t } = useTranslation();

  const converters = [
    { path: '/media/m4a-to-mp3', titleKey: 'media.audio.title', descKey: 'media.audio.description', tags: ['M4A', 'AAC', 'MP3', 'iPhone'], icon: '🎵' },
    { path: '/media/webm-to-mp4', titleKey: 'media.video.title', descKey: 'media.video.description', tags: ['WebM', 'MP4'], icon: '🎬' },
    { path: '/media/gif-to-mp4', titleKey: 'media.gif.title', descKey: 'media.gif.description', tags: ['GIF', 'MP4'], icon: '🎞️' }
  ];

  return (
    <>
      <SEOHead title={t('media.pageTitle')} description={t('media.pageDescription')} keywords="media converter, M4A converter, WebM converter, GIF converter, audio converter, video converter, online media converter" />

      <div className="page-header">
        <h1 className="page-title">{t('media.pageTitle')}</h1>
        <p className="page-description">{t('media.pageDescription')}</p>
      </div>

      <div className="categories" style={{ marginTop: '20px' }}>
        {converters.map((converter) => (
          <Link key={converter.path} to={converter.path} className="category-card" style={{ textDecoration: 'none' }}>
            <div className="category-icon media">{converter.icon}</div>
            <h3 className="category-title">{t(converter.titleKey)}</h3>
            <p className="category-description">{t(converter.descKey)}</p>
            <div className="converter-list">
              {converter.tags.map((tag) => (<span key={tag} className="converter-tag">{tag}</span>))}
            </div>
          </Link>
        ))}
      </div>

      <div className="seo-content">
        <h2>{t('whyUse.title')}</h2>
        <ul>
          <li><strong>{t('whyUse.free')}</strong></li>
          <li><strong>{t('whyUse.privacy')}</strong></li>
          <li><strong>{t('whyUse.fast')}</strong></li>
        </ul>
      </div>
    </>
  );
};

export default MediaIndex;
