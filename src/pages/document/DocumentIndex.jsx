import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/SEOHead';
import CoupangBanner from '../../components/CoupangBanner';

const DocumentIndex = () => {
  const { t } = useTranslation();

  const converters = [
    { path: '/document/excel-to-json', titleKey: 'document.excel.title', descKey: 'document.excel.description', tags: ['Excel', 'XLSX', 'JSON', 'CSV', 'HTML'], icon: '📊' },
    { path: '/document/markdown-to-html', titleKey: 'document.markdown.title', descKey: 'document.markdown.description', tags: ['Markdown', 'MD', 'HTML', 'GitHub'], icon: '📝' },
    { path: '/document/latex-to-image', titleKey: 'document.latex.title', descKey: 'document.latex.description', tags: ['LaTeX', 'Math', 'PNG', 'SVG'], icon: '🔢' }
  ];

  return (
    <>
      <SEOHead title={t('document.pageTitle')} description={t('document.pageDescription')} keywords="document converter, Excel converter, Markdown converter, LaTeX converter, JSON converter, CSV converter, online document converter" />

      <div className="page-header">
        <h1 className="page-title">{t('document.pageTitle')}</h1>
        <p className="page-description">{t('document.pageDescription')}</p>
      </div>

      <CoupangBanner />

      <div className="categories" style={{ marginTop: '20px' }}>
        {converters.map((converter) => (
          <Link key={converter.path} to={converter.path} className="category-card" style={{ textDecoration: 'none' }}>
            <div className="category-icon document">{converter.icon}</div>
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

export default DocumentIndex;
