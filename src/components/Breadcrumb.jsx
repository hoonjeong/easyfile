import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Breadcrumb = ({ category, currentPage }) => {
  const { t } = useTranslation();

  // Category path and translation key mapping
  const categoryInfo = {
    image: { path: '/image', titleKey: 'nav.image' },
    pdf: { path: '/pdf', titleKey: 'nav.pdf' },
    document: { path: '/document', titleKey: 'nav.document' },
    media: { path: '/media', titleKey: 'nav.media' },
    chromakey: { path: '/chromakey', titleKey: 'nav.chromakey' },
    address: { path: '/address', titleKey: 'nav.address' }
  };

  const info = categoryInfo[category];
  if (!info) return null;

  return (
    <nav className="breadcrumb" aria-label="breadcrumb">
      <Link to="/" className="breadcrumb-item">
        {t('nav.home')}
      </Link>
      <span className="breadcrumb-separator">&gt;</span>
      <Link to={info.path} className="breadcrumb-item">
        {t(info.titleKey)}
      </Link>
      {currentPage && (
        <>
          <span className="breadcrumb-separator">&gt;</span>
          <span className="breadcrumb-item current">{currentPage}</span>
        </>
      )}

      <style>{`
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 0;
          margin-bottom: 16px;
          font-size: 14px;
          flex-wrap: wrap;
        }

        .breadcrumb-item {
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .breadcrumb-item:hover:not(.current) {
          color: var(--primary-color);
        }

        .breadcrumb-item.current {
          color: var(--text-primary);
          font-weight: 500;
        }

        .breadcrumb-separator {
          color: var(--text-tertiary);
          font-size: 12px;
        }

        @media (max-width: 768px) {
          .breadcrumb {
            font-size: 13px;
            gap: 6px;
          }
        }
      `}</style>
    </nav>
  );
};

export default Breadcrumb;
