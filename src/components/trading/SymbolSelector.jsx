import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, RefreshCw, TrendingUp, Star, AlertTriangle, X } from 'lucide-react';
import useSymbolCache from '../../hooks/useSymbolCache';

const SymbolSelector = ({ 
  onSelect,
  onCancel,
  selectedAccount,
  currentSymbol = '',
  showSelectedSymbol = true
}) => {
  const accountId = selectedAccount?.account_id || selectedAccount?.id;
  const {
    symbols,
    popularSymbols,
    loading,
    error,
    fetchSymbols,
    getFilteredSymbols,
    getPopularByCategory,
    totalSymbols,
    hasSymbols,
  } = useSymbolCache(accountId);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'popular', 'recent'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const searchInputRef = useRef(null);

  // Filtered symbols based on search
  const filteredSymbols = useMemo(() => {
    if (!searchTerm) {
      if (activeTab === 'popular' && selectedCategory) {
        return getPopularByCategory(selectedCategory);
      }
      return symbols.slice(0, 100); // Show first 100 by default
    }
    return getFilteredSymbols(searchTerm);
  }, [searchTerm, activeTab, selectedCategory, symbols, getPopularByCategory, getFilteredSymbols]);

  // Categories from popular symbols
  const categories = useMemo(() => {
    return Object.keys(popularSymbols).filter(cat => getPopularByCategory(cat).length > 0);
  }, [popularSymbols, getPopularByCategory]);

  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleSelect = (symbol) => {
    onSelect(symbol.symbol || symbol.broker_symbol);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#2A2A2A] flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Search className="w-5 h-5" />
            Symbol Selector
            {loading && (
              <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
            )}
          </h3>
          <button 
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-[#2A2A2A]">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search symbols (e.g., EUR, USD, Gold...)"
                  className="w-full bg-[#222] border border-[#444] rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              </div>
            </div>
            <button
              onClick={() => fetchSymbols(true)}
              className="px-3 py-2 bg-[#222] border border-[#444] rounded-lg text-blue-400 hover:text-blue-300 transition-colors"
              title="Refresh symbols"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Statistics */}
          <div className="mt-2 flex items-center gap-4 text-xs">
            <div className="text-gray-400">
              {totalSymbols} symbols available
            </div>
            {filteredSymbols.length !== totalSymbols && (
              <div className="text-blue-400">
                {filteredSymbols.length} matches
              </div>
            )}
            {selectedAccount && (
              <div className="text-green-400">
                {selectedAccount.broker_name || selectedAccount.broker || 'Account'} {selectedAccount.account_id}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => {
                setActiveTab('all');
                setSelectedCategory(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#222] border border-[#444] text-gray-400 hover:text-white'
              }`}
            >
              All Symbols
            </button>
            <button
              onClick={() => {
                setActiveTab('popular');
                setSelectedCategory(categories[0]);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'popular'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#222] border border-[#444] text-gray-400 hover:text-white'
              }`}
            >
              Popular
            </button>
          </div>

          {/* Category Selector for Popular */}
          {activeTab === 'popular' && categories.length > 0 && (
            <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                      : 'bg-[#222] border border-[#444] text-gray-400 hover:text-white'
                  }`}
                >
                  {category.replace(/_/g, ' ').split(' ').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                  ).join(' ')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Symbol List */}
        <div className="flex-1 overflow-y-auto">
          {error ? (
            <div className="p-4 text-center">
              <div className="inline-flex items-center gap-2 text-red-400 bg-red-950/30 px-4 py-2 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            </div>
          ) : loading && !hasSymbols ? (
            <div className="p-4 text-center text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading symbols...
            </div>
          ) : filteredSymbols.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              No symbols found
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4">
              {filteredSymbols.map(symbol => (
                <button
                  key={symbol.symbol || symbol.broker_symbol}
                  onClick={() => handleSelect(symbol)}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    showSelectedSymbol && (symbol.symbol === currentSymbol || symbol.broker_symbol === currentSymbol)
                      ? 'bg-blue-600/20 border border-blue-600/30'
                      : 'bg-[#222] border border-[#444] hover:bg-[#333]'
                  }`}
                >
                  {/* Symbol Icon/Type Indicator */}
                  {symbol.type === 'forex' ? (
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                    </div>
                  ) : symbol.type === 'crypto' ? (
                    <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center">
                      ₿
                    </div>
                  ) : symbol.popular ? (
                    <div className="w-8 h-8 rounded-full bg-yellow-600/20 flex items-center justify-center">
                      <Star className="w-4 h-4 text-yellow-400" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-600/20 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                    </div>
                  )}

                  {/* Symbol Details */}
                  <div className="flex-1 text-left">
                    <div className="font-medium text-white">
                      {symbol.symbol || symbol.broker_symbol}
                    </div>
                    {(symbol.description || symbol.broker_symbol !== symbol.symbol) && (
                      <div className="text-xs text-gray-400">
                        {symbol.description || symbol.broker_symbol}
                      </div>
                    )}
                  </div>

                  {/* Category Tag */}
                  {symbol.category && (
                    <div className="text-xs px-2 py-1 rounded bg-blue-900/30 text-blue-400">
                      {symbol.category}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="p-4 border-t border-[#2A2A2A] bg-[#1A1A1A]">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div>
              {filteredSymbols.length} symbols shown
            </div>
            <div>
              {totalSymbols} total available
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SymbolSelector;