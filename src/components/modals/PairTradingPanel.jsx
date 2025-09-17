import React, { useState, useEffect } from 'react';
import { Scale, AlertTriangle, Info, TrendingUp, TrendingDown, HelpCircle, BarChart3, RefreshCw, Search, X, Clock, Link2, Activity, ArrowRightLeft, ChevronDown, Play } from 'lucide-react';
import { getPopularSymbols, searchSymbols, mockSearchSymbols, formatSymbolsForPicker } from '../../utils/symbolpicker';
import { toast } from 'react-hot-toast';
import { getEASymbols, getEASymbolPrice, getEAMarketPrice, searchEASymbols } from '../../api/ea';

// Default categories from our symbol picker API
const SYMBOL_CATEGORIES = {
  major_pairs: 'MAJOR FOREX PAIRS',
  cross_pairs: 'CROSS FOREX PAIRS',
  exotic_pairs: 'EXOTIC PAIRS',
  commodities: 'COMMODITIES',
  indices: 'INDICES',
  crypto: 'CRYPTOCURRENCY'
};

// Pair trade action types for dropdown
const PAIR_TRADE_ACTIONS = [
  {
    label: "BUY SPREAD",
    value: "BUY_SPREAD",
    description: "Buy Symbol1, Sell Symbol2 (expect spread to widen)",
    color: "text-green-400",
    icon: "📈"
  },
  {
    label: "SELL SPREAD", 
    value: "SELL_SPREAD",
    description: "Sell Symbol1, Buy Symbol2 (expect spread to narrow)",
    color: "text-red-400",
    icon: "📉"
  }
];

