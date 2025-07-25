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

  // Simple SVG chart component
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

    return (
      <svg width={width} height={height} className="opacity-80">
        <polyline
          points={points}
          fill="none"
          stroke={isPositive ? "#10b981" : "#ef4444"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div className={`relative bg-gradient-to-br ${currentVariant.gradient} rounded-lg p-4 border ${currentVariant.border} hover:shadow-lg ${currentVariant.glow} transition-all duration-300 hover:scale-[1.02] min-w-[200px] max-w-[240px] backdrop-blur-sm`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${currentVariant.accent} flex items-center justify-center text-white text-xs font-bold`}>
            {symbol.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-white font-medium text-sm">{symbol}</div>
            <div className="text-gray-300 text-xs">{name}</div>
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="mb-3">
        <div className="text-white text-lg font-bold mb-1">
          {formatPrice(animatedPrice)}
        </div>
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? (
              <TrendingUp size={12} />
            ) : (
              <TrendingDown size={12} />
            )}
            <span className="text-xs font-medium">
              {formatChange(change)} ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="flex justify-end">
        <MiniChart data={chartData} isPositive={isPositive} />
      </div>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${currentVariant.accent} rounded-b-lg`}></div>
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

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prevData => 
        prevData.map(item => ({
          ...item,
          price: item.price + (Math.random() - 0.5) * 50,
          change: item.change + (Math.random() - 0.5) * 10,
          changePercent: item.changePercent + (Math.random() - 0.5) * 2,
          chartData: [...item.chartData.slice(1), item.price + (Math.random() - 0.5) * 100]
        }))
      );
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className=" p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Market Overview</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </div>
      
      {/* Scrollable Market Cards */}
      <div className="overflow-x-auto">
        <div className="flex space-x-4 pb-2" style={{ minWidth: 'max-content' }}>
          {marketData.map((item) => (
            <MarketCard
              key={item.id}
              symbol={item.symbol}
              name={item.name}
              price={item.price}
              change={item.change}
              changePercent={item.changePercent}
              chartData={item.chartData}
              colorVariant={item.colorVariant}
              currency={item.currency}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;
