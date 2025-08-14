import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, RefreshCw, Settings } from 'lucide-react';
import { getAccountSymbols, getSymbolMappingStatus } from '../../api/broker';

const AccountSymbolStats = ({ account, className = "" }) => {
  const [stats, setStats] = useState({
    total_available: 0,
    total_discovered: 0,
    live_symbols: 0,
    database_symbols: 0,
    symbols_mapped: false,
    last_updated: null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account?.id) {
      fetchSymbolStats();
    }
  }, [account]);

  const fetchSymbolStats = async () => {
    if (!account?.id) return;

    try {
      setLoading(true);
      const result = await getAccountSymbols(account.id);
      
      if (result.success) {
        setStats({
          total_available: result.data.total_available || 0,
          total_discovered: result.data.total_discovered || 0,
          live_symbols: result.data.live_symbols || 0,
          database_symbols: result.data.database_symbols || 0,
          symbols_mapped: result.data.symbols_mapped || false,
          last_updated: result.data.last_updated
        });
      }
    } catch (error) {
      console.error('Failed to fetch symbol stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!account) return null;

  const formatLastUpdated = () => {
    if (!stats.last_updated) return 'Never';
    return new Date(stats.last_updated).toLocaleDateString();
  };

  return (
    <div className={`bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <BarChart3 size={18} className="text-blue-400" />
          <h4 className="text-sm font-medium text-white">Symbol Statistics</h4>
        </div>
        <button
          onClick={fetchSymbolStats}
          disabled={loading}
          className="p-1 text-gray-400 hover:text-white hover:bg-[#2A2A2A] rounded transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="text-center">
          <div className="text-lg font-bold text-green-400">{stats.total_available}</div>
          <div className="text-xs text-gray-400">Available</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-400">{stats.total_discovered}</div>
          <div className="text-xs text-gray-400">Discovered</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-400">{stats.live_symbols}</div>
          <div className="text-xs text-gray-400">Live</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-orange-400">{stats.database_symbols}</div>
          <div className="text-xs text-gray-400">Cached</div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[#2A2A2A]">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Last updated: {formatLastUpdated()}</span>
          <div className={`px-2 py-1 rounded-full text-xs ${
            stats.symbols_mapped 
              ? 'bg-green-600/20 text-green-400' 
              : 'bg-yellow-600/20 text-yellow-400'
          }`}>
            {stats.symbols_mapped ? 'Mapped' : 'Mapping...'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSymbolStats;
