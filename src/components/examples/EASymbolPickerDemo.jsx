import React, { useState } from 'react';
import { Search, RefreshCw, TrendingUp } from 'lucide-react';
import { searchEASymbols, getEASymbolsFiltered } from '../../api/ea';

/**
 * EA Symbol Picker Demo Component
 * Shows how to implement autocomplete symbol search using EA API
 */
const EASymbolPickerDemo = ({ selectedAccount }) => {
  const [symbolInput, setSymbolInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('');

  const handleSymbolInputChange = async (value) => {
    setSymbolInput(value);
    
    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (!selectedAccount) {
      console.warn('No account selected for symbol search');
      return;
    }

    setLoading(true);
    
    try {
      const accountId = selectedAccount.account_id || selectedAccount.id;
      const response = await searchEASymbols(accountId, value);
      
      if (response.success && response.data) {
        setSuggestions(response.data.slice(0, 8)); // Show up to 8 suggestions
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Failed to search symbols:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  const selectSymbol = (symbol) => {
    setSymbolInput(symbol);
    setSelectedSymbol(symbol);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const getFilteredSymbols = async (category) => {
    if (!selectedAccount) return;
    
    setLoading(true);
    
    try {
      const accountId = selectedAccount.account_id || selectedAccount.id;
      const response = await getEASymbolsFiltered(accountId, category);
      
      if (response.success && response.data) {
        console.log(`${category} symbols:`, response.data);
        // You can update state to show these symbols in a separate section
      }
    } catch (error) {
      console.error(`Failed to get ${category} symbols:`, error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-6 max-w-lg mx-auto">
      <h3 className="text-white font-medium mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        EA Symbol Picker Demo
      </h3>

      {!selectedAccount && (
        <div className="bg-orange-900/30 border border-orange-700 text-orange-300 px-3 py-2 rounded-lg mb-4">
          Please select an EA account to use symbol search
        </div>
      )}

      {/* Symbol Input with Autocomplete */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Search Symbol
        </label>
        <div className="relative">
          <div className="flex">
            <input
              type="text"
              value={symbolInput}
              onChange={(e) => handleSymbolInputChange(e.target.value)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Type symbol (e.g., EUR, GBP, BTC)..."
              className="flex-1 bg-[#222] border border-[#444] rounded-l-lg px-3 py-2 text-white"
              disabled={!selectedAccount}
            />
            <div className="bg-[#333] border border-[#444] border-l-0 rounded-r-lg px-3 py-2 flex items-center">
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
              ) : (
                <Search className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 bg-[#222] border border-[#444] rounded-b-lg shadow-lg">
              {suggestions.map((symbol, index) => (
                <button
                  key={`${symbol}-${index}`}
                  type="button"
                  onClick={() => selectSymbol(symbol)}
                  className="w-full text-left px-3 py-2 hover:bg-[#333] text-gray-300 hover:text-white border-b border-[#444] last:border-b-0 flex items-center gap-2"
                >
                  <TrendingUp className="w-3 h-3" />
                  <span>{symbol}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected Symbol Display */}
      {selectedSymbol && (
        <div className="bg-green-900/30 border border-green-700 text-green-300 px-3 py-2 rounded-lg mb-4">
          <div className="font-medium">Selected Symbol: {selectedSymbol}</div>
        </div>
      )}

      {/* Category Filters */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Quick Filters (EA API)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => getFilteredSymbols('forex')}
            disabled={!selectedAccount || loading}
            className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 px-3 py-2 rounded border border-blue-600/30 disabled:opacity-50"
          >
            💱 Forex
          </button>
          <button
            onClick={() => getFilteredSymbols('crypto')}
            disabled={!selectedAccount || loading}
            className="bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 px-3 py-2 rounded border border-orange-600/30 disabled:opacity-50"
          >
            ₿ Crypto
          </button>
          <button
            onClick={() => getFilteredSymbols('metals')}
            disabled={!selectedAccount || loading}
            className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 px-3 py-2 rounded border border-yellow-600/30 disabled:opacity-50"
          >
            🥇 Metals
          </button>
          <button
            onClick={() => getFilteredSymbols('indices')}
            disabled={!selectedAccount || loading}
            className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 px-3 py-2 rounded border border-purple-600/30 disabled:opacity-50"
          >
            📈 Indices
          </button>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="mt-6 bg-[#222] border border-[#333] rounded-lg p-3">
        <h4 className="text-white font-medium mb-2">How to Use:</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Type 2+ characters to see symbol suggestions</li>
          <li>• Click on any suggestion to select it</li>
          <li>• Use category buttons to explore symbols by type</li>
          <li>• All data comes from your EA account's available symbols</li>
        </ul>
      </div>
    </div>
  );
};

export default EASymbolPickerDemo;
