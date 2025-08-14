import React, { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, Star, RefreshCw, X } from 'lucide-react';
import { getAvailableSymbols, getPopularSymbols, searchSymbols } from '../../api/broker';
import { toast } from 'react-hot-toast';

const EnhancedSymbolPicker = ({ 
  selectedSymbol = '', 
  onSymbolSelect, 
  placeholder = "Search symbols...",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [symbols, setSymbols] = useState([]);
  const [popularSymbols, setPopularSymbols] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('popular');
  const searchTimeoutRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isOpen && popularSymbols.length === 0) {
      loadPopularSymbols();
    }
  }, [isOpen]);

  useEffect(() => {
    // Handle click outside to close
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Debounced search
    if (searchTerm.trim().length >= 2) {
      setSearchLoading(true);
      
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await searchSymbols(searchTerm, 20);
          if (result.success) {
            setSymbols(result.data.symbols || []);
            setActiveTab('search');
          } else {
            toast.error('Failed to search symbols');
          }
        } catch (error) {
          console.error('Symbol search error:', error);
          toast.error('Symbol search failed');
        } finally {
          setSearchLoading(false);
        }
      }, 300);
    } else if (searchTerm.trim().length === 0) {
      setActiveTab('popular');
      setSymbols([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const loadPopularSymbols = async () => {
    try {
      setLoading(true);
      const result = await getPopularSymbols();
      if (result.success) {
        // Flatten popular symbols from different categories
        const allPopular = [];
        Object.values(result.data.popular_symbols || {}).forEach(category => {
          allPopular.push(...category);
        });
        setPopularSymbols(allPopular);
      }
    } catch (error) {
      console.error('Failed to load popular symbols:', error);
      toast.error('Failed to load popular symbols');
    } finally {
      setLoading(false);
    }
  };

  const loadAllSymbols = async () => {
    try {
      setLoading(true);
      const result = await getAvailableSymbols('', 100);
      if (result.success) {
        setSymbols(result.data.symbols || []);
        setActiveTab('all');
      }
    } catch (error) {
      console.error('Failed to load symbols:', error);
      toast.error('Failed to load symbols');
    } finally {
      setLoading(false);
    }
  };

  const handleSymbolClick = (symbol) => {
    onSymbolSelect(symbol.symbol || symbol.standard_symbol);
    setIsOpen(false);
    setSearchTerm('');
  };

  const clearSearch = () => {
    setSearchTerm('');
    setActiveTab('popular');
    setSymbols([]);
  };

  const displaySymbols = () => {
    switch (activeTab) {
      case 'popular':
        return popularSymbols;
      case 'search':
      case 'all':
        return symbols;
      default:
        return [];
    }
  };

  const getSymbolDisplayName = (symbol) => {
    if (symbol.display_name) return symbol.display_name;
    if (symbol.name) return symbol.name;
    const sym = symbol.symbol || symbol.standard_symbol;
    if (sym && sym.length === 6) {
      return `${sym.slice(0, 3)}/${sym.slice(3)}`;
    }
    return sym;
  };

  const getSymbolDescription = (symbol) => {
    return symbol.description || symbol.name || '';
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Selected Symbol Display / Search Input */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-3 py-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg cursor-pointer hover:border-[#3A3A3A] transition-colors"
      >
        <div className="flex items-center space-x-2 flex-1">
          <Search size={16} className="text-gray-400" />
          {selectedSymbol ? (
            <div className="flex items-center space-x-2">
              <span className="text-white font-medium">{getSymbolDisplayName({ symbol: selectedSymbol })}</span>
              <span className="text-gray-400 text-sm">{selectedSymbol}</span>
            </div>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <div className="text-gray-400">
          {isOpen ? <X size={16} /> : <TrendingUp size={16} />}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-[#2A2A2A]">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search symbols..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-600"
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-[#2A2A2A]">
            <button
              onClick={() => setActiveTab('popular')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'popular'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-600/10'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Star size={14} className="inline mr-1" />
              Popular
            </button>
            <button
              onClick={() => setActiveTab('search')}
              disabled={searchTerm.length < 2}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'search' && searchTerm.length >= 2
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-600/10'
                  : 'text-gray-400 hover:text-white disabled:opacity-50'
              }`}
            >
              <Search size={14} className="inline mr-1" />
              Search
            </button>
            <button
              onClick={loadAllSymbols}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-600/10'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <RefreshCw size={14} className="inline mr-1" />
              All
            </button>
          </div>

          {/* Symbol List */}
          <div className="max-h-60 overflow-y-auto">
            {(loading || searchLoading) ? (
              <div className="p-4 text-center text-gray-400">
                <RefreshCw size={16} className="animate-spin mx-auto mb-2" />
                Loading symbols...
              </div>
            ) : displaySymbols().length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                {searchTerm.length >= 2 ? 'No symbols found' : 'No symbols available'}
              </div>
            ) : (
              displaySymbols().map((symbol, index) => (
                <div
                  key={index}
                  onClick={() => handleSymbolClick(symbol)}
                  className="px-4 py-3 hover:bg-[#2A2A2A] cursor-pointer border-b border-[#1A1A1A] last:border-b-0 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium">
                          {getSymbolDisplayName(symbol)}
                        </span>
                        {symbol.popular && (
                          <Star size={12} className="text-yellow-400" />
                        )}
                        {symbol.available_accounts > 0 && (
                          <span className="text-xs text-green-400 bg-green-600/20 px-2 py-0.5 rounded">
                            {symbol.available_accounts} account{symbol.available_accounts !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {getSymbolDescription(symbol)}
                      </div>
                    </div>
                    {symbol.relevance_score && (
                      <div className="text-xs text-gray-500">
                        {Math.round(symbol.relevance_score)}%
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSymbolPicker;
