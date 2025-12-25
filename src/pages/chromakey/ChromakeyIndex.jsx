import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/SEOHead';
import CoupangBanner from '../../components/CoupangBanner';

const ChromakeyIndex = () => {
  const { t } = useTranslation();

  const tools = [
    {
      path: '/chromakey/background-removal',
      titleKey: 'bgRemoval.title',
      descKey: 'bgRemoval.description',
      tags: ['AI', 'PNG', 'JPG', 'Transparent'],
      icon: '✨'
    },
    {
      path: '/chromakey/image',
      titleKey: 'chromakey.image.title',
      descKey: 'chromakey.image.description',
      tags: ['JPG', 'PNG', 'WebP', 'Green Screen'],
      icon: '🖼️'
    },
    {
      path: '/chromakey/video',
      titleKey: 'chromakey.video.title',
      descKey: 'chromakey.video.description',
      tags: ['MP4', 'WebM', 'Green Screen'],
      icon: '🎬'
    }
  ];

  return (
    <>
      <SEOHead
        title={t('chromakey.seoTitle')}
        description={t('chromakey.seoDescription')}
        keywords="chromakey, green screen, background removal, video compositing, image compositing, chroma key online"
      />

      <div className="page-header">
        <h1 className="page-title">{t('chromakey.pageTitle')}</h1>
        <p className="page-description">{t('chromakey.pageDescription')}</p>
      </div>

      <CoupangBanner />

      <div className="categories" style={{ marginTop: '20px' }}>
        {tools.map((tool) => (
          <Link key={tool.path} to={tool.path} className="category-card" style={{ textDecoration: 'none' }}>
            <div className="category-icon media">{tool.icon}</div>
            <h3 className="category-title">{t(tool.titleKey)}</h3>
            <p className="category-description">{t(tool.descKey)}</p>
            <div className="converter-list">
              {tool.tags.map((tag) => (<span key={tag} className="converter-tag">{tag}</span>))}
            </div>
          </Link>
        ))}
      </div>

      <div className="seo-content">
        <h2>{t('chromakey.features.title')}</h2>
        <ul>
          <li><strong>{t('chromakey.features.free')}</strong></li>
          <li><strong>{t('chromakey.features.secure')}</strong></li>
          <li><strong>{t('chromakey.features.realtime')}</strong></li>
          <li><strong>{t('chromakey.features.adjustable')}</strong></li>
          <li><strong>{t('chromakey.features.formats')}</strong></li>
        </ul>
      </div>
    </>
  );
};

export default ChromakeyIndex;
