import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const MarketCard = ({ 
  symbol, 
  name, 
  price, 
  change, 
  changePercent, 
  chartData = [], 
  colorVariant = 1,
  currency = "USD"
}) => {
  const [animatedPrice, setAnimatedPrice] = useState(price);
  const isPositive = change >= 0;

  // Color variants for different assets
  const colorVariants = {
    1: { // Bitcoin - Orange
      gradient: 'from-orange-800 via-orange-700 to-amber-900',
      accent: 'from-orange-600 to-amber-600',
      border: 'border-orange-500/30',
      glow: 'shadow-orange-500/20'
    },
    2: { // Ethereum - Purple
      gradient: 'from-purple-800 via-purple-700 to-indigo-900',
      accent: 'from-purple-600 to-indigo-600',
      border: 'border-purple-500/30',
      glow: 'shadow-purple-500/20'
    },
    3: { // Binance - Yellow
      gradient: 'from-yellow-800 via-yellow-700 to-amber-900',
      accent: 'from-yellow-600 to-amber-600',
      border: 'border-yellow-500/30',
      glow: 'shadow-yellow-500/20'
    },
    4: { // Chainlink - Blue
      gradient: 'from-blue-800 via-blue-700 to-cyan-900',
      accent: 'from-blue-600 to-cyan-600',
      border: 'border-blue-500/30',
      glow: 'shadow-blue-500/20'
    },
    5: { // Default - Gray
      gradient: 'from-slate-800 via-slate-700 to-slate-900',
      accent: 'from-slate-600 to-slate-700',
      border: 'border-slate-500/30',
      glow: 'shadow-slate-500/20'
    }
  };

  const currentVariant = colorVariants[colorVariant] || colorVariants[5];

  // Animate price changes
  useEffect(() => {
    setAnimatedPrice(price);
  }, [price]);

  const formatPrice = (value) => {
    if (currency === "USD") {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    }
    return `${value.toLocaleString()}`;
  };

  const formatChange = (value) => {
    const sign = value >= 0 ? '+' : '';
    if (currency === "USD") {
      return `${sign}${value.toFixed(2)}`;
    }
    return `${sign}${value.toLocaleString()}`;
  };

  // Enhanced SVG chart component
  const MiniChart = ({ data, isPositive }) => {
    if (!data || data.length === 0) return null;

    const width = 80;
    const height = 30;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    // Create a closed area for the gradient fill
    const areaPoints = `0,${height} ${points} ${width},${height}`;
    
    // Define gradient colors based on trend
    const gradientColor = isPositive ? 
      ["rgba(16, 185, 129, 0.3)", "rgba(16, 185, 129, 0)"] : 
      ["rgba(239, 68, 68, 0.3)", "rgba(239, 68, 68, 0)"];
    
    const strokeColor = isPositive ? "#10b981" : "#ef4444";
    
    return (
      <svg width={width} height={height} className="opacity-90">
        <defs>
          <linearGradient id={`chartGradient-${isPositive ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradientColor[0]} />
            <stop offset="100%" stopColor={gradientColor[1]} />
          </linearGradient>
        </defs>
        
        {/* Gradient area */}
        <polygon
          points={areaPoints}
          fill={`url(#chartGradient-${isPositive ? 'up' : 'down'})`}
        />
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Highlight the last point */}
        <circle 
          cx={(data.length - 1) / (data.length - 1) * width} 
          cy={height - ((data[data.length - 1] - min) / range) * height} 
          r="2" 
          fill="#fff" 
          stroke={strokeColor} 
          strokeWidth="1" 
        />
      </svg>
    );
  };

  return (
    <div className={`relative bg-gradient-to-br ${currentVariant.gradient} rounded-lg p-4 border ${currentVariant.border} 
      hover:shadow-lg ${currentVariant.glow} transition-all duration-300 hover:scale-[1.02] 
      min-w-[220px] max-w-[260px] backdrop-blur-sm cursor-pointer`}>
      
      {/* Shimmering effect for background */}
      <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50"></div>
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent opacity-50"></div>
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center space-x-2">
          <div className={`w-9 h-9 rounded-full bg-gradient-to-r ${currentVariant.accent} 
            flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
            {symbol.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-white font-bold text-sm">{symbol}</div>
            <div className="text-gray-300 text-xs">{name}</div>
          </div>
        </div>
      </div>

      {/* Price with animation */}
      <div className="mb-3 relative z-10">
        <div className="text-white text-lg font-bold mb-1 transition-all duration-300">
          {formatPrice(animatedPrice)}
        </div>
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-400' : 'text-red-400'} 
            rounded-full px-2 py-0.5 bg-white/5 backdrop-blur-sm`}>
            {isPositive ? (
              <TrendingUp size={12} strokeWidth={2.5} />
            ) : (
              <TrendingDown size={12} strokeWidth={2.5} />
            )}
            <span className="text-xs font-medium">
              {formatChange(change)} ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="flex justify-end relative z-10">
        <MiniChart data={chartData} isPositive={isPositive} />
      </div>

      {/* Bottom accent line with animation */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${currentVariant.accent} 
        rounded-b-lg opacity-80 group-hover:opacity-100 transition-opacity duration-300`}></div>
        
      {/* Pulse effect for active price changes */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${currentVariant.accent} rounded-lg opacity-0
        filter blur-md transition-opacity duration-300 ${Math.random() > 0.8 ? 'animate-pulse opacity-10' : ''}`}></div>
    </div>
  );
};

// Market Overview Component
const MarketOverview = () => {
  const [marketData, setMarketData] = useState([
    {
      id: 1,
      symbol: "BTC",
      name: "Bitcoin",
      price: 38769.45,
      change: -1234.55,
      changePercent: -3.1,
      chartData: [40000, 39800, 39500, 38900, 38769, 39100, 38769],
      colorVariant: 1,
      currency: "USD"
    },
    {
      id: 2,
      symbol: "ETH",
      name: "Ethereum",
      price: 2769.85,
      change: 102.34,
      changePercent: 3.8,
      chartData: [2650, 2680, 2720, 2750, 2769, 2755, 2769],
      colorVariant: 2,
      currency: "USD"
    },
    {
      id: 3,
      symbol: "BNB",
      name: "Binance",
      price: 302.89,
      change: 11.23,
      changePercent: 3.8,
      chartData: [290, 295, 298, 302, 305, 301, 302],
      colorVariant: 3,
      currency: "USD"
    },
    {
      id: 4,
      symbol: "LINK",
      name: "Chainlink",
      price: 38769.45,
      change: -456.78,
      changePercent: -1.2,
      chartData: [39200, 39000, 38900, 38800, 38769, 38850, 38769],
      colorVariant: 4,
      currency: "USD"
    },
    {
      id: 5,
      symbol: "ETH",
      name: "Ethereum",
      price: 2769.85,
      change: 89.45,
      changePercent: 3.3,
      chartData: [2680, 2700, 2720, 2750, 2769, 2755, 2769],
      colorVariant: 2,
      currency: "USD"
    },
    {
      id: 6,
      symbol: "LTC",
      name: "Litecoin",
      price: 102.89,
      change: 5.67,
      changePercent: 5.8,
      chartData: [95, 98, 100, 102, 104, 101, 102],
      colorVariant: 5,
      currency: "USD"
    }
  ]);

  // State for timeframe and selected market
  const [timeframe, setTimeframe] = useState('24h');
  const [selectedMarket, setSelectedMarket] = useState(null);
  
  // Handle market card selection
  const handleMarketSelect = (id) => {
    setSelectedMarket(selectedMarket === id ? null : id);
  };

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prevData => 
        prevData.map(item => {
          // Generate more realistic price movements
          const priceChange = item.price * (Math.random() - 0.48) * 0.01;
          const newPrice = item.price + priceChange;
          const newChange = item.change + priceChange;
          const newPercentage = (newChange / (newPrice - newChange)) * 100;
          
          return {
            ...item,
            price: newPrice,
            change: newChange,
            changePercent: newPercentage,
            chartData: [...item.chartData.slice(1), newPrice]
          };
        })
      );
    }, 3000); // Update every 3 seconds for more dynamic feeling

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 bg-slate-900/40 rounded-xl border border-slate-800/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Market Overview</h3>
          <p className="text-gray-400 text-sm">Real-time crypto price movements</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Timeframe selector */}
          <div className="bg-slate-800/50 rounded-lg p-1 flex items-center space-x-1">
            {['1h', '24h', '7d', '30d'].map((time) => (
              <button
                key={time}
                onClick={() => setTimeframe(time)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  timeframe === time
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400">Live</span>
          </div>
        </div>
      </div>
      
      {/* Scrollable Market Cards */}
      <div className="overflow-x-auto">
        <div className="flex space-x-4 pb-2" style={{ minWidth: 'max-content' }}>
          {marketData.map((item) => (
            <div 
              key={item.id}
              onClick={() => handleMarketSelect(item.id)}
              className={`transition-all duration-300 ${
                selectedMarket && selectedMarket !== item.id ? 'opacity-50 scale-95' : 'opacity-100'
              }`}
            >
              <MarketCard
                symbol={item.symbol}
                name={item.name}
                price={item.price}
                change={item.change}
                changePercent={item.changePercent}
                chartData={item.chartData}
                colorVariant={item.colorVariant}
                currency={item.currency}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;
