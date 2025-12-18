import { Link } from 'react-router-dom';
import SEOHead from '../../components/SEOHead';

const converters = [
  {
    path: '/pdf/pdf-to-image',
    title: 'PDF to Image',
    description: 'PDF 파일을 JPG, PNG 이미지로 변환',
    tags: ['PDF', 'JPG', 'PNG', '이미지'],
    icon: '🖼️'
  },
  {
    path: '/pdf/pdf-to-text',
    title: 'PDF to Text',
    description: 'PDF에서 텍스트 추출',
    tags: ['PDF', 'Text', '텍스트', '추출'],
    icon: '📝'
  },
  {
    path: '/pdf/merge',
    title: 'PDF 병합',
    description: '여러 PDF 파일을 하나로 합치기',
    tags: ['병합', 'Merge', '합치기'],
    icon: '📑'
  },
  {
    path: '/pdf/split',
    title: 'PDF 분할',
    description: 'PDF를 여러 파일로 나누기',
    tags: ['분할', 'Split', '나누기'],
    icon: '✂️'
  },
  {
    path: '/pdf/extract',
    title: '페이지 추출',
    description: 'PDF에서 특정 페이지만 추출',
    tags: ['추출', 'Extract', '페이지'],
    icon: '📄'
  },
  {
    path: '/pdf/delete',
    title: '페이지 삭제',
    description: 'PDF에서 특정 페이지 삭제',
    tags: ['삭제', 'Delete', '페이지'],
    icon: '🗑️'
  },
  {
    path: '/pdf/reorder',
    title: '페이지 순서 변경',
    description: 'PDF 페이지 순서 재정렬',
    tags: ['순서', 'Reorder', '정렬'],
    icon: '🔀'
  },
  {
    path: '/pdf/rotate',
    title: '페이지 회전',
    description: 'PDF 페이지 90°/180°/270° 회전',
    tags: ['회전', 'Rotate', '90도'],
    icon: '🔄'
  }
];

const PdfIndex = () => {
  return (
    <>
      <SEOHead
        title="PDF 도구 - PDF 변환, 병합, 분할, 편집"
        description="무료 온라인 PDF 도구. PDF를 이미지로 변환, 텍스트 추출, PDF 병합, 분할, 페이지 추출, 삭제, 순서 변경, 회전. 100% 브라우저 기반으로 개인정보가 안전합니다."
        keywords="PDF 변환, PDF 병합, PDF 분할, PDF 편집, PDF to JPG, PDF to PNG, PDF 텍스트 추출, 온라인 PDF 도구"
      />

      <div className="page-header">
        <h1 className="page-title">PDF 도구</h1>
        <p className="page-description">
          PDF 파일을 변환, 병합, 분할, 편집하세요.
          모든 작업은 브라우저에서 처리되어 개인정보가 안전합니다.
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
            <div className="category-icon pdf">
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
        <h2>EasyFile PDF 도구의 특징</h2>
        <ul>
          <li><strong>100% 무료</strong> - 회원가입 없이 무제한 사용</li>
          <li><strong>완벽한 보안</strong> - 파일이 서버로 전송되지 않음</li>
          <li><strong>빠른 처리</strong> - 브라우저에서 즉시 처리</li>
          <li><strong>다양한 기능</strong> - 변환, 병합, 분할, 편집 모두 지원</li>
        </ul>

        <h2>지원하는 PDF 기능</h2>
        <p>
          <strong>변환:</strong> PDF → JPG/PNG, PDF → 텍스트
        </p>
        <p>
          <strong>편집:</strong> 병합, 분할, 페이지 추출, 페이지 삭제, 순서 변경, 회전
        </p>
      </div>
    </>
  );
};

export default PdfIndex;
