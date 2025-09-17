import { useState, useEffect, useCallback } from 'react';
import { getEASymbols, getEAPopularSymbols } from '../api/ea';

/**
 * Custom hook for caching and managing available trading symbols across the app
 */
const useSymbolCache = (accountId) => {
  const [symbols, setSymbols] = useState([]);
  const [popularSymbols, setPopularSymbols] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);

  // Fetch symbols with error handling and caching
  const fetchSymbols = useCallback(async (forceRefresh = false) => {
    // Don't refetch if we have recent data (within last 5 minutes)
    if (!forceRefresh && lastFetchTime && (Date.now() - lastFetchTime < 300000)) {
      return;
    }

    if (!accountId) {
      setSymbols([]);
      setPopularSymbols({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch both regular and popular symbols concurrently
      const [symbolsResponse, popularResponse] = await Promise.all([
        getEASymbols(accountId),
        getEAPopularSymbols(accountId)
      ]);

      if (symbolsResponse.success && symbolsResponse.data) {
        const processedSymbols = symbolsResponse.data.map(symbol => ({
          ...symbol,
          displayName: symbol.description || symbol.symbol || symbol.broker_symbol,
          searchKey: (symbol.symbol + symbol.broker_symbol + symbol.description)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
        }));
        setSymbols(processedSymbols);
      } else {
        throw new Error(symbolsResponse.error || 'Failed to fetch symbols');
      }

      if (popularResponse.success && popularResponse.data) {
        setPopularSymbols(popularResponse.data);
      }

      setLastFetchTime(Date.now());
    } catch (err) {
      console.error('Error fetching symbols:', err);
      setError(err.message || 'Failed to fetch symbols');
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  // Load symbols when account changes
  useEffect(() => {
    fetchSymbols();
  }, [accountId, fetchSymbols]);

  const getFilteredSymbols = useCallback((searchTerm) => {
    if (!searchTerm) return symbols;

    const normalizedTerm = searchTerm.toLowerCase().replace(/[^a-z0-9]/g, '');
    return symbols.filter(symbol => 
      symbol.searchKey.includes(normalizedTerm)
    ).slice(0, 100); // Limit results for performance
  }, [symbols]);

  const getPopularByCategory = useCallback((category) => {
    return popularSymbols[category] || [];
  }, [popularSymbols]);

  const symbolExists = useCallback((symbolName) => {
    if (!symbolName) return false;
    const normalizedName = symbolName.toUpperCase();
    return symbols.some(s => 
      (s.symbol || '').toUpperCase() === normalizedName || 
      (s.broker_symbol || '').toUpperCase() === normalizedName
    );
  }, [symbols]);

  const getSymbolInfo = useCallback((symbolName) => {
    if (!symbolName) return null;
    const normalizedName = symbolName.toUpperCase();
    return symbols.find(s => 
      (s.symbol || '').toUpperCase() === normalizedName || 
      (s.broker_symbol || '').toUpperCase() === normalizedName
    );
  }, [symbols]);

  return {
    symbols,
    popularSymbols,
    loading,
    error,
    lastFetchTime,
    fetchSymbols,
    getFilteredSymbols,
    getPopularByCategory,
    symbolExists,
    getSymbolInfo,
    totalSymbols: symbols.length,
    hasSymbols: symbols.length > 0,
    hasPopular: Object.keys(popularSymbols).length > 0
  };
};

export default useSymbolCache;