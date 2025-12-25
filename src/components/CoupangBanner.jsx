import { useEffect, useRef } from 'react';

const CoupangBanner = () => {
  const containerRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current || !containerRef.current) return;
    initializedRef.current = true;

    const loadBanner = () => {
      // Check if script already exists
      const existingScript = document.querySelector('script[src="https://ads-partners.coupang.com/g.js"]');

      if (existingScript && window.PartnersCoupang) {
        // Script already loaded, just create banner
        createBanner();
      } else if (!existingScript) {
        // Load script first time
        const script = document.createElement('script');
        script.src = 'https://ads-partners.coupang.com/g.js';
        script.async = true;
        script.onload = () => {
          createBanner();
        };
        document.head.appendChild(script);
      } else {
        // Script exists but not loaded yet, wait for it
        existingScript.addEventListener('load', createBanner);
      }
    };

    const createBanner = () => {
      if (window.PartnersCoupang && containerRef.current) {
        try {
          new window.PartnersCoupang.G({
            id: 953120,
            trackingCode: "AF3215781",
            subId: null,
            template: "carousel",
            width: "680",
            height: "140",
            container: containerRef.current
          });
        } catch (e) {
          console.error('Failed to create Coupang banner:', e);
        }
      }
    };

    loadBanner();
  }, []);

  return (
    <div className="coupang-banner-wrapper">
      <div ref={containerRef} style={{ maxWidth: '100%', overflow: 'hidden' }} />
    </div>
  );
};

export default CoupangBanner;
