import { useState, useEffect } from 'react';
import { getPopularSymbols, searchSymbols, getAvailableSymbols } from './symbolpicker.js';

/**
 * Custom hook for SymbolPicker component
 * @param {Object} options - Hook options
 * @param {string} options.initialSymbol - Initial symbol
 * @param {Array} options.accounts - Trading accounts
 * @param {boolean} options.enableCache - Enable symbol caching
 * @param {number} options.cacheExpiry - Cache expiry time in milliseconds
 * @returns {Object} - Symbol picker state and methods
 */
export const useSymbolPicker = ({ 
  initialSymbol = '', 
  accounts = [],
  enableCache = true,
  cacheExpiry = 5 * 60 * 1000 // 5 minutes
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [popularSymbols, setPopularSymbols] = useState({});
  const [availableSymbols, setAvailableSymbols] = useState([]);
  const [recentSymbols, setRecentSymbols] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load recent symbols from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('recentSymbols');
      if (stored) {
        setRecentSymbols(JSON.parse(stored));
      }
    } catch (error) {
      //console.error('Error loading recent symbols:', error);
      setError('Failed to load recent symbols');
    }
  }, []);

  // Load popular symbols on mount
  useEffect(() => {
    loadPopularSymbols();
  }, [accounts]);

  // Load available symbols when accounts change
  useEffect(() => {
    if (accounts.length > 0) {
      loadAvailableSymbols();
    }
  }, [accounts]);

  // Save symbol to recent symbols when selected
  useEffect(() => {
    if (selectedSymbol) {
      addToRecentSymbols(selectedSymbol);
    }
  }, [selectedSymbol]);

  /**
   * Load popular symbols from API
   */
  const loadPopularSymbols = async () => {
    if (enableCache) {
      const cached = getCachedData('popularSymbols');
      if (cached) {
        setPopularSymbols(cached);
        return;
      }
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await getPopularSymbols();
      setPopularSymbols(response);
      
      if (enableCache) {
        setCachedData('popularSymbols', response);
      }
    } catch (error) {
      //console.error('Error loading popular symbols:', error);
      setError('Failed to load popular symbols');
      // Fallback to empty structure
      setPopularSymbols({
        forex: [],
        crypto: [],
        commodities: [],
        indices: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load available symbols from API
   */
  const loadAvailableSymbols = async () => {
    if (enableCache) {
      const cached = getCachedData('availableSymbols');
      if (cached) {
        setAvailableSymbols(cached);
        return;
      }
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await getAvailableSymbols('', 200); // Get more symbols for filtering
      setAvailableSymbols(response.symbols || []);
      
      if (enableCache) {
        setCachedData('availableSymbols', response.symbols || []);
      }
    } catch (error) {
      //console.error('Error loading available symbols:', error);
      setError('Failed to load available symbols');
      setAvailableSymbols([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Search symbols with debouncing
   */
  const performSearch = async (term) => {
    if (!term || term.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await searchSymbols(term.trim(), 20);
      setSearchResults(response.symbols || []);
    } catch (error) {
      //console.error('Error searching symbols:', error);
      setError('Failed to search symbols');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Add symbol to recent symbols list
   */
  const addToRecentSymbols = (symbol) => {
    if (!symbol) return;
    
    const updated = [symbol, ...recentSymbols.filter(s => s !== symbol)].slice(0, 5);
    setRecentSymbols(updated);
    
    try {
      localStorage.setItem('recentSymbols', JSON.stringify(updated));
    } catch (error) {
      //console.error('Error saving recent symbols:', error);
    }
  };

  /**
   * Clear recent symbols
   */
  const clearRecentSymbols = () => {
    setRecentSymbols([]);
    try {
      localStorage.removeItem('recentSymbols');
    } catch (error) {
      //console.error('Error clearing recent symbols:', error);
    }
  };

  /**
   * Get symbol by exact match
   */
  const getSymbolByName = (symbolName) => {
    return availableSymbols.find(s => 
      s.symbol.toLowerCase() === symbolName.toLowerCase()
    );
  };

  /**
   * Check if symbol is available in any account
   */
  const isSymbolAvailable = (symbolName) => {
    const symbol = getSymbolByName(symbolName);
    return symbol && symbol.available_accounts > 0;
  };

  /**
   * Get symbols by category
   */
  const getSymbolsByCategory = (category) => {
    return popularSymbols[category] || [];
  };

  /**
   * Cache management functions
   */
  const getCachedData = (key) => {
    if (!enableCache) return null;
    
    try {
      const cached = localStorage.getItem(`symbol_cache_${key}`);
      if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < cacheExpiry) {
          return data.value;
        } else {
          localStorage.removeItem(`symbol_cache_${key}`);
        }
      }
    } catch (error) {
      //console.error('Error reading cache:', error);
    }
    return null;
  };

  const setCachedData = (key, value) => {
    if (!enableCache) return;
    
    try {
      const data = {
        value,
        timestamp: Date.now()
      };
      localStorage.setItem(`symbol_cache_${key}`, JSON.stringify(data));
    } catch (error) {
      //console.error('Error setting cache:', error);
    }
  };

  /**
   * Clear all cached data
   */
  const clearCache = () => {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('symbol_cache_'));
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      //console.error('Error clearing cache:', error);
    }
  };

  /**
   * Refresh all data
   */
  const refreshData = async () => {
    clearCache();
    await Promise.all([
      loadPopularSymbols(),
      loadAvailableSymbols()
    ]);
  };

  return {
    // State
    selectedSymbol,
    searchTerm,
    searchResults,
    popularSymbols,
    availableSymbols,
    recentSymbols,
    isLoading,
    error,

    // Setters
    setSelectedSymbol,
    setSearchTerm,
    setSearchResults,
    setPopularSymbols,
    setIsLoading,
    setError,

    // Methods
    performSearch,
    addToRecentSymbols,
    clearRecentSymbols,
    getSymbolByName,
    isSymbolAvailable,
    getSymbolsByCategory,
    refreshData,
    clearCache,
    loadPopularSymbols,
    loadAvailableSymbols
  };
};

/**
 * Hook for symbol search with debouncing
 */
export const useSymbolSearch = (delay = 300) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  // Perform search when debounced term changes
  useEffect(() => {
    if (debouncedTerm) {
      performSearch(debouncedTerm);
    } else {
      setResults([]);
    }
  }, [debouncedTerm]);

  const performSearch = async (term) => {
    if (!term || term.trim().length < 2) {
      setResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await searchSymbols(term.trim(), 15);
      setResults(response.symbols || []);
    } catch (error) {
      //console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    results,
    isSearching,
    clearResults: () => setResults([])
  };
};

/**
 * Hook for managing symbol favorites
 */
export const useSymbolFavorites = () => {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('favoriteSymbols');
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      //console.error('Error loading favorites:', error);
    }
  }, []);

  const addToFavorites = (symbol) => {
    if (!favorites.includes(symbol)) {
      const updated = [...favorites, symbol];
      setFavorites(updated);
      try {
        localStorage.setItem('favoriteSymbols', JSON.stringify(updated));
      } catch (error) {
        //console.error('Error saving favorites:', error);
      }
    }
  };

  const removeFromFavorites = (symbol) => {
    const updated = favorites.filter(s => s !== symbol);
    setFavorites(updated);
    try {
      localStorage.setItem('favoriteSymbols', JSON.stringify(updated));
    } catch (error) {
      //console.error('Error saving favorites:', error);
    }
  };

  const isFavorite = (symbol) => favorites.includes(symbol);

  const toggleFavorite = (symbol) => {
    if (isFavorite(symbol)) {
      removeFromFavorites(symbol);
    } else {
      addToFavorites(symbol);
    }
  };

  return {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite
  };
};
