import React, { createContext, useContext, useState, useEffect } from 'react';
import { symbolMappingService } from '../api/symbolMapping';
import { useTradingViewSync } from '../utils/tradingViewSync';

const TradingSymbolContext = createContext();

export const useTradingSymbol = () => {
  const context = useContext(TradingSymbolContext);
  if (!context) {
    throw new Error('useTradingSymbol must be used within a TradingSymbolProvider');
  }
  return context;
};

export const TradingSymbolProvider = ({ children }) => {
  // Global trading state
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [standardSymbols, setStandardSymbols] = useState([]);
  const [accountSymbols, setAccountSymbols] = useState({});
  const [loading, setLoading] = useState(false);

  // TradingView integration
  const tradingViewSync = useTradingViewSync();

  // Initialize standard symbols and TradingView sync on mount
  useEffect(() => {
    loadStandardSymbols();
    
    // Initialize TradingView sync
    tradingViewSync.initialize();

    // Listen for symbol changes from TradingView
    const unsubscribe = tradingViewSync.onSymbolChange((symbol) => {
      setSelectedSymbol(symbol);
      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent('symbolChange', { 
        detail: { symbol, source: 'tradingview' } 
      }));
    });

    return () => {
      unsubscribe();
      tradingViewSync.destroy();
    };
  }, []);

  // Load standard symbols list
  const loadStandardSymbols = async () => {
    try {
      const response = await symbolMappingService.getStandardSymbols();
      if (response.success) {
        setStandardSymbols(response.standard_symbols || []);
      }
    } catch (error) {
      console.error('Failed to load standard symbols:', error);
    }
  };

  // Load symbols for a specific account
  const loadAccountSymbols = async (accountId) => {
    if (!accountId) return;

    setLoading(true);
    try {
      const response = await symbolMappingService.getAccountSymbols(accountId);
      setAccountSymbols(prev => ({
        ...prev,
        [accountId]: response
      }));
    } catch (error) {
      console.error(`Failed to load symbols for account ${accountId}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh symbols for an account
  const refreshAccountSymbols = async (accountId) => {
    if (!accountId) return;

    setLoading(true);
    try {
      await symbolMappingService.refreshAccountSymbols(accountId);
      await loadAccountSymbols(accountId);
      return { success: true };
    } catch (error) {
      console.error(`Failed to refresh symbols for account ${accountId}:`, error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Get available symbols for selected accounts
  const getAvailableSymbols = (accountIds = []) => {
    if (accountIds.length === 0) return [];

    const availableSymbols = new Set();
    
    accountIds.forEach(accountId => {
      const accountData = accountSymbols[accountId];
      if (accountData?.symbols) {
        accountData.symbols
          .filter(symbol => symbol.available)
          .forEach(symbol => availableSymbols.add(symbol.standard_symbol));
      }
    });

    return Array.from(availableSymbols).sort();
  };

  // Check if symbol is available on specific accounts
  const checkSymbolAvailability = (symbol, accountIds = []) => {
    const availability = {};
    
    accountIds.forEach(accountId => {
      const accountData = accountSymbols[accountId];
      if (accountData?.symbols) {
        const symbolData = accountData.symbols.find(s => s.standard_symbol === symbol);
        availability[accountId] = {
          available: symbolData?.available || false,
          broker_symbol: symbolData?.broker_symbol || null
        };
      } else {
        availability[accountId] = { available: false, broker_symbol: null };
      }
    });

    return availability;
  };

  // Get symbol mapping status for account
  const getSymbolMappingStatus = (accountId) => {
    const accountData = accountSymbols[accountId];
    return {
      mapped: !!accountData,
      total_symbols: accountData?.total_symbols || 0,
      total_available: accountData?.total_available || 0,
      broker_name: accountData?.broker_name || 'Unknown'
    };
  };

  // Update selected symbol (for TradingView sync)
  const updateSelectedSymbol = (symbol) => {
    setSelectedSymbol(symbol);
    
    // Sync to TradingView
    tradingViewSync.syncToTradingView(symbol);
    
    // Dispatch custom event for cross-component sync
    window.dispatchEvent(new CustomEvent('symbolSelected', {
      detail: { symbol, source: 'trading_interface' }
    }));
  };

  const value = {
    // State
    selectedSymbol,
    selectedAccount,
    standardSymbols,
    accountSymbols,
    loading,

    // Actions
    setSelectedSymbol: updateSelectedSymbol,
    updateSelectedSymbol,
    setSelectedAccount,
    loadAccountSymbols,
    refreshAccountSymbols,
    
    // Derived data
    getAvailableSymbols,
    checkSymbolAvailability,
    getSymbolMappingStatus,

    // API methods
    validateSymbol: symbolMappingService.validateSymbol,
    getCrossBrokerMappings: symbolMappingService.getCrossBrokerMappings,
    getSymbolStatistics: symbolMappingService.getSymbolStatistics,
    pollSymbolMappingStatus: symbolMappingService.pollSymbolMappingStatus,

    // TradingView integration
    syncToTradingView: tradingViewSync.syncToTradingView,
    syncFromTradingView: tradingViewSync.syncFromTradingView,
    getCurrentTradingViewSymbol: tradingViewSync.getCurrentSymbol
  };

  return (
    <TradingSymbolContext.Provider value={value}>
      {children}
    </TradingSymbolContext.Provider>
  );
};

export default TradingSymbolContext;
