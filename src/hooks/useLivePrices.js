import { useState, useEffect, useCallback, useRef } from 'react';
import livePriceFeed from '../api/livePrices';

/**
 * Custom hook for live price data
 * @param {string|Array<string>} symbols - Symbol(s) to track
 * @param {string} accountId - Broker account ID
 * @param {Object} options - Configuration options
 * @returns {Object} Price data and controls
 */
export function useLivePrices(symbols, accountId, options = {}) {
  const {
    method = 'polling', // 'polling', 'websocket', 'subscription'
    interval = 2000,
    autoStart = true,
    onError = null
  } = options;

  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  const intervalRef = useRef(null);
  const wsRef = useRef(null);
  const componentId = useRef(`price-hook-${Date.now()}`);

  // Normalize symbols to array
  const symbolList = Array.isArray(symbols) ? symbols : [symbols];

  // Handle price updates
  const handlePriceUpdate = useCallback((priceData) => {
    setPrices(prev => ({
      ...prev,
      [priceData.symbol]: priceData
    }));
    setLoading(false);
    setError(null);
  }, []);

  // Setup polling method
  const setupPolling = useCallback(async () => {
    if (!accountId || symbolList.length === 0) return;

    try {
      setLoading(true);
      const data = await livePriceFeed.getMultiplePrices(symbolList, accountId);
      
      const priceMap = {};
      if (data.prices) {
        data.prices.forEach(price => {
          if (price.success) {
            priceMap[price.symbol] = price;
          }
        });
      }
      
      setPrices(priceMap);
      setConnected(true);
      setLoading(false);
      setError(null);

      // Start polling interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(async () => {
        try {
          const updateData = await livePriceFeed.getMultiplePrices(symbolList, accountId);
          if (updateData.prices) {
            const updateMap = {};
            updateData.prices.forEach(price => {
              if (price.success) {
                updateMap[price.symbol] = price;
              }
            });
            setPrices(prev => ({ ...prev, ...updateMap }));
          }
        } catch (pollError) {
          console.error('Polling error:', pollError);
          if (onError) onError(pollError);
        }
      }, interval);

    } catch (error) {
      setError(error);
      setLoading(false);
      if (onError) onError(error);
    }
  }, [accountId, symbolList, interval, onError]);

  // Setup WebSocket method
  const setupWebSocket = useCallback(async () => {
    if (!accountId || symbolList.length === 0) return;

    try {
      setLoading(true);
      
      wsRef.current = await livePriceFeed.setupWebSocketStream(
        symbolList,
        accountId,
        handlePriceUpdate
      );

      setConnected(true);
      setLoading(false);
      setError(null);

    } catch (error) {
      setError(error);
      setLoading(false);
      setConnected(false);
      if (onError) onError(error);
    }
  }, [accountId, symbolList, handlePriceUpdate, onError]);

  // Setup subscription method
  const setupSubscription = useCallback(async () => {
    if (!accountId || symbolList.length === 0) return;

    try {
      setLoading(true);
      
      const connectionId = await livePriceFeed.setupPriceSubscription(accountId, symbolList);
      
      // Get initial prices from cache
      const initialPrices = {};
      symbolList.forEach(symbol => {
        const cached = livePriceFeed.getCachedPrice(symbol);
        if (cached) {
          initialPrices[symbol] = cached;
        }
      });
      setPrices(initialPrices);

      setConnected(true);
      setLoading(false);
      setError(null);

      // Start polling for updates
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(async () => {
        try {
          const updates = await livePriceFeed.getPriceUpdates(accountId, connectionId);
          if (updates.length > 0) {
            const updateMap = {};
            updates.forEach(price => {
              updateMap[price.symbol] = price;
            });
            setPrices(prev => ({ ...prev, ...updateMap }));
          }
        } catch (updateError) {
          console.error('Subscription update error:', updateError);
          if (onError) onError(updateError);
        }
      }, interval);

    } catch (error) {
      setError(error);
      setLoading(false);
      if (onError) onError(error);
    }
  }, [accountId, symbolList, interval, onError]);

  // Start price feed
  const start = useCallback(() => {
    switch (method) {
      case 'websocket':
        setupWebSocket();
        break;
      case 'subscription':
        setupSubscription();
        break;
      default:
        setupPolling();
        break;
    }
  }, [method, setupWebSocket, setupSubscription, setupPolling]);

  // Stop price feed
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    livePriceFeed.unsubscribe(componentId.current);
    setConnected(false);
  }, []);

  // Restart price feed
  const restart = useCallback(() => {
    stop();
    setTimeout(start, 100);
  }, [stop, start]);

  // Setup effect
  useEffect(() => {
    if (autoStart && accountId && symbolList.length > 0) {
      start();
    }

    return () => {
      stop();
    };
  }, [autoStart, accountId, symbolList, start, stop]);

  // Subscribe to live price feed notifications
  useEffect(() => {
    livePriceFeed.subscribe(componentId.current, handlePriceUpdate);
    
    return () => {
      livePriceFeed.unsubscribe(componentId.current);
    };
  }, [handlePriceUpdate]);

  return {
    prices,
    loading,
    error,
    connected,
    start,
    stop,
    restart
  };
}

/**
 * Hook for single symbol price
 * @param {string} symbol - Trading symbol
 * @param {string} accountId - Broker account ID
 * @param {Object} options - Configuration options
 * @returns {Object} Single price data and controls
 */
export function useLivePrice(symbol, accountId, options = {}) {
  const { prices, loading, error, connected, start, stop, restart } = useLivePrices(
    symbol,
    accountId,
    options
  );

  return {
    price: prices[symbol] || null,
    loading,
    error,
    connected,
    start,
    stop,
    restart
  };
}

/**
 * Hook for popular symbols
 * @param {Object} options - Configuration options
 * @returns {Object} Popular symbols data
 */
export function usePopularSymbols(options = {}) {
  const { autoFetch = true } = options;
  
  const [symbols, setSymbols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPopularSymbols = useCallback(async () => {
    try {
      setLoading(true);
      const data = await livePriceFeed.getPopularSymbols();
      setSymbols(data.symbols || []);
      setError(null);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchPopularSymbols();
    }
  }, [autoFetch, fetchPopularSymbols]);

  return {
    symbols,
    loading,
    error,
    refetch: fetchPopularSymbols
  };
}

/**
 * Hook for symbol search
 * @param {string} query - Search query
 * @param {Object} options - Configuration options
 * @returns {Object} Search results and controls
 */
export function useSymbolSearch(query, options = {}) {
  const { limit = 20, debounceMs = 300 } = options;
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const timeoutRef = useRef(null);

  const search = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const data = await livePriceFeed.searchSymbols(searchQuery, limit);
      setResults(data.symbols || []);
      setError(null);
    } catch (error) {
      setError(error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      search(query);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, search, debounceMs]);

  return {
    results,
    loading,
    error,
    search
  };
}
