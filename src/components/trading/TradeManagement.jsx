import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { 
  TrendingUp, 
  TrendingDown,
  Activity,
  DollarSign,
  BarChart2,
  Settings,
  AlertTriangle,
  Filter,
  Check,
  X,
  Edit3,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import axios from 'axios';

// Helper function for className concatenation
const cn = (...classes) => classes.filter(Boolean).join(' ');

// Placeholder websocket - replace with your actual websocket implementation
const createWebSocket = (accountId, onUpdate) => {
  // Implement your WebSocket connection here
  return {
    subscribe: () => console.log('WebSocket subscribed'),
    unsubscribe: () => console.log('WebSocket unsubscribed')
  };
};

function TradeManagement({ selectedAccount, onTradeSelect, shouldRefresh, onRefreshComplete }) {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTradeId, setSelectedTradeId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    source: 'all'
  });
  const [stats, setStats] = useState({
    totalTrades: 0,
    winRate: 0,
    avgPL: 0,
    bestTrade: null,
    worstTrade: null,
    volume: 0,
    balance: 0,
    equity: 0,
    margin: 0,
    freeMargin: 0,
    currency: 'USD',
    leverage: 0
  });

  // Fetch trades and positions
  const fetchTrades = useCallback(async () => {
    if (!selectedAccount?.id) return;
    
    setLoading(true);
    try {
      // Common headers for authentication
      const headers = {
        'Authorization': localStorage.getItem('access_token'),
        'Content-Type': 'application/json'
      };

      // Get account balance, positions, and orders
      const [balanceResponse, positionsResponse, ordersResponse] = await Promise.all([
        axios.get(`http://127.0.0.1:8000/api/v1/broker/${selectedAccount.id}/balance`, { headers }),
        axios.get(`http://127.0.0.1:8000/api/v1/broker/${selectedAccount.id}/positions`, { headers }),
        axios.get(`http://127.0.0.1:8000/api/v1/broker/${selectedAccount.id}/orders`, { headers })
      ]);

      // Debugging output
      console.log('Balance Response:', balanceResponse.data);
      console.log('Positions Response:', positionsResponse.data);
      console.log('Orders Response:', ordersResponse.data);

      // Ensure positionsResponse.data is always an array
      const positionsArray = Array.isArray(positionsResponse.data)
        ? positionsResponse.data
        : Array.isArray(positionsResponse.data?.positions)
          ? positionsResponse.data.positions
          : [];

      const ordersArray = Array.isArray(ordersResponse.data)
        ? ordersResponse.data
        : Array.isArray(ordersResponse.data?.orders)
          ? ordersResponse.data.orders
          : [];

      // Combine positions and orders into a unified trade format
      const positions = positionsArray.map(pos => ({
        id: pos.id,
        order_number: pos.id,
        symbol: pos.symbol,
        type: pos.type,
        volume: pos.volume,
        opening: pos.open_price,
        current_price: pos.current_price,
        trade_pl: pos.profit,
        swap: pos.swap,
        commission: pos.commission,
        date: pos.open_time,
        status: 'Executed',
        stop_loss: pos.stop_loss,
        take_profit: pos.take_profit
      }));

      const orders = ordersArray.map(order => ({
        id: order.id,
        order_number: order.id,
        symbol: order.symbol,
        type: order.type,
        volume: order.volume,
        opening: order.open_price,
        stop_loss: order.stop_loss,
        take_profit: order.take_profit,
        date: order.created_time,
        status: 'Pending'
      }));

      // Combine all trades
      const allTrades = [...positions, ...orders];
      setTrades(allTrades);
      calculateStats(allTrades, balanceResponse.data);
    } catch (error) {
      setError(error.message);
      toast.error(`Error fetching trades: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [selectedAccount]);

  // WebSocket setup
  useEffect(() => {
    if (!selectedAccount?.id) return;

    const ws = createWebSocket(selectedAccount.id, (update) => {
      setTrades(prevTrades => {
        const newTrades = [...prevTrades];
        const index = newTrades.findIndex(t => t.order_number === update.order_number);
        if (index >= 0) {
          newTrades[index] = { ...newTrades[index], ...update };
        } else {
          newTrades.unshift(update);
        }
        return newTrades;
      });
    });

    ws.subscribe();
    return () => ws.unsubscribe();
  }, [selectedAccount]);

  // Calculate trading statistics
  const calculateStats = useCallback((tradeData, balanceData) => {
    const stats = {
      totalTrades: tradeData.length,
      winningTrades: tradeData.filter(t => (t.trade_pl || 0) > 0).length,
      totalPL: tradeData.reduce((sum, t) => sum + (t.trade_pl || 0), 0),
      volume: tradeData.reduce((sum, t) => sum + (t.quantity || 0), 0),
      bestTrade: tradeData.reduce((best, t) => (!best || (t.trade_pl || 0) > (best.trade_pl || 0) ? t : best), null),
      worstTrade: tradeData.reduce((worst, t) => (!worst || (t.trade_pl || 0) < (worst.trade_pl || 0) ? t : worst), null),
    };

    setStats(prevStats => ({
      ...prevStats,
      totalTrades: stats.totalTrades,
      winRate: stats.totalTrades ? (stats.winningTrades / stats.totalTrades * 100).toFixed(1) : 0,
      avgPL: stats.totalTrades ? (stats.totalPL / stats.totalTrades).toFixed(2) : 0,
      bestTrade: stats.bestTrade,
      worstTrade: stats.worstTrade,
      volume: stats.volume.toFixed(2),
      // Update balance data if provided
      ...(balanceData ? {
        balance: balanceData.balance,
        equity: balanceData.equity,
        margin: balanceData.margin,
        freeMargin: balanceData.free_margin,
        currency: balanceData.currency,
        leverage: balanceData.leverage
      } : {})
    }));
  }, []);

  // Handle trade closure
  const handleCloseTrade = async (tradeId) => {
    try {
      const response = await axios.delete(`http://127.0.0.1:8000/api/v1/broker/${selectedAccount.id}/positions/${tradeId}`, {
        headers: {
          'Authorization': localStorage.getItem('access_token'),
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        toast.success(`Position closed successfully. Profit: ${response.data.profit}`);
        fetchTrades();
      } else {
        throw new Error(response.data.message || 'Failed to close trade');
      }
    } catch (error) {
      // Check if it's a pending order that needs to be cancelled instead
      try {
        const orderResponse = await axios.delete(`http://127.0.0.1:8000/api/v1/broker/${selectedAccount.id}/orders/${tradeId}`, {
          headers: {
            'Authorization': localStorage.getItem('access_token'),
            'Content-Type': 'application/json'
          }
        });
        
        if (orderResponse.data.success) {
          toast.success('Order cancelled successfully');
          fetchTrades();
        } else {
          throw new Error(orderResponse.data.message);
        }
      } catch (orderError) {
        toast.error(`Error closing trade: ${error.message}`);
      }
    }
  };

  // Sort and filter trades
  const filteredAndSortedTrades = useMemo(() => {
    return trades
      .filter(trade => {
        if (filters.status !== 'all' && trade.status !== filters.status) return false;
        if (filters.type !== 'all' && trade.type !== filters.type) return false;
        if (filters.source !== 'all' && trade.strat_source !== filters.source) return false;
        return true;
      })
      .sort((a, b) => {
        const direction = sortConfig.direction === 'asc' ? 1 : -1;
        return a[sortConfig.key] > b[sortConfig.key] ? direction : -direction;
      });
  }, [trades, filters, sortConfig]);

  // Request initial data and handle refresh requests
  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  // Handle refresh requests from parent
  useEffect(() => {
    if (shouldRefresh) {
      fetchTrades().then(() => {
        if (onRefreshComplete) {
          onRefreshComplete();
        }
      });
    }
  }, [shouldRefresh, fetchTrades, onRefreshComplete]);

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Trade Management
        </h3>
        <button 
          onClick={fetchTrades}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2F00FF] to-[#1C0099] hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-[#222] border border-[#333] rounded-lg p-4">
          <h4 className="text-sm text-gray-400 mb-2">Total Trades</h4>
          <div className="text-2xl font-bold text-white">{stats.totalTrades}</div>
        </div>
        <div className="bg-[#222] border border-[#333] rounded-lg p-4">
          <h4 className="text-sm text-gray-400 mb-2">Win Rate</h4>
          <div className="text-2xl font-bold text-green-400">{stats.winRate}%</div>
        </div>
        <div className="bg-[#222] border border-[#333] rounded-lg p-4">
          <h4 className="text-sm text-gray-400 mb-2">Avg. P/L</h4>
          <div className={cn("text-2xl font-bold", parseFloat(stats.avgPL) >= 0 ? "text-green-400" : "text-red-400")}>
            {parseFloat(stats.avgPL) >= 0 ? '+' : ''}{stats.avgPL}
          </div>
        </div>
        <div className="bg-[#222] border border-[#333] rounded-lg p-4">
          <h4 className="text-sm text-gray-400 mb-2">Best Trade</h4>
          <div className="text-2xl font-bold text-green-400">
            {stats.bestTrade ? `+${stats.bestTrade.trade_pl?.toFixed(2)}` : '-'}
          </div>
        </div>
        <div className="bg-[#222] border border-[#333] rounded-lg p-4">
          <h4 className="text-sm text-gray-400 mb-2">Worst Trade</h4>
          <div className="text-2xl font-bold text-red-400">
            {stats.worstTrade ? stats.worstTrade.trade_pl?.toFixed(2) : '-'}
          </div>
        </div>
        <div className="bg-[#222] border border-[#333] rounded-lg p-4">
          <h4 className="text-sm text-gray-400 mb-2">Volume</h4>
          <div className="text-2xl font-bold text-white">{stats.volume}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="all">All Status</option>
          <option value="Executed">Executed</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
        </select>

        <select
          value={filters.type}
          onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
          className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="all">All Types</option>
          <option value="Buy">Buy</option>
          <option value="Sell">Sell</option>
        </select>

        <select
          value={filters.source}
          onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
          className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="all">All Sources</option>
          <option value="Manual">Manual</option>
          <option value="AI Bot">AI Bot</option>
          <option value="Copy Trade">Copy Trade</option>
          <option value="Pair Trade">Pair Trade</option>
        </select>
      </div>

      {/* Trade Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#333]">
              <th className="text-left py-3 px-4 text-gray-300 font-medium">Date</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium">Order #</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium">Asset</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium">Type</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium">Quantity</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium">Entry</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium">SL</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium">TP</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium">P/L</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="11" className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mr-2" />
                    <span className="text-gray-400">Loading trades...</span>
                  </div>
                </td>
              </tr>
            ) : filteredAndSortedTrades.length === 0 ? (
              <tr>
                <td colSpan="11" className="text-center py-8">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <Activity className="w-12 h-12 mb-2" />
                    <p>No trades found</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedTrades.map((trade) => (
                <tr 
                  key={trade.order_number}
                  className={cn(
                    "border-b border-[#333] hover:bg-[#2A2A2A] transition-colors",
                    selectedTradeId === trade.order_number && "bg-[#2A2A2A]"
                  )}
                  onClick={() => {
                    setSelectedTradeId(trade.order_number);
                    if (onTradeSelect) onTradeSelect(trade);
                  }}
                >
                  <td className="py-3 px-4 text-gray-300">
                    {new Date(trade.date).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-gray-300 font-mono">
                    {trade.order_number}
                  </td>
                  <td className="py-3 px-4 text-white font-medium">
                    {trade.asset}
                  </td>
                  <td className="py-3 px-4">
                    <div className={cn(
                      "flex items-center gap-1",
                      trade.type === 'Buy' ? "text-green-400" : "text-red-400"
                    )}>
                      {trade.type === 'Buy' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {trade.type}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {trade.quantity}
                  </td>
                  <td className="py-3 px-4 text-gray-300 font-mono">
                    {trade.opening?.toFixed(5)}
                  </td>
                  <td className="py-3 px-4 text-gray-300 font-mono">
                    {trade.sl?.toFixed(5) || '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-300 font-mono">
                    {trade.tp?.toFixed(5) || '-'}
                  </td>
                  <td className={cn(
                    "py-3 px-4 font-medium",
                    (trade.trade_pl || 0) >= 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {trade.trade_pl ? (
                      `${trade.trade_pl >= 0 ? '+' : ''}${trade.trade_pl.toFixed(2)}`
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      trade.status === 'Executed' && "bg-green-500/20 text-green-400 border border-green-500/30",
                      trade.status === 'Pending' && "bg-amber-500/20 text-amber-400 border border-amber-500/30",
                      trade.status === 'Failed' && "bg-red-500/20 text-red-400 border border-red-500/30"
                    )}>
                      {trade.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloseTrade(trade.order_number);
                        }}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        title="Close trade"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle edit
                        }}
                        className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                        title="Edit trade"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};

const ExportedComponent = TradeManagement;
export default ExportedComponent;
