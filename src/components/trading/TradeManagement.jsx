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
import {
  getEAAccounts,
  getEAAccountBalance,
  getEAPositions,
  getEAOrders,
  eaWebSocket,
  EA_WEBSOCKET_MESSAGE_TYPES,
  isEAAccount
} from '../../api/ea';

// Helper function for className concatenation
const cn = (...classes) => classes.filter(Boolean).join(' ');

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

  // Fetch trades and positions using EA API
  const fetchTrades = useCallback(async () => {
    if (!selectedAccount?.id) {
      console.log('No selected account, skipping fetch');
      return;
    }
    
    console.log('=== FETCHING TRADES FOR ACCOUNT ===');
    console.log('Selected Account:', selectedAccount);
    
    setLoading(true);
    setError(null);
    
    try {
      // Check if this is an EA account for optimized API calls
      const isEA = selectedAccount?.platform === 'EA' || selectedAccount?.connection_type === 'EA' || selectedAccount?.status === 'connected';
      console.log('Is EA Account:', isEA);
      
      if (isEA) {
        // Use EA API endpoints for real-time data
        console.log('Fetching data from EA API for account:', selectedAccount.id);
        
        const [balanceResult, positionsResult, ordersResult] = await Promise.allSettled([
          getEAAccountBalance(selectedAccount.id),
          getEAPositions(selectedAccount.id),
          getEAOrders(selectedAccount.id)
        ]);

        console.log('EA API Results:', {
          balance: balanceResult,
          positions: positionsResult,
          orders: ordersResult
        });

        // Process balance data
        const balanceData = balanceResult.status === 'fulfilled' && balanceResult.value?.success 
          ? balanceResult.value.data 
          : {};
        
        // Process positions data
        const positionsArray = positionsResult.status === 'fulfilled' && positionsResult.value?.success 
          ? (positionsResult.value.data || []) 
          : [];
        
        // Process orders data
        const ordersArray = ordersResult.status === 'fulfilled' && ordersResult.value?.success 
          ? (ordersResult.value.data || []) 
          : [];

        console.log('Processed Data:', {
          balanceData,
          positionsArray,
          ordersArray
        });

        // Transform EA positions to unified format
        const positions = positionsArray.map((pos, index) => {
          console.log('Processing position:', pos);
          return {
            id: pos.id || pos.ticket || `pos_${index}`,
            order_number: pos.ticket || pos.id || `POS_${index}`,
            symbol: pos.symbol || 'Unknown',
            asset: pos.symbol || 'Unknown', // For table display
            type: pos.type === 0 ? 'Buy' : pos.type === 1 ? 'Sell' : pos.type || 'Buy',
            volume: pos.volume || 0,
            quantity: pos.volume || 0, // Alias for consistency
            opening: pos.open_price || pos.price_open || 0,
            current_price: pos.price_current || pos.current_price || pos.opening || 0,
            trade_pl: pos.profit || 0,
            swap: pos.swap || 0,
            commission: pos.commission || 0,
            date: pos.time_open || pos.open_time || new Date().toISOString(),
            status: 'Executed',
            stop_loss: pos.sl || pos.stop_loss || null,
            sl: pos.sl || pos.stop_loss || null, // Alias
            take_profit: pos.tp || pos.take_profit || null,
            tp: pos.tp || pos.take_profit || null, // Alias
            source: 'EA'
          };
        });

        // Transform EA orders to unified format
        const orders = ordersArray.map((order, index) => {
          console.log('Processing order:', order);
          return {
            id: order.id || order.ticket || `order_${index}`,
            order_number: order.ticket || order.id || `ORD_${index}`,
            symbol: order.symbol || 'Unknown',
            asset: order.symbol || 'Unknown', // For table display
            type: order.type === 2 ? 'Buy Limit' : order.type === 3 ? 'Sell Limit' : order.type === 4 ? 'Buy Stop' : order.type === 5 ? 'Sell Stop' : order.type || 'Pending',
            volume: order.volume || 0,
            quantity: order.volume || 0, // Alias for consistency
            opening: order.price_open || order.open_price || 0,
            stop_loss: order.sl || order.stop_loss || null,
            sl: order.sl || order.stop_loss || null, // Alias
            take_profit: order.tp || order.take_profit || null,
            tp: order.tp || order.take_profit || null, // Alias
            date: order.time_setup || order.created_time || new Date().toISOString(),
            status: 'Pending',
            trade_pl: 0, // Orders don't have P&L yet
            source: 'EA'
          };
        });

        // Combine all trades
        const allTrades = [...positions, ...orders];
        console.log('Final combined trades:', allTrades);
        
        setTrades(allTrades);
        calculateStats(allTrades, balanceData);
        
        // Show success message for EA accounts
        if (allTrades.length > 0) {
          console.log(`✅ Loaded ${positions.length} positions and ${orders.length} orders from EA`);
        } else {
          console.log('⚠️ No trades found for EA account');
        }
        
      } else {
        // Fallback to original broker API for non-EA accounts
        console.log('Using fallback broker API for account:', selectedAccount.id);
        
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const [balanceResponse, positionsResponse, ordersResponse] = await Promise.allSettled([
          fetch(`http://api.tradexas.com/api/v1/broker/${selectedAccount.id}/balance`, { headers }),
          fetch(`http://api.tradexas.com/api/v1/broker/${selectedAccount.id}/positions`, { headers }),
          fetch(`http://api.tradexas.com/api/v1/broker/${selectedAccount.id}/orders`, { headers })
        ]);

        console.log('Broker API Responses:', {
          balance: balanceResponse,
          positions: positionsResponse,
          orders: ordersResponse
        });

        // Process broker responses
        const balanceData = balanceResponse.status === 'fulfilled' && balanceResponse.value.ok 
          ? await balanceResponse.value.json() 
          : {};
        const positionsData = positionsResponse.status === 'fulfilled' && positionsResponse.value.ok 
          ? await positionsResponse.value.json() 
          : {};
        const ordersData = ordersResponse.status === 'fulfilled' && ordersResponse.value.ok 
          ? await ordersResponse.value.json() 
          : {};

        console.log('Broker API Results:', {
          balance: balanceData,
          positions: positionsData,
          orders: ordersData
        });

        // Process broker API data (existing logic)
        const positionsArray = Array.isArray(positionsData)
          ? positionsData
          : Array.isArray(positionsData?.positions)
            ? positionsData.positions
            : positionsData?.data && Array.isArray(positionsData.data) 
            ? positionsData.data
            : [];

        const ordersArray = Array.isArray(ordersData)
          ? ordersData
          : Array.isArray(ordersData?.orders)
            ? ordersData.orders
            : ordersData?.data && Array.isArray(ordersData.data)
            ? ordersData.data
            : [];

        console.log('Processed broker arrays:', { positionsArray, ordersArray });

        const positions = positionsArray.map((pos, index) => ({
          id: pos.id || `broker_pos_${index}`,
          order_number: pos.id || `BROKER_POS_${index}`,
          symbol: pos.symbol || 'Unknown',
          asset: pos.symbol || 'Unknown',
          type: pos.type || 'Buy',
          volume: pos.volume || 0,
          quantity: pos.volume || 0,
          opening: pos.open_price || 0,
          current_price: pos.current_price || pos.opening || 0,
          trade_pl: pos.profit || 0,
          swap: pos.swap || 0,
          commission: pos.commission || 0,
          date: pos.open_time || new Date().toISOString(),
          status: 'Executed',
          stop_loss: pos.stop_loss || null,
          sl: pos.stop_loss || null,
          take_profit: pos.take_profit || null,
          tp: pos.take_profit || null,
          source: 'Broker'
        }));

        const orders = ordersArray.map((order, index) => ({
          id: order.id || `broker_order_${index}`,
          order_number: order.id || `BROKER_ORD_${index}`,
          symbol: order.symbol || 'Unknown',
          asset: order.symbol || 'Unknown',
          type: order.type || 'Pending',
          volume: order.volume || 0,
          quantity: order.volume || 0,
          opening: order.open_price || 0,
          stop_loss: order.stop_loss || null,
          sl: order.stop_loss || null,
          take_profit: order.take_profit || null,
          tp: order.take_profit || null,
          date: order.created_time || new Date().toISOString(),
          status: 'Pending',
          trade_pl: 0,
          source: 'Broker'
        }));

        // Combine all trades
        const allTrades = [...positions, ...orders];
        console.log('Final broker trades:', allTrades);
        
        setTrades(allTrades);
        calculateStats(allTrades, balanceData);
      }
      
    } catch (error) {
      console.error('❌ Error fetching trades:', error);
      setError(error.message);
      toast.error(`Error fetching trades: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [selectedAccount]);

  // Enhanced WebSocket setup for EA accounts
  useEffect(() => {
    if (!selectedAccount?.id) return;

    const isEA = isEAAccount(selectedAccount);
    
    if (isEA) {
      // Use EA WebSocket for real-time updates
      console.log('Setting up EA WebSocket for account:', selectedAccount.id);
      
      // Set up event listeners for real-time updates
      const handleTradeUpdate = (data) => {
        console.log('EA trade update received:', data);
        if (data.account_id === selectedAccount.id) {
          // Refresh data when trade updates occur
          fetchTrades();
        }
      };

      const handlePositionUpdate = (data) => {
        console.log('EA position update received:', data);
        if (data.account_id === selectedAccount.id) {
          setTrades(prevTrades => {
            const newTrades = [...prevTrades];
            const index = newTrades.findIndex(t => t.order_number === data.ticket);
            if (index >= 0) {
              // Update existing position
              newTrades[index] = {
                ...newTrades[index],
                current_price: data.price_current,
                trade_pl: data.profit,
                swap: data.swap,
                commission: data.commission
              };
            }
            return newTrades;
          });
        }
      };

      const handleBalanceUpdate = (data) => {
        console.log('EA balance update received:', data);
        if (data.account_id === selectedAccount.id) {
          setStats(prevStats => ({
            ...prevStats,
            balance: data.balance,
            equity: data.equity,
            margin: data.margin,
            freeMargin: data.free_margin,
            currency: data.currency
          }));
        }
      };

      const handleOrderUpdate = (data) => {
        console.log('EA order update received:', data);
        if (data.account_id === selectedAccount.id) {
          // Refresh trades to get latest order status
          fetchTrades();
        }
      };

      // Register EA WebSocket event listeners
      eaWebSocket.on(EA_WEBSOCKET_MESSAGE_TYPES.TRADE_RESULT, handleTradeUpdate);
      eaWebSocket.on(EA_WEBSOCKET_MESSAGE_TYPES.POSITION_UPDATE, handlePositionUpdate);
      eaWebSocket.on(EA_WEBSOCKET_MESSAGE_TYPES.BALANCE_UPDATE, handleBalanceUpdate);
      eaWebSocket.on(EA_WEBSOCKET_MESSAGE_TYPES.ORDER_UPDATE, handleOrderUpdate);

      // Connect WebSocket if not already connected
      if (!eaWebSocket.ws || eaWebSocket.ws.readyState !== WebSocket.OPEN) {
        // Get user ID from auth token or storage for WebSocket connection
        const userId = localStorage.getItem('user_id') || 'default_user';
        eaWebSocket.connect(userId);
      }

      // Cleanup on unmount
      return () => {
        eaWebSocket.off(EA_WEBSOCKET_MESSAGE_TYPES.TRADE_RESULT, handleTradeUpdate);
        eaWebSocket.off(EA_WEBSOCKET_MESSAGE_TYPES.POSITION_UPDATE, handlePositionUpdate);
        eaWebSocket.off(EA_WEBSOCKET_MESSAGE_TYPES.BALANCE_UPDATE, handleBalanceUpdate);
        eaWebSocket.off(EA_WEBSOCKET_MESSAGE_TYPES.ORDER_UPDATE, handleOrderUpdate);
      };
    } else {
      // Legacy WebSocket fallback for non-EA accounts
      console.log('Using legacy WebSocket for non-EA account:', selectedAccount.id);
      // Keep existing placeholder WebSocket logic if needed
    }
  }, [selectedAccount, fetchTrades]);

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

  // Handle trade closure with EA API support
  const handleCloseTrade = async (tradeId) => {
    if (!selectedAccount?.id || !tradeId) return;
    
    try {
      const isEA = isEAAccount(selectedAccount);
      
      if (isEA) {
        // Use EA API for closing positions/orders
        console.log('Closing EA trade:', tradeId);
        
        // Try to close as position first, then as order if it fails
        try {
          // For EA accounts, we need to use the appropriate EA endpoints
          // Note: EA API might need specific close position/order endpoints
          // For now, we'll use the existing broker API as fallback
          const response = await fetch(`http://api.tradexas.com/api/v1/broker/${selectedAccount.id}/positions/${tradeId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': localStorage.getItem('access_token'),
              'Content-Type': 'application/json'
            }
          });
          
          const data = await response.json();
          
          if (data.success) {
            toast.success(`EA position closed successfully. Profit: ${data.profit || 'N/A'}`);
            fetchTrades();
          } else {
            throw new Error(data.message || 'Failed to close EA position');
          }
        } catch (positionError) {
          // Try cancelling as pending order
          try {
            const orderResponse = await fetch(`http://api.tradexas.com/api/v1/broker/${selectedAccount.id}/orders/${tradeId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': localStorage.getItem('access_token'),
                'Content-Type': 'application/json'
              }
            });
            
            const orderData = await orderResponse.json();
            
            if (orderData.success) {
              toast.success('EA order cancelled successfully');
              fetchTrades();
            } else {
              throw new Error(orderData.message || 'Failed to cancel EA order');
            }
          } catch (orderError) {
            console.error('Failed to close EA trade:', positionError, orderError);
            toast.error(`Error closing EA trade: ${positionError.message}`);
          }
        }
      } else {
        // Original logic for non-EA accounts
        try {
          const response = await fetch(`http://api.tradexas.com/api/v1/broker/${selectedAccount.id}/positions/${tradeId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': localStorage.getItem('access_token'),
              'Content-Type': 'application/json'
            }
          });
          
          const data = await response.json();
          
          if (data.success) {
            toast.success(`Position closed successfully. Profit: ${data.profit || 'N/A'}`);
            fetchTrades();
          } else {
            throw new Error(data.message || 'Failed to close trade');
          }
        } catch (error) {
          // Check if it's a pending order that needs to be cancelled instead
          try {
            const orderResponse = await fetch(`http://api.tradexas.com/api/v1/broker/${selectedAccount.id}/orders/${tradeId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': localStorage.getItem('access_token'),
                'Content-Type': 'application/json'
              }
            });
            
            const orderData = await orderResponse.json();
            
            if (orderData.success) {
              toast.success('Order cancelled successfully');
              fetchTrades();
            } else {
              throw new Error(orderData.message);
            }
          } catch (orderError) {
            toast.error(`Error closing trade: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.error('Error in handleCloseTrade:', error);
      toast.error(`Error closing trade: ${error.message}`);
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
          {selectedAccount && isEAAccount(selectedAccount) && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full border border-green-500/30">
              EA Connected
            </span>
          )}
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

      {/* Account Balance Info (EA Enhanced) */}
      {(stats.balance || stats.equity) && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#222] border border-[#333] rounded-lg p-4">
            <h4 className="text-sm text-gray-400 mb-2">Balance</h4>
            <div className="text-xl font-bold text-white">
              {stats.balance ? `${stats.balance?.toFixed(2)} ${stats.currency || 'USD'}` : '-'}
            </div>
          </div>
          <div className="bg-[#222] border border-[#333] rounded-lg p-4">
            <h4 className="text-sm text-gray-400 mb-2">Equity</h4>
            <div className="text-xl font-bold text-white">
              {stats.equity ? `${stats.equity?.toFixed(2)} ${stats.currency || 'USD'}` : '-'}
            </div>
          </div>
          <div className="bg-[#222] border border-[#333] rounded-lg p-4">
            <h4 className="text-sm text-gray-400 mb-2">Margin Used</h4>
            <div className="text-xl font-bold text-yellow-400">
              {stats.margin ? `${stats.margin?.toFixed(2)} ${stats.currency || 'USD'}` : '-'}
            </div>
          </div>
          <div className="bg-[#222] border border-[#333] rounded-lg p-4">
            <h4 className="text-sm text-gray-400 mb-2">Free Margin</h4>
            <div className="text-xl font-bold text-green-400">
              {stats.freeMargin ? `${stats.freeMargin?.toFixed(2)} ${stats.currency || 'USD'}` : '-'}
            </div>
          </div>
        </div>
      )}

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
              <th className="text-left py-3 px-4 text-gray-300 font-medium">Source</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="12" className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mr-2" />
                    <span className="text-gray-400">Loading trades...</span>
                  </div>
                </td>
              </tr>
            ) : filteredAndSortedTrades.length === 0 ? (
              <tr>
                <td colSpan="12" className="text-center py-8">
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
                    {trade.asset || trade.symbol}
                  </td>
                  <td className="py-3 px-4">
                    <div className={cn(
                      "flex items-center gap-1",
                      (trade.type === 'Buy' || trade.type === 'BUY') ? "text-green-400" : "text-red-400"
                    )}>
                      {(trade.type === 'Buy' || trade.type === 'BUY') ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {trade.type}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {trade.quantity || trade.volume}
                  </td>
                  <td className="py-3 px-4 text-gray-300 font-mono">
                    {trade.opening?.toFixed(5)}
                  </td>
                  <td className="py-3 px-4 text-gray-300 font-mono">
                    {(trade.sl || trade.stop_loss)?.toFixed(5) || '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-300 font-mono">
                    {(trade.tp || trade.take_profit)?.toFixed(5) || '-'}
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
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-medium",
                      trade.source === 'EA' && "bg-blue-500/20 text-blue-400 border border-blue-500/30",
                      trade.source === 'Broker' && "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    )}>
                      {trade.source || 'Unknown'}
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
