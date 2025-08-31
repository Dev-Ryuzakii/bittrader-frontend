import { useState, useEffect, useRef, useCallback } from 'react';
import { getEASymbolPrice } from '../api/ea';
import { subscribeToPrices, unsubscribeFromPrices } from '../api/livePrices';

/**
 * Custom hook for live price integration
 * @param {string} symbol - Trading symbol (e.g., 'EURUSD')
 * @param {string} accountId - Broker account ID
 * @param {Object} options - Configuration options
 * @returns {Object} Price data and control functions
 */
export const useLivePrice = (symbol, accountId, options = {}) => {
  const {
    updateInterval = 2000, // 2 seconds
    autoRefresh = true,
    onPriceUpdate = null,
    onError = null
  } = options;

  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const intervalRef = useRef(null);
  const componentId = useRef(`live-price-${Date.now()}-${Math.random()}`);
  const isMountedRef = useRef(true);

  // Fetch price function
  const fetchPrice = useCallback(async (showLoading = true) => {
    if (!symbol || !accountId) return;

    if (showLoading) setLoading(true);
    setError(null);

    try {
      const priceResponse = await getEASymbolPrice(accountId, symbol);
      
      if (isMountedRef.current && priceResponse.success && priceResponse.data) {
        setPrice(priceResponse.data);
        setLastUpdate(new Date());
        
        // Call user callback if provided
        if (onPriceUpdate) {
          onPriceUpdate(priceResponse.data);
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err.message || 'Failed to fetch price';
        setError(errorMessage);
        
        // Call user error callback if provided
        if (onError) {
          onError(err);
        }
      }
    } finally {
      if (isMountedRef.current && showLoading) {
        setLoading(false);
      }
    }
  }, [symbol, accountId, onPriceUpdate, onError]);

  // Manual refresh function
  const refreshPrice = useCallback(() => {
    fetchPrice(true);
  }, [fetchPrice]);

  // Setup auto-refresh
  useEffect(() => {
    if (!symbol || !accountId || !autoRefresh) return;

    // Initial fetch
    fetchPrice(true);

    // Setup interval for continuous updates
    intervalRef.current = setInterval(() => {
      fetchPrice(false); // Don't show loading for background updates
    }, updateInterval);

    // Subscribe to live updates (if available)
    subscribeToPrices(componentId.current, (priceData) => {
      if (priceData.symbol === symbol && isMountedRef.current) {
        setPrice(priceData);
        setLastUpdate(new Date());
        
        if (onPriceUpdate) {
          onPriceUpdate(priceData);
        }
      }
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      unsubscribeFromPrices(componentId.current);
    };
  }, [symbol, accountId, autoRefresh, updateInterval, fetchPrice, onPriceUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      unsubscribeFromPrices(componentId.current);
    };
  }, []);

  return {
    price,
    loading,
    error,
    lastUpdate,
    refreshPrice,
    // Convenience getters
    bid: price?.bid,
    ask: price?.ask,
    spread: price?.spread || (price?.ask && price?.bid ? price.ask - price.bid : null),
    isStale: lastUpdate ? (Date.now() - lastUpdate.getTime()) > (updateInterval * 2) : true
  };
};

/**
 * Hook for multiple symbols price tracking
 * @param {Array<string>} symbols - Array of trading symbols
 * @param {string} accountId - Broker account ID
 * @param {Object} options - Configuration options
 * @returns {Object} Prices data and control functions
 */
export const useMultipleLivePrices = (symbols, accountId, options = {}) => {
  const {
    updateInterval = 3000, // 3 seconds for multiple symbols
    autoRefresh = true
  } = options;

  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  const fetchPrices = useCallback(async () => {
    if (!symbols?.length || !accountId) return;

    setLoading(true);
    setErrors({});

    const newPrices = {};
    const newErrors = {};

    // Fetch prices for each symbol
    await Promise.allSettled(
      symbols.map(async (symbol) => {
        try {
          const priceResponse = await getEASymbolPrice(accountId, symbol);
          if (priceResponse.success && priceResponse.data) {
            newPrices[symbol] = priceResponse.data;
          } else {
            throw new Error(priceResponse.error || 'Failed to fetch price');
          }
        } catch (error) {
          newErrors[symbol] = error.message;
        }
      })
    );

    if (isMountedRef.current) {
      setPrices(newPrices);
      setErrors(newErrors);
      setLastUpdate(new Date());
      setLoading(false);
    }
  }, [symbols, accountId]);

  // Setup auto-refresh
  useEffect(() => {
    if (!symbols?.length || !accountId || !autoRefresh) return;

    // Initial fetch
    fetchPrices();

    // Setup interval
    intervalRef.current = setInterval(fetchPrices, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [symbols, accountId, autoRefresh, updateInterval, fetchPrices]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    prices,
    loading,
    errors,
    lastUpdate,
    refreshPrices: fetchPrices,
    // Convenience getters
    getPrice: (symbol) => prices[symbol],
    getBid: (symbol) => prices[symbol]?.bid,
    getAsk: (symbol) => prices[symbol]?.ask,
    getSpread: (symbol) => {
      const price = prices[symbol];
      return price?.spread || (price?.ask && price?.bid ? price.ask - price.bid : null);
    },
    hasError: (symbol) => !!errors[symbol],
    getError: (symbol) => errors[symbol]
  };
};

export default useLivePrice;
