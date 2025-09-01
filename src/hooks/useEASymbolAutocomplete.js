import { useState, useEffect, useRef, useCallback } from 'react';
import { searchEASymbols, getEAPopularSymbols, getEASymbols } from '../api/ea';

/**
 * Custom hook for EA symbol autocomplete functionality
 * Provides state management and API integration for symbol search
 * 
 * @param {Object} eaAccount - EA account object
 * @param {Object} options - Configuration options
 * @returns {Object} - Hook state and methods
 */
export const useEASymbolAutocomplete = (eaAccount, options = {}) => {
  const {
    minSearchLength = 2,
    searchDebounceMs = 300,
    maxResults = 20,
    enablePopularSymbols = true
  } = options;

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [popularSymbols, setPopularSymbols] = useState({});
  const [allSymbols, setAllSymbols] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs
  const searchTimeoutRef = useRef(null);
  const lastSearchTermRef = useRef('');

  // Initialize when account changes
  useEffect(() => {
    if (eaAccount?.account_id) {
      initializeSymbols();
    } else {
      resetState();
    }
  }, [eaAccount?.account_id]);

  // Reset state
  const resetState = useCallback(() => {
    setSearchTerm('');
    setSearchResults([]);
    setPopularSymbols({});
    setAllSymbols([]);
    setError(null);
    setIsInitialized(false);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  // Initialize symbols data
  const initializeSymbols = useCallback(async () => {
    if (!eaAccount?.account_id) return;

    try {
      setLoading(true);
      setError(null);

      // Load all symbols and popular symbols concurrently
      const promises = [
        getEASymbols(eaAccount.account_id)
      ];

      if (enablePopularSymbols) {
        promises.push(getEAPopularSymbols(eaAccount.account_id));
      }

      const results = await Promise.all(promises);
      const [symbolsResponse, popularResponse] = results;

      // Handle symbols
      if (symbolsResponse.success && symbolsResponse.data) {
        setAllSymbols(symbolsResponse.data);
      }

      // Handle popular symbols
      if (enablePopularSymbols && popularResponse?.success && popularResponse.data) {
        setPopularSymbols(popularResponse.data);
      }

      setIsInitialized(true);
    } catch (err) {
      console.error('Error initializing EA symbols:', err);
      setError('Failed to load symbols');
    } finally {
      setLoading(false);
    }
  }, [eaAccount?.account_id, enablePopularSymbols]);

  // Perform search
  const performSearch = useCallback(async (term) => {
    if (!eaAccount?.account_id || !term || term.length < minSearchLength) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await searchEASymbols(eaAccount.account_id, term, maxResults);

      if (response.success && response.data) {
        setSearchResults(response.data);
      } else {
        setError(response.error || 'No symbols found');
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error searching EA symbols:', err);
      setError('Search failed');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [eaAccount?.account_id, minSearchLength, maxResults]);

  // Debounced search
  const searchSymbols = useCallback((term) => {
    setSearchTerm(term);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Skip search if term hasn't changed
    if (term === lastSearchTermRef.current) {
      return;
    }

    lastSearchTermRef.current = term;

    // Clear results immediately if term is too short
    if (!term || term.length < minSearchLength) {
      setSearchResults([]);
      setError(null);
      return;
    }

    // Debounce the search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(term);
    }, searchDebounceMs);
  }, [performSearch, minSearchLength, searchDebounceMs]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setSearchResults([]);
    setError(null);
    lastSearchTermRef.current = '';
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  // Filter symbols locally (for instant results)
  const filterSymbolsLocally = useCallback((term, symbols = allSymbols) => {
    if (!term || term.length < 2) return [];

    const upperTerm = term.toUpperCase();
    
    return symbols
      .filter(symbolInfo => {
        const symbol = (symbolInfo.symbol || symbolInfo.standard_symbol || '').toString().toUpperCase();
        const brokerSymbol = (symbolInfo.broker_symbol || '').toString().toUpperCase();
        const description = (symbolInfo.description || '').toString().toUpperCase();
        
        return symbol.includes(upperTerm) || 
               brokerSymbol.includes(upperTerm) || 
               description.includes(upperTerm);
      })
      .map(symbolInfo => {
        const symbol = (symbolInfo.symbol || symbolInfo.standard_symbol || '').toString().toUpperCase();
        const brokerSymbol = (symbolInfo.broker_symbol || '').toString().toUpperCase();
        
        // Calculate relevance score
        let score = 0;
        if (symbol === upperTerm) score = 100;
        else if (symbol.startsWith(upperTerm)) score = 90;
        else if (brokerSymbol === upperTerm) score = 85;
        else if (brokerSymbol.startsWith(upperTerm)) score = 80;
        else if (symbol.includes(upperTerm)) score = 70;
        else if (brokerSymbol.includes(upperTerm)) score = 65;
        else score = 60;

        return {
          ...symbolInfo,
          relevance_score: score
        };
      })
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, maxResults);
  }, [allSymbols, maxResults]);

  // Get instant results (local filtering)
  const getInstantResults = useCallback((term) => {
    return filterSymbolsLocally(term);
  }, [filterSymbolsLocally]);

  // Get symbols by category
  const getSymbolsByCategory = useCallback((category) => {
    return popularSymbols[category] || [];
  }, [popularSymbols]);

  // Get all categories
  const getCategories = useCallback(() => {
    return Object.keys(popularSymbols);
  }, [popularSymbols]);

  // Check if symbol exists
  const symbolExists = useCallback((symbolName) => {
    if (!symbolName) return false;
    const upperSymbol = symbolName.toUpperCase();
    return allSymbols.some(s => {
      const symbol = (s.symbol || s.standard_symbol || '').toString().toUpperCase();
      const brokerSymbol = (s.broker_symbol || '').toString().toUpperCase();
      return symbol === upperSymbol || brokerSymbol === upperSymbol;
    });
  }, [allSymbols]);

  // Get symbol info
  const getSymbolInfo = useCallback((symbolName) => {
    if (!symbolName) return null;
    const upperSymbol = symbolName.toUpperCase();
    return allSymbols.find(s => {
      const symbol = (s.symbol || s.standard_symbol || '').toString().toUpperCase();
      const brokerSymbol = (s.broker_symbol || '').toString().toUpperCase();
      return symbol === upperSymbol || brokerSymbol === upperSymbol;
    });
  }, [allSymbols]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    searchTerm,
    searchResults,
    popularSymbols,
    allSymbols,
    loading,
    error,
    isInitialized,
    
    // Actions
    searchSymbols,
    clearSearch,
    initializeSymbols,
    resetState,
    
    // Helpers
    getInstantResults,
    getSymbolsByCategory,
    getCategories,
    symbolExists,
    getSymbolInfo,
    
    // Utils
    hasResults: searchResults.length > 0,
    hasPopularSymbols: Object.keys(popularSymbols).length > 0,
    totalSymbols: allSymbols.length,
    isSearching: loading && searchTerm.length >= minSearchLength,
    canSearch: !!eaAccount?.account_id && isInitialized
  };
};

export default useEASymbolAutocomplete;
