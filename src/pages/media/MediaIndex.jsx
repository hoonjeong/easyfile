import { Link } from 'react-router-dom';
import SEOHead from '../../components/SEOHead';

const converters = [
  {
    path: '/media/m4a-to-mp3',
    title: 'M4A/AAC to MP3',
    description: '아이폰 음성메모를 MP3로 변환',
    tags: ['M4A', 'AAC', 'MP3', 'iPhone', '음성메모'],
    icon: '🎵'
  },
  {
    path: '/media/webm-to-mp4',
    title: 'WebM to MP4',
    description: '웹 녹화 비디오를 MP4로 변환',
    tags: ['WebM', 'MP4', '비디오', '녹화'],
    icon: '🎬'
  },
  {
    path: '/media/gif-to-mp4',
    title: 'GIF to MP4',
    description: 'GIF 용량을 1/10로 줄이기',
    tags: ['GIF', 'MP4', '움짤', '압축'],
    icon: '🎞️'
  }
];

const MediaIndex = () => {
  return (
    <>
      <SEOHead
        title="미디어 변환기 - 오디오, 비디오, GIF 변환"
        description="다양한 미디어 형식을 무료로 변환하세요. M4A를 MP3로, WebM을 MP4로, GIF를 MP4로 변환. 100% 브라우저 기반으로 파일이 서버로 전송되지 않습니다."
        keywords="미디어 변환, M4A 변환, WebM 변환, GIF 변환, 오디오 변환, 비디오 변환, 온라인 미디어 변환기"
      />

      <div className="page-header">
        <h1 className="page-title">미디어 변환기</h1>
        <p className="page-description">
          오디오와 비디오 파일을 쉽게 변환하세요.
          WebAssembly 기술로 브라우저에서 직접 인코딩됩니다.
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
            <div className="category-icon media">
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
        <h2>브라우저에서 미디어 변환이 가능한 이유</h2>
        <p>
          과거에는 오디오/비디오 변환에 반드시 서버가 필요했습니다.
          하지만 WebAssembly(Wasm) 기술 덕분에 이제 브라우저가 직접 인코딩을 처리할 수 있습니다.
          FFmpeg를 WebAssembly로 컴파일하여 브라우저에서 실행합니다.
        </p>

        <h2>주요 기능</h2>
        <ul>
          <li><strong>M4A → MP3</strong> - 아이폰 음성메모를 범용 포맷으로 변환</li>
          <li><strong>WebM → MP4</strong> - 웹 녹화 파일을 편집 가능한 포맷으로 변환</li>
          <li><strong>GIF → MP4</strong> - 용량이 큰 GIF를 1/10 크기의 MP4로 변환</li>
        </ul>

        <h2>첫 변환 시 안내</h2>
        <p>
          처음 변환할 때 FFmpeg 라이브러리(약 30MB)를 다운로드합니다.
          한 번 로드되면 이후 변환은 빠르게 처리됩니다.
          대용량 미디어 파일은 변환에 시간이 걸릴 수 있습니다.
        </p>

        <h2>보안</h2>
        <p>
          모든 변환은 브라우저에서 처리되며, 파일이 서버로 전송되지 않습니다.
          개인적인 음성이나 영상도 안심하고 변환하실 수 있습니다.
        </p>
      </div>
    </>
  );
};

export default MediaIndex;
