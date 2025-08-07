import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  RefreshCw, 
  X, 
  Edit3, 
  TrendingUp, 
  TrendingDown,
  Clock,
  DollarSign,
  Activity
} from 'lucide-react';
import { 
  getPositions, 
  getOrders, 
  closePosition, 
  cancelOrder, 
  modifyPosition, 
  modifyOrder 
} from '../../api/broker';

const OrderManagementPanel = ({ selectedAccount }) => {
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (selectedAccount) {
      fetchPositionsAndOrders();
    }
  }, [selectedAccount]);

  const fetchPositionsAndOrders = async () => {
    if (!selectedAccount) return;

    setLoading(true);
    try {
      const [positionsRes, ordersRes] = await Promise.all([
        getPositions(selectedAccount.id),
        getOrders(selectedAccount.id)
      ]);

      if (positionsRes.success) {
        setPositions(positionsRes.data || []);
      } else {
        console.warn('Failed to fetch positions:', positionsRes.error);
        setPositions([]);
      }

      if (ordersRes.success) {
        setOrders(ordersRes.data || []);
      } else {
        console.warn('Failed to fetch orders:', ordersRes.error);
        setOrders([]);
      }
    } catch (error) {
      toast.error('Failed to fetch positions and orders');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPositionsAndOrders();
    setRefreshing(false);
    toast.success('Data refreshed');
  };

  const handleClosePosition = async (positionId) => {
    try {
      const response = await closePosition(selectedAccount.id, positionId);
      
      if (response.success) {
        toast.success(`Position closed: P&L ${response.data.profit || 'N/A'}`);
        fetchPositionsAndOrders(); // Refresh data
      } else {
        toast.error(`Failed to close position: ${response.error}`);
      }
    } catch (error) {
      toast.error('Error closing position');
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      const response = await cancelOrder(selectedAccount.id, orderId);
      
      if (response.success) {
        toast.success('Order cancelled successfully');
        fetchPositionsAndOrders(); // Refresh data
      } else {
        toast.error(`Failed to cancel order: ${response.error}`);
      }
    } catch (error) {
      toast.error('Error cancelling order');
    }
  };

  const handleModifyPosition = async (positionId, newStopLoss, newTakeProfit) => {
    try {
      const modifications = {};
      if (newStopLoss) modifications.stop_loss = parseFloat(newStopLoss);
      if (newTakeProfit) modifications.take_profit = parseFloat(newTakeProfit);

      const response = await modifyPosition(selectedAccount.id, positionId, modifications);
      
      if (response.success) {
        toast.success('Position modified successfully');
        fetchPositionsAndOrders();
      } else {
        toast.error(`Failed to modify position: ${response.error}`);
      }
    } catch (error) {
      toast.error('Error modifying position');
    }
  };

  if (!selectedAccount) {
    return (
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-8 text-center">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-white text-lg font-medium mb-2">No Account Selected</h3>
        <p className="text-gray-400">Please select an account to view positions and orders</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Order Management - {selectedAccount.broker_name || selectedAccount.accountName}
        </h3>
        <button 
          onClick={handleRefresh} 
          disabled={loading || refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2F00FF] to-[#1C0099] hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="bg-[#222] border border-[#333] rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading positions and orders...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Open Positions */}
          <div className="bg-[#222] border border-[#333] rounded-lg p-4">
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Open Positions ({positions.length})
            </h4>
            {positions.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400">No open positions</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#333]">
                      <th className="text-left py-2 px-3 text-gray-300 font-medium">Symbol</th>
                      <th className="text-left py-2 px-3 text-gray-300 font-medium">Type</th>
                      <th className="text-left py-2 px-3 text-gray-300 font-medium">Volume</th>
                      <th className="text-left py-2 px-3 text-gray-300 font-medium">Open Price</th>
                      <th className="text-left py-2 px-3 text-gray-300 font-medium">Current Price</th>
                      <th className="text-left py-2 px-3 text-gray-300 font-medium">Profit</th>
                      <th className="text-left py-2 px-3 text-gray-300 font-medium">SL</th>
                      <th className="text-left py-2 px-3 text-gray-300 font-medium">TP</th>
                      <th className="text-left py-2 px-3 text-gray-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map(position => (
                      <PositionRow 
                        key={position.id || position.ticket}
                        position={position}
                        onClose={() => handleClosePosition(position.id || position.ticket)}
                        onModify={(sl, tp) => handleModifyPosition(position.id || position.ticket, sl, tp)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pending Orders */}
          <div className="bg-[#222] border border-[#333] rounded-lg p-4">
            <h4 className="text-white font-medium mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Orders ({orders.length})
            </h4>
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400">No pending orders</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#333]">
                      <th className="text-left py-2 px-3 text-gray-300 font-medium">Symbol</th>
                      <th className="text-left py-2 px-3 text-gray-300 font-medium">Type</th>
                      <th className="text-left py-2 px-3 text-gray-300 font-medium">Volume</th>
                      <th className="text-left py-2 px-3 text-gray-300 font-medium">Order Price</th>
                      <th className="text-left py-2 px-3 text-gray-300 font-medium">SL</th>
                      <th className="text-left py-2 px-3 text-gray-300 font-medium">TP</th>
                      <th className="text-left py-2 px-3 text-gray-300 font-medium">Created</th>
                      <th className="text-left py-2 px-3 text-gray-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <OrderRow 
                        key={order.id || order.ticket}
                        order={order}
                        onCancel={() => handleCancelOrder(order.id || order.ticket)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Individual Position Row Component
const PositionRow = ({ position, onClose, onModify }) => {
  const [editing, setEditing] = useState(false);
  const [newSL, setNewSL] = useState(position.stop_loss || '');
  const [newTP, setNewTP] = useState(position.take_profit || '');

  const handleModify = () => {
    onModify(newSL, newTP);
    setEditing(false);
  };

  const profit = position.profit || position.pnl || 0;
  const profitColor = profit >= 0 ? 'text-green-400' : 'text-red-400';
  const typeColor = position.type === 'BUY' || position.cmd === 0 ? 'text-green-400' : 'text-red-400';
  const TypeIcon = position.type === 'BUY' || position.cmd === 0 ? TrendingUp : TrendingDown;

  return (
    <tr className="border-b border-[#333] hover:bg-[#2A2A2A] transition-colors">
      <td className="py-3 px-3 text-white font-medium">{position.symbol}</td>
      <td className="py-3 px-3">
        <div className={`flex items-center gap-1 ${typeColor}`}>
          <TypeIcon className="w-3 h-3" />
          <span className="text-sm font-medium">
            {position.type?.toUpperCase() || (position.cmd === 0 ? 'BUY' : 'SELL')}
          </span>
        </div>
      </td>
      <td className="py-3 px-3 text-gray-300">{position.volume || position.lots}</td>
      <td className="py-3 px-3 text-gray-300 font-mono">
        {(position.open_price || position.price_open)?.toFixed(5)}
      </td>
      <td className="py-3 px-3 text-gray-300 font-mono">
        {(position.current_price || position.price_current)?.toFixed(5)}
      </td>
      <td className={`py-3 px-3 font-mono font-medium ${profitColor}`}>
        {profit >= 0 ? '+' : ''}{profit.toFixed(2)}
      </td>
      <td className="py-3 px-3">
        {editing ? (
          <input
            type="number"
            step="0.00001"
            value={newSL}
            onChange={(e) => setNewSL(e.target.value)}
            placeholder="SL"
            className="w-20 bg-[#1A1A1A] border border-[#444] rounded px-2 py-1 text-white text-sm"
          />
        ) : (
          <span className="text-gray-300 font-mono text-sm">
            {position.stop_loss?.toFixed(5) || '-'}
          </span>
        )}
      </td>
      <td className="py-3 px-3">
        {editing ? (
          <input
            type="number"
            step="0.00001"
            value={newTP}
            onChange={(e) => setNewTP(e.target.value)}
            placeholder="TP"
            className="w-20 bg-[#1A1A1A] border border-[#444] rounded px-2 py-1 text-white text-sm"
          />
        ) : (
          <span className="text-gray-300 font-mono text-sm">
            {position.take_profit?.toFixed(5) || '-'}
          </span>
        )}
      </td>
      <td className="py-3 px-3">
        {editing ? (
          <div className="flex gap-1">
            <button 
              onClick={handleModify}
              className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition-colors"
            >
              Save
            </button>
            <button 
              onClick={() => setEditing(false)}
              className="px-2 py-1 bg-gray-600 hover:bg-[#222222] text-white rounded text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-1">
            <button 
              onClick={() => setEditing(true)}
              className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
              title="Modify position"
            >
              <Edit3 className="w-3 h-3" />
            </button>
            <button 
              onClick={onClose}
              className="p-1 text-red-400 hover:text-red-300 transition-colors"
              title="Close position"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

// Individual Order Row Component
const OrderRow = ({ order, onCancel }) => {
  const typeColor = order.type?.includes('BUY') || order.cmd === 2 || order.cmd === 4 ? 'text-green-400' : 'text-red-400';
  const TypeIcon = order.type?.includes('BUY') || order.cmd === 2 || order.cmd === 4 ? TrendingUp : TrendingDown;

  return (
    <tr className="border-b border-[#333] hover:bg-[#2A2A2A] transition-colors">
      <td className="py-3 px-3 text-white font-medium">{order.symbol}</td>
      <td className="py-3 px-3">
        <div className={`flex items-center gap-1 ${typeColor}`}>
          <TypeIcon className="w-3 h-3" />
          <span className="text-sm font-medium">
            {order.type?.replace('_', ' ').toUpperCase() || 
             (order.cmd === 2 ? 'BUY LIMIT' : 
              order.cmd === 3 ? 'SELL LIMIT' : 
              order.cmd === 4 ? 'BUY STOP' : 
              order.cmd === 5 ? 'SELL STOP' : 'PENDING')}
          </span>
        </div>
      </td>
      <td className="py-3 px-3 text-gray-300">{order.volume || order.lots}</td>
      <td className="py-3 px-3 text-gray-300 font-mono">
        {(order.open_price || order.price_open)?.toFixed(5)}
      </td>
      <td className="py-3 px-3 text-gray-300 font-mono text-sm">
        {order.stop_loss?.toFixed(5) || '-'}
      </td>
      <td className="py-3 px-3 text-gray-300 font-mono text-sm">
        {order.take_profit?.toFixed(5) || '-'}
      </td>
      <td className="py-3 px-3 text-gray-300 text-sm">
        {order.created_time ? new Date(order.created_time).toLocaleDateString() : 
         order.time_setup ? new Date(order.time_setup * 1000).toLocaleDateString() : '-'}
      </td>
      <td className="py-3 px-3">
        <button 
          onClick={onCancel}
          className="p-1 text-red-400 hover:text-red-300 transition-colors"
          title="Cancel order"
        >
          <X className="w-3 h-3" />
        </button>
      </td>
    </tr>
  );
};

export default OrderManagementPanel;