// EA Trader Style Pair Trading Panel Component
const PairTradingPanel = ({ data, setData, onSubmit, submitting, selectedAccount }) => {
  const updateData = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  // State for search term
  const [searchTerm, setSearchTerm] = useState('');
  // State for symbol selection modal
  const [showSymbolModal, setShowSymbolModal] = useState(false);
  // State to track which symbol is being selected (1 or 2)
  const [selectingSymbol, setSelectingSymbol] = useState(null);
  // State for symbols
  const [symbols, setSymbols] = useState([]);
  // State for popular symbols
  const [popularSymbols, setPopularSymbols] = useState({});
  // Loading state
  const [loading, setLoading] = useState(false);
  // Help modal state
  const [showHelp, setShowHelp] = useState(false);
  
  // Live price states
  const [symbol1Price, setSymbol1Price] = useState(null);
  const [symbol2Price, setSymbol2Price] = useState(null);
  const [currentSpread, setCurrentSpread] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState(null);
  const [lastPriceUpdate, setLastPriceUpdate] = useState(null);
  const [spreadDirection, setSpreadDirection] = useState(null); // "WIDENING", "NARROWING", or null
  
  // Symbol suggestions states (like in UnifiedOrderPanel)
  const [availableSymbols, setAvailableSymbols] = useState([]);
  const [symbolsLoading, setSymbolsLoading] = useState(false);
  const [symbolsLoadedFor, setSymbolsLoadedFor] = useState(null);
  const [symbol1Suggestions, setSymbol1Suggestions] = useState([]);
  const [symbol2Suggestions, setSymbol2Suggestions] = useState([]);
  const [showSymbol1Suggestions, setShowSymbol1Suggestions] = useState(false);
  const [showSymbol2Suggestions, setShowSymbol2Suggestions] = useState(false);
  
  // Action dropdown state
  const [selectedAction, setSelectedAction] = useState('BUY_SPREAD');
  const [showActionDropdown, setShowActionDropdown] = useState(false);

  useEffect(() => {
    // Initialize with STATISTICAL correlation type as the default for advanced analysis
    if (!data.correlation_type) {
      updateData('correlation_type', 'STATISTICAL');
    }
    
    // Initialize order type with MARKET as default
    if (!data.order_type) {
      updateData('order_type', 'MARKET');
    }

    // Initialize with BUY as the default action for FastAPI alignment
    if (!data.action) {
      updateData('action', 'BUY_SPREAD');
    }
    
    // Load popular symbols when component mounts
    loadPopularSymbols();
  }, []);
  
  // Sync selectedAction with data.action
  useEffect(() => {
    if (data.action && data.action !== selectedAction) {
      setSelectedAction(data.action);
    }
  }, [data.action]);
  
  // Fetch available symbols when account is selected (like in UnifiedOrderPanel)
  useEffect(() => {
    if (selectedAccount) {
      const accountId = selectedAccount.account_id || selectedAccount.id;
      // Only fetch symbols if we haven't loaded them for this account yet
      if (symbolsLoadedFor !== accountId) {
        fetchAvailableSymbols();
      }
    }
    // Clear symbols when account changes
    else if (!selectedAccount) {
      setAvailableSymbols([]);
      setSymbolsLoadedFor(null);
    }
  }, [selectedAccount]);
  
  // Fetch available symbols from EA
  const fetchAvailableSymbols = async () => {
    if (!selectedAccount) return;
    
    const accountId = selectedAccount.account_id || selectedAccount.id;
    setSymbolsLoading(true);
    
    try {
      const response = await getEASymbols(accountId);
      
      if (response.success && response.data) {
        setAvailableSymbols(response.data);
        setSymbolsLoadedFor(accountId); // Mark symbols as loaded for this account
      }
    } catch (error) {
      console.error('Error fetching available symbols:', error);
    } finally {
      setSymbolsLoading(false);
    }
  };
  
  // Function to force refresh symbols (for manual refresh)
  const refreshSymbols = async () => {
    if (selectedAccount) {
      setSymbolsLoadedFor(null); // Reset the loaded flag
      await fetchAvailableSymbols();
    }
  };
  
  // Get symbol suggestions from available symbols using EA API (like in UnifiedOrderPanel)
  const getSymbolSuggestions = async (input, symbolNumber) => {
    if (!input || input.length < 2) {
      if (symbolNumber === 1) {
        setSymbol1Suggestions([]);
        setShowSymbol1Suggestions(false);
      } else {
        setSymbol2Suggestions([]);
        setShowSymbol2Suggestions(false);
      }
      return;
    }

    // First try to use cached available symbols if they exist
    if (availableSymbols && availableSymbols.length > 0) {
      const filtered = availableSymbols
        .filter(symbolInfo => {
          const symbol = (symbolInfo.symbol || symbolInfo.standard_symbol || '').toString().toUpperCase();
          const brokerSymbol = (symbolInfo.broker_symbol || '').toString().toUpperCase();
          const description = (symbolInfo.description || '').toString().toUpperCase();
          const searchTerm = input.toUpperCase();
          
          return symbol.includes(searchTerm) || 
                 brokerSymbol.includes(searchTerm) || 
                 description.includes(searchTerm);
        })
        .slice(0, 10)
        .map(symbolInfo => ({
          symbol: symbolInfo.symbol || symbolInfo.standard_symbol,
          description: symbolInfo.description || symbolInfo.broker_symbol || '',
          broker_symbol: symbolInfo.broker_symbol
        }));

      if (symbolNumber === 1) {
        setSymbol1Suggestions(filtered);
        setShowSymbol1Suggestions(filtered.length > 0);
      } else {
        setSymbol2Suggestions(filtered);
        setShowSymbol2Suggestions(filtered.length > 0);
      }
      return;
    }

    // If no cached symbols, try EA search API
    if (selectedAccount) {
      try {
        const accountId = selectedAccount.account_id || selectedAccount.id;
        const response = await searchEASymbols(accountId, input, 10);
        
        if (response.success && response.data) {
          const suggestions = response.data.map(symbolInfo => ({
            symbol: symbolInfo.symbol || symbolInfo.standard_symbol,
            description: symbolInfo.description || symbolInfo.broker_symbol || '',
            broker_symbol: symbolInfo.broker_symbol
          }));

          if (symbolNumber === 1) {
            setSymbol1Suggestions(suggestions);
            setShowSymbol1Suggestions(suggestions.length > 0);
          } else {
            setSymbol2Suggestions(suggestions);
            setShowSymbol2Suggestions(suggestions.length > 0);
          }
        }
      } catch (error) {
        console.error('Error searching symbols:', error);
      }
    }
  };

  // Handle symbol input changes with suggestions
  const handleSymbolInputChange = async (value, symbolNumber) => {
    if (symbolNumber === 1) {
      updateData('symbol1', value);
    } else {
      updateData('symbol2', value);
    }
    
    // Get suggestions after a short delay to avoid too many API calls
    setTimeout(() => {
      getSymbolSuggestions(value, symbolNumber);
    }, 300);
  };

  // Select suggestion
  const selectSuggestion = (symbol, symbolNumber) => {
    if (symbolNumber === 1) {
      updateData('symbol1', symbol);
      setSymbol1Suggestions([]);
      setShowSymbol1Suggestions(false);
    } else {
      updateData('symbol2', symbol);
      setSymbol2Suggestions([]);
      setShowSymbol2Suggestions(false);
    }
  };
  
  // Fetch prices when symbols change or account changes
  useEffect(() => {
    if (selectedAccount && data.symbol1 && data.symbol1.length >= 3) {
      fetchSymbolPrice(1, data.symbol1);
    } else {
      setSymbol1Price(null);
    }
    
    if (selectedAccount && data.symbol2 && data.symbol2.length >= 3) {
      fetchSymbolPrice(2, data.symbol2);
    } else {
      setSymbol2Price(null);
    }
  }, [selectedAccount, data.symbol1, data.symbol2]);
  
  // Calculate spread when both prices are available
  useEffect(() => {
    if (symbol1Price && symbol2Price) {
      const spread = calculateSpread(symbol1Price, symbol2Price);
      
      // Check if spread direction changed
      if (currentSpread !== null) {
        if (spread > currentSpread) {
          setSpreadDirection("WIDENING");
        } else if (spread < currentSpread) {
          setSpreadDirection("NARROWING");
        }
      }
      
      setCurrentSpread(spread);
      setLastPriceUpdate(new Date());
    } else {
      setCurrentSpread(null);
    }
  }, [symbol1Price, symbol2Price]);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close action dropdown if clicking outside
      if (showActionDropdown && !event.target.closest('.action-dropdown')) {
        setShowActionDropdown(false);
      }
      // Close symbol suggestions if clicking outside
      if (showSymbol1Suggestions && !event.target.closest('.symbol1-suggestions')) {
        setShowSymbol1Suggestions(false);
      }
      if (showSymbol2Suggestions && !event.target.closest('.symbol2-suggestions')) {
        setShowSymbol2Suggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActionDropdown, showSymbol1Suggestions, showSymbol2Suggestions]);
  
  // Function to calculate spread between two symbols
  const calculateSpread = (price1, price2) => {
    if (!price1 || !price2) return null;
    
    // Use mid price (average of bid and ask)
    const midPrice1 = (price1.bid + price1.ask) / 2;
    const midPrice2 = (price2.bid + price2.ask) / 2;
    
    // Spread = Symbol1 Price - Symbol2 Price
    return midPrice1 - midPrice2;
  };
  
  // Fetch price for a specific symbol
  const fetchSymbolPrice = async (symbolNum, symbol) => {
    if (!selectedAccount || !symbol || symbol.length < 3) return;
    
    const accountId = selectedAccount.account_id || selectedAccount.id;
    
    if (!accountId) {
      console.error('No account ID available');
      return;
    }
    
    if (symbolNum === 1) {
      setPriceLoading(true);
    }
    
    try {
      const response = await getEAMarketPrice(accountId, symbol);
      
      if (response.success) {
        const priceData = {
          symbol: symbol,
          bid: response.bid,
          ask: response.ask,
          price: response.price,
          spread: response.spread,
          timestamp: response.timestamp || new Date().toISOString()
        };
        
        if (symbolNum === 1) {
          setSymbol1Price(priceData);
        } else {
          setSymbol2Price(priceData);
        }
        
        setPriceError(null);
      } else {
        // Try detailed symbol price if market price fails
        const detailedResponse = await getEASymbolPrice(accountId, symbol);
        
        if (detailedResponse.success && detailedResponse.data) {
          const priceData = {
            symbol: symbol,
            bid: detailedResponse.data.bid,
            ask: detailedResponse.data.ask,
            price: detailedResponse.data.price || (detailedResponse.data.bid + detailedResponse.data.ask) / 2,
            spread: detailedResponse.data.spread,
            timestamp: detailedResponse.data.timestamp || new Date().toISOString()
          };
          
          if (symbolNum === 1) {
            setSymbol1Price(priceData);
          } else {
            setSymbol2Price(priceData);
          }
          
          setPriceError(null);
        } else {
          if (symbolNum === 1) {
            setSymbol1Price(null);
            setPriceError(`Failed to fetch price for ${symbol}`);
          } else {
            setSymbol2Price(null);
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching price for symbol ${symbol}:`, error);
      
      if (symbolNum === 1) {
        setSymbol1Price(null);
        setPriceError(`Error: ${error.message}`);
      } else {
        setSymbol2Price(null);
      }
    } finally {
      if (symbolNum === 1) {
        setPriceLoading(false);
      }
    }
  };
  
  // Load popular symbols from API
  const loadPopularSymbols = async () => {
    try {
      setLoading(true);
      const response = await getPopularSymbols();
      if (response && response.popular_symbols) {
        setPopularSymbols(response.popular_symbols);
      } else {
        // Fallback mock data if API fails
        setPopularSymbols({
          major_pairs: [],
          cross_pairs: [],
          commodities: []
        });
      }
    } catch (error) {
      //console.error('Error loading popular symbols:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to open symbol selection modal
  const openSymbolSelector = (symbolNumber) => {
    setSelectingSymbol(symbolNumber);
    setShowSymbolModal(true);
    setSearchTerm('');
    // Reset symbols list when opening modal
    setSymbols([]);
  };

  // Function to select a symbol
  const selectSymbol = (symbol) => {
    if (selectingSymbol === 1) {
      updateData('symbol1', symbol);
    } else if (selectingSymbol === 2) {
      updateData('symbol2', symbol);
    }
    setShowSymbolModal(false);
  };

  // Search for symbols
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
        // Fallback to mock search if API fails
        setSymbols(mockSearchSymbols(term));
      }
    } catch (error) {
      //console.error('Error searching symbols:', error);
      // Fallback to mock search
      setSymbols(mockSearchSymbols(term));
    } finally {
      setLoading(false);
    }
  };

  // Update the onClick handlers to pass the correct data structure
  const handlePendingOrderSubmit = () => {
    // For pending orders, construct the proper payload
    const payload = {
      symbol1: data.symbol1,
      symbol2: data.symbol2,
      volume1: parseFloat(data.volume1) || 0.1,
      volume2: parseFloat(data.volume2) || 0.1,
      action: selectedAction || data.action || 'buy_spread',
      order_type: 'PENDING',
      entry_spread: parseFloat(data.entry_spread),
      spread_direction: data.spread_direction || 'NARROW'
    };
    
    // Add optional fields
    if (data.spread_stop_loss) payload.spread_stop_loss = parseFloat(data.spread_stop_loss);
    if (data.spread_take_profit) payload.spread_take_profit = parseFloat(data.spread_take_profit);
    if (data.comment) payload.comment = data.comment;
    
    onSubmit(payload);
  };

  const handleMarketOrderSubmit = () => {
    // For market orders, construct the proper payload
    const payload = {
      symbol1: data.symbol1,
      symbol2: data.symbol2,
      volume1: parseFloat(data.volume1) || 0.1,
      volume2: parseFloat(data.volume2) || 0.1,
      action: selectedAction || data.action || 'buy_spread',
      order_type: 'MARKET'
    };
    
    // Add optional fields
    if (data.spread_stop_loss) payload.spread_stop_loss = parseFloat(data.spread_stop_loss);
    if (data.spread_take_profit) payload.spread_take_profit = parseFloat(data.spread_take_profit);
    if (data.comment) payload.comment = data.comment;
    
    onSubmit(payload);
  };

  const handleStatisticalSubmit = () => {
    // For statistical analysis, construct the proper payload
    const payload = {
      symbol1: data.symbol1,
      symbol2: data.symbol2,
      volume1: parseFloat(data.volume1) || 0.1,
      volume2: parseFloat(data.volume2) || 0.1,
      action: selectedAction || data.action || 'buy_spread'
    };
    
    // Add optional fields
    if (data.comment) payload.comment = data.comment;
    
    onSubmit(payload);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#222] border border-[#333] rounded-lg p-4">
        <h4 className="text-white font-medium mb-4 flex items-center gap-2">
          <Scale className="w-4 h-4" />
          Statistical Pair Trading
          <button 
            className="text-blue-400 hover:text-blue-300 transition-colors ml-auto"
            onClick={() => setShowHelp(!showHelp)}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </h4>
        
        {showHelp && (
          <div className="bg-[#2A2A2A] border border-[#444] rounded-lg p-3 mb-4 text-sm text-gray-300">
            <h5 className="text-blue-400 font-medium mb-2 flex items-center gap-1">
              <Info className="w-4 h-4" />
              Advanced Pair Trading
            </h5>
            <div className="space-y-2">
              <p>
                <strong>Statistical Analysis:</strong> Advanced correlation, cointegration, and Z-score analysis with automatic hedge ratio calculation for market-neutral positions.
              </p>
              <p>
                <strong>Market Orders:</strong> Execute immediately at current market prices with real-time spread monitoring via WebSocket for instant updates.
              </p>
              <p>
                <strong>Pending Spread Orders:</strong> Conditional execution when spread reaches target levels - perfect for mean reversion strategies.
              </p>
              <p>
                <strong>Risk Management:</strong> Single stop loss/take profit based on spread values, not individual symbol prices.
              </p>
              <p className="text-yellow-400">
                💡 Trade Logic: BUY spread = Buy Symbol1 + Sell Symbol2 (expect spread to increase)
              </p>
              <p className="text-blue-400">
                📊 Spread = Symbol1 Price - Symbol2 Price
              </p>
            </div>
          </div>
        )}
        
        
        
        {/* Symbols Count Display */}
        {availableSymbols.length > 0 && (
          <div className="bg-[#2A2A2A] border border-[#444] rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-300">
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Available Symbols: <span className="text-blue-400 font-semibold">{availableSymbols.length}</span>
              </div>
              <button
                onClick={refreshSymbols}
                disabled={symbolsLoading}
                className="text-blue-400 hover:text-blue-300 disabled:text-gray-500 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${symbolsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Symbol */}
          <div className="bg-[#1A1A1A] border border-[#444] rounded-lg p-4">
            <h5 className="text-blue-400 font-medium mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Symbol 1 (Primary)
            </h5>
            <div className="space-y-3">
              <div className="relative symbol1-suggestions">
                <label className="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
                <div className="flex">
                  <input
                    type="text"
                    value={data.symbol1}
                    onChange={(e) => handleSymbolInputChange(e.target.value.toUpperCase(), 1)}
                    onFocus={() => {
                      if (data.symbol1.length >= 2) {
                        getSymbolSuggestions(data.symbol1, 1);
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding suggestions to allow clicks
                      setTimeout(() => setShowSymbol1Suggestions(false), 200);
                    }}
                    placeholder="Type symbol (e.g., EUR)"
                    className="w-full bg-[#222] border border-[#555] rounded-l-lg px-3 py-2 text-white"
                  />
                  <button
                    onClick={() => openSymbolSelector(1)}
                    className="bg-[#333] border border-[#555] border-l-0 rounded-r-lg px-2 text-blue-400 hover:text-blue-300"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Symbol 1 Suggestions */}
                {showSymbol1Suggestions && symbol1Suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-[#222] border border-[#444] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {symbol1Suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => selectSuggestion(suggestion.symbol, 1)}
                        className="w-full text-left px-3 py-2 hover:bg-[#333] text-white border-b border-[#444] last:border-b-0"
                      >
                        <div className="font-mono text-sm">{suggestion.symbol}</div>
                        {suggestion.description && (
                          <div className="text-xs text-gray-400">{suggestion.description}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Live price info for Symbol 1 */}
              {symbol1Price && (
                <div className="bg-[#222] border border-[#444] rounded-lg p-2 text-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-gray-400">Bid:</span> 
                      <span className="text-green-400 font-mono ml-1">{symbol1Price.bid.toFixed(5)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Ask:</span> 
                      <span className="text-red-400 font-mono ml-1">{symbol1Price.ask.toFixed(5)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Spread:</span> 
                      <span className="text-blue-400 font-mono ml-1">{symbol1Price.spread.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex items-center mt-1 text-xs text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                    <div>Last updated: {new Date(symbol1Price.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              )}
              
              {priceLoading && !symbol1Price && (
                <div className="flex items-center justify-center p-2 bg-[#222] border border-[#444] rounded-lg">
                  <RefreshCw className="w-4 h-4 text-blue-400 animate-spin mr-2" />
                  <span className="text-gray-300 text-sm">Loading price data...</span>
                </div>
              )}
              
              {priceError && !symbol1Price && (
                <div className="bg-[#331111] border border-[#662222] rounded-lg p-2 text-xs text-red-300">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  {priceError}
                </div>
              )}
            </div>
          </div>

          {/* Second Symbol */}
          <div className="bg-[#1A1A1A] border border-[#444] rounded-lg p-4">
            <h5 className="text-blue-400 font-medium mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Symbol 2 (Secondary)
            </h5>
            <div className="space-y-3">
              <div className="relative symbol2-suggestions">
                <label className="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
                <div className="flex">
                  <input
                    type="text"
                    value={data.symbol2}
                    onChange={(e) => handleSymbolInputChange(e.target.value.toUpperCase(), 2)}
                    onFocus={() => {
                      if (data.symbol2.length >= 2) {
                        getSymbolSuggestions(data.symbol2, 2);
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding suggestions to allow clicks
                      setTimeout(() => setShowSymbol2Suggestions(false), 200);
                    }}
                    placeholder="Type symbol (e.g., GBP)"
                    className="w-full bg-[#222] border border-[#555] rounded-l-lg px-3 py-2 text-white"
                  />
                  <button
                    onClick={() => openSymbolSelector(2)}
                    className="bg-[#333] border border-[#555] border-l-0 rounded-r-lg px-2 text-blue-400 hover:text-blue-300"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Symbol 2 Suggestions */}
                {showSymbol2Suggestions && symbol2Suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-[#222] border border-[#444] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {symbol2Suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => selectSuggestion(suggestion.symbol, 2)}
                        className="w-full text-left px-3 py-2 hover:bg-[#333] text-white border-b border-[#444] last:border-b-0"
                      >
                        <div className="font-mono text-sm">{suggestion.symbol}</div>
                        {suggestion.description && (
                          <div className="text-xs text-gray-400">{suggestion.description}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Live price info for Symbol 2 */}
              {symbol2Price && (
                <div className="bg-[#222] border border-[#444] rounded-lg p-2 text-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-gray-400">Bid:</span> 
                      <span className="text-green-400 font-mono ml-1">{symbol2Price.bid.toFixed(5)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Ask:</span> 
                      <span className="text-red-400 font-mono ml-1">{symbol2Price.ask.toFixed(5)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Spread:</span> 
                      <span className="text-blue-400 font-mono ml-1">{symbol2Price.spread.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex items-center mt-1 text-xs text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                    <div>Last updated: {new Date(symbol2Price.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Current Spread Information */}
          {currentSpread !== null && (
            <div className="bg-[#1A2A1A] border border-[#2A4A2A] col-span-2 rounded-lg p-3 mt-2">
              <h5 className="text-green-400 font-medium mb-2 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" />
                Current Spread
              </h5>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#222] border border-[#333] rounded-lg p-2">
                  <div className="text-center">
                    <div className="text-xl font-mono font-bold text-white">
                      {currentSpread.toFixed(5)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {data.symbol1} - {data.symbol2}
                    </div>
                  </div>
                </div>
                
                <div className="bg-[#222] border border-[#333] rounded-lg p-2">
                  <div className="text-center">
                    <div className={`text-sm font-medium ${spreadDirection === "WIDENING" ? "text-green-400" : spreadDirection === "NARROWING" ? "text-red-400" : "text-blue-400"}`}>
                      {spreadDirection === "WIDENING" ? (
                        <>
                          <TrendingUp className="inline mr-1 w-4 h-4" />
                          Widening
                        </>
                      ) : spreadDirection === "NARROWING" ? (
                        <>
                          <TrendingDown className="inline mr-1 w-4 h-4" />
                          Narrowing
                        </>
                      ) : (
                        <>
                          <Activity className="inline mr-1 w-4 h-4" />
                          Stable
                        </>
                      )}
                    </div>
                    {lastPriceUpdate && (
                      <div className="text-xs text-gray-500 mt-1">
                        Updated: {lastPriceUpdate.toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Trade Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Volume for {data.symbol1}</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={data.volume1 || '0.1'}
              onChange={(e) => updateData('volume1', e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Volume for {data.symbol2}</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={data.volume2 || '0.1'}
              onChange={(e) => updateData('volume2', e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            />
          </div>

         {/* Line 768 omitted */}         { /* Trade Action Selection */}
                <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Trade Action
                </label>
                <select
                  value={data.action || 'BUY_SPREAD'}
                  onChange={(e) => {
                  updateData('action', e.target.value);
                  setSelectedAction(e.target.value);
                  }}
                  className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
                >
                  <optgroup label="Spread Orders">
                  <option value="BUY_SPREAD">BUY SPREAD (Buy Symbol1, Sell Symbol2)</option>
                  <option value="SELL_SPREAD">SELL SPREAD (Sell Symbol1, Buy Symbol2)</option>
                  </optgroup>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {data.action === 'BUY_SPREAD' 
                  ? 'Expect spread to widen - Buy Symbol1 and Sell Symbol2 simultaneously'
                  : 'Expect spread to narrow - Sell Symbol1 and Buy Symbol2 simultaneously'
                  }
                </p>
                </div>

                {/* Execution Type Selection */}
                <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Execution Type
                </label>
                <select
                  value={data.order_type || 'MARKET'}
                  onChange={(e) => updateData('order_type', e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
                >
                  <option value="MARKET">Market Order (Execute Immediately)</option>
                  <option value="PENDING">Pending Order (Wait for Conditions)</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {data.order_type === 'MARKET' 
                  ? 'Execute immediately at current market prices'
                  : 'Wait for specific spread conditions to be met'
                  }
                </p>
                </div>

                {/* Correlation Type Selection */}
          {/* <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Analysis Type
            </label>
            <select
              value={data.correlation_type || 'STATISTICAL'}
              onChange={(e) => updateData('correlation_type', e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            >
              <option value="STATISTICAL">Statistical Analysis (Advanced)</option>
              <option value="SIMPLE">Simple Correlation</option>
              <option value="MEAN_REVERSION">Mean Reversion</option>
            </select>
          </div> */}
        </div>

        {/* Spread-based Risk Management */}
        <div className="mt-4 p-4 bg-[#2A2A2A] border border-[#444] rounded-lg">
          <h5 className="text-green-400 font-medium mb-3 flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Spread-based Risk Management
          </h5>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Spread Stop Loss
                
              </label>
              <input
                type="number"
                step="0.00001"
                value={data.spread_stop_loss || ''}
                onChange={(e) => updateData('spread_stop_loss', e.target.value)}
                placeholder="e.g., -0.0150"
                className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
              />
              
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Spread Take Profit
               
              </label>
              <input
                type="number"
                step="0.00001"
                value={data.spread_take_profit || ''}
                onChange={(e) => updateData('spread_take_profit', e.target.value)}
                placeholder="e.g., 0.0100"
                className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
              />
              
            </div>
          </div>
        </div>

        {/* Pending Order Controls - Only show if PENDING order type */}
        {data.order_type === 'PENDING' && (
          <div className="mt-4 p-4 bg-[#2A2A2A] border border-[#444] rounded-lg">
            <h5 className="text-blue-400 font-medium mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Spread Order Settings
            </h5>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Entry Spread Level
                  <span className="ml-1 text-red-400 text-xs">(Required)</span>
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={data.entry_spread || ''}
                  onChange={(e) => updateData('entry_spread', e.target.value)}
                  placeholder="e.g., 0.0250"
                  className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Spread Direction
                </label>
                <select
                  value={data.spread_direction || 'NARROW'}
                  onChange={(e) => updateData('spread_direction', e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
                >
                  <option value="NARROW">Narrow (Mean Reversion)</option>
                  <option value="WIDEN">Widen (Trend Following)</option>
                </select>
              </div>
              
              {/* <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Expiration
                  <span className="ml-1 text-gray-500 text-xs">(Optional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={data.expiration || ''}
                  onChange={(e) => updateData('expiration', e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
                />
              </div> */}
            </div>
          </div>
        )}

        {/* Additional Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Trade Type (Manual Override)
              <span className="ml-1 text-gray-500 text-xs">(Optional for Statistical mode)</span>
            </label>
            <select
              value={data.trade_type || ''}
              onChange={(e) => updateData('trade_type', e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
              disabled={data.correlation_type === 'STATISTICAL'}
            >
              <option value="">Auto-detect from correlation</option>
              <option value="BUY">BUY Spread (Symbol1 ↑, Symbol2 ↓)</option>
              <option value="SELL">SELL Spread (Symbol1 ↓, Symbol2 ↑)</option>
            </select>
          </div> */}
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Comment
              <span className="ml-1 text-gray-500 text-xs">(Optional)</span>
            </label>
            <input
              type="text"
              value={data.comment || ''}
              onChange={(e) => updateData('comment', e.target.value)}
              placeholder="Trade notes..."
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>


        {/* Action Buttons */}
        <div className="mt-6">
          {data.order_type === 'PENDING' ? (
            // For pending orders, single placement button
            <button
              onClick={handlePendingOrderSubmit}
              disabled={submitting || !data.symbol1 || !data.symbol2 || !data.entry_spread || !data.volume1 || !data.volume2}
              className={`w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors ${
                submitting || !data.symbol1 || !data.symbol2 || !data.entry_spread || !data.volume1 || !data.volume2 ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? 'Placing Pending Order...' : 'Place Pending Spread Order'}
            </button>
          ) : data.correlation_type === 'STATISTICAL' ? (
            // For statistical analysis, single analyze & execute button
            <button
              onClick={handleStatisticalSubmit}
              disabled={submitting || !data.symbol1 || !data.symbol2}
              className={`w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors ${
                submitting || !data.symbol1 || !data.symbol2 ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? 'Analyzing & Executing...' : '🤖 Statistical Analysis & Execute'}
            </button>
          ) : (
            // Enhanced execution section with dropdown
            <div className="space-y-4">
              {/* Action Selection Dropdown */}
              <div className="relative action-dropdown">
                <label className="block text-sm font-medium text-gray-300 mb-2">Trade Action</label>
                <button
                  onClick={() => setShowActionDropdown(!showActionDropdown)}
                  className="w-full bg-[#222] border border-[#555] rounded-lg px-3 py-2 text-white flex items-center justify-between hover:bg-[#333] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {selectedAction === 'BUY_SPREAD' ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">BUY SPREAD</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-4 h-4 text-red-400" />
                        <span className="text-red-400">SELL SPREAD</span>
                      </>
                    )}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showActionDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showActionDropdown && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-[#222] border border-[#444] rounded-lg shadow-lg overflow-hidden">
                    {PAIR_TRADE_ACTIONS.map((action) => (
                      <button
                        key={action.value}
                        onClick={() => {
                          setSelectedAction(action.value);
                          setShowActionDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-[#333] border-b border-[#444] last:border-b-0 flex items-center gap-2 transition-colors ${selectedAction === action.value ? 'bg-[#333]' : ''}`}
                      >
                        {action.value === 'BUY_SPREAD' ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        )}
                        <div className="flex-1">
                          <span className={action.value === 'BUY_SPREAD' ? 'text-green-400' : 'text-red-400'}>
                            {action.label}
                          </span>
                          <div className="text-xs text-gray-400">{action.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Execute Button */}
              <button
                onClick={handleMarketOrderSubmit}
                disabled={submitting || !data.symbol1 || !data.symbol2 || !symbol1Price || !symbol2Price || !data.volume1 || !data.volume2}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  submitting || !data.symbol1 || !data.symbol2 || !symbol1Price || !symbol2Price || !data.volume1 || !data.volume2
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : selectedAction === 'BUY_SPREAD'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white shadow-lg hover:shadow-green-500/25'
                    : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg hover:shadow-red-500/25'
                }`}
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Execute {selectedAction === 'BUY_SPREAD' ? 'BUY' : 'SELL'} Spread
                  </>
                )}
              </button>

              {/* Execution Summary */}
              {data.symbol1 && data.symbol2 && symbol1Price && symbol2Price && (
                <div className="bg-[#222] border border-[#444] rounded-lg p-3 text-xs">
                  <div className="text-gray-400 mb-1">Trade Summary:</div>
                  <div className="text-white">
                    {selectedAction === 'BUY_SPREAD' ? 'BUY' : 'SELL'} {data.symbol1}/{data.symbol2} spread
                  </div>
                  <div className="text-gray-400">
                    Lot Size: {data.lotSize} | Risk: {data.riskPercentage}%
                  </div>
                  {currentSpread !== null && (
                    <div className="text-gray-400">
                      Current Spread: {currentSpread.toFixed(5)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Real-time monitoring notice */}
          <div className="mt-3 p-2 bg-[#1A2A1A] border border-[#2A4A2A] rounded text-xs text-green-400">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Real-time spread monitoring enabled
            </div>
          </div>
        </div>
      </div>

      {/* Symbol Selection Modal */}
      {showSymbolModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#2A2A2A] flex justify-between items-center">
              <h3 className="text-lg font-medium text-white">Select Symbol {selectingSymbol}</h3>
              <button 
                className="text-gray-400 hover:text-white" 
                onClick={() => setShowSymbolModal(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 border-b border-[#2A2A2A]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSymbolSearch(e.target.value)}
                  placeholder="Search symbols..."
                  className="w-full bg-[#222] border border-[#444] rounded-lg pl-9 pr-3 py-2 text-white"
                />
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1 p-2">
              {loading && (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                  <RefreshCw className="w-5 h-5 animate-spin mb-2" />
                  <p>Loading symbols...</p>
                </div>
              )}
              
              {!loading && searchTerm.length < 2 && (
                <>
                  {Object.entries(popularSymbols).map(([category, symbolList]) => (
                    symbolList && symbolList.length > 0 && (
                      <div key={category}>
                        <div className="text-xs font-medium text-gray-500 px-2 py-1">
                          {SYMBOL_CATEGORIES[category] || category.toUpperCase()}
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {symbolList.map(sym => (
                            <button
                              key={sym.symbol}
                              onClick={() => selectSymbol(sym.symbol)}
                              className={`bg-[#222] hover:bg-[#333] border border-[#444] rounded px-3 py-2 text-left transition-colors ${
                                sym.available ? 'text-white' : 'text-gray-500'
                              }`}
                              disabled={!sym.available}
                            >
                              {sym.symbol}
                              {sym.name && sym.name !== sym.symbol && (
                                <span className="text-xs text-gray-400 block">{sym.name}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                  
                  {Object.keys(popularSymbols).length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                      <p>Type to search for symbols</p>
                    </div>
                  )}
                </>
              )}
              
              {!loading && searchTerm.length >= 2 && (
                <>
                  {symbols.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {symbols.map(symbol => (
                        <button
                          key={symbol.symbol}
                          onClick={() => selectSymbol(symbol.symbol)}
                          className="bg-[#222] hover:bg-[#333] border border-[#444] rounded px-3 py-2 text-white text-left transition-colors"
                        >
                          {symbol.symbol}
                          {symbol.description && (
                            <span className="text-xs text-gray-400 block">{symbol.description}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                      <p>No symbols found</p>
                      <p className="text-sm">Try a different search term</p>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="p-4 border-t border-[#2A2A2A]">
              <button
                onClick={() => setShowSymbolModal(false)}
                className="w-full py-2 px-4 bg-[#333] hover:bg-[#444] text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PairTradingPanel;
