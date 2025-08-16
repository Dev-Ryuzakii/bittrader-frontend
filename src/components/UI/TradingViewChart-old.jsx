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
    // Reset error state when trying to render chart
    setChartError(null);
    
    try {
      if (chartContainerRef.current && dimensions.width > 0) {
        // Destroy existing chart if it exists
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
      
      // Create the chart instance with modern dark theme
      chartRef.current = createChart(chartContainerRef.current, {
        width: dimensions.width,
        height: 500,
        layout: {
          background: { color: '#1A1A1A' },
          textColor: '#d1d4dc',
          fontSize: 12,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        },
        grid: {
          vertLines: { color: '#222222' },
          horzLines: { color: '#222222' },
        },
        crosshair: {
          mode: 1, // Normal crosshair (1 = Normal, 0 = Magnet)
          vertLine: {
            color: '#333333',
            width: 1,
            style: 0,
            labelBackgroundColor: '#333333',
          },
          horzLine: {
            color: '#333333',
            width: 1,
            style: 0,
            labelBackgroundColor: '#333333',
          },
        },
        timeScale: {
          borderColor: '#333333',
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: '#333333',
        },
        handleScroll: true,
        handleScale: true,
      });
      
      try {
        // Create series based on chart type
        if (chartType === 'candles') {
          // Add candlestick series
          candleSeriesRef.current = chartRef.current.addCandlestickSeries({
            upColor: '#4bffb5',
            downColor: '#ff4976',
            borderUpColor: '#4bffb5',
            borderDownColor: '#ff4976',
            wickUpColor: '#4bffb5',
            wickDownColor: '#ff4976',
          });
        } else if (chartType === 'line') {
          // Add line series
          candleSeriesRef.current = chartRef.current.addLineSeries({
            color: '#2962FF',
            lineWidth: 2,
          });
        } else if (chartType === 'area') {
          // Add area series
          candleSeriesRef.current = chartRef.current.addAreaSeries({
            topColor: 'rgba(38, 198, 218, 0.56)',
            bottomColor: 'rgba(38, 198, 218, 0.04)',
            lineColor: 'rgba(38, 198, 218, 1)',
            lineWidth: 2,
          });
        }

        // Add volume series
        volumeSeriesRef.current = chartRef.current.addHistogramSeries({
          color: '#26a69a',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: '',
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        });
      } catch (error) {
        //console.error("Error creating chart series:", error);
      }

      // Example data - in a real app, this would come from your API
      const data = generateDemoData(100);
      
      if (chartType === 'candles') {
        candleSeriesRef.current.setData(data);
      } else {
        // For line or area, convert OHLC to single price
        const lineData = data.map(item => ({
          time: item.time,
          value: item.close,
        }));
        candleSeriesRef.current.setData(lineData);
      }
      
      // Set volume data
      const volumeData = data.map(item => ({
        time: item.time,
        value: item.volume,
        color: item.close >= item.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
      }));
      volumeSeriesRef.current.setData(volumeData);
      
      // Set last price marker
      if (data.length > 0) {
        setCurrentPrice(data[data.length - 1].close);
      }

      // Add price line for the last price if series was created successfully
      if (candleSeriesRef.current && data.length > 0) {
        try {
          candleSeriesRef.current.createPriceLine({
            price: data[data.length - 1].close,
            color: '#2962FF',
            lineWidth: 1,
            lineStyle: 2, // Dotted
            axisLabelVisible: true,
            title: 'Last Price',
          });
        } catch (error) {
          //console.error("Error creating price line:", error);
        }
      }
      
      // Fit content to view
      try {
        chartRef.current.timeScale().fitContent();
      } catch (error) {
        //console.error("Error fitting content to view:", error);
      }

      // Simulate real-time updates
      const intervalId = setInterval(() => {
        const lastPoint = data[data.length - 1];
        const newPoint = generateNextPoint(lastPoint);
        
        if (chartType === 'candles') {
          candleSeriesRef.current.update(newPoint);
        } else {
          candleSeriesRef.current.update({
            time: newPoint.time,
            value: newPoint.close,
          });
        }

        volumeSeriesRef.current.update({
          time: newPoint.time,
          value: newPoint.volume,
          color: newPoint.close >= newPoint.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
        });
        
        data.push(newPoint);
        data.shift(); // Remove oldest point
        
        setCurrentPrice(newPoint.close);
      }, 5000); // Update every 5 seconds

      return () => {
        clearInterval(intervalId);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
      };
    }
    } catch (error) {
      //console.error("Error initializing chart:", error);
      setChartError(`Failed to initialize chart: ${error.message}`);
    }
  }, [dimensions.width, chartType]);

  // Function to generate demo data for the chart
  const generateDemoData = (count) => {
    const basePrice = 100 + Math.random() * 50;
    const volatility = 3;
    const data = [];
    
    for (let i = 0; i < count; i++) {
      const now = new Date();
      now.setDate(now.getDate() - (count - i));
      
      let open, high, low, close;
      
      if (i === 0) {
        open = basePrice;
        close = basePrice + (Math.random() - 0.5) * volatility;
      } else {
        open = data[i-1].close;
        close = open + (Math.random() - 0.5) * volatility;
      }
      
      high = Math.max(open, close) + Math.random() * volatility;
      low = Math.min(open, close) - Math.random() * volatility;
      
      data.push({
        time: now.toISOString().split('T')[0],
        open,
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 1000) + 100,
      });
    }
    
    return data;
  };

  // Function to generate the next data point
  const generateNextPoint = (lastPoint) => {
    const open = lastPoint.close;
    const close = open + (Math.random() - 0.5) * 5; // Random price movement
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;
    
    // Get next timestamp
    const lastTime = new Date(lastPoint.time);
    lastTime.setDate(lastTime.getDate() + 1);
    
    return {
      time: lastTime.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 1000) + 100,
    };
  };

  const toggleChartType = (type) => {
    setChartType(type);
  };

  return (
    <div className="relative">
      {/* Chart controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
        <div className="bg-[#222222] rounded-lg p-1 flex">
          <button 
            className={`px-3 py-1 rounded text-sm ${chartType === 'candles' ? 'bg-gradient-to-r from-[#2F00FF] to-[#1C0099] text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={() => toggleChartType('candles')}
          >
            Candles
          </button>
          <button 
            className={`px-3 py-1 rounded text-sm ${chartType === 'line' ? 'bg-gradient-to-r from-[#2F00FF] to-[#1C0099] text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={() => toggleChartType('line')}
          >
            Line
          </button>
          <button 
            className={`px-3 py-1 rounded text-sm ${chartType === 'area' ? 'bg-gradient-to-r from-[#2F00FF] to-[#1C0099] text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={() => toggleChartType('area')}
          >
            Area
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
          className="bg-gradient-to-r from-[#2F00FF] to-[#1C0099] hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          Place Trade
        </button>
      </div>

      {/* Chart container */}
      {chartError ? (
        <div className="w-full h-[500px] bg-[#1A1A1A] flex flex-col items-center justify-center">
          <p className="text-red-400 mb-2">Error loading chart</p>
          <p className="text-gray-400 text-sm">{chartError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-gradient-to-r from-[#2F00FF] to-[#1C0099] hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            Reload
          </button>
        </div>
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
