import { Link, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '홈' },
    { path: '/image', label: '이미지' },
    { path: '/document', label: '문서' },
    { path: '/media', label: '미디어' },
  ];

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
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)) ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
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
            <span className="footer-highlight">100% 브라우저 기반</span> - 파일이 서버로 전송되지 않습니다. 모든 변환은 로컬에서 처리됩니다.
          </p>
        </div>
      </footer>
    </>
  );
};

export default Layout;
