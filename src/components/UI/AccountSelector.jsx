import React, { useState } from 'react';
import { ChevronDown, CheckCircle, Clock, RefreshCw, ExternalLink } from 'lucide-react';
import { CompactSymbolStatus } from './SymbolMappingIndicator';

const AccountSelector = ({ 
  accounts = [], 
  selectedAccount, 
  onAccountSelect,
  showSymbolStatus = true,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAccountSelect = (account) => {
    onAccountSelect(account);
    setIsOpen(false);
  };

  const getBrokerIcon = (broker) => {
    const icons = {
      'mt4': '📊',
      'mt5': '📈',
      'binance': '🔶',
      'bybit': '🟡',
      'default': '💼'
    };
    return icons[broker?.toLowerCase()] || icons.default;
  };

  const getAccountStatusColor = (account) => {
    if (!account.connected) return 'text-red-400';
    if (account.symbols_mapped) return 'text-green-400';
    return 'text-yellow-400';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selected Account Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gray-800 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
      >
        {selectedAccount ? (
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <span className="text-lg">{getBrokerIcon(selectedAccount.broker)}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-white truncate">
                  {selectedAccount.account_name || selectedAccount.name || 'Unknown Account'}
                </span>
                <span className={`text-xs ${getAccountStatusColor(selectedAccount)}`}>
                  {selectedAccount.broker?.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-400">
                  {selectedAccount.account_number || selectedAccount.login || 'N/A'}
                </span>
                {showSymbolStatus && (
                  <CompactSymbolStatus account={selectedAccount} showRefresh={false} />
                )}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-gray-400">Select an account</span>
        )}
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
          {accounts.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              <p className="text-sm">No accounts available</p>
              <p className="text-xs mt-1">Connect your trading accounts first</p>
            </div>
          ) : (
            <div className="py-1">
              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => handleAccountSelect(account)}
                  className={`w-full px-3 py-3 text-left hover:bg-gray-700 transition-colors ${
                    selectedAccount?.id === account.id ? 'bg-gray-700' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getBrokerIcon(account.broker)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-white truncate">
                          {account.account_name || account.name || 'Unknown Account'}
                        </span>
                        <span className={`text-xs ${getAccountStatusColor(account)}`}>
                          {account.broker?.toUpperCase()}
                        </span>
                        {selectedAccount?.id === account.id && (
                          <CheckCircle className="h-4 w-4 text-blue-400" />
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400">
                          {account.account_number || account.login || 'N/A'}
                        </span>
                        {showSymbolStatus && (
                          <CompactSymbolStatus account={account} />
                        )}
                      </div>
                      {!account.connected && (
                        <div className="flex items-center space-x-1 mt-1">
                          <span className="text-xs text-red-400">Disconnected</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const AccountCard = ({ 
  account, 
  isSelected = false, 
  onSelect,
  onRefreshSymbols,
  showActions = true 
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefreshSymbols) return;
    setRefreshing(true);
    await onRefreshSymbols(account.id);
    setRefreshing(false);
  };

  const getBrokerIcon = (broker) => {
    const icons = {
      'mt4': '📊',
      'mt5': '📈',
      'binance': '🔶',
      'bybit': '🟡',
      'default': '💼'
    };
    return icons[broker?.toLowerCase()] || icons.default;
  };

  return (
    <div 
      className={`p-4 border rounded-lg transition-all cursor-pointer ${
        isSelected 
          ? 'border-blue-500 bg-blue-900/20' 
          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
      }`}
      onClick={() => onSelect && onSelect(account)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <span className="text-2xl">{getBrokerIcon(account.broker)}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-white truncate">
                {account.account_name || account.name || 'Unknown Account'}
              </h3>
              <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded">
                {account.broker?.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Account: {account.account_number || account.login || 'N/A'}
            </p>
            {account.server && (
              <p className="text-xs text-gray-500">
                Server: {account.server}
              </p>
            )}
          </div>
        </div>
        
        {showActions && (
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRefresh();
              }}
              disabled={refreshing}
              className="p-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh symbols"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      <div className="mt-3">
        <CompactSymbolStatus account={account} showRefresh={false} />
      </div>

      {!account.connected && (
        <div className="mt-2 p-2 bg-red-900/20 border border-red-700 rounded text-xs text-red-400">
          Account disconnected - check connection
        </div>
      )}
    </div>
  );
};

export default AccountSelector;
