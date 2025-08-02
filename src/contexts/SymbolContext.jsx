import React, { createContext, useContext, useState, useEffect } from 'react';
import { symbolMappingService } from '../api/symbolMapping';

const SymbolContext = createContext();

export const useSymbolContext = () => {
  const context = useContext(SymbolContext);
  if (!context) {
    throw new Error('useSymbolContext must be used within a SymbolProvider');
  }
  return context;
};

export const SymbolProvider = ({ children }) => {
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [symbolMappings, setSymbolMappings] = useState({});
  const [availableSymbols, setAvailableSymbols] = useState({});
  const [crossBrokerData, setCrossBrokerData] = useState({});
  const [loading, setLoading] = useState(false);

  // Get symbol mapping for a specific account
  const getSymbolMapping = async (symbol, accountId) => {
    if (!symbol || !accountId) return null;

    const cacheKey = `${symbol}_${accountId}`;
    if (symbolMappings[cacheKey]) {
      return symbolMappings[cacheKey];
    }

    try {
      const response = await symbolMappingService.mapSymbol(symbol, accountId);
      
      if (response.success) {
        setSymbolMappings(prev => ({
          ...prev,
          [cacheKey]: response.mapped_symbol
        }));
        return response.mapped_symbol;
      }
      return null;
    } catch (error) {
      console.error('Failed to get symbol mapping:', error);
      return null;
    }
  };

  // Check if symbol is available on account
  const checkSymbolAvailability = async (symbol, accountId) => {
    if (!symbol || !accountId) return false;

    const cacheKey = `${symbol}_${accountId}_available`;
    if (availableSymbols[cacheKey] !== undefined) {
      return availableSymbols[cacheKey];
    }

    try {
      const response = await symbolMappingService.checkSymbolAvailability(symbol, accountId);
      
      setAvailableSymbols(prev => ({
        ...prev,
        [cacheKey]: response.available
      }));
      
      return response.available;
    } catch (error) {
      console.error('Failed to check symbol availability:', error);
      return false;
    }
  };

  // Get cross-broker analysis
  const getCrossBrokerAnalysis = async (accountIds) => {
    if (!accountIds || accountIds.length < 2) return null;

    const cacheKey = accountIds.sort().join('_');
    if (crossBrokerData[cacheKey]) {
      return crossBrokerData[cacheKey];
    }

    setLoading(true);
    try {
      const [mappingsResponse, statsResponse] = await Promise.all([
        symbolMappingService.getCrossBrokerMappings(accountIds),
        symbolMappingService.getSymbolStatistics(accountIds)
      ]);

      const data = {
        mappings: mappingsResponse.success ? mappingsResponse.cross_mappings : {},
        statistics: statsResponse.success ? statsResponse.statistics : {}
      };

      setCrossBrokerData(prev => ({
        ...prev,
        [cacheKey]: data
      }));

      return data;
    } catch (error) {
      console.error('Failed to get cross-broker analysis:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create symbol mapping
  const createSymbolMapping = async (accountId, standardSymbol, brokerSymbol) => {
    try {
      const response = await symbolMappingService.createSymbolMapping(
        accountId,
        standardSymbol,
        brokerSymbol
      );

      if (response.success) {
        // Update cache
        const cacheKey = `${standardSymbol}_${accountId}`;
        setSymbolMappings(prev => ({
          ...prev,
          [cacheKey]: brokerSymbol
        }));

        // Clear cross-broker cache as it might be affected
        setCrossBrokerData({});
      }

      return response;
    } catch (error) {
      console.error('Failed to create symbol mapping:', error);
      throw error;
    }
  };

  // Update symbol mapping
  const updateSymbolMapping = async (mappingId, updates) => {
    try {
      const response = await symbolMappingService.updateSymbolMapping(mappingId, updates);

      if (response.success) {
        // Clear relevant caches
        setSymbolMappings({});
        setCrossBrokerData({});
      }

      return response;
    } catch (error) {
      console.error('Failed to update symbol mapping:', error);
      throw error;
    }
  };

  // Delete symbol mapping
  const deleteSymbolMapping = async (mappingId) => {
    try {
      await symbolMappingService.deleteSymbolMapping(mappingId);
      
      // Clear caches
      setSymbolMappings({});
      setCrossBrokerData({});
      
      return true;
    } catch (error) {
      console.error('Failed to delete symbol mapping:', error);
      throw error;
    }
  };

  // Clear all caches
  const clearCache = () => {
    setSymbolMappings({});
    setAvailableSymbols({});
    setCrossBrokerData({});
  };

  const value = {
    // State
    selectedSymbol,
    setSelectedSymbol,
    loading,
    
    // Methods
    getSymbolMapping,
    checkSymbolAvailability,
    getCrossBrokerAnalysis,
    createSymbolMapping,
    updateSymbolMapping,
    deleteSymbolMapping,
    clearCache,
    
    // Cached data
    symbolMappings,
    availableSymbols,
    crossBrokerData
  };

  return (
    <SymbolContext.Provider value={value}>
      {children}
    </SymbolContext.Provider>
  );
};

export default SymbolContext;
