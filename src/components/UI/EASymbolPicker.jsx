import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown, Star, RefreshCw, TrendingUp } from 'lucide-react';
import { searchEASymbols, getEAPopularSymbols, getEASymbols } from '../../api/ea';

/**
 * EA Symbol Picker component with autocomplete functionality
 * Specifically designed for EA accounts with real-time symbol search
 * 
 * @param {Object} props - Component props
 * @param {string} props.selectedSymbol - Currently selected symbol
 * @param {Function} props.onSymbolChange - Callback when symbol is changed
 * @param {Object} props.selectedAccount - EA account object
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.compact - Whether to use compact layout
 */
const EASymbolPicker = ({ 
  selectedSymbol, 
  onSymbolChange, 
  selectedAccount,
  placeholder = "Select symbol...",
  compact = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [symbols, setSymbols] = useState([]);
  const [popularSymbols, setPopularSymbols] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load popular symbols when dropdown opens or account changes
  useEffect(() => {
    if (isOpen && selectedAccount) {
      loadPopularSymbols();
    }
  }, [isOpen, selectedAccount]);

  // Reset state when account changes
  useEffect(() => {
    setSymbols([]);
    setPopularSymbols({});
    setSearchTerm('');
    setError(null);
  }, [selectedAccount]);

  // Load popular symbols from EA
  const loadPopularSymbols = async () => {
    if (!selectedAccount?.account_id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await getEAPopularSymbols(selectedAccount.account_id, 50);
      
      if (response.success && response.data) {
        setPopularSymbols(response.data);
      } else {
        setError('Failed to load popular symbols');
        setPopularSymbols({});
      }
    } catch (error) {
      console.error('Error loading popular symbols:', error);
      setError('Failed to load symbols');
      setPopularSymbols({});
    } finally {
      setLoading(false);
    }
  };

  // Handle symbol search with debouncing
  const handleSymbolSearch = async (term) => {
    setSearchTerm(term);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (!term || term.length < 2) {
      setSymbols([]);
      return;
    }

    if (!selectedAccount?.account_id) {
      setError('No EA account selected');
      return;
    }
    
    // Debounce search by 300ms
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await searchEASymbols(selectedAccount.account_id, term, 20);
        
        if (response.success && response.data) {
          setSymbols(response.data);
        } else {
          setError(response.error || 'No symbols found');
          setSymbols([]);
        }
      } catch (error) {
        console.error('Error searching symbols:', error);
        setError('Failed to search symbols');
        setSymbols([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  // Select symbol and close dropdown
  const handleSelectSymbol = (symbolInfo) => {
    const symbol = symbolInfo.symbol || symbolInfo.standard_symbol;
    onSymbolChange(symbol);
    setIsOpen(false);
    setSearchTerm('');
    setSymbols([]);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setSymbols([]);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  // Category display configurations
  const CATEGORY_CONFIG = {
    major_pairs: { 
      title: 'Major Forex Pairs', 
      icon: '💱', 
      color: 'text-green-400' 
    },
    cross_pairs: { 
      title: 'Cross Pairs', 
      icon: '💰', 
      color: 'text-blue-400' 
    },
    exotic_pairs: { 
      title: 'Exotic Pairs', 
      icon: '🌍', 
      color: 'text-purple-400' 
    },
    metals: { 
      title: 'Precious Metals', 
      icon: '🥇', 
      color: 'text-yellow-400' 
    },
    indices: { 
      title: 'Stock Indices', 
      icon: '📈', 
      color: 'text-orange-400' 
    },
    commodities: { 
      title: 'Commodities', 
      icon: '🛢️', 
      color: 'text-amber-400' 
    },
    crypto: { 
      title: 'Cryptocurrency', 
      icon: '₿', 
      color: 'text-cyan-400' 
    },
    other: { 
      title: 'Other Instruments', 
      icon: '📊', 
      color: 'text-gray-400' 
    }
  };

  const renderSymbolItem = (symbolInfo, showDescription = true) => {
    const symbol = symbolInfo.symbol || symbolInfo.standard_symbol;
    const description = symbolInfo.description;
    const available = symbolInfo.available !== false;

    return (
      <button
        key={`${symbol}-${symbolInfo.relevance_score || 0}`}
        onClick={() => handleSelectSymbol(symbolInfo)}
        disabled={!available}
        className={`w-full flex items-center justify-between px-3 py-2 rounded text-left transition-colors ${
          available 
            ? 'hover:bg-[#222] text-white' 
            : 'text-gray-500 cursor-not-allowed bg-gray-800/30'
        }`}
      >
        <div className="flex-1 min-w-0">
          <div className={`font-medium text-sm ${available ? '' : 'line-through'}`}>
            {symbol}
          </div>
          {showDescription && description && (
            <div className="text-xs text-gray-400 truncate">
              {description}
            </div>
          )}
          {!available && (
            <div className="text-xs text-red-400">Not available</div>
          )}
        </div>
        {symbolInfo.popular && (
          <Star className="w-4 h-4 text-yellow-500 ml-2" />
        )}
        {symbolInfo.relevance_score && (
          <div className="text-xs text-gray-500 ml-2">
            {Math.round(symbolInfo.relevance_score)}%
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Input */}
      <div 
        className={`flex items-center border border-[#2A2A2A] bg-[#1A1A1A] rounded-lg cursor-pointer transition-colors hover:border-[#333] ${
          isOpen ? 'border-blue-500' : ''
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={`flex-1 flex items-center ${compact ? 'px-2 py-1.5' : 'px-3 py-2'}`}>
          {selectedSymbol ? (
            <span className="text-white font-medium">{selectedSymbol}</span>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        
        {selectedSymbol && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSymbolChange('');
            }}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        <div className={`border-l border-[#2A2A2A] ${compact ? 'px-2 py-1.5' : 'px-3 py-2'}`}>
          <ChevronDown 
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute z-50 mt-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg shadow-xl overflow-hidden ${
          compact ? 'w-80 right-0' : 'w-full'
        }`}>
          {/* Search Header */}
          <div className="p-3 border-b border-[#2A2A2A]">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-white font-medium text-sm">
                {selectedAccount?.name || 'EA Account'} Symbols
              </span>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSymbolSearch(e.target.value)}
                placeholder="Type symbol name (min 2 chars)..."
                className="w-full bg-[#222] border border-[#333] rounded-lg pl-9 pr-8 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-6 text-gray-400">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                <span>Searching symbols...</span>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="p-4 text-center">
                <div className="text-red-400 text-sm">{error}</div>
                <button
                  onClick={() => selectedAccount && loadPopularSymbols()}
                  className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
                >
                  Try again
                </button>
              </div>
            )}

            {/* No Account Selected */}
            {!selectedAccount && !loading && (
              <div className="p-4 text-center text-gray-400">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Please select an EA account first</p>
              </div>
            )}

            {/* Search Results */}
            {!loading && !error && searchTerm.length >= 2 && (
              <div className="p-2">
                {symbols.length > 0 ? (
                  <>
                    <div className="text-xs text-gray-500 px-2 py-1 mb-2">
                      Found {symbols.length} symbols matching "{searchTerm}"
                    </div>
                    <div className="space-y-1">
                      {symbols.map((symbolInfo, index) => renderSymbolItem(symbolInfo))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No symbols found for "{searchTerm}"</p>
                    <p className="text-xs mt-1">Try a different search term</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Popular Symbols (when not searching) */}
            {!loading && !error && searchTerm.length < 2 && selectedAccount && (
              <div className="p-2">
                {Object.keys(popularSymbols).length > 0 ? (
                  <>
                    <div className="text-xs text-gray-500 px-2 py-1 mb-3">
                      Popular symbols on this account
                    </div>
                    <div className="space-y-3">
                      {Object.entries(popularSymbols).map(([category, categorySymbols]) => (
                        categorySymbols && categorySymbols.length > 0 && (
                          <div key={category}>
                            <div className={`text-xs font-medium px-2 py-1 flex items-center gap-2 ${
                              CATEGORY_CONFIG[category]?.color || 'text-gray-400'
                            }`}>
                              <span>{CATEGORY_CONFIG[category]?.icon || '📊'}</span>
                              {CATEGORY_CONFIG[category]?.title || category.toUpperCase()}
                              <span className="bg-[#333] px-2 py-0.5 rounded text-gray-300">
                                {categorySymbols.length}
                              </span>
                            </div>
                            <div className="space-y-1 mt-1">
                              {categorySymbols.slice(0, compact ? 4 : 6).map((symbolInfo, index) => 
                                renderSymbolItem(symbolInfo, !compact)
                              )}
                              {categorySymbols.length > (compact ? 4 : 6) && (
                                <button
                                  onClick={() => setSearchTerm(category)}
                                  className="w-full text-center py-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                  Show all {categorySymbols.length} symbols
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Type to search for symbols</p>
                    <p className="text-xs mt-1">Enter at least 2 characters</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Info */}
          {!loading && !error && selectedAccount && (
            <div className="p-2 border-t border-[#2A2A2A] bg-[#111]">
              <div className="text-xs text-gray-500 flex items-center justify-between">
                <span>EA Account: {selectedAccount.account_id}</span>
                {Object.keys(popularSymbols).length > 0 && (
                  <span>
                    {Object.values(popularSymbols).flat().length} symbols available
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Compact version of EA Symbol Picker for smaller spaces
 */
export const CompactEASymbolPicker = (props) => {
  return <EASymbolPicker {...props} compact={true} />;
};

export default EASymbolPicker;
