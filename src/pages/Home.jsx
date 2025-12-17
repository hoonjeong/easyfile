import { Link, useNavigate } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

const categories = [
  {
    id: 'image',
    title: '이미지 변환',
    description: 'HEIC, WebP, PSD, TIFF 등 다양한 이미지 형식을 JPG, PNG로 변환',
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
    title: '문서 변환',
    description: 'Excel, Markdown, LaTeX 등 문서 형식을 JSON, HTML로 변환',
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
    title: '미디어 변환',
    description: 'M4A, WebM, GIF 등 오디오/비디오 파일을 MP3, MP4로 변환',
    icon: '🎬',
    iconClass: 'media',
    path: '/media',
    converters: [
      { name: 'M4A → MP3', path: '/media/m4a-to-mp3' },
      { name: 'WebM → MP4', path: '/media/webm-to-mp4' },
      { name: 'GIF → MP4', path: '/media/gif-to-mp4' },
    ]
  }
];

const features = [
  {
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: '100% 개인정보 보호',
    description: '파일이 서버로 전송되지 않습니다. 모든 변환은 브라우저에서 처리됩니다.'
  },
  {
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: '빠른 변환 속도',
    description: '최신 WebAssembly 기술로 서버 왕복 없이 즉시 변환됩니다.'
  },
  {
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: '완전 무료',
    description: '회원가입, 파일 제한, 워터마크 없이 무제한 무료로 사용하세요.'
  },
  {
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: '설치 불필요',
    description: '프로그램 설치 없이 웹브라우저만으로 바로 사용할 수 있습니다.'
  }
];

const Home = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="무료 온라인 파일 변환기"
        description="HEIC, WebP, PSD, Excel, M4A 등 다양한 파일을 무료로 변환하세요. 100% 브라우저 기반으로 파일이 서버로 전송되지 않아 안전합니다. 회원가입 없이 무제한 사용 가능."
        keywords="파일 변환, HEIC 변환, WebP 변환, Excel 변환, 온라인 변환기, 무료 파일 변환, 이미지 변환, 문서 변환"
      />

      <section className="hero">
        <span className="hero-badge">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          서버 업로드 없음 - 100% 브라우저 기반
        </span>
        <h1 className="hero-title">
          무료 온라인<br />
          <span style={{ background: 'linear-gradient(135deg, #4F46E5, #10B981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            파일 변환기
          </span>
        </h1>
        <p className="hero-subtitle">
          이미지, 문서, 오디오, 비디오 파일을 브라우저에서 안전하게 변환하세요.
          파일이 서버로 전송되지 않아 개인정보가 보호됩니다.
        </p>
      </section>

      <section className="categories">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={category.path}
            className="category-card"
            style={{ textDecoration: 'none', cursor: 'pointer' }}
          >
            <div className={`category-icon ${category.iconClass}`}>
              {category.icon}
            </div>
            <h2 className="category-title">{category.title}</h2>
            <p className="category-description">{category.description}</p>
            <div className="converter-list">
              {category.converters.map((converter) => (
                <span
                  key={converter.path}
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
        ))}
      </section>

      <section className="features">
        {features.map((feature, index) => (
          <div key={index} className="feature">
            <div className="feature-icon">{feature.icon}</div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-text">{feature.description}</p>
          </div>
        ))}
      </section>

      <section className="seo-content">
        <h2>EasyFile이란?</h2>
        <p>
          EasyFile은 100% 브라우저 기반의 무료 온라인 파일 변환 서비스입니다.
          아이폰의 HEIC 사진, 웹의 WebP 이미지, 포토샵 PSD 파일 등 다양한 형식을
          누구나 열 수 있는 JPG, PNG로 변환할 수 있습니다.
        </p>

        <h2>왜 EasyFile을 사용해야 하나요?</h2>
        <ul>
          <li>
            <strong>완벽한 개인정보 보호</strong> - 모든 변환이 브라우저에서 처리되어
            파일이 서버로 전송되지 않습니다. 민감한 문서나 개인 사진도 안심하고 변환하세요.
          </li>
          <li>
            <strong>무료 무제한</strong> - 회원가입, 이메일 인증, 파일 크기 제한, 일일 변환 제한이 없습니다.
            원하는 만큼 자유롭게 사용하세요.
          </li>
          <li>
            <strong>설치 불필요</strong> - 웹브라우저만 있으면 됩니다. 프로그램 설치나 회원가입 없이
            바로 사용할 수 있습니다.
          </li>
          <li>
            <strong>빠른 처리</strong> - 최신 WebAssembly 기술로 서버 왕복 없이 즉시 변환됩니다.
          </li>
        </ul>

        <h2>지원하는 변환 형식</h2>
        <p>
          <strong>이미지:</strong> HEIC → JPG/PNG, WebP → JPG/PNG, PSD → JPG/PNG, TIFF → JPG/PNG, SVG → PNG, ICO → PNG
        </p>
        <p>
          <strong>문서:</strong> Excel → JSON/CSV/HTML, Markdown → HTML, LaTeX → PNG/SVG
        </p>
        <p>
          <strong>미디어:</strong> M4A → MP3, WebM → MP4, GIF → MP4
        </p>
      </section>
    </>
  );
};

export default Home;
