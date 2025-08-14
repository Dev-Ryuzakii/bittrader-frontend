import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Activity } from 'lucide-react';
import { getRealTimePrice, getRealTimePrices } from '../../api/broker';

const RealTimePriceDisplay = ({ 
  accountId, 
  symbol, 
  symbols = [], 
  updateInterval = 5000,
  className = "",
  compact = false 
}) => {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (accountId && (symbol || symbols.length > 0)) {
      fetchPrices();
      startPriceUpdates();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [accountId, symbol, symbols, updateInterval]);

  const fetchPrices = async () => {
    if (!accountId) return;

    try {
      setLoading(true);
      let result;

      if (symbol) {
        // Single symbol
        result = await getRealTimePrice(accountId, symbol);
        if (result.success) {
          setPrices({ [symbol]: result.data });
        }
      } else if (symbols.length > 0) {
        // Multiple symbols
        result = await getRealTimePrices(accountId, symbols);
        if (result.success) {
          setPrices(result.data);
        }
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch real-time prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const startPriceUpdates = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(fetchPrices, updateInterval);
  };

  const formatPrice = (price) => {
    if (typeof price !== 'number') return '--';
    return price.toFixed(5);
  };

  const formatChange = (change) => {
    if (typeof change !== 'number') return '--';
    return change.toFixed(2);
  };

  const getPriceColor = (change) => {
    if (typeof change !== 'number') return 'text-gray-400';
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getTrendIcon = (change) => {
    if (typeof change !== 'number') return <Minus size={14} />;
    if (change > 0) return <TrendingUp size={14} />;
    if (change < 0) return <TrendingDown size={14} />;
    return <Minus size={14} />;
  };

  const formatTime = () => {
    if (!lastUpdate) return '';
    return lastUpdate.toLocaleTimeString();
  };

  if (compact && symbol) {
    const priceData = prices[symbol];
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <span className="text-sm text-gray-300">{symbol}</span>
        <span className={`text-sm font-medium ${getPriceColor(priceData?.change_pct)}`}>
          {formatPrice(priceData?.price)}
        </span>
        <div className={`flex items-center ${getPriceColor(priceData?.change_pct)}`}>
          {getTrendIcon(priceData?.change_pct)}
          <span className="text-xs ml-1">{formatChange(priceData?.change_pct)}%</span>
        </div>
      </div>
    );
  }

  const symbolsToShow = symbol ? [symbol] : symbols;

  return (
    <div className={`bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Activity size={18} className="text-green-400" />
          <h4 className="text-sm font-medium text-white">Real-Time Prices</h4>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">{formatTime()}</span>
          <button
            onClick={fetchPrices}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-white hover:bg-[#2A2A2A] rounded transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {symbolsToShow.map(sym => {
          const priceData = prices[sym];
          return (
            <div key={sym} className="flex items-center justify-between p-2 bg-[#0D1117] rounded border border-[#21262D]">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-white">{sym}</span>
                <div className={`flex items-center ${getPriceColor(priceData?.change_pct)}`}>
                  {getTrendIcon(priceData?.change_pct)}
                  <span className="text-xs ml-1">{formatChange(priceData?.change_pct)}%</span>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${getPriceColor(priceData?.change_pct)}`}>
                  {formatPrice(priceData?.price)}
                </div>
                <div className="text-xs text-gray-400">
                  {priceData?.timestamp ? new Date(priceData.timestamp).toLocaleTimeString() : '--'}
                </div>
              </div>
            </div>
          );
        })}

        {symbolsToShow.length === 0 && (
          <div className="text-center py-4 text-gray-400">
            <Activity size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No symbols selected</p>
          </div>
        )}
      </div>

      {symbolsToShow.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#2A2A2A]">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Update interval: {updateInterval / 1000}s</span>
            <span>{symbolsToShow.length} symbol{symbolsToShow.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimePriceDisplay;
