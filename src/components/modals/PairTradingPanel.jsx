import React, { useState, useEffect } from 'react';
import { Scale, AlertTriangle, Info, TrendingUp, TrendingDown, HelpCircle, BarChart3, RefreshCw, Search, X, Clock, Link2 } from 'lucide-react';
import { getPopularSymbols, searchSymbols, mockSearchSymbols, formatSymbolsForPicker } from '../../utils/symbolpicker';
import { toast } from 'react-hot-toast';

// Default categories from our symbol picker API
const SYMBOL_CATEGORIES = {
  major_pairs: 'MAJOR FOREX PAIRS',
  cross_pairs: 'CROSS FOREX PAIRS',
  exotic_pairs: 'EXOTIC PAIRS',
  commodities: 'COMMODITIES',
  indices: 'INDICES',
  crypto: 'CRYPTOCURRENCY'
};

// EA Trader Style Pair Trading Panel Component
const PairTradingPanel = ({ data, setData, onSubmit, submitting }) => {
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

  useEffect(() => {
    // Initialize with STATISTICAL correlation type as the default for advanced analysis
    if (!data.correlation_type) {
      updateData('correlation_type', 'STATISTICAL');
    }
    
    // Initialize order type with MARKET as default
    if (!data.order_type) {
      updateData('order_type', 'MARKET');
    }
    
    // Load popular symbols when component mounts
    loadPopularSymbols();
  }, []);
  
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
      console.error('Error loading popular symbols:', error);
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
      console.error('Error searching symbols:', error);
      // Fallback to mock search
      setSymbols(mockSearchSymbols(term));
    } finally {
      setLoading(false);
    }
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
        
        
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Symbol */}
          <div className="bg-[#1A1A1A] border border-[#444] rounded-lg p-4">
            <h5 className="text-blue-400 font-medium mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Symbol 1 (Primary)
            </h5>
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={data.symbol1}
                      onChange={(e) => updateData('symbol1', e.target.value.toUpperCase())}
                      placeholder="Symbol (e.g., GBPUSD)"
                      className="w-full bg-[#222] border border-[#555] rounded-l-lg px-3 py-2 text-white"
                    />
                    <button
                      onClick={() => openSymbolSelector(1)}
                      className="bg-[#333] border border-[#555] border-l-0 rounded-r-lg px-2 text-blue-400 hover:text-blue-300"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Second Symbol */}
          <div className="bg-[#1A1A1A] border border-[#444] rounded-lg p-4">
            <h5 className="text-blue-400 font-medium mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Symbol 2 (Secondary)
            </h5>
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={data.symbol2}
                      onChange={(e) => updateData('symbol2', e.target.value.toUpperCase())}
                      placeholder="e.g., GBPUSD"
                      className="w-full bg-[#222] border border-[#555] rounded-l-lg px-3 py-2 text-white"
                    />
                    <button
                      onClick={() => openSymbolSelector(2)}
                      className="bg-[#333] border border-[#555] border-l-0 rounded-r-lg px-2 text-blue-400 hover:text-blue-300"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trade Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Volume</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={data.volume || '0.1'}
              onChange={(e) => updateData('volume', e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            />
          </div>

          {/* Order Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Order Type
            </label>
            <select
              value={data.order_type || 'MARKET'}
              onChange={(e) => updateData('order_type', e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            >
              <option value="MARKET">Market Order (Immediate)</option>
              <option value="PENDING">Pending Spread Order</option>
            </select>
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
              onClick={() => onSubmit('PENDING')}
              disabled={submitting || !data.symbol1 || !data.symbol2 || !data.entry_spread}
              className={`w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors ${
                submitting || !data.symbol1 || !data.symbol2 || !data.entry_spread ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? 'Placing Pending Order...' : 'Place Pending Spread Order'}
            </button>
          ) : data.correlation_type === 'STATISTICAL' ? (
            // For statistical analysis, single analyze & execute button
            <button
              onClick={() => onSubmit('STATISTICAL')}
              disabled={submitting || !data.symbol1 || !data.symbol2}
              className={`w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors ${
                submitting || !data.symbol1 || !data.symbol2 ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? 'Analyzing & Executing...' : '🤖 Statistical Analysis & Execute'}
            </button>
          ) : (
            // For manual correlation types, show BUY/SELL spread buttons
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => onSubmit('BUY')}
                disabled={submitting || !data.symbol1 || !data.symbol2}
                className={`py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors ${
                  submitting || !data.symbol1 || !data.symbol2 ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {submitting ? 'Processing...' : 'BUY Spread'}
              </button>
              <button
                onClick={() => onSubmit('SELL')}
                disabled={submitting || !data.symbol1 || !data.symbol2}
                className={`py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors ${
                  submitting || !data.symbol1 || !data.symbol2 ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {submitting ? 'Processing...' : 'SELL Spread'}
              </button>
            </div>
          )}
          
          {/* Real-time monitoring notice */}
          {/* <div className="mt-3 p-2 bg-[#1A2A1A] border border-[#2A4A2A] rounded text-xs text-green-400">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Real-time spread monitoring enabled (WebSocket: 31,500 updates/10s)
            </div>
          </div> */}
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
