import React, { useState, useEffect } from 'react';
import { useLivePrices, useLivePrice } from '../hooks/useLivePrices';
import { TrendingUp, TrendingDown, Activity, RefreshCw, Wifi, WifiOff } from 'lucide-react';

/**
 * Live Price Ticker - Shows multiple symbols in a horizontal ticker
 */
export function LivePriceTicker({ symbols = [], accountId, className = "" }) {
  const { prices, loading, error, connected } = useLivePrices(symbols, accountId, {
    method: 'polling',
    interval: 2000
  });

  if (loading) {
    return (
      <div className={`flex items-center space-x-4 p-2 ${className}`}>
        <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
        <span className="text-sm text-gray-400">Loading prices...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 p-2 text-red-400 ${className}`}>
        <WifiOff className="h-4 w-4" />
        <span className="text-sm">Price feed error</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-6 p-2 overflow-x-auto ${className}`}>
      <div className="flex items-center space-x-2">
        {connected ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        <span className="text-xs text-gray-400">
          {connected ? 'Live' : 'Disconnected'}
        </span>
      </div>
      
      {symbols.map(symbol => {
        const price = prices[symbol];
        if (!price) return null;

        const change = price.change || 0;
        const isPositive = change >= 0;

        return (
          <div key={symbol} className="flex items-center space-x-2 min-w-max">
            <span className="font-medium text-white">{symbol}</span>
            <span className="text-green-400">{price.bid?.toFixed(5) || '--'}</span>
            <span className="text-red-400">{price.ask?.toFixed(5) || '--'}</span>
            <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span className="text-xs">
                {isPositive ? '+' : ''}{change?.toFixed(5) || '0.00000'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Live Price Card - Detailed view for a single symbol
 */
export function LivePriceCard({ symbol, accountId, className = "" }) {
  const { price, loading, error, connected } = useLivePrice(symbol, accountId, {
    method: 'polling',
    interval: 1000
  });

  if (loading) {
    return (
      <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-3"></div>
          <div className="h-8 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-800 border border-red-600 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2 text-red-400">
          <WifiOff className="h-5 w-5" />
          <span>Error loading {symbol}</span>
        </div>
      </div>
    );
  }

  if (!price) {
    return (
      <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 ${className}`}>
        <div className="text-gray-400">No data for {symbol}</div>
      </div>
    );
  }

  const change = price.change || 0;
  const changePercent = price.change_percent || 0;
  const isPositive = change >= 0;
  const spread = (price.ask - price.bid) || 0;

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-bold text-white">{symbol}</h3>
          {connected ? (
            <Activity className="h-4 w-4 text-green-500 animate-pulse" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
        </div>
        <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          <span className="text-sm font-medium">
            {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-gray-400 mb-1">Bid</div>
          <div className="text-xl font-mono text-green-400">
            {price.bid?.toFixed(5) || '--'}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Ask</div>
          <div className="text-xl font-mono text-red-400">
            {price.ask?.toFixed(5) || '--'}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Spread:</span>
          <span className="text-white font-mono">{spread.toFixed(5)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Change:</span>
          <span className={`font-mono ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{change.toFixed(5)}
          </span>
        </div>
      </div>

      {price.timestamp && (
        <div className="mt-3 text-xs text-gray-500">
          Updated: {new Date(price.timestamp).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

/**
 * Mini Price Widget - Compact version for dashboards
 */
export function MiniPriceWidget({ symbol, accountId, showChange = true, className = "" }) {
  const { price, loading, connected } = useLivePrice(symbol, accountId, {
    method: 'polling',
    interval: 2000
  });

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
        <span className="text-sm text-gray-400">{symbol}</span>
      </div>
    );
  }

  if (!price) {
    return (
      <div className={`flex items-center space-x-2 text-gray-400 ${className}`}>
        <WifiOff className="h-3 w-3" />
        <span className="text-sm">{symbol}</span>
      </div>
    );
  }

  const change = price.change || 0;
  const isPositive = change >= 0;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {connected ? (
        <Activity className="h-3 w-3 text-green-500" />
      ) : (
        <WifiOff className="h-3 w-3 text-red-500" />
      )}
      <span className="text-sm font-medium text-white">{symbol}</span>
      <span className="text-sm font-mono text-green-400">
        {price.bid?.toFixed(4) || '--'}
      </span>
      {showChange && (
        <span className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}{change.toFixed(4)}
        </span>
      )}
    </div>
  );
}

/**
 * Price Grid - Multiple symbols in a grid layout
 */
export function LivePriceGrid({ symbols = [], accountId, columns = 3, className = "" }) {
  const { prices, loading, error, connected } = useLivePrices(symbols, accountId, {
    method: 'polling',
    interval: 2000
  });

  if (loading) {
    return (
      <div className={`grid gap-4 ${className}`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: symbols.length }).map((_, index) => (
          <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-700 rounded mb-2"></div>
            <div className="h-6 bg-gray-700 rounded mb-1"></div>
            <div className="h-4 bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center p-8 text-red-400 ${className}`}>
        <WifiOff className="h-8 w-8 mx-auto mb-2" />
        <div>Failed to load price data</div>
        <div className="text-sm text-gray-400 mt-1">{error.message}</div>
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${className}`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {symbols.map(symbol => {
        const price = prices[symbol];
        
        return (
          <div key={symbol} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">{symbol}</span>
              {connected ? (
                <Activity className="h-3 w-3 text-green-500" />
              ) : (
                <WifiOff className="h-3 w-3 text-red-500" />
              )}
            </div>
            
            {price ? (
              <>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-400">Bid</span>
                  <span className="font-mono text-green-400">
                    {price.bid?.toFixed(5) || '--'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Ask</span>
                  <span className="font-mono text-red-400">
                    {price.ask?.toFixed(5) || '--'}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-400 text-sm">No data</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Price Comparison Widget - Shows spread between two symbols
 */
export function PriceSpreadWidget({ symbol1, symbol2, accountId, className = "" }) {
  const [spreadData, setSpreadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!symbol1 || !symbol2 || !accountId) return;

    const fetchSpread = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://api.tradexas.com/api/v1/broker/${accountId}/spread-price/${symbol1}/${symbol2}`, {
          headers: {
            'Authorization': localStorage.getItem('access_token'),
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch spread data');
        }

        const data = await response.json();
        setSpreadData(data);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSpread();
    const interval = setInterval(fetchSpread, 3000);

    return () => clearInterval(interval);
  }, [symbol1, symbol2, accountId]);

  if (loading) {
    return (
      <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-3"></div>
          <div className="h-8 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-800 border border-red-600 rounded-lg p-4 ${className}`}>
        <div className="text-red-400">Error loading spread</div>
      </div>
    );
  }

  if (!spreadData) {
    return (
      <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 ${className}`}>
        <div className="text-gray-400">No spread data</div>
      </div>
    );
  }

  const spread = spreadData.bid || 0;
  const isPositive = spread >= 0;

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white">
          {symbol1} - {symbol2}
        </h3>
        <Activity className="h-4 w-4 text-green-500 animate-pulse" />
      </div>

      <div className="text-center">
        <div className="text-xs text-gray-400 mb-1">Spread</div>
        <div className={`text-2xl font-mono font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}{spread.toFixed(5)}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Bid:</span>
          <span className="text-white font-mono">{spreadData.bid?.toFixed(5) || '--'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Ask:</span>
          <span className="text-white font-mono">{spreadData.ask?.toFixed(5) || '--'}</span>
        </div>
      </div>
    </div>
  );
}
