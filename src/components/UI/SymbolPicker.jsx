import React, { useState, useEffect, useMemo } from 'react';
import { Search, TrendingUp, Star, CheckCircle, AlertCircle } from 'lucide-react';
import { useTradingSymbol } from '../../contexts/TradingSymbolContext';
import { SymbolAvailabilityBadge } from './SymbolMappingIndicator';

const SymbolPicker = ({ 
  selectedSymbol, 
  onSymbolSelect, 
  accounts = [],
  showFavorites = true,
  showAvailability = true,
  className = '' 
}) => {
  const { getAvailableSymbols, checkSymbolAvailability, updateSelectedSymbol } = useTradingSymbol();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favorites, setFavorites] = useState(['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD']);

  const accountIds = accounts.map(acc => acc.id);
  const availableSymbols = getAvailableSymbols(accountIds);

  // Filter and search symbols
  const filteredSymbols = useMemo(() => {
    let symbols = availableSymbols;

    // Filter by category
    if (selectedCategory === 'favorites') {
      symbols = symbols.filter(symbol => favorites.includes(symbol));
    } else if (selectedCategory !== 'all') {
      symbols = symbols.filter(symbol => {
        const category = getSymbolCategory(symbol);
        return category === selectedCategory;
      });
    }

    // Filter by search term
    if (searchTerm) {
      symbols = symbols.filter(symbol =>
        symbol.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by availability and name
    return symbols.sort((a, b) => {
      if (showAvailability && accounts.length > 0) {
        const aAvailability = checkSymbolAvailability(a, accountIds);
        const bAvailability = checkSymbolAvailability(b, accountIds);
        const aAvailableCount = Object.values(aAvailability).filter(av => av.available).length;
        const bAvailableCount = Object.values(bAvailability).filter(av => av.available).length;
        
        if (aAvailableCount !== bAvailableCount) {
          return bAvailableCount - aAvailableCount; // More available first
        }
      }
      return a.localeCompare(b);
    });
  }, [availableSymbols, selectedCategory, searchTerm, favorites, showAvailability, accounts, accountIds, checkSymbolAvailability]);

  const getSymbolCategory = (symbol) => {
    if (symbol.includes('USD') || symbol.includes('EUR') || symbol.includes('GBP')) return 'forex';
    if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('USDT')) return 'crypto';
    if (symbol.includes('.') || symbol.includes('_')) return 'stocks';
    return 'other';
  };

  const categories = [
    { id: 'all', label: 'All Symbols', count: availableSymbols.length },
    { id: 'favorites', label: 'Favorites', count: favorites.filter(f => availableSymbols.includes(f)).length },
    { id: 'forex', label: 'Forex', count: availableSymbols.filter(s => getSymbolCategory(s) === 'forex').length },
    { id: 'crypto', label: 'Crypto', count: availableSymbols.filter(s => getSymbolCategory(s) === 'crypto').length },
    { id: 'stocks', label: 'Stocks', count: availableSymbols.filter(s => getSymbolCategory(s) === 'stocks').length }
  ];

  const handleSymbolSelect = (symbol) => {
    onSymbolSelect(symbol);
    updateSelectedSymbol(symbol);
  };

  const toggleFavorite = (symbol, e) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(symbol) 
        ? prev.filter(f => f !== symbol)
        : [...prev, symbol]
    );
  };

  const getSymbolIcon = (symbol) => {
    const category = getSymbolCategory(symbol);
    const icons = {
      forex: '💱',
      crypto: '₿',
      stocks: '📈',
      other: '📊'
    };
    return icons[category] || icons.other;
  };

  return (
    <div className={`symbol-picker ${className}`}>
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search symbols..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-1 mb-4 bg-gray-800 p-1 rounded-lg">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {category.label}
            {category.count > 0 && (
              <span className="ml-1 text-xs opacity-75">({category.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Symbol List */}
      <div className="max-h-80 overflow-y-auto">
        {filteredSymbols.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No symbols found</p>
            {searchTerm && (
              <p className="text-xs mt-1">Try adjusting your search terms</p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredSymbols.map((symbol) => {
              const availability = showAvailability && accounts.length > 0 
                ? checkSymbolAvailability(symbol, accountIds) 
                : {};
              const availableCount = Object.values(availability).filter(av => av.available).length;
              const isFavorite = favorites.includes(symbol);
              const isSelected = selectedSymbol === symbol;

              return (
                <button
                  key={symbol}
                  onClick={() => handleSymbolSelect(symbol)}
                  className={`w-full p-3 text-left rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <span className="text-lg">{getSymbolIcon(symbol)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium truncate">{symbol}</span>
                          {isSelected && <CheckCircle className="h-4 w-4 text-blue-200" />}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-400 capitalize">
                            {getSymbolCategory(symbol)}
                          </span>
                          {showAvailability && accounts.length > 0 && (
                            <SymbolAvailabilityBadge symbol={symbol} accounts={accounts} />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {showFavorites && (
                        <button
                          onClick={(e) => toggleFavorite(symbol, e)}
                          className={`p-1 rounded transition-colors ${
                            isFavorite 
                              ? 'text-yellow-400 hover:text-yellow-300' 
                              : 'text-gray-400 hover:text-yellow-400'
                          }`}
                        >
                          <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      {accounts.length > 0 && (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              {filteredSymbols.length} symbols available
            </span>
            <span className="text-gray-400">
              {accounts.length} account{accounts.length > 1 ? 's' : ''} connected
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export const CompactSymbolPicker = ({ 
  selectedSymbol, 
  onSymbolSelect, 
  accounts = [],
  popularSymbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'BTCUSD']
}) => {
  const { getAvailableSymbols } = useTradingSymbol();
  const accountIds = accounts.map(acc => acc.id);
  const availableSymbols = getAvailableSymbols(accountIds);
  
  const displaySymbols = popularSymbols.filter(symbol => 
    availableSymbols.includes(symbol)
  ).slice(0, 5);

  return (
    <div className="flex flex-wrap gap-2">
      {displaySymbols.map((symbol) => (
        <button
          key={symbol}
          onClick={() => onSymbolSelect(symbol)}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            selectedSymbol === symbol
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {symbol}
        </button>
      ))}
    </div>
  );
};

export default SymbolPicker;
