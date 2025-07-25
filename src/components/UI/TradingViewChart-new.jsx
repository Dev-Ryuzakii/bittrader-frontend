import React, { useState, useEffect, useRef } from 'react';

const TradingViewChart = ({ onPlaceTrade, symbol = 'BTC/USD' }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [chartType, setChartType] = useState('candles');
  const [chartError, setChartError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setChartError(null);
    setIsLoading(true);

    const initChart = async () => {
      try {
        // Dynamic import to handle potential loading issues
        const { createChart } = await import('lightweight-charts');
        
        if (chartContainerRef.current) {
          // Destroy existing chart if it exists
          if (chartRef.current) {
            try {
              chartRef.current.remove();
            } catch (e) {
              console.warn('Error removing existing chart:', e);
            }
            chartRef.current = null;
            seriesRef.current = null;
          }

          // Create the chart with basic configuration
          chartRef.current = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth || 800,
            height: 500,
            layout: {
              background: { color: '#1A1A1A' },
              textColor: '#d1d4dc',
            },
            grid: {
              vertLines: { color: '#222222' },
              horzLines: { color: '#222222' },
            },
            timeScale: {
              borderColor: '#333333',
            },
            rightPriceScale: {
              borderColor: '#333333',
            },
          });

          // Generate demo data
          const data = generateDemoData(50);
          
          // Add series based on chart type
          try {
            if (chartType === 'line') {
              seriesRef.current = chartRef.current.addLineSeries({
                color: '#2962FF',
                lineWidth: 2,
              });
              const lineData = data.map(item => ({
                time: item.time,
                value: item.close,
              }));
              seriesRef.current.setData(lineData);
            } else {
              // Default to candlestick
              seriesRef.current = chartRef.current.addCandlestickSeries({
                upColor: '#4bffb5',
                downColor: '#ff4976',
                borderUpColor: '#4bffb5',
                borderDownColor: '#ff4976',
                wickUpColor: '#4bffb5',
                wickDownColor: '#ff4976',
              });
              seriesRef.current.setData(data);
            }

            // Set current price from last data point
            if (data.length > 0) {
              setCurrentPrice(data[data.length - 1].close);
            }

            setIsLoading(false);
          } catch (seriesError) {
            console.error('Error creating series:', seriesError);
            setChartError('Failed to create chart series');
            setIsLoading(false);
            return;
          }

          // Handle window resize
          const handleResize = () => {
            if (chartRef.current && chartContainerRef.current) {
              try {
                chartRef.current.applyOptions({
                  width: chartContainerRef.current.clientWidth,
                });
              } catch (e) {
                console.warn('Error resizing chart:', e);
              }
            }
          };

          window.addEventListener('resize', handleResize);

          // Simulate real-time updates
          const intervalId = setInterval(() => {
            if (!seriesRef.current || !data.length) return;
            
            try {
              const lastPoint = data[data.length - 1];
              const newPoint = generateNextPoint(lastPoint);
              
              if (chartType === 'line') {
                seriesRef.current.update({
                  time: newPoint.time,
                  value: newPoint.close,
                });
              } else {
                seriesRef.current.update(newPoint);
              }
              
              data.push(newPoint);
              if (data.length > 50) {
                data.shift(); // Keep only last 50 points
              }
              
              setCurrentPrice(newPoint.close);
            } catch (error) {
              console.error("Error updating chart:", error);
            }
          }, 3000);

          // Cleanup function
          return () => {
            clearInterval(intervalId);
            window.removeEventListener('resize', handleResize);
            if (chartRef.current) {
              try {
                chartRef.current.remove();
              } catch (e) {
                console.warn('Error cleaning up chart:', e);
              }
              chartRef.current = null;
              seriesRef.current = null;
            }
          };
        }
      } catch (error) {
        console.error("Error initializing chart:", error);
        setChartError(`Failed to load chart library: ${error.message}`);
        setIsLoading(false);
      }
    };

    const cleanup = initChart();
    
    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(cleanupFn => {
          if (typeof cleanupFn === 'function') {
            cleanupFn();
          }
        });
      }
    };
  }, [chartType]);

  // Function to generate demo data for the chart
  const generateDemoData = (count) => {
    const basePrice = 45000 + Math.random() * 10000; // BTC-like price
    const volatility = 500;
    const data = [];
    
    for (let i = 0; i < count; i++) {
      const now = new Date();
      now.setHours(now.getHours() - (count - i));
      
      let open, high, low, close;
      
      if (i === 0) {
        open = basePrice;
        close = basePrice + (Math.random() - 0.5) * volatility;
      } else {
        open = data[i-1].close;
        close = open + (Math.random() - 0.5) * volatility;
      }
      
      high = Math.max(open, close) + Math.random() * volatility * 0.5;
      low = Math.min(open, close) - Math.random() * volatility * 0.5;
      
      // Convert to Unix timestamp
      const time = Math.floor(now.getTime() / 1000);
      
      data.push({
        time,
        open: Math.max(0, open),
        high: Math.max(0, high),
        low: Math.max(0, low),
        close: Math.max(0, close),
      });
    }
    
    return data;
  };

  // Function to generate the next data point
  const generateNextPoint = (lastPoint) => {
    const open = lastPoint.close;
    const close = open + (Math.random() - 0.5) * 200; // Random price movement
    const high = Math.max(open, close) + Math.random() * 100;
    const low = Math.min(open, close) - Math.random() * 100;
    
    // Get next timestamp (1 hour later)
    const time = lastPoint.time + 3600;
    
    return {
      time,
      open: Math.max(0, open),
      high: Math.max(0, high),
      low: Math.max(0, low),
      close: Math.max(0, close),
    };
  };

  const toggleChartType = (type) => {
    setChartType(type);
  };

  // Fallback chart component
  const FallbackChart = () => (
    <div className="w-full h-[500px] bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">📈</div>
        <h3 className="text-xl font-semibold text-white mb-2">Trading Chart</h3>
        <p className="text-gray-400 mb-4">Chart visualization temporarily unavailable</p>
        <div className="bg-[#2A2A2A] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">{symbol}</span>
            <span className="text-green-400 font-bold">
              ${currentPrice ? currentPrice.toFixed(2) : '45,234.56'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative">
      {/* Chart controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
        <div className="bg-[#222222] rounded-lg p-1 flex">
          <button 
            className={`px-3 py-1 rounded text-sm ${chartType === 'candles' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={() => toggleChartType('candles')}
          >
            Candles
          </button>
          <button 
            className={`px-3 py-1 rounded text-sm ${chartType === 'line' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={() => toggleChartType('line')}
          >
            Line
          </button>
        </div>
        <div className="text-white font-medium">
          <span className="text-gray-400 mr-2">{symbol}:</span>
          <span className="text-green-400">${currentPrice ? currentPrice.toFixed(2) : '—'}</span>
        </div>
      </div>

      {/* Place Trade Button */}
      <div className="absolute top-4 right-4 z-10">
        <button 
          onClick={onPlaceTrade}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          Place Trade
        </button>
      </div>

      {/* Chart container */}
      {isLoading ? (
        <div className="w-full h-[500px] bg-[#1A1A1A] flex items-center justify-center">
          <div className="text-white">Loading chart...</div>
        </div>
      ) : chartError ? (
        <FallbackChart />
      ) : (
        <div 
          ref={chartContainerRef} 
          className="w-full h-[500px]"
          style={{ position: 'relative' }}
        />
      )}
    </div>
  );
};

export default TradingViewChart;
