import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Layout = ({ children }) => {
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const navItems = [
    { path: '/', labelKey: 'nav.home' },
    { path: '/pdf', labelKey: 'nav.pdf' },
    { path: '/image', labelKey: 'nav.image' },
    { path: '/chromakey', labelKey: 'nav.chromakey' },
    { path: '/document', labelKey: 'nav.document' },
    { path: '/media', labelKey: 'nav.media' },
    { path: '/address', labelKey: 'nav.address' },
    { path: '/about', labelKey: 'nav.about' },
  ];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <>
      <header className="header">
        <div className="container header-content">
          <Link to="/" className="logo">
            <svg className="logo-icon" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="36" height="36" rx="8" fill="currentColor"/>
              <path d="M10 18L16 24L26 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            EasyFile
          </Link>
          <nav className="nav">
            {navItems.map((item) => (
              item.external ? (
                <a
                  key={item.path}
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-link"
                >
                  {t(item.labelKey)}
                </a>
              ) : (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link ${location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)) ? 'active' : ''}`}
                >
                  {t(item.labelKey)}
                </Link>
              )
            ))}
            <div className="language-selector">
              <button
                onClick={() => changeLanguage('ko')}
                className={`lang-btn ${i18n.language === 'ko' ? 'active' : ''}`}
              >
                KR
              </button>
              <button
                onClick={() => changeLanguage('en')}
                className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
              >
                EN
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="main">
        <div className="container">
          {children}
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p className="footer-text">
            <span className="footer-highlight">{t('common.tagline')}</span> - {t('common.footerText')}
          </p>
          <p className="footer-contact">
            {t('common.contact')}: <a href="mailto:hoonjeong.eden@gmail.com">hoonjeong.eden@gmail.com</a>
          </p>
        </div>
      </footer>
    </>
  );
};

export default Layout;
