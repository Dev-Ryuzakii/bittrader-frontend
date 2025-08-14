import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, Filter, Download, RefreshCw } from 'lucide-react';
import { getTradingHistory, getTrades } from '../../api/broker';
import { toast } from 'react-hot-toast';

const TradingHistoryPanel = ({ selectedAccount, className = "" }) => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0
  });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all' // all, open, closed, cancelled
  });
  const [metrics, setMetrics] = useState({
    totalTrades: 0,
    winRate: 0,
    totalPnL: 0
  });

  useEffect(() => {
    if (selectedAccount) {
      fetchTradingHistory();
    }
  }, [selectedAccount, pagination.offset, filters]);

  const fetchTradingHistory = async () => {
    if (!selectedAccount) return;

    setLoading(true);
    try {
      const options = {
        limit: pagination.limit,
        offset: pagination.offset
      };

      if (filters.startDate) options.startDate = filters.startDate;
      if (filters.endDate) options.endDate = filters.endDate;

      const result = await getTradingHistory(selectedAccount.id, options);
      
      if (result.success) {
        setTrades(result.data.trades || []);
        setPagination(prev => ({
          ...prev,
          total: result.data.pagination?.total || 0
        }));

        // Update metrics if available in headers
        if (result.data.total_trades !== undefined) {
          setMetrics({
            totalTrades: result.data.total_trades,
            winRate: result.data.win_rate || 0,
            totalPnL: result.data.total_pnl || 0
          });
        }
      } else {
        toast.error('Failed to fetch trading history');
      }
    } catch (error) {
      console.error('Trading history error:', error);
      toast.error('Failed to fetch trading history');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, offset: 0 })); // Reset to first page
  };

  const handlePageChange = (direction) => {
    const newOffset = direction === 'next' 
      ? pagination.offset + pagination.limit
      : Math.max(0, pagination.offset - pagination.limit);
    
    setPagination(prev => ({ ...prev, offset: newOffset }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'closed':
        return 'text-blue-400 bg-blue-600/20';
      case 'open':
        return 'text-green-400 bg-green-600/20';
      case 'cancelled':
        return 'text-gray-400 bg-gray-600/20';
      default:
        return 'text-gray-400 bg-gray-600/20';
    }
  };

  const getPnLColor = (pnl) => {
    if (pnl > 0) return 'text-green-400';
    if (pnl < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  if (!selectedAccount) {
    return (
      <div className={`bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 text-center ${className}`}>
        <div className="text-gray-400">Select an account to view trading history</div>
      </div>
    );
  }

  return (
    <div className={`bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-[#2A2A2A]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Trading History</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchTradingHistory}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#2A2A2A] rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-[#2A2A2A] rounded-lg transition-colors">
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{metrics.totalTrades}</div>
            <div className="text-sm text-gray-400">Total Trades</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{metrics.winRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-400">Win Rate</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getPnLColor(metrics.totalPnL)}`}>
              {formatCurrency(metrics.totalPnL)}
            </div>
            <div className="text-sm text-gray-400">Total P&L</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Calendar size={16} className="text-gray-400" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="bg-[#0A0A0A] border border-[#2A2A2A] rounded px-3 py-1 text-sm text-white"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="bg-[#0A0A0A] border border-[#2A2A2A] rounded px-3 py-1 text-sm text-white"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="bg-[#0A0A0A] border border-[#2A2A2A] rounded px-3 py-1 text-sm text-white"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Trades Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
            Loading trading history...
          </div>
        ) : trades.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No trading history found
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[#0A0A0A]">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-gray-400">Date</th>
                <th className="text-left p-3 text-sm font-medium text-gray-400">Symbol</th>
                <th className="text-left p-3 text-sm font-medium text-gray-400">Type</th>
                <th className="text-right p-3 text-sm font-medium text-gray-400">Volume</th>
                <th className="text-right p-3 text-sm font-medium text-gray-400">Open</th>
                <th className="text-right p-3 text-sm font-medium text-gray-400">Close</th>
                <th className="text-right p-3 text-sm font-medium text-gray-400">P&L</th>
                <th className="text-center p-3 text-sm font-medium text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade, index) => (
                <tr key={index} className="border-b border-[#1A1A1A] hover:bg-[#0A0A0A]">
                  <td className="p-3 text-sm text-gray-300">
                    {formatDate(trade.date || trade.timestamp)}
                  </td>
                  <td className="p-3 text-sm text-white font-medium">
                    {trade.asset || trade.symbol}
                  </td>
                  <td className="p-3 text-sm">
                    <div className="flex items-center space-x-1">
                      {trade.type === 'BUY' ? (
                        <TrendingUp size={14} className="text-green-400" />
                      ) : (
                        <TrendingDown size={14} className="text-red-400" />
                      )}
                      <span className={trade.type === 'BUY' ? 'text-green-400' : 'text-red-400'}>
                        {trade.type}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-gray-300 text-right">
                    {trade.quantity || trade.volume}
                  </td>
                  <td className="p-3 text-sm text-gray-300 text-right">
                    {trade.opening || trade.open_price || trade.entry_price || '-'}
                  </td>
                  <td className="p-3 text-sm text-gray-300 text-right">
                    {trade.closing || trade.close_price || trade.exit_price || '-'}
                  </td>
                  <td className={`p-3 text-sm text-right font-medium ${getPnLColor(trade.trade_pl || trade.pnl)}`}>
                    {formatCurrency(trade.trade_pl || trade.pnl || 0)}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.status)}`}>
                      {trade.status || 'Unknown'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {trades.length > 0 && (
        <div className="p-4 border-t border-[#2A2A2A] flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} trades
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange('prev')}
              disabled={pagination.offset === 0}
              className="px-3 py-1 bg-[#2A2A2A] text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3A3A3A] transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange('next')}
              disabled={pagination.offset + pagination.limit >= pagination.total}
              className="px-3 py-1 bg-[#2A2A2A] text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3A3A3A] transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingHistoryPanel;
