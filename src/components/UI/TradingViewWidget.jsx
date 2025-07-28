import React, { useEffect, useRef, memo, useState } from 'react';

const TradingViewWidget = ({ symbol = '', theme = 'dark' }) => {
  const containerRef = useRef();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    
    // Clear any existing content
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    
    script.onload = () => {
      setTimeout(() => setIsLoading(false), 2000); // Give time for widget to load
    };
    
    script.innerHTML = `
      {
        "width": "100%",
        "height": "640",
        "symbol": "${symbol}",
        "interval": "",
        "timezone": "Etc/UTC",
        "theme": "${theme}",
        "style": "1",
        "locale": "en",
        "toolbar_bg": "#f1f3f6",
        "enable_publishing": false,
        "allow_symbol_change": true,
        "calendar": false,
        "studies": [
          "MACD@tv-basicstudies",
          "RSI@tv-basicstudies"
        ],
        "show_popup_button": true,
        "popup_width": "1000",
        "popup_height": "650",
        "support_host": "https://www.tradingview.com"
      }`;

    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, theme]);

  return (
    <div className="tradingview-widget-container" style={{ height: '660px', width: '100%', position: 'relative' }}>
      {isLoading && (
        <div 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#1A1A1A',
            zIndex: 10
          }}
        >
          <div style={{ color: '#9DB2BD', fontSize: '16px' }}>Loading chart...</div>
        </div>
      )}
      <div
        className="tradingview-widget-container__widget"
        ref={containerRef}
        style={{ height: '640px', width: '100%' }}
      ></div>
      <div className="tradingview-widget-copyright" style={{ fontSize: '13px', lineHeight: '20px', textAlign: 'center', marginTop: '0px' }}>
        <a
          href="https://www.tradingview.com/"
          rel="noopener nofollow"
          target="_blank"
          style={{ color: '#9DB2BD', fontSize: '13px', textDecoration: 'none' }}
        >
          Track all markets on TradingView
        </a>
      </div>
    </div>
  );
};

export default memo(TradingViewWidget);
