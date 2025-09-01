import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Info, TrendingUp } from 'lucide-react';
import { getAccountSymbols, searchAccountSymbols } from '../../api/livePrices';
import { getEASymbols, searchEASymbols, getEASymbolsFiltered } from '../../api/ea';

/**
 * Symbol Browser Component
 * Helps users find available symbols for their broker account
 */
const SymbolBrowser = ({ onSymbolSelect, onClose, selectedAccount }) => {
  const [symbols, setSymbols] = useState([]);
  const [filteredSymbols, setFilteredSymbols] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState({});

  useEffect(() => {
    if (selectedAccount) {
      loadAccountSymbols();
    }
  }, [selectedAccount]);

  useEffect(() => {
    filterSymbols();
  }, [symbols, searchTerm]);

  const loadAccountSymbols = async () => {
    if (!selectedAccount) return;
    
    setLoading(true);
    setError(null);

    try {
      const accountId = selectedAccount.account_id || selectedAccount.id;
      
      // Try EA API first for EA accounts
      if (selectedAccount.account_id) {
        const eaResponse = await getEASymbols(accountId);
        if (eaResponse.success && eaResponse.data && eaResponse.data.length > 0) {
          setSymbols(eaResponse.data);
          categorizeSymbols(eaResponse.data);
          return;
        }
      }
      
      // Fallback to regular API for broker accounts
      const symbolsData = await getAccountSymbols(accountId);
      
      if (symbolsData && symbolsData.length > 0) {
        setSymbols(symbolsData);
        categorizeSymbols(symbolsData);
      } else {
        setError('No symbols found for this account');
      }
    } catch (err) {
      console.error('Error loading account symbols:', err);
      setError('Failed to load available symbols');
    } finally {
      setLoading(false);
    }
  };

  const categorizeSymbols = (symbolsData) => {
    const categorized = {
      forex: [],
      crypto: [],
      metals: [],
      indices: [],
      commodities: [],
      other: []
    };

    symbolsData.forEach(symbolInfo => {
      // Handle both EA and broker symbol formats
      const symbol = symbolInfo.symbol || symbolInfo.standard_symbol || '';
      const type = symbolInfo.type || symbolInfo.symbol_type || '';
      const description = symbolInfo.description || '';
      
      // Convert to string if needed
      const symbolStr = typeof symbol === 'string' ? symbol : String(symbol);
      const typeStr = typeof type === 'string' ? type.toLowerCase() : '';
      const descStr = typeof description === 'string' ? description.toLowerCase() : '';
      
      if (typeStr.includes('forex') || typeStr.includes('currency') || symbolStr.length === 6) {
        categorized.forex.push(symbolInfo);
      } else if (typeStr.includes('crypto') || symbolStr.includes('BTC') || symbolStr.includes('ETH') || descStr.includes('bitcoin') || descStr.includes('crypto')) {
        categorized.crypto.push(symbolInfo);
      } else if (typeStr.includes('metal') || symbolStr.includes('XAU') || symbolStr.includes('XAG') || symbolStr.includes('GOLD') || symbolStr.includes('SILVER')) {
        categorized.metals.push(symbolInfo);
      } else if (typeStr.includes('index') || symbolStr.includes('US30') || symbolStr.includes('SPX') || symbolStr.includes('NAS') || symbolStr.includes('DAX')) {
        categorized.indices.push(symbolInfo);
      } else if (typeStr.includes('commodity') || symbolStr.includes('OIL') || symbolStr.includes('WTI') || symbolStr.includes('BRENT')) {
        categorized.commodities.push(symbolInfo);
      } else {
        categorized.other.push(symbolInfo);
      }
    });

    setCategories(categorized);
  };

  const filterSymbols = async () => {
    if (!searchTerm.trim()) {
      setFilteredSymbols(symbols);
      return;
    }

    // If we have an EA account, try to use the enhanced search
    if (selectedAccount?.account_id && searchTerm.length >= 2) {
      try {
        const accountId = selectedAccount.account_id || selectedAccount.id;
        const response = await searchEASymbols(accountId, searchTerm);
        
        if (response.success && response.data) {
          // Convert search results to the same format as symbols
          const searchResults = response.data.map(symbol => ({
            symbol: symbol,
            broker_symbol: symbol,
            description: `${symbol} - Available symbol`
          }));
          setFilteredSymbols(searchResults);
          return;
        }
      } catch (error) {
        console.warn('EA search failed, falling back to local search:', error);
      }
    }

    // Fallback to local filtering
    const term = searchTerm.toLowerCase();
    const filtered = symbols.filter(symbolInfo => {
      // Handle both EA and broker symbol formats
      const symbol = (symbolInfo.symbol || symbolInfo.standard_symbol || '').toString().toLowerCase();
      const brokerSymbol = (symbolInfo.broker_symbol || '').toString().toLowerCase();
      const description = (symbolInfo.description || '').toString().toLowerCase();
      
      return symbol.includes(term) || 
             brokerSymbol.includes(term) || 
             description.includes(term);
    });

    setFilteredSymbols(filtered);
  };

  const handleSymbolSelect = (symbolInfo) => {
    // Handle both EA and broker symbol formats
    const symbol = symbolInfo.symbol || symbolInfo.standard_symbol;
    if (onSymbolSelect) {
      onSymbolSelect(symbol);
    }
    if (onClose) {
      onClose();
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'forex': return '💱';
      case 'crypto': return '₿';
      case 'metals': return '🥇';
      case 'indices': return '📈';
      case 'commodities': return '🛢️';
      default: return '📊';
    }
  };

  const getCategoryTitle = (category) => {
    switch (category) {
      case 'forex': return 'Forex Pairs';
      case 'crypto': return 'Cryptocurrencies';
      case 'metals': return 'Precious Metals';
      case 'indices': return 'Stock Indices';
      case 'commodities': return 'Commodities';
      default: return 'Other Instruments';
    }
  };

  const displaySymbols = searchTerm.trim() ? filteredSymbols : symbols;

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4 max-h-[500px] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Available Symbols
        </h3>
        <button
          onClick={loadAccountSymbols}
          disabled={loading}
          className="text-blue-400 hover:text-blue-300 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search symbols..."
          className="w-full bg-[#222] border border-[#444] rounded-lg pl-9 pr-3 py-2 text-white text-sm"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          <span>Loading symbols...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-red-300">
            <Info className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Symbols List */}
      {!loading && !error && (
        <div className="flex-1 overflow-y-auto">
          {searchTerm.trim() ? (
            // Filtered search results
            <div className="space-y-2">
              {displaySymbols.length > 0 ? (
                displaySymbols.map((symbolInfo, index) => (
                  <SymbolItem 
                    key={index} 
                    symbolInfo={symbolInfo} 
                    onSelect={handleSymbolSelect}
                  />
                ))
              ) : (
                <div className="text-center py-4 text-gray-400">
                  <p>No symbols found for "{searchTerm}"</p>
                  <p className="text-xs mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          ) : (
            // Categorized view
            <div className="space-y-4">
              {Object.entries(categories).map(([category, categorySymbols]) => (
                categorySymbols.length > 0 && (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                      <span>{getCategoryIcon(category)}</span>
                      {getCategoryTitle(category)}
                      <span className="text-xs bg-[#333] px-2 py-1 rounded">
                        {categorySymbols.length}
                      </span>
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {categorySymbols.slice(0, 8).map((symbolInfo, index) => (
                        <SymbolItem 
                          key={index} 
                          symbolInfo={symbolInfo} 
                          onSelect={handleSymbolSelect}
                          compact
                        />
                      ))}
                      {categorySymbols.length > 8 && (
                        <div className="col-span-2 text-center">
                          <button
                            onClick={() => setSearchTerm(category)}
                            className="text-blue-400 hover:text-blue-300 text-xs"
                          >
                            Show all {categorySymbols.length} {category} symbols
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info Footer */}
      {!loading && !error && symbols.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[#333]">
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <Info className="w-3 h-3" />
            <span>Found {symbols.length} symbols available on this broker</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Symbol Item Component
const SymbolItem = ({ symbolInfo, onSelect, compact = false }) => {
  // Handle both EA and broker symbol formats
  const symbol = symbolInfo.symbol || symbolInfo.standard_symbol;
  const brokerSymbol = symbolInfo.broker_symbol;
  const description = symbolInfo.description;
  const available = symbolInfo.available !== false;

  return (
    <button
      onClick={() => onSelect(symbolInfo)}
      disabled={!available}
      className={`w-full text-left p-2 rounded transition-colors ${
        available 
          ? 'bg-[#222] hover:bg-[#333] border border-[#444] text-white' 
          : 'bg-[#1A1A1A] border border-[#333] text-gray-500 cursor-not-allowed'
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{symbol}</div>
          {!compact && brokerSymbol && brokerSymbol !== symbol && (
            <div className="text-xs text-gray-400">Broker: {brokerSymbol}</div>
          )}
          {!compact && description && (
            <div className="text-xs text-gray-500 truncate">{description}</div>
          )}
        </div>
        {!available && (
          <div className="text-xs text-red-400">N/A</div>
        )}
      </div>
    </button>
  );
};

export default SymbolBrowser;
