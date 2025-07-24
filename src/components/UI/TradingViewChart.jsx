import React, { useEffect, useRef, memo } from 'react';

function TradingViewWidget({ symbol = 'EURUSD', theme = 'dark', height = 600 }) {
  const container = useRef();

  useEffect(() => {
    // Clear any existing content
    if (container.current) {
      container.current.innerHTML = '';
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    
    // TradingView widget configuration
    script.innerHTML = `
      {
        "autosize": true,
        "symbol": "${symbol}",
        "timezone": "Etc/UTC",
        "theme": "${theme}",
        "style": "1",
        "locale": "en",
        "enable_publishing": false,
        "withdateranges": true,
        "range": "YTD",
        "hide_side_toolbar": false,
        "allow_symbol_change": true,
        "details": true,
        "hotlist": true,
        "calendar": true,
        "studies": [
          "STD;MA",
          "STD;MACD",
          "STD;RSI",
          "STD;BB"
        ],
        "container_id": "tradingview_${Math.random().toString(36).substr(2, 9)}"
      }`;

    if (container.current) {
      container.current.appendChild(script);
    }

    // Cleanup function
    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbol, theme]);

  return (
    <div 
      className="tradingview-widget-container" 
      ref={container} 
      style={{ height: `${height}px`, width: '100%' }}
    >
      <div className="tradingview-widget-container__widget"></div>
    </div>
  );
}

export default memo(TradingViewWidget);
