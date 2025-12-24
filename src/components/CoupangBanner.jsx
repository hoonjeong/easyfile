import { useEffect, useRef } from 'react';

const CoupangBanner = () => {
  const containerRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    // 스크립트 태그 생성
    const script1 = document.createElement('script');
    script1.src = 'https://ads-partners.coupang.com/g.js';
    script1.async = true;

    // 광고 초기화 스크립트
    const script2 = document.createElement('script');
    script2.textContent = `
      new PartnersCoupang.G({"id":953120,"template":"carousel","trackingCode":"AF3215781","width":"680","height":"140","tsource":""});
    `;

    // 순서대로 추가
    script1.onload = () => {
      containerRef.current?.appendChild(script2);
    };

    containerRef.current.appendChild(script1);

    return () => {
      initializedRef.current = false;
    };
  }, []);

  return (
    <div className="coupang-banner-wrapper" ref={containerRef} />
  );
};

export default CoupangBanner;
