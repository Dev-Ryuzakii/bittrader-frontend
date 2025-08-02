import React, { useState, useEffect } from 'react';
import { symbolMappingService } from '../../api/symbolMapping';
import { ChevronDown, Check, X } from 'lucide-react';

const SymbolPicker = ({ accountIds, onSymbolSelect, selectedSymbol, className = "" }) => {
  const [symbols, setSymbols] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (accountIds && accountIds.length > 0) {
      fetchAvailableSymbols();
    }
  }, [accountIds]);

  const fetchAvailableSymbols = async () => {
    setLoading(true);
    try {
      // Get symbols available across all selected accounts
      const response = await symbolMappingService.getStandardSymbols();
      
      if (response.success) {
        // Filter symbols that are available in at least one account
        const availableSymbols = [];
        for (const symbol of response.standard_symbols) {
          const availability = await checkSymbolAvailability(symbol, accountIds);
          if (availability && Object.values(availability).some(acc => acc.available)) {
            availableSymbols.push({
              symbol,
              availability
            });
          }
        }
        setSymbols(availableSymbols);
      }
    } catch (error) {
      console.error('Failed to fetch symbols:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSymbolAvailability = async (symbol, accountIds) => {
    try {
      const response = await symbolMappingService.validateSymbolAcrossAccounts(symbol, accountIds);
      return response.account_availability;
    } catch (error) {
      return {};
    }
  };

  const filteredSymbols = symbols.filter(({ symbol }) =>
    symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedSymbolData = symbols.find(s => s.symbol === selectedSymbol);
  const availableCount = selectedSymbolData?.availability 
    ? Object.values(selectedSymbolData.availability).filter(acc => acc.available).length 
    : 0;

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Select Trading Symbol:
      </label>
      
      {/* Custom Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading}
          className={`w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-left text-gray-300 
            hover:border-[#444] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span className="block truncate">
            {selectedSymbol || 'Choose a symbol...'}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </span>
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-[#222] border border-[#333] rounded-lg shadow-lg max-h-60 overflow-hidden">
            {/* Search Input */}
            <div className="p-2 border-b border-[#333]">
              <input
                type="text"
                placeholder="Search symbols..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#333] border border-[#444] rounded px-2 py-1 text-sm text-gray-300 
                  placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Symbol List */}
            <div className="overflow-y-auto max-h-48">
              {filteredSymbols.length > 0 ? (
                filteredSymbols.map(({ symbol, availability }) => {
                  const accountsWithSymbol = Object.values(availability || {}).filter(acc => acc.available).length;
                  const isSelected = symbol === selectedSymbol;
                  
                  return (
                    <button
                      key={symbol}
                      type="button"
                      onClick={() => {
                        onSymbolSelect(symbol);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-[#333] focus:outline-none focus:bg-[#333]
                        ${isSelected ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{symbol}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-400">
                            {accountsWithSymbol}/{accountIds.length} accounts
                          </span>
                          {isSelected && <Check className="h-4 w-4 text-blue-400" />}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-gray-400 text-sm">
                  {loading ? 'Loading symbols...' : 'No symbols found'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Symbol Availability Details */}
      {selectedSymbol && selectedSymbolData && (
        <div className="mt-3 p-3 bg-[#2A2A2A] rounded-lg border border-[#333]">
          <h4 className="text-sm font-medium text-white mb-2">Symbol Availability:</h4>
          <div className="space-y-1">
            {Object.entries(selectedSymbolData.availability || {}).map(([accountId, acc]) => (
              <div key={accountId} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Account {accountId.slice(-6)}</span>
                <div className="flex items-center space-x-2">
                  {acc.available ? (
                    <>
                      <span className="text-green-400">{acc.broker_symbol}</span>
                      <Check className="h-3 w-3 text-green-400" />
                    </>
                  ) : (
                    <>
                      <span className="text-red-400">Not available</span>
                      <X className="h-3 w-3 text-red-400" />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mt-2 text-sm text-gray-400">
          Loading symbols...
        </div>
      )}
    </div>
  );
};

export default SymbolPicker;
