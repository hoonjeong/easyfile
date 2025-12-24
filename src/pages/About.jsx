import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEOHead from '../components/SEOHead';
import CoupangBanner from '../components/CoupangBanner';

const About = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      titleKey: 'about.features.privacy.title',
      descKey: 'about.features.privacy.desc',
      color: '#10B981'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
      titleKey: 'about.features.fast.title',
      descKey: 'about.features.fast.desc',
      color: '#F59E0B'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      titleKey: 'about.features.free.title',
      descKey: 'about.features.free.desc',
      color: '#4F46E5'
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
      ),
      titleKey: 'about.features.noInstall.title',
      descKey: 'about.features.noInstall.desc',
      color: '#EC4899'
    }
  ];

  const toolGuides = [
    {
      category: 'pdf',
      icon: '📄',
      color: '#EF4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      tools: [
        { path: '/pdf/pdf-to-image', nameKey: 'about.guide.pdf.toImage.name', descKey: 'about.guide.pdf.toImage.desc', steps: 'about.guide.pdf.toImage.steps' },
        { path: '/pdf/pdf-to-text', nameKey: 'about.guide.pdf.toText.name', descKey: 'about.guide.pdf.toText.desc', steps: 'about.guide.pdf.toText.steps' },
        { path: '/pdf/merge', nameKey: 'about.guide.pdf.merge.name', descKey: 'about.guide.pdf.merge.desc', steps: 'about.guide.pdf.merge.steps' },
        { path: '/pdf/split', nameKey: 'about.guide.pdf.split.name', descKey: 'about.guide.pdf.split.desc', steps: 'about.guide.pdf.split.steps' },
        { path: '/pdf/extract', nameKey: 'about.guide.pdf.extract.name', descKey: 'about.guide.pdf.extract.desc', steps: 'about.guide.pdf.extract.steps' },
        { path: '/pdf/delete', nameKey: 'about.guide.pdf.delete.name', descKey: 'about.guide.pdf.delete.desc', steps: 'about.guide.pdf.delete.steps' },
        { path: '/pdf/reorder', nameKey: 'about.guide.pdf.reorder.name', descKey: 'about.guide.pdf.reorder.desc', steps: 'about.guide.pdf.reorder.steps' },
        { path: '/pdf/rotate', nameKey: 'about.guide.pdf.rotate.name', descKey: 'about.guide.pdf.rotate.desc', steps: 'about.guide.pdf.rotate.steps' },
        { path: '/pdf/compress', nameKey: 'about.guide.pdf.compress.name', descKey: 'about.guide.pdf.compress.desc', steps: 'about.guide.pdf.compress.steps' }
      ]
    },
    {
      category: 'image',
      icon: '🖼️',
      color: '#4F46E5',
      bgColor: 'rgba(79, 70, 229, 0.1)',
      tools: [
        { path: '/image/heic-to-jpg', nameKey: 'about.guide.image.heic.name', descKey: 'about.guide.image.heic.desc', steps: 'about.guide.image.heic.steps' },
        { path: '/image/webp-to-jpg', nameKey: 'about.guide.image.webp.name', descKey: 'about.guide.image.webp.desc', steps: 'about.guide.image.webp.steps' },
        { path: '/image/psd-to-jpg', nameKey: 'about.guide.image.psd.name', descKey: 'about.guide.image.psd.desc', steps: 'about.guide.image.psd.steps' },
        { path: '/image/tiff-to-jpg', nameKey: 'about.guide.image.tiff.name', descKey: 'about.guide.image.tiff.desc', steps: 'about.guide.image.tiff.steps' },
        { path: '/image/svg-to-png', nameKey: 'about.guide.image.svg.name', descKey: 'about.guide.image.svg.desc', steps: 'about.guide.image.svg.steps' },
        { path: '/image/ico-to-png', nameKey: 'about.guide.image.ico.name', descKey: 'about.guide.image.ico.desc', steps: 'about.guide.image.ico.steps' },
        { path: '/image/compress', nameKey: 'about.guide.image.compress.name', descKey: 'about.guide.image.compress.desc', steps: 'about.guide.image.compress.steps' }
      ]
    },
    {
      category: 'document',
      icon: '📝',
      color: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      tools: [
        { path: '/document/excel-to-json', nameKey: 'about.guide.document.excel.name', descKey: 'about.guide.document.excel.desc', steps: 'about.guide.document.excel.steps' },
        { path: '/document/markdown-to-html', nameKey: 'about.guide.document.markdown.name', descKey: 'about.guide.document.markdown.desc', steps: 'about.guide.document.markdown.steps' },
        { path: '/document/latex-to-image', nameKey: 'about.guide.document.latex.name', descKey: 'about.guide.document.latex.desc', steps: 'about.guide.document.latex.steps' }
      ]
    },
    {
      category: 'media',
      icon: '🎵',
      color: '#F59E0B',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      tools: [
        { path: '/media/m4a-to-mp3', nameKey: 'about.guide.media.audio.name', descKey: 'about.guide.media.audio.desc', steps: 'about.guide.media.audio.steps' },
        { path: '/media/webm-to-mp4', nameKey: 'about.guide.media.video.name', descKey: 'about.guide.media.video.desc', steps: 'about.guide.media.video.steps' },
        { path: '/media/gif-to-mp4', nameKey: 'about.guide.media.gif.name', descKey: 'about.guide.media.gif.desc', steps: 'about.guide.media.gif.steps' }
      ]
    },
    {
      category: 'address',
      icon: '📍',
      color: '#3B82F6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      tools: [
        { path: '/address', nameKey: 'about.guide.address.name', descKey: 'about.guide.address.desc', steps: 'about.guide.address.steps' }
      ]
    }
  ];

  return (
    <>
      <SEOHead
        title={t('about.pageTitle')}
        description={t('about.pageDescription')}
      />

      <div className="about-page">
        {/* Hero Section */}
        <section className="about-hero">
          <div className="about-hero-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            {t('about.heroBadge')}
          </div>
          <h1 className="about-hero-title">
            {t('about.heroTitle')}
            <span className="about-hero-highlight"> EasyFile</span>
          </h1>
          <p className="about-hero-subtitle">{t('about.heroSubtitle')}</p>
        </section>

        <CoupangBanner type="top" />

        {/* Features Section */}
        <section className="about-features">
          <h2 className="about-section-title">{t('about.whyEasyFile')}</h2>
          <div className="about-features-grid">
            {features.map((feature, index) => (
              <div key={index} className="about-feature-card">
                <div className="about-feature-icon" style={{ backgroundColor: `${feature.color}15`, color: feature.color }}>
                  {feature.icon}
                </div>
                <h3 className="about-feature-title">{t(feature.titleKey)}</h3>
                <p className="about-feature-desc">{t(feature.descKey)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tool Guide Section */}
        <section className="about-guide">
          <h2 className="about-section-title">{t('about.guideTitle')}</h2>
          <p className="about-section-subtitle">{t('about.guideSubtitle')}</p>

          <div className="about-guide-categories">
            {toolGuides.map((category) => (
              <div key={category.category} className="about-guide-category">
                <div className="about-guide-category-header" style={{ backgroundColor: category.bgColor }}>
                  <span className="about-guide-category-icon">{category.icon}</span>
                  <h3 className="about-guide-category-title" style={{ color: category.color }}>
                    {t(`about.guide.categories.${category.category}`)}
                  </h3>
                </div>

                <div className="about-guide-tools">
                  {category.tools.map((tool) => (
                    <div key={tool.path} className="about-guide-tool">
                      <div className="about-guide-tool-header">
                        <h4 className="about-guide-tool-name">{t(tool.nameKey)}</h4>
                        <Link to={tool.path} className="about-guide-tool-link">
                          {t('about.tryNow')}
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                      <p className="about-guide-tool-desc">{t(tool.descKey)}</p>
                      <div className="about-guide-tool-steps">
                        <span className="about-guide-tool-steps-label">{t('about.howToUse')}</span>
                        <ol className="about-guide-tool-steps-list">
                          {t(tool.steps, { returnObjects: true }).map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="about-faq">
          <h2 className="about-section-title">{t('about.faqTitle')}</h2>
          <div className="about-faq-list">
            <div className="about-faq-item">
              <h3 className="about-faq-question">{t('about.faq.q1')}</h3>
              <p className="about-faq-answer">{t('about.faq.a1')}</p>
            </div>
            <div className="about-faq-item">
              <h3 className="about-faq-question">{t('about.faq.q2')}</h3>
              <p className="about-faq-answer">{t('about.faq.a2')}</p>
            </div>
            <div className="about-faq-item">
              <h3 className="about-faq-question">{t('about.faq.q3')}</h3>
              <p className="about-faq-answer">{t('about.faq.a3')}</p>
            </div>
            <div className="about-faq-item">
              <h3 className="about-faq-question">{t('about.faq.q4')}</h3>
              <p className="about-faq-answer">{t('about.faq.a4')}</p>
            </div>
          </div>
        </section>

        <CoupangBanner type="bottom" />

        {/* CTA Section */}
        <section className="about-cta">
          <h2 className="about-cta-title">{t('about.ctaTitle')}</h2>
          <p className="about-cta-subtitle">{t('about.ctaSubtitle')}</p>
          <div className="about-cta-buttons">
            <Link to="/" className="about-cta-button primary">
              {t('about.ctaButton')}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};

export default About;
