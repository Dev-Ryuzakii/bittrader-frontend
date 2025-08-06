import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown, Star, RefreshCw } from 'lucide-react';
import { 
  getPopularSymbols, 
  searchSymbols, 
  formatSymbolsForPicker, 
  mockSearchSymbols 
} from '../../utils/symbolpicker';

/**
 * Symbol Picker component with search functionality
 * @param {Object} props - Component props
 * @param {string} props.selectedSymbol - Currently selected symbol
 * @param {Function} props.onSymbolChange - Callback when symbol is changed
 * @param {Array} props.accounts - Array of trading accounts
 */
const SymbolPicker = ({ selectedSymbol, onSymbolChange, accounts = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [symbols, setSymbols] = useState([]);
  const [popularSymbols, setPopularSymbols] = useState({});
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

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

  // Load popular symbols when dropdown opens
  useEffect(() => {
    if (isOpen) {
      loadPopularSymbols();
    }
  }, [isOpen]);

  // Load popular symbols
  const loadPopularSymbols = async () => {
    try {
      setLoading(true);
      const response = await getPopularSymbols();
      if (response && response.popular_symbols) {
        setPopularSymbols(response.popular_symbols);
      } else {
        // Fallback to mock data
        setPopularSymbols({
          major_pairs: [
            { symbol: 'EURUSD', description: 'Euro/US Dollar', available: true },
            { symbol: 'GBPUSD', description: 'British Pound/US Dollar', available: true },
            { symbol: 'USDJPY', description: 'US Dollar/Japanese Yen', available: true },
            { symbol: 'USDCHF', description: 'US Dollar/Swiss Franc', available: true }
          ],
          cross_pairs: [
            { symbol: 'EURGBP', description: 'Euro/British Pound', available: true },
            { symbol: 'EURJPY', description: 'Euro/Japanese Yen', available: true },
            { symbol: 'GBPJPY', description: 'British Pound/Japanese Yen', available: true }
          ],
          commodities: [
            { symbol: 'XAUUSD', description: 'Gold/US Dollar', available: true },
            { symbol: 'XAGUSD', description: 'Silver/US Dollar', available: true },
            { symbol: 'XBRUSD', description: 'Brent Crude Oil/USD', available: true }
          ],
          crypto: [
            { symbol: 'BTCUSD', description: 'Bitcoin/US Dollar', available: true },
            { symbol: 'ETHUSD', description: 'Ethereum/US Dollar', available: true }
          ]
        });
      }
    } catch (error) {
      console.error('Error loading popular symbols:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle symbol search
  const handleSymbolSearch = async (term) => {
    setSearchTerm(term);
    if (!term || term.length < 2) {
      setSymbols([]);
      return;
    }
    
    try {
      setLoading(true);
      // Try to get symbols from API
      const response = await searchSymbols(term);
      if (response && response.symbols) {
        setSymbols(formatSymbolsForPicker(response));
      } else {
        // Fallback to mock search
        setSymbols(mockSearchSymbols(term));
      }
    } catch (error) {
      console.error('Error searching symbols:', error);
      // Fallback to mock search
      setSymbols(mockSearchSymbols(term));
    } finally {
      setLoading(false);
    }
  };

  // Select symbol and close dropdown
  const handleSelectSymbol = (symbol) => {
    onSymbolChange(symbol);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Define categories
  const SYMBOL_CATEGORIES = {
    major_pairs: 'MAJOR FOREX PAIRS',
    cross_pairs: 'CROSS FOREX PAIRS',
    exotic_pairs: 'EXOTIC PAIRS',
    commodities: 'COMMODITIES',
    indices: 'INDICES',
    crypto: 'CRYPTOCURRENCY'
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className="flex items-center px-3 py-2 border border-[#2A2A2A] bg-[#1A1A1A] rounded-lg cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1 flex items-center">
          {selectedSymbol ? (
            <span className="text-white">{selectedSymbol}</span>
          ) : (
            <span className="text-gray-400">Select symbol...</span>
          )}
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-[#2A2A2A]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSymbolSearch(e.target.value)}
                placeholder="Search symbols..."
                className="w-full bg-[#222] border border-[#333] rounded-lg pl-9 pr-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto p-2">
            {loading && (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                <span className="ml-2 text-gray-400">Loading symbols...</span>
              </div>
            )}
            
            {!loading && searchTerm.length >= 2 && (
              <>
                {symbols.length > 0 ? (
                  <div className="grid grid-cols-1 gap-1">
                    {symbols.map(symbol => (
                      <button
                        key={symbol.symbol}
                        onClick={() => handleSelectSymbol(symbol.symbol)}
                        className="flex items-center justify-between px-3 py-2 hover:bg-[#222] rounded text-left transition-colors"
                      >
                        <div>
                          <div className="text-white font-medium">{symbol.symbol}</div>
                          {symbol.description && (
                            <div className="text-xs text-gray-400">{symbol.description}</div>
                          )}
                        </div>
                        {symbol.popular && (
                          <Star className="w-4 h-4 text-yellow-500" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400">
                    No symbols found
                  </div>
                )}
              </>
            )}
            
            {!loading && searchTerm.length < 2 && (
              <>
                {Object.entries(popularSymbols).map(([category, symbolList]) => (
                  symbolList && symbolList.length > 0 && (
                    <div key={category} className="mb-3">
                      <div className="text-xs font-medium text-gray-500 px-2 py-1">
                        {SYMBOL_CATEGORIES[category] || category.toUpperCase()}
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {symbolList.map(sym => (
                          <button
                            key={sym.symbol}
                            onClick={() => handleSelectSymbol(sym.symbol)}
                            className={`flex items-center justify-between px-3 py-2 rounded text-left transition-colors ${
                              sym.available ? 'hover:bg-[#222] text-white' : 'text-gray-500 cursor-default'
                            }`}
                            disabled={!sym.available}
                          >
                            <div>
                              <div className={sym.available ? 'font-medium' : ''}>{sym.symbol}</div>
                              {sym.description && (
                                <div className="text-xs text-gray-400">{sym.description}</div>
                              )}
                            </div>
                            {sym.popular && (
                              <Star className="w-4 h-4 text-yellow-500" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                ))}
                
                {Object.keys(popularSymbols).length === 0 && (
                  <div className="text-center py-4 text-gray-400">
                    Type to search for symbols
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Compact version of the Symbol Picker with simpler UI
 */
export const CompactSymbolPicker = ({ selectedSymbol, onSymbolSelect, accounts = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [symbols, setSymbols] = useState([]);
  const [popularSymbols, setPopularSymbols] = useState({});
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

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

  // Load popular symbols when dropdown opens
  useEffect(() => {
    if (isOpen) {
      loadPopularSymbols();
    }
  }, [isOpen]);

  // Load popular symbols
  const loadPopularSymbols = async () => {
    try {
      setLoading(true);
      const response = await getPopularSymbols();
      if (response && response.popular_symbols) {
        setPopularSymbols(response.popular_symbols);
      } else {
        // Use mock data
        setPopularSymbols({
          major_pairs: [
            { symbol: 'EURUSD', description: 'Euro/US Dollar', available: true },
            { symbol: 'GBPUSD', description: 'British Pound/US Dollar', available: true },
            { symbol: 'USDJPY', description: 'US Dollar/Japanese Yen', available: true }
          ],
          crypto: [
            { symbol: 'BTCUSD', description: 'Bitcoin/US Dollar', available: true },
            { symbol: 'ETHUSD', description: 'Ethereum/US Dollar', available: true }
          ]
        });
      }
    } catch (error) {
      console.error('Error loading popular symbols:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle symbol search
  const handleSymbolSearch = async (term) => {
    setSearchTerm(term);
    if (!term || term.length < 2) {
      setSymbols([]);
      return;
    }
    
    try {
      setLoading(true);
      const response = await searchSymbols(term);
      if (response && response.symbols) {
        setSymbols(formatSymbolsForPicker(response));
      } else {
        setSymbols(mockSearchSymbols(term));
      }
    } catch (error) {
      console.error('Error searching symbols:', error);
      setSymbols(mockSearchSymbols(term));
    } finally {
      setLoading(false);
    }
  };

  // Define categories
  const SYMBOL_CATEGORIES = {
    major_pairs: 'MAJOR FOREX',
    cross_pairs: 'CROSS PAIRS',
    commodities: 'COMMODITIES',
    crypto: 'CRYPTO'
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className="flex items-center border border-[#333] rounded bg-[#1A1A1A] overflow-hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1 px-3 py-2">
          {selectedSymbol ? (
            <div className="text-white">{selectedSymbol}</div>
          ) : (
            <div className="text-gray-400">Select symbol</div>
          )}
        </div>
        <button
          className="px-3 py-2 text-gray-400 hover:bg-[#222] transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-64 right-0 bg-[#1A1A1A] border border-[#333] rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-[#333]">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSymbolSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-[#222] border border-[#333] rounded pl-8 pr-3 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto p-1">
            {loading && (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="w-4 h-4 text-blue-500 animate-spin mr-2" />
                <span className="text-sm text-gray-400">Loading...</span>
              </div>
            )}
            
            {!loading && searchTerm.length >= 2 && (
              <>
                {symbols.length > 0 ? (
                  <div className="space-y-0.5">
                    {symbols.map(symbol => (
                      <button
                        key={symbol.symbol}
                        onClick={() => {
                          onSymbolSelect(symbol.symbol);
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center px-3 py-2 hover:bg-[#222] rounded text-left transition-colors"
                      >
                        <div className="flex-1">
                          <div className="text-white text-sm font-medium">{symbol.symbol}</div>
                          {symbol.description && (
                            <div className="text-xs text-gray-400 truncate">{symbol.description}</div>
                          )}
                        </div>
                        {symbol.popular && (
                          <Star className="w-3 h-3 text-yellow-500 ml-2" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-gray-400">
                    No symbols found
                  </div>
                )}
              </>
            )}
            
            {!loading && searchTerm.length < 2 && (
              <>
                {Object.entries(popularSymbols).map(([category, symbolList]) => (
                  symbolList && symbolList.length > 0 && (
                    <div key={category} className="mb-2">
                      <div className="text-xs font-medium text-gray-500 px-2 py-1">
                        {SYMBOL_CATEGORIES[category] || category.toUpperCase()}
                      </div>
                      <div className="space-y-0.5">
                        {symbolList.map(sym => (
                          <button
                            key={sym.symbol}
                            onClick={() => {
                              onSymbolSelect(sym.symbol);
                              setIsOpen(false);
                            }}
                            className="w-full flex items-center px-3 py-1.5 hover:bg-[#222] rounded text-left transition-colors"
                          >
                            <div className="flex-1">
                              <div className="text-white text-sm">{sym.symbol}</div>
                              {sym.description && (
                                <div className="text-xs text-gray-400 truncate">{sym.description}</div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                ))}
                
                {Object.keys(popularSymbols).length === 0 && (
                  <div className="text-center py-4 text-sm text-gray-400">
                    Type to search symbols
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SymbolPicker;
