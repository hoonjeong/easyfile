import { Link } from 'react-router-dom';
import SEOHead from '../../components/SEOHead';

const converters = [
  {
    path: '/document/excel-to-json',
    title: 'Excel to JSON/CSV/HTML',
    description: '엑셀 파일을 JSON, CSV, HTML로 변환',
    tags: ['Excel', 'XLSX', 'JSON', 'CSV', 'HTML'],
    icon: '📊'
  },
  {
    path: '/document/markdown-to-html',
    title: 'Markdown to HTML',
    description: '마크다운 파일을 HTML로 변환',
    tags: ['Markdown', 'MD', 'HTML', 'GitHub'],
    icon: '📝'
  },
  {
    path: '/document/latex-to-image',
    title: 'LaTeX to PNG/SVG',
    description: 'LaTeX 수식을 이미지로 변환',
    tags: ['LaTeX', 'Math', 'PNG', 'SVG'],
    icon: '🔢'
  }
];

const DocumentIndex = () => {
  return (
    <>
      <SEOHead
        title="문서 변환기 - Excel, Markdown, LaTeX 변환"
        description="다양한 문서 형식을 무료로 변환하세요. Excel을 JSON으로, Markdown을 HTML로, LaTeX 수식을 이미지로 변환. 서버 업로드 없이 안전하게 변환됩니다."
        keywords="문서 변환, Excel 변환, Markdown 변환, LaTeX 변환, JSON 변환, CSV 변환, 온라인 문서 변환기"
      />

      <div className="page-header">
        <h1 className="page-title">문서 변환기</h1>
        <p className="page-description">
          다양한 문서 형식을 쉽게 변환하세요.
          모든 변환은 브라우저에서 처리되어 민감한 비즈니스 데이터도 안전합니다.
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
            <div className="category-icon document">
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
        <h2>직장인을 위한 문서 변환</h2>
        <p>
          EasyFile 문서 변환기는 업무 중 급하게 필요한 파일 변환을 도와줍니다.
          특히 보안이 중요한 비즈니스 데이터도 서버에 저장되지 않아 안전합니다.
        </p>

        <h2>주요 기능</h2>
        <ul>
          <li><strong>Excel → JSON</strong> - 엑셀 데이터를 개발용 JSON으로 변환</li>
          <li><strong>Excel → CSV</strong> - 다양한 프로그램과 호환되는 형식으로 변환</li>
          <li><strong>Excel → HTML</strong> - 웹페이지에 삽입할 수 있는 테이블로 변환</li>
          <li><strong>Markdown → HTML</strong> - GitHub README를 웹페이지로 변환</li>
          <li><strong>LaTeX → 이미지</strong> - 수학 공식을 문서에 삽입할 수 있는 이미지로 변환</li>
        </ul>

        <h2>보안 안내</h2>
        <p>
          모든 변환은 100% 브라우저에서 처리됩니다.
          파일이 서버로 전송되지 않으므로 민감한 비즈니스 데이터도 안심하고 변환하실 수 있습니다.
        </p>
      </div>
    </>
  );
};

export default DocumentIndex;
