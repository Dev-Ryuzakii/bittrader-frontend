import React, { useState, useEffect } from 'react';
import { RefreshCw, Zap, TrendingUp, Target, Activity, AlertCircle } from 'lucide-react';
import { refreshAccountSymbols, getSymbolMappingStatus, getAccountSymbols } from '../../api/broker';
import { useToast } from '../../contexts/ToastContext';

const EnhancedAccountInfo = ({ account, onRefresh }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [mappingStatus, setMappingStatus] = useState(null);
  const [symbolStats, setSymbolStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (account?.id) {
      fetchAccountInfo();
    }
  }, [account]);

  const fetchAccountInfo = async () => {
    if (!account?.id) return;

    try {
      setLoading(true);
      
      // Fetch symbol mapping status
      const statusResult = await getSymbolMappingStatus(account.id);
      if (statusResult.success) {
        setMappingStatus(statusResult.data);
      }

      // Fetch symbol statistics
      const statsResult = await getAccountSymbols(account.id);
      if (statsResult.success) {
        setSymbolStats(statsResult.data);
      }
    } catch (error) {
      console.error('Failed to fetch account info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSymbols = async () => {
    if (!account?.id) return;

    try {
      setRefreshing(true);
      const result = await refreshAccountSymbols(account.id);
      
      if (result.success) {
        toast?.showToast(`Symbol refresh completed for ${account.login}`, 'success');
        await fetchAccountInfo(); // Refresh the status
        onRefresh?.(); // Notify parent component
      } else {
        toast?.showToast(result.error || 'Failed to refresh symbols', 'error');
      }
    } catch (error) {
      console.error('Failed to refresh symbols:', error);
      toast?.showToast('Failed to refresh symbols', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  if (!account) {
    return (
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">
        <div className="text-center py-6 text-gray-400">
          <Activity size={24} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select an account to view details</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value) => {
    if (typeof value !== 'number') return '--';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'in_progress': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Zap size={18} className="text-blue-400" />
          <h4 className="text-sm font-medium text-white">Account Details</h4>
        </div>
        <button
          onClick={handleRefreshSymbols}
          disabled={refreshing || loading}
          className="p-1 text-gray-400 hover:text-white hover:bg-[#2A2A2A] rounded transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="space-y-3">
        {/* Account Info */}
        <div className="text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-gray-400">Login:</span>
            <span className="text-white font-medium">{account.login}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-400">Server:</span>
            <span className="text-white">{account.server}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-400">Broker:</span>
            <span className="text-white">{account.broker_name}</span>
          </div>
          {account.is_demo && (
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">Type:</span>
              <span className="text-orange-400">Demo Account</span>
            </div>
          )}
        </div>

        {/* Balance Info */}
        {(account.balance !== undefined || account.equity !== undefined) && (
          <div className="pt-3 border-t border-[#2A2A2A]">
            <div className="text-sm space-y-1">
              {account.balance !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Balance:</span>
                  <span className="text-green-400">{formatCurrency(account.balance)}</span>
                </div>
              )}
              {account.equity !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Equity:</span>
                  <span className="text-blue-400">{formatCurrency(account.equity)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Symbol Mapping Status */}
        {mappingStatus && (
          <div className="pt-3 border-t border-[#2A2A2A]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Symbol Mapping</span>
              <span className={`text-xs ${getStatusColor(mappingStatus.status)}`}>
                {mappingStatus.status?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            {mappingStatus.last_updated && (
              <div className="text-xs text-gray-500">
                Updated: {new Date(mappingStatus.last_updated).toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        {/* Symbol Statistics */}
        {symbolStats && (
          <div className="pt-3 border-t border-[#2A2A2A]">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400">{symbolStats.total_available || 0}</div>
                <div className="text-gray-400">Available</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-400">{symbolStats.live_symbols || 0}</div>
                <div className="text-gray-400">Live</div>
              </div>
            </div>
          </div>
        )}

        {/* Connection Status */}
        <div className="pt-3 border-t border-[#2A2A2A]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-xs text-gray-400">Connected</span>
            </div>
            <span className="text-xs text-gray-500">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAccountInfo;
