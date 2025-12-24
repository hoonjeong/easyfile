import { useEffect, useRef } from 'react';

const CoupangBanner = () => {
  const containerRef = useRef(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || loadedRef.current) return;

    const config = { id: 953120, template: "carousel", trackingCode: "AF3215781", width: "680", height: "140", tsource: "" };

    const initBanner = () => {
      if (window.PartnersCoupang && containerRef.current) {
        containerRef.current.innerHTML = '';
        const bannerDiv = document.createElement('div');
        containerRef.current.appendChild(bannerDiv);
        new window.PartnersCoupang.G(config);
        loadedRef.current = true;
      }
    };

    if (window.PartnersCoupang) {
      initBanner();
    } else {
      const existingScript = document.querySelector('script[src="https://ads-partners.coupang.com/g.js"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://ads-partners.coupang.com/g.js';
        script.async = true;
        script.onload = initBanner;
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', initBanner);
        if (window.PartnersCoupang) {
          initBanner();
        }
      }
    }

    return () => {
      loadedRef.current = false;
    };
  }, []);

  return (
    <div className="coupang-banner-wrapper" ref={containerRef} />
  );
};

export default CoupangBanner;
