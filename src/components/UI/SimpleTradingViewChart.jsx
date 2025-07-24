import React, { useEffect, useRef, useState } from 'react';

const SimpleTradingViewChart = ({ symbol = 'EURUSD', height = 600 }) => {
  const container = useRef();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('SimpleTradingViewChart: Starting to load chart for symbol:', symbol);
    
    if (!container.current) {
      console.error('SimpleTradingViewChart: Container ref is null');
      return;
    }

    // Clear container
    container.current.innerHTML = '';
    setIsLoading(true);
    setError(null);

    // Create widget configuration
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    
    script.onload = () => {
      console.log('SimpleTradingViewChart: TradingView script loaded successfully');
      setIsLoading(false);
    };
    
    script.onerror = (e) => {
      console.error('SimpleTradingViewChart: Failed to load TradingView script:', e);
      setError('Failed to load chart script');
      setIsLoading(false);
    };

    // Widget configuration
    const config = {
      "autosize": true,
      "symbol": `FX:${symbol}`,
      "interval": "D",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "toolbar_bg": "#f1f3f6",
      "enable_publishing": false,
      "allow_symbol_change": true,
      "container_id": "tradingview_simple_widget"
    };

    // Create container div
    const widgetDiv = document.createElement('div');
    widgetDiv.id = 'tradingview_simple_widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    
    container.current.appendChild(widgetDiv);
    
    // Add config to script
    script.innerHTML = JSON.stringify(config);
    
    // Append script to head
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      console.log('SimpleTradingViewChart: Cleaning up');
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [symbol]);

  if (error) {
    return (
      <div className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg overflow-hidden flex items-center justify-center" style={{ height: `${height}px` }}>
        <div className="text-center text-gray-400">
          <div className="text-lg mb-2">Chart Error</div>
          <div className="text-sm text-red-400">{error}</div>
          <div className="text-xs mt-2">Check console for details</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg overflow-hidden relative" style={{ height: `${height}px` }}>
      <div ref={container} className="w-full h-full" />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A0A] bg-opacity-80">
          <div className="flex flex-col items-center text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mb-3"></div>
            <span className="text-sm">Loading simple chart...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleTradingViewChart;
