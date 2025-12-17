import { Link } from 'react-router-dom';
import SEOHead from '../../components/SEOHead';

const converters = [
  {
    path: '/image/heic-to-jpg',
    title: 'HEIC to JPG/PNG',
    description: '아이폰 HEIC 사진을 JPG, PNG로 변환',
    tags: ['HEIC', 'HEIF', 'iPhone', 'JPG', 'PNG'],
    icon: '📱'
  },
  {
    path: '/image/webp-to-jpg',
    title: 'WebP to JPG/PNG',
    description: '웹 이미지 WebP를 JPG, PNG로 변환',
    tags: ['WebP', 'JPG', 'PNG', 'Google'],
    icon: '🌐'
  },
  {
    path: '/image/psd-to-jpg',
    title: 'PSD to JPG/PNG',
    description: '포토샵 PSD 파일을 이미지로 변환',
    tags: ['PSD', 'Photoshop', 'JPG', 'PNG'],
    icon: '🎨'
  },
  {
    path: '/image/tiff-to-jpg',
    title: 'TIFF to JPG/PNG',
    description: '고해상도 TIFF 파일을 JPG, PNG로 변환',
    tags: ['TIFF', 'TIF', 'JPG', 'PNG'],
    icon: '🖼️'
  },
  {
    path: '/image/svg-to-png',
    title: 'SVG to PNG',
    description: 'SVG 벡터를 PNG 이미지로 변환',
    tags: ['SVG', 'PNG', '벡터', '래스터'],
    icon: '✨'
  },
  {
    path: '/image/ico-to-png',
    title: 'ICO to PNG',
    description: '아이콘 파일을 PNG 이미지로 변환',
    tags: ['ICO', 'PNG', '아이콘', '파비콘'],
    icon: '🔷'
  }
];

const ImageIndex = () => {
  return (
    <>
      <SEOHead
        title="이미지 변환기 - HEIC, WebP, PSD, TIFF, SVG 변환"
        description="다양한 이미지 형식을 무료로 변환하세요. HEIC, WebP, PSD, TIFF, SVG, ICO를 JPG, PNG로 변환. 100% 브라우저 기반으로 개인정보가 안전합니다."
        keywords="이미지 변환, HEIC 변환, WebP 변환, PSD 변환, TIFF 변환, SVG 변환, ICO 변환, 온라인 이미지 변환기"
      />

      <div className="page-header">
        <h1 className="page-title">이미지 변환기</h1>
        <p className="page-description">
          다양한 이미지 형식을 JPG, PNG로 쉽게 변환하세요.
          모든 변환은 브라우저에서 처리되어 개인정보가 안전합니다.
        </p>
      </div>

      <div className="categories" style={{ marginTop: '20px' }}>
        {converters.map((converter) => (
          <Link
            key={converter.path}
            to={converter.path}
            className="category-card"
            style={{ textDecoration: 'none' }}
          >
            <div className="category-icon image">
              {converter.icon}
            </div>
            <h3 className="category-title">{converter.title}</h3>
            <p className="category-description">{converter.description}</p>
            <div className="converter-list">
              {converter.tags.map((tag) => (
                <span key={tag} className="converter-tag">{tag}</span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      <div className="seo-content">
        <h2>EasyFile 이미지 변환기의 특징</h2>
        <ul>
          <li><strong>100% 무료</strong> - 회원가입 없이 무제한 사용</li>
          <li><strong>완벽한 보안</strong> - 파일이 서버로 전송되지 않음</li>
          <li><strong>빠른 변환</strong> - 브라우저에서 즉시 처리</li>
          <li><strong>고품질 유지</strong> - 원본 화질 그대로 변환</li>
          <li><strong>다양한 형식</strong> - 주요 이미지 형식 모두 지원</li>
        </ul>

        <h2>지원하는 이미지 변환</h2>
        <p>
          HEIC → JPG/PNG, WebP → JPG/PNG, PSD → JPG/PNG, TIFF → JPG/PNG,
          SVG → PNG, ICO → PNG 변환을 지원합니다.
        </p>
      </div>
    </>
  );
};

export default ImageIndex;
