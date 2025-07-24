import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

const FallbackChart = ({ symbol = 'EURUSD', height = 600, theme = 'dark' }) => {
  const [price, setPrice] = useState(1.0845);
  const [priceHistory, setPriceHistory] = useState([]);
  const [isPositive, setIsPositive] = useState(true);

  // Generate mock price data
  useEffect(() => {
    const generateInitialData = () => {
      const data = [];
      let currentPrice = price;
      
      for (let i = 30; i >= 0; i--) {
        const change = (Math.random() - 0.5) * 0.02;
        currentPrice = Math.max(0.1, currentPrice + change);
        data.push({
          time: new Date(Date.now() - i * 60 * 60 * 1000),
          price: currentPrice
        });
      }
      
      setPriceHistory(data);
      setPrice(currentPrice);
    };

    generateInitialData();

    // Simulate real-time updates
    const interval = setInterval(() => {
      const change = (Math.random() - 0.5) * 0.005;
      const newPrice = Math.max(0.1, price + change);
      
      setPrice(newPrice);
      setIsPositive(change >= 0);
      
      setPriceHistory(prev => [
        ...prev.slice(1),
        {
          time: new Date(),
          price: newPrice
        }
      ]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Create SVG path for price line
  const createPath = () => {
    if (priceHistory.length < 2) return '';
    
    const width = 800;
    const height = 400;
    const padding = 40;
    
    const prices = priceHistory.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    
    const points = priceHistory.map((d, index) => {
      const x = padding + (index / (priceHistory.length - 1)) * (width - 2 * padding);
      const y = padding + (1 - (d.price - minPrice) / priceRange) * (height - 2 * padding);
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };

  const formatPrice = (value) => {
    if (symbol.includes('USD') && !symbol.startsWith('USD')) {
      return value.toFixed(4);
    }
    return value.toFixed(2);
  };

  return (
    <div 
      className={`w-full rounded-lg border ${
        theme === 'dark' 
          ? 'bg-[#0A0A0A] border-[#2A2A2A]' 
          : 'bg-white border-gray-200'
      }`}
      style={{ height: `${height}px` }}
    >
      {/* Header */}
      <div className={`p-4 border-b ${
        theme === 'dark' ? 'border-[#2A2A2A]' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BarChart3 className={`w-5 h-5 ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <h3 className={`font-medium ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {symbol}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span className={`font-mono text-lg ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {formatPrice(price)}
            </span>
            <span className={`text-sm ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              {isPositive ? '+' : ''}{((Math.random() - 0.5) * 2).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="p-4 h-full">
        <div className="w-full h-full flex items-center justify-center">
          <svg
            width="100%"
            height="80%"
            viewBox="0 0 800 400"
            className="overflow-visible"
          >
            {/* Grid lines */}
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke={theme === 'dark' ? '#333' : '#e5e7eb'}
                  strokeWidth="1"
                  opacity="0.3"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Price line */}
            {priceHistory.length > 1 && (
              <>
                {/* Area under the line */}
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={isPositive ? '#10b981' : '#ef4444'}
                      stopOpacity="0.3"
                    />
                    <stop
                      offset="100%"
                      stopColor={isPositive ? '#10b981' : '#ef4444'}
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>
                <path
                  d={`${createPath()} L 760,360 L 40,360 Z`}
                  fill="url(#priceGradient)"
                />
                
                {/* Price line */}
                <path
                  d={createPath()}
                  fill="none"
                  stroke={isPositive ? '#10b981' : '#ef4444'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* Current price dot */}
                {priceHistory.length > 0 && (
                  <circle
                    cx={40 + ((priceHistory.length - 1) / (priceHistory.length - 1)) * (800 - 80)}
                    cy={40 + (1 - (price - Math.min(...priceHistory.map(d => d.price))) / 
                      (Math.max(...priceHistory.map(d => d.price)) - Math.min(...priceHistory.map(d => d.price)) || 1)) * (400 - 80)}
                    r="4"
                    fill={isPositive ? '#10b981' : '#ef4444'}
                    stroke={theme === 'dark' ? '#0A0A0A' : '#ffffff'}
                    strokeWidth="2"
                  />
                )}
              </>
            )}
          </svg>
        </div>
      </div>

      {/* Footer */}
      <div className={`px-4 py-2 border-t text-xs ${
        theme === 'dark' 
          ? 'border-[#2A2A2A] text-gray-400' 
          : 'border-gray-200 text-gray-500'
      }`}>
        <div className="flex items-center justify-between">
          <span>Simplified chart view • Live data simulation</span>
          <span>Updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default FallbackChart;
