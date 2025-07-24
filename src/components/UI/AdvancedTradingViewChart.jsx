import React, { useEffect, useRef, memo, useState } from 'react';
import FallbackChart from './FallbackChart';

function AdvancedTradingViewChart({ 
  symbol = 'EURUSD', 
  theme = 'dark', 
  height = 600,
  interval = 'D',
  onSymbolChange,
  showToolbar = true,
  showVolumeProfile = true,
  enableTrading = false 
}) {
  const container = useRef();
  const widgetId = useRef(`tradingview_${Math.random().toString(36).substring(2, 9)}`);
  const [chartError, setChartError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [useFallback, setUseFallback] = useState(false);

  // If we've had too many errors, use fallback
  if (useFallback || retryCount > 2) {
    return <FallbackChart symbol={symbol} height={height} theme={theme} />;
  }

  // Enhanced logging for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('AdvancedTradingViewChart render:', {
      symbol,
      height,
      theme,
      chartError,
      isLoading,
      retryCount,
      useFallback
    });
  }
  
  // Symbol mapping for different asset classes
  const getFormattedSymbol = (sym) => {
    if (!sym) return 'FX:EURUSD'; // Default fallback
    
    const symbolMappings = {
      // Forex pairs
      'EURUSD': 'FX:EURUSD',
      'GBPUSD': 'FX:GBPUSD', 
      'USDJPY': 'FX:USDJPY',
      'USDCAD': 'FX:USDCAD',
      'AUDUSD': 'FX:AUDUSD',
      'NZDUSD': 'FX:NZDUSD',
      'EURJPY': 'FX:EURJPY',
      'GBPJPY': 'FX:GBPJPY',
      'EURGBP': 'FX:EURGBP',
      'USDCHF': 'FX:USDCHF',
      'AUDCAD': 'FX:AUDCAD',
      'AUDCHF': 'FX:AUDCHF',
      'AUDJPY': 'FX:AUDJPY',
      'AUDNZD': 'FX:AUDNZD',
      'CADCHF': 'FX:CADCHF',
      'CADJPY': 'FX:CADJPY',
      'CHFJPY': 'FX:CHFJPY',
      'EURAUD': 'FX:EURAUD',
      'EURCAD': 'FX:EURCAD',
      'EURCHF': 'FX:EURCHF',
      'EURNZD': 'FX:EURNZD',
      'GBPAUD': 'FX:GBPAUD',
      'GBPCAD': 'FX:GBPCAD',
      'GBPCHF': 'FX:GBPCHF',
      'GBPNZD': 'FX:GBPNZD',
      'NZDCAD': 'FX:NZDCAD',
      'NZDCHF': 'FX:NZDCHF',
      'NZDJPY': 'FX:NZDJPY',
      
      // Commodities
      'XAUUSD': 'TVC:GOLD',
      'XAGUSD': 'TVC:SILVER',
      'USOIL': 'TVC:USOIL',
      'UKOIL': 'TVC:UKOIL',
      'NATGAS': 'TVC:NATURALGAS',
      
      // Crypto
      'BTCUSD': 'BINANCE:BTCUSDT',
      'ETHUSD': 'BINANCE:ETHUSDT',
      'ADAUSD': 'BINANCE:ADAUSDT',
      'DOTUSD': 'BINANCE:DOTUSDT',
      'LINKUSD': 'BINANCE:LINKUSDT',
      'LTCUSD': 'BINANCE:LTCUSDT',
      'XLMUSD': 'BINANCE:XLMUSDT',
      'XRPUSD': 'BINANCE:XRPUSDT',
      
      // Major Indices
      'SPX500': 'TVC:SPX',
      'US30': 'TVC:DJI',
      'NAS100': 'TVC:IXIC',
      'GER40': 'TVC:DAX',
      'UK100': 'TVC:UKX',
      'JPN225': 'TVC:NI225',
      'AUS200': 'TVC:AS51',
      
      // Major Stocks
      'AAPL': 'NASDAQ:AAPL',
      'MSFT': 'NASDAQ:MSFT',
      'GOOGL': 'NASDAQ:GOOGL',
      'AMZN': 'NASDAQ:AMZN',
      'TSLA': 'NASDAQ:TSLA',
      'META': 'NASDAQ:META',
      'NVDA': 'NASDAQ:NVDA',
      'NFLX': 'NASDAQ:NFLX'
    };
    
    return symbolMappings[sym] || `FX:${sym}`;
  };

  useEffect(() => {
    let isMounted = true;
    let timeoutId;
    
    const initializeChart = async () => {
      // Ensure container exists and component is still mounted
      if (!container.current || !isMounted) {
        console.warn('TradingView container not ready or component unmounted');
        return;
      }

      setIsLoading(true);
      setChartError(null);

      // Cleanup any existing widgets or scripts
      const cleanup = () => {
        if (container.current) {
          // Remove all child elements safely
          try {
            while (container.current.firstChild) {
              container.current.removeChild(container.current.firstChild);
            }
          } catch (e) {
            console.warn('Error during cleanup:', e);
          }
        }
      };

      cleanup();

      // Wait for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!isMounted || !container.current) return;

      try {
        // Convert the symbol
        const formattedSymbol = getFormattedSymbol(symbol);
        
        // Create the container div with the widget ID first
        const widgetDiv = document.createElement('div');
        widgetDiv.id = widgetId.current;
        widgetDiv.style.height = '100%';
        widgetDiv.style.width = '100%';
        widgetDiv.style.position = 'relative';
        widgetDiv.style.backgroundColor = theme === 'dark' ? '#0A0A0A' : '#ffffff';
        
        // Add container to DOM first
        if (container.current && isMounted) {
          container.current.appendChild(widgetDiv);
        } else {
          return;
        }

        // Check if TradingView script is already loaded
        const existingScript = document.querySelector('script[src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"]');
        if (existingScript) {
          existingScript.remove();
        }

        // Create and configure the embed script
        const embedScript = document.createElement('script');
        embedScript.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        embedScript.type = "text/javascript";
        embedScript.async = true;
        
        // Error handling for script loading
        embedScript.onerror = (error) => {
          console.error('Failed to load TradingView script:', error);
          if (isMounted) {
            setChartError('Failed to load chart');
            setIsLoading(false);
            setRetryCount(prev => prev + 1);
            
            // Use fallback after 2 failures
            if (retryCount >= 1) {
              setUseFallback(true);
            }
          }
        };
        
        embedScript.onload = () => {
          if (isMounted) {
            setIsLoading(false);
          }
        };
        
        // The widget configuration
        const widgetConfig = {
          "autosize": true,
          "symbol": formattedSymbol,
          "interval": interval,
          "timezone": "Etc/UTC",
          "theme": theme,
          "style": "1",
          "locale": "en",
          "toolbar_bg": theme === 'dark' ? "#1A1A1A" : "#f1f3f6",
          "enable_publishing": false,
          "allow_symbol_change": true,
          "calendar": true,
          "container_id": widgetId.current,
          "hide_top_toolbar": !showToolbar,
          "withdateranges": true,
          "save_image": false,
          "studies": showVolumeProfile ? ["Volume@tv-basicstudies"] : [],
          "overrides": {
            "mainSeriesProperties.candleStyle.upColor": "#26a69a",
            "mainSeriesProperties.candleStyle.downColor": "#ef5350",
            "mainSeriesProperties.candleStyle.borderUpColor": "#26a69a",
            "mainSeriesProperties.candleStyle.borderDownColor": "#ef5350",
            "mainSeriesProperties.candleStyle.wickUpColor": "#26a69a",
            "mainSeriesProperties.candleStyle.wickDownColor": "#ef5350"
          }
        };
        
        // Set the configuration as a JSON string
        embedScript.innerHTML = JSON.stringify(widgetConfig);
        
        // Add script to container with a delay to ensure DOM is ready
        timeoutId = setTimeout(() => {
          if (container.current && container.current.contains(widgetDiv) && isMounted) {
            try {
              container.current.appendChild(embedScript);
            } catch (e) {
              console.error('Error appending TradingView script:', e);
              if (isMounted) {
                setChartError('Failed to initialize chart');
                setIsLoading(false);
              }
            }
          }
        }, 200);
        
      } catch (error) {
        console.error('Error creating TradingView widget:', error);
        if (isMounted) {
          setChartError(error.message);
          setIsLoading(false);
          setRetryCount(prev => prev + 1);
          
          // Use fallback after 2 failures
          if (retryCount >= 1) {
            setUseFallback(true);
          }
        }
      }
    };

    initializeChart();

    // Cleanup function
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Don't cleanup DOM here as it may cause the error
    };
  }, [symbol, theme, interval, showToolbar, showVolumeProfile]);

  return (
    <div className="w-full h-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg overflow-hidden relative">
      <div 
        className="tradingview-widget-container w-full h-full" 
        ref={container}
        style={{ height: `${height}px` }}
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A0A] bg-opacity-80">
          <div className="flex flex-col items-center text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mb-3"></div>
            <span className="text-sm">Loading chart...</span>
          </div>
        </div>
      )}
      
      {/* Error overlay */}
      {chartError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A0A] bg-opacity-90">
          <div className="flex flex-col items-center text-gray-400 text-center p-6">
            <div className="text-4xl mb-4">📈</div>
            <div className="text-lg mb-2">Chart temporarily unavailable</div>
            <div className="text-sm text-gray-500 mb-2">Symbol: {symbol}</div>
            <div className="text-xs text-red-400">{chartError}</div>
            <div className="flex space-x-2 mt-4">
              <button 
                onClick={() => {
                  setChartError(null);
                  setIsLoading(true);
                  setRetryCount(prev => prev + 1);
                  // Trigger re-render by updating the key
                  widgetId.current = `tradingview_${Math.random().toString(36).substring(2, 9)}`;
                }}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
              <button 
                onClick={() => setUseFallback(true)}
                className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
              >
                Use Simple Chart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(AdvancedTradingViewChart);