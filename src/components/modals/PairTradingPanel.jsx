import React, { useState, useEffect } from 'react';
import { Scale, AlertTriangle, Info, TrendingUp, TrendingDown, HelpCircle, BarChart3, RefreshCw, Search, X } from 'lucide-react';
import { getPopularSymbols, searchSymbols, mockSearchSymbols, formatSymbolsForPicker } from '../../utils/symbolpicker';

// Default categories from our symbol picker API
const SYMBOL_CATEGORIES = {
  major_pairs: 'MAJOR FOREX PAIRS',
  cross_pairs: 'CROSS FOREX PAIRS',
  exotic_pairs: 'EXOTIC PAIRS',
  commodities: 'COMMODITIES',
  indices: 'INDICES',
  crypto: 'CRYPTOCURRENCY'
};

// Pair Trading Panel Component
const PairTradingPanel = ({ data, setData, onSubmit, submitting }) => {
  const updateData = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  // State for showing the help tooltip
  const [showHelp, setShowHelp] = useState(false);
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

  useEffect(() => {
    // Initialize with statistical pair trading as the default
    if (!data.correlation_type) {
      updateData('correlation_type', 'STATISTICAL');
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
              What is Pair Trading?
            </h5>
            <p className="mb-2">
              Pair trading is a <strong>market-neutral strategy</strong> that identifies two assets with a statistical relationship and trades them in opposite directions when their relationship deviates from the norm.
            </p>
            <p>
              The system will analyze the statistical relationship between your selected symbols and automatically determine the optimal trade directions based on historical correlation patterns.
            </p>
          </div>
        )}
        
        
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Symbol */}
          <div className="bg-[#1A1A1A] border border-[#444] rounded-lg p-4">
            <h5 className="text-blue-400 font-medium mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Symbol 1
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
                      placeholder="e.g., EURUSD"
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
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Volume</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={data.volume1}
                  onChange={(e) => updateData('volume1', e.target.value)}
                  className="w-full bg-[#222] border border-[#555] rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Stop Loss</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={data.stop_loss1}
                    onChange={(e) => updateData('stop_loss1', e.target.value)}
                    placeholder="Optional"
                    className="w-full bg-[#222] border border-[#555] rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Take Profit</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={data.take_profit1}
                    onChange={(e) => updateData('take_profit1', e.target.value)}
                    placeholder="Optional"
                    className="w-full bg-[#222] border border-[#555] rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Second Symbol */}
          <div className="bg-[#1A1A1A] border border-[#444] rounded-lg p-4">
            <h5 className="text-blue-400 font-medium mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Symbol 2
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
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Volume</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={data.volume2}
                  onChange={(e) => updateData('volume2', e.target.value)}
                  className="w-full bg-[#222] border border-[#555] rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Stop Loss</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={data.stop_loss2}
                    onChange={(e) => updateData('stop_loss2', e.target.value)}
                    placeholder="Optional"
                    className="w-full bg-[#222] border border-[#555] rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Take Profit</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={data.take_profit2}
                    onChange={(e) => updateData('take_profit2', e.target.value)}
                    placeholder="Optional"
                    className="w-full bg-[#222] border border-[#555] rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Correlation Threshold
              <span className="ml-1 text-gray-500 text-xs">(0.7-0.9 recommended)</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={data.correlation_threshold}
              onChange={(e) => updateData('correlation_threshold', e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            />
          </div>
          
         
        </div>


        <div className="grid grid-cols-2 gap-4 mt-6">
          <button
            onClick={() => onSubmit('BUY')}
            disabled={submitting}
            className={`py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors ${
              submitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {submitting ? 'Processing...' : 'Buy Pair'}
          </button>
          <button
            onClick={() => onSubmit('SELL')}
            disabled={submitting}
            className={`py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors ${
              submitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {submitting ? 'Processing...' : 'Sell Pair'}
          </button>
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
