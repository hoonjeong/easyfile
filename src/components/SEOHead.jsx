import { Helmet } from 'react-helmet-async';

const SEOHead = ({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage = '/og-image.png'
}) => {
  const siteName = 'EasyFile - 무료 온라인 파일 변환기';
  const fullTitle = title ? `${title} | ${siteName}` : siteName;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": fullTitle,
    "description": description,
    "applicationCategory": "UtilityApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "KRW"
    },
    "featureList": [
      "100% 브라우저 기반 변환",
      "서버 업로드 없음",
      "무료 무제한 사용",
      "개인정보 보호"
    ]
  };

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Language */}
      <html lang="ko" />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default SEOHead;
