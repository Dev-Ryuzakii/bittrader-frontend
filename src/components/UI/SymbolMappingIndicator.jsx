import React, { useState } from 'react';
import { CheckCircle, Clock, RefreshCw, AlertCircle, TrendingUp } from 'lucide-react';
import { useTradingSymbol } from '../../contexts/TradingSymbolContext';
import { refreshAccountSymbols as refreshAccountSymbolsAPI, getSymbolMappingStatus } from '../../api/broker';
import { toast } from 'react-hot-toast';

const SymbolMappingIndicator = ({ account, className = '' }) => {
  const { refreshAccountSymbols, getSymbolMappingStatus } = useTradingSymbol();
  const [refreshing, setRefreshing] = useState(false);

  if (!account) return null;

  const handleRefreshSymbols = async () => {
    setRefreshing(true);
    try {
      // Use the new API function with enhanced error handling
      toast.loading('Refreshing symbols...', { id: 'symbol-refresh' });
      const result = await refreshAccountSymbolsAPI(account.id);
      
      if (result.success) {
        toast.success('Symbol refresh started in background', { id: 'symbol-refresh' });
        // Also call the context method for UI updates
        await refreshAccountSymbols(account.id);
      } else {
        toast.error(`Failed to refresh symbols: ${result.error}`, { id: 'symbol-refresh' });
      }
    } catch (error) {
      console.error('Failed to refresh symbols:', error);
      toast.error(`Failed to refresh symbols: ${error.message}`, { id: 'symbol-refresh' });
    } finally {
      setRefreshing(false);
    }
  };

  const mappingStatus = getSymbolMappingStatus(account.id);
  const symbolsMapped = account.symbols_mapped || mappingStatus.mapped;
  const symbolsCount = account.symbols_count || mappingStatus.total_available;

  return (
    <div className={`symbol-mapping-indicator ${className}`}>
      {symbolsMapped ? (
        <div className="flex items-center space-x-3 p-3 bg-green-900/20 border border-green-700 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-400">
                Symbols Ready
              </span>
              <button
                onClick={handleRefreshSymbols}
                disabled={refreshing}
                className="p-1 text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
                title="Refresh symbols"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-xs text-green-300">
                {symbolsCount} symbols available
              </span>
              {account.last_symbol_refresh && (
                <span className="text-xs text-gray-400">
                  Updated: {new Date(account.last_symbol_refresh).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-3 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
          <Clock className="h-5 w-5 text-yellow-400 animate-pulse flex-shrink-0" />
          <div className="flex-1">
            <span className="text-sm font-medium text-yellow-400">
              Mapping symbols automatically...
            </span>
            <div className="text-xs text-yellow-300 mt-1">
              This may take a few moments
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const CompactSymbolStatus = ({ account, showRefresh = true }) => {
  const { refreshAccountSymbols } = useTradingSymbol();
  const [refreshing, setRefreshing] = useState(false);

  if (!account) return null;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      toast.loading('Refreshing symbols...', { id: 'symbol-refresh' });
      const result = await refreshAccountSymbolsAPI(account.id);
      
      if (result.success) {
        toast.success('Symbol refresh started in background', { id: 'symbol-refresh' });
        // Also call the context method for UI updates
        await refreshAccountSymbols(account.id);
      } else {
        toast.error(`Failed to refresh symbols: ${result.error}`, { id: 'symbol-refresh' });
      }
    } catch (error) {
      console.error('Failed to refresh symbols:', error);
      toast.error(`Failed to refresh symbols: ${error.message}`, { id: 'symbol-refresh' });
    } finally {
      setRefreshing(false);
    }
  };

  const symbolsMapped = account.symbols_mapped;
  const symbolsCount = account.symbols_count || 0;

  return (
    <div className="flex items-center space-x-2">
      {symbolsMapped ? (
        <>
          <div className="flex items-center space-x-1 text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">{symbolsCount}</span>
          </div>
          {showRefresh && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1 text-gray-400 hover:text-green-400 transition-colors disabled:opacity-50"
              title="Refresh symbols"
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </>
      ) : (
        <div className="flex items-center space-x-1 text-yellow-400">
          <Clock className="h-4 w-4 animate-pulse" />
          <span className="text-sm">Mapping...</span>
        </div>
      )}
    </div>
  );
};

export const SymbolAvailabilityBadge = ({ symbol, accounts = [] }) => {
  const { checkSymbolAvailability } = useTradingSymbol();
  
  if (!symbol || accounts.length === 0) return null;

  const accountIds = accounts.map(acc => acc.id);
  const availability = checkSymbolAvailability(symbol, accountIds);
  const availableCount = Object.values(availability).filter(av => av.available).length;
  const totalCount = accounts.length;

  const getVariant = () => {
    if (availableCount === 0) return 'unavailable';
    if (availableCount === totalCount) return 'available';
    return 'partial';
  };

  const variant = getVariant();
  const variantStyles = {
    available: 'bg-green-900/20 text-green-400 border-green-700',
    partial: 'bg-yellow-900/20 text-yellow-400 border-yellow-700',
    unavailable: 'bg-red-900/20 text-red-400 border-red-700'
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${variantStyles[variant]}`}>
      {variant === 'available' && <CheckCircle className="h-3 w-3 mr-1" />}
      {variant === 'partial' && <TrendingUp className="h-3 w-3 mr-1" />}
      {variant === 'unavailable' && <AlertCircle className="h-3 w-3 mr-1" />}
      {availableCount}/{totalCount}
    </span>
  );
};

export default SymbolMappingIndicator;
