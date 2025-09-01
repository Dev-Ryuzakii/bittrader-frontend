import React, { useState } from 'react';
import { TrendingUp, Info, CheckCircle } from 'lucide-react';
import EASymbolPicker from '../UI/EASymbolPicker';
import { useEASymbolAutocomplete } from '../../hooks/useEASymbolAutocomplete';

/**
 * Example component demonstrating EA Symbol Autocomplete functionality
 * Shows how to integrate symbol search with EA accounts
 */
const EASymbolAutocompleteDemo = ({ selectedAccount }) => {
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Use the EA symbol autocomplete hook
  const {
    searchTerm,
    searchResults,
    popularSymbols,
    loading,
    error,
    isInitialized,
    searchSymbols,
    clearSearch,
    getInstantResults,
    symbolExists,
    getSymbolInfo,
    hasResults,
    hasPopularSymbols,
    totalSymbols,
    canSearch
  } = useEASymbolAutocomplete(selectedAccount);

  const handleSymbolChange = (symbol) => {
    setSelectedSymbol(symbol);
  };

  const symbolInfo = selectedSymbol ? getSymbolInfo(selectedSymbol) : null;

  if (!selectedAccount) {
    return (
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 text-center">
        <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-500" />
        <h3 className="text-white font-medium mb-2">EA Symbol Autocomplete</h3>
        <p className="text-gray-400 text-sm">
          Please select an EA account to enable symbol search
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            EA Symbol Autocomplete Demo
          </h3>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
        </div>

        {/* Account Info */}
        <div className="mb-4 p-3 bg-[#222] rounded-lg">
          <div className="text-sm text-gray-400">Connected EA Account:</div>
          <div className="text-white font-medium">
            {selectedAccount.name || `Account ${selectedAccount.account_id}`}
          </div>
          {isInitialized && (
            <div className="text-xs text-green-400 flex items-center gap-1 mt-1">
              <CheckCircle className="w-3 h-3" />
              {totalSymbols} symbols loaded
            </div>
          )}
        </div>

        {/* Symbol Picker */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Trading Symbol
            </label>
            <EASymbolPicker
              selectedSymbol={selectedSymbol}
              onSymbolChange={handleSymbolChange}
              selectedAccount={selectedAccount}
              placeholder="Type to search symbols..."
            />
          </div>

          {/* Selected Symbol Info */}
          {selectedSymbol && (
            <div className="bg-[#222] border border-[#333] rounded-lg p-4">
              <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Selected Symbol: {selectedSymbol}
              </h4>
              
              {symbolInfo && (
                <div className="space-y-2 text-sm">
                  {symbolInfo.description && (
                    <div>
                      <span className="text-gray-400">Description:</span>
                      <span className="text-white ml-2">{symbolInfo.description}</span>
                    </div>
                  )}
                  {symbolInfo.broker_symbol && symbolInfo.broker_symbol !== selectedSymbol && (
                    <div>
                      <span className="text-gray-400">Broker Symbol:</span>
                      <span className="text-white ml-2">{symbolInfo.broker_symbol}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-400">Available:</span>
                    <span className={`ml-2 ${symbolInfo.available !== false ? 'text-green-400' : 'text-red-400'}`}>
                      {symbolInfo.available !== false ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Advanced Controls */}
      {showAdvanced && (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">
          <h4 className="text-white font-medium mb-4 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            Advanced Controls & Debug Info
          </h4>

          {/* Manual Search */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Manual Symbol Search
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => searchSymbols(e.target.value)}
                  placeholder="Type symbol name..."
                  className="flex-1 bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm"
                />
                <button
                  onClick={clearSearch}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Search Results */}
            {searchTerm && (
              <div className="bg-[#222] rounded-lg p-3">
                <h5 className="text-white font-medium mb-2">
                  Search Results for "{searchTerm}"
                  {loading && <span className="text-blue-400 ml-2">(searching...)</span>}
                </h5>
                
                {error && (
                  <div className="text-red-400 text-sm mb-2">{error}</div>
                )}
                
                {hasResults && (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 bg-[#333] rounded text-sm"
                      >
                        <div>
                          <span className="text-white font-medium">
                            {result.symbol || result.standard_symbol}
                          </span>
                          {result.description && (
                            <span className="text-gray-400 ml-2">
                              - {result.description}
                            </span>
                          )}
                        </div>
                        <div className="text-gray-500 text-xs">
                          Score: {Math.round(result.relevance_score || 0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {!loading && !hasResults && searchTerm.length >= 2 && (
                  <div className="text-gray-400 text-sm">No symbols found</div>
                )}
              </div>
            )}

            {/* Popular Symbols Info */}
            {hasPopularSymbols && (
              <div className="bg-[#222] rounded-lg p-3">
                <h5 className="text-white font-medium mb-2">Popular Symbol Categories</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(popularSymbols).map(([category, symbols]) => (
                    <div key={category} className="flex justify-between">
                      <span className="text-gray-300 capitalize">
                        {category.replace('_', ' ')}:
                      </span>
                      <span className="text-blue-400">{symbols.length} symbols</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Info */}
            <div className="bg-[#222] rounded-lg p-3">
              <h5 className="text-white font-medium mb-2">Status Information</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Account:</span>
                  <span className="text-white">{selectedAccount.account_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Initialized:</span>
                  <span className={isInitialized ? 'text-green-400' : 'text-red-400'}>
                    {isInitialized ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Can Search:</span>
                  <span className={canSearch ? 'text-green-400' : 'text-red-400'}>
                    {canSearch ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Symbols:</span>
                  <span className="text-blue-400">{totalSymbols}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Loading:</span>
                  <span className={loading ? 'text-yellow-400' : 'text-gray-400'}>
                    {loading ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
        <h4 className="text-blue-300 font-medium mb-2 flex items-center gap-2">
          <Info className="w-4 h-4" />
          How to Use EA Symbol Autocomplete
        </h4>
        <div className="text-blue-200 text-sm space-y-2">
          <p>• Click the symbol picker dropdown to see popular symbols organized by category</p>
          <p>• Type at least 2 characters to start searching for specific symbols</p>
          <p>• Search matches symbol names, broker symbols, and descriptions</p>
          <p>• Results are ranked by relevance with exact matches scoring highest</p>
          <p>• The component automatically loads all available symbols from your EA account</p>
          <p>• Search is debounced by 300ms to avoid excessive API calls</p>
        </div>
      </div>
    </div>
  );
};

export default EASymbolAutocompleteDemo;
