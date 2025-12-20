import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEOHead from '../components/SEOHead';

const Home = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const categories = [
    {
      id: 'pdf',
      titleKey: 'categories.pdf.title',
      descriptionKey: 'categories.pdf.description',
      icon: '📑',
      iconClass: 'pdf',
      path: '/pdf',
      converters: [
        { name: 'PDF → Image', path: '/pdf/pdf-to-image' },
        { name: 'PDF → Text', path: '/pdf/pdf-to-text' },
        { name: 'Merge', path: '/pdf/merge' },
        { name: 'Split', path: '/pdf/split' },
        { name: 'Extract', path: '/pdf/extract' },
        { name: 'Rotate', path: '/pdf/rotate' },
      ]
    },
    {
      id: 'image',
      titleKey: 'categories.image.title',
      descriptionKey: 'categories.image.description',
      icon: '🖼️',
      iconClass: 'image',
      path: '/image',
      converters: [
        { name: 'HEIC → JPG', path: '/image/heic-to-jpg' },
        { name: 'WebP → JPG', path: '/image/webp-to-jpg' },
        { name: 'PSD → PNG', path: '/image/psd-to-jpg' },
        { name: 'TIFF → JPG', path: '/image/tiff-to-jpg' },
        { name: 'SVG → PNG', path: '/image/svg-to-png' },
        { name: 'ICO → PNG', path: '/image/ico-to-png' },
      ]
    },
    {
      id: 'document',
      titleKey: 'categories.document.title',
      descriptionKey: 'categories.document.description',
      icon: '📄',
      iconClass: 'document',
      path: '/document',
      converters: [
        { name: 'Excel → JSON', path: '/document/excel-to-json' },
        { name: 'Excel → CSV', path: '/document/excel-to-json' },
        { name: 'Markdown → HTML', path: '/document/markdown-to-html' },
        { name: 'LaTeX → PNG', path: '/document/latex-to-image' },
      ]
    },
    {
      id: 'media',
      titleKey: 'categories.media.title',
      descriptionKey: 'categories.media.description',
      icon: '🎬',
      iconClass: 'media',
      path: '/media',
      converters: [
        { name: 'M4A → MP3', path: '/media/m4a-to-mp3' },
        { name: 'WebM → MP4', path: '/media/webm-to-mp4' },
        { name: 'GIF → MP4', path: '/media/gif-to-mp4' },
      ]
    },
    {
      id: 'address',
      titleKey: 'categories.address.title',
      descriptionKey: 'categories.address.description',
      icon: '📮',
      iconClass: 'address',
      path: '/address',
      converters: [
        { name: 'Amazon', path: '/address' },
        { name: 'AliExpress', path: '/address' },
        { name: 'iHerb', path: '/address' },
        { name: 'eBay', path: '/address' },
      ]
    },
    {
      id: 'games',
      titleKey: 'categories.games.title',
      descriptionKey: 'categories.games.description',
      icon: '🎮',
      iconClass: 'games',
      path: 'https://shortgames.kr/',
      external: true,
      converters: []
    }
  ];

  const features = [
    {
      icon: (
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      titleKey: 'features.privacy',
      descriptionKey: 'features.privacyDesc'
    },
    {
      icon: (
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      titleKey: 'features.fast',
      descriptionKey: 'features.fastDesc'
    },
    {
      icon: (
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      titleKey: 'features.free',
      descriptionKey: 'features.freeDesc'
    },
    {
      icon: (
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      titleKey: 'features.noInstall',
      descriptionKey: 'features.noInstallDesc'
    }
  ];

  return (
    <>
      <SEOHead
        title={t('home.seoTitle')}
        description={t('home.seoDescription')}
        keywords="file converter, HEIC converter, WebP converter, Excel converter, online converter, free file converter, image converter, document converter"
      />

      <section className="hero">
        <span className="hero-badge">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          {t('home.heroBadge')}
        </span>
        <h1 className="hero-title">
          {t('home.heroTitle')}<br />
          <span style={{ background: 'linear-gradient(135deg, #4F46E5, #10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {t('home.heroTitleHighlight')}
          </span>
        </h1>
        <p className="hero-subtitle">
          {t('home.heroSubtitle')}
        </p>
      </section>

      <section className="categories">
        {categories.map((category) => (
          category.external ? (
            <a
              key={category.id}
              href={category.path}
              target="_blank"
              rel="noopener noreferrer"
              className="category-card"
              style={{ textDecoration: 'none', cursor: 'pointer' }}
            >
              <div className={`category-icon ${category.iconClass}`}>
                {category.icon}
              </div>
              <h2 className="category-title">{t(category.titleKey)}</h2>
              <p className="category-description">{t(category.descriptionKey)}</p>
            </a>
          ) : (
            <Link
              key={category.id}
              to={category.path}
              className="category-card"
              style={{ textDecoration: 'none', cursor: 'pointer' }}
            >
              <div className={`category-icon ${category.iconClass}`}>
                {category.icon}
              </div>
              <h2 className="category-title">{t(category.titleKey)}</h2>
              <p className="category-description">{t(category.descriptionKey)}</p>
              <div className="converter-list">
                {category.converters.map((converter) => (
                  <span
                    key={converter.path + converter.name}
                    className="converter-tag"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(converter.path);
                    }}
                  >
                    {converter.name}
                  </span>
                ))}
              </div>
            </Link>
          )
        ))}
      </section>

      <section className="features">
        {features.map((feature, index) => (
          <div key={index} className="feature">
            <div className="feature-icon">{feature.icon}</div>
            <h3 className="feature-title">{t(feature.titleKey)}</h3>
            <p className="feature-text">{t(feature.descriptionKey)}</p>
          </div>
        ))}
      </section>

      <section className="seo-content">
        <h2>{t('home.whatIsEasyFile')}</h2>
        <p>{t('home.whatIsEasyFileDesc')}</p>

        <h2>{t('home.whyUseEasyFile')}</h2>
        <ul>
          <li><strong>{t('home.privacyTitle')}</strong> - {t('home.privacyDesc')}</li>
          <li><strong>{t('home.freeTitle')}</strong> - {t('home.freeDesc')}</li>
          <li><strong>{t('home.noInstallTitle')}</strong> - {t('home.noInstallDesc')}</li>
          <li><strong>{t('home.fastTitle')}</strong> - {t('home.fastDesc')}</li>
        </ul>

        <h2>{t('home.supportedFormats')}</h2>
        <p>
          <strong>Image:</strong> HEIC → JPG/PNG, WebP → JPG/PNG, PSD → JPG/PNG, TIFF → JPG/PNG, SVG → PNG, ICO → PNG
        </p>
        <p>
          <strong>Document:</strong> Excel → JSON/CSV/HTML, Markdown → HTML, LaTeX → PNG/SVG
        </p>
        <p>
          <strong>Media:</strong> M4A → MP3, WebM → MP4, GIF → MP4
        </p>
        <p>
          <strong>PDF:</strong> PDF → Image, PDF → Text, Merge, Split, Extract, Delete, Reorder, Rotate
        </p>
      </section>
    </>
  );
};

export default Home;
