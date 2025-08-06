import { useState, useEffect } from 'react';

/**
 * Custom hook to get mock symbols for development
 * @returns {Array} - Array of mock symbols
 */
export const getMockSymbols = () => {
  return [
    { symbol: 'EURUSD', display_name: 'EUR/USD', description: 'Euro/US Dollar', popular: true },
    { symbol: 'GBPUSD', display_name: 'GBP/USD', description: 'British Pound/US Dollar', popular: true },
    { symbol: 'USDJPY', display_name: 'USD/JPY', description: 'US Dollar/Japanese Yen', popular: true },
    { symbol: 'USDCHF', display_name: 'USD/CHF', description: 'US Dollar/Swiss Franc', popular: false },
    { symbol: 'AUDUSD', display_name: 'AUD/USD', description: 'Australian Dollar/US Dollar', popular: false },
    { symbol: 'NZDUSD', display_name: 'NZD/USD', description: 'New Zealand Dollar/US Dollar', popular: false },
    { symbol: 'XAUUSD', display_name: 'Gold', description: 'Gold/US Dollar', popular: true },
    { symbol: 'XAGUSD', display_name: 'Silver', description: 'Silver/US Dollar', popular: false },
    { symbol: 'BTCUSD', display_name: 'BTC/USD', description: 'Bitcoin/US Dollar', popular: true },
    { symbol: 'ETHUSD', display_name: 'ETH/USD', description: 'Ethereum/US Dollar', popular: true }
  ];
};

/**
 * Custom hook for SymbolPicker component
 * @param {Object} options - Hook options
 * @param {string} options.initialSymbol - Initial symbol
 * @param {Array} options.accounts - Trading accounts
 * @returns {Object} - Symbol picker state and methods
 */
export const useSymbolPicker = ({ initialSymbol = '', accounts = [] }) => {
  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [popularSymbols, setPopularSymbols] = useState({});
  const [recentSymbols, setRecentSymbols] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load recent symbols from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('recentSymbols');
      if (stored) {
        setRecentSymbols(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading recent symbols:', error);
    }
  }, []);

  // Save symbol to recent symbols when selected
  useEffect(() => {
    if (selectedSymbol) {
      addToRecentSymbols(selectedSymbol);
    }
  }, [selectedSymbol]);

  // Add to recent symbols
  const addToRecentSymbols = (symbol) => {
    const updated = [symbol, ...recentSymbols.filter(s => s !== symbol)].slice(0, 5);
    setRecentSymbols(updated);
    try {
      localStorage.setItem('recentSymbols', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recent symbols:', error);
    }
  };

  return {
    selectedSymbol,
    setSelectedSymbol,
    searchTerm,
    setSearchTerm,
    searchResults,
    setSearchResults,
    popularSymbols,
    setPopularSymbols,
    recentSymbols,
    isLoading,
    setIsLoading,
    addToRecentSymbols
  };
};
