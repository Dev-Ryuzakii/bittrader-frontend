import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  Scale,
  Activity,
  Search,
  RefreshCw,
  Link2,
  BarChart3,
  Zap
} from 'lucide-react';
import { 
  placeTrade, 
  placePendingOrder, 
  placePairTrade, 
  getSymbolPrice 
} from '../../api/broker';
import { 
  getPopularSymbols, 
  searchSymbols, 
  mockSearchSymbols, 
  formatSymbolsForPicker 
} from '../../utils/symbolpicker';

const TradeModal = ({ isOpen, onClose, accounts, selectedAccount, onAccountSelect, onPlaceTrade }) => {
  const [activeTab, setActiveTab] = useState('market');
  const [submitting, setSubmitting] = useState(false);
  const [livePrice, setLivePrice] = useState(null);
  const [error, setError] = useState('');

  // Market Order State
  const [marketData, setMarketData] = useState({
    symbol: '',
    trade_type: 'BUY',
    volume: 0.1,
    stop_loss: '',
    take_profit: '',
    comment: '',
  });

  // Pending Order State - Updated to match FastAPI PlacePendingOrderRequest
  const [pendingData, setPendingData] = useState({
    symbol: 'BTCUSD',
    trade_type: 'BUY',     // Add trade_type field
    order_type: 'BUY_LIMIT', // Update to match backend enum
    volume: 0.01,
    price: '',
    stop_loss: '',
    take_profit: '',
    expiration: '',
    comment: '',
  });

  // Pair Trading State
  const [pairData, setPairData] = useState({
    symbol1: '',
    symbol2: '',
    volume1: 0.01,
    volume2: 0.01,
    correlation_type: 'ANALYZE',
    order_type: 'MARKET',
    entry_spread: '',
    spread_direction: 'NARROW',
    spread_stop_loss: '',
    spread_take_profit: '',
    expiration: '',
    stop_loss1: '',
    stop_loss2: '',
    take_profit1: '',
    take_profit2: '',
    correlation_threshold: 0.8,
    comment: '',
  });

  // Fetch live price when symbol changes
  useEffect(() => {
    if (isOpen && selectedAccount && marketData.symbol) {
      fetchLivePrice(marketData.symbol);
    }
  }, [isOpen, marketData.symbol, selectedAccount]);

  const fetchLivePrice = async (symbol) => {
    try {
      // Try to use the symbolpicker's getSymbolPrice function first
      if (selectedAccount) {
        const response = await getSymbolPrice(selectedAccount.id, symbol);
        if (response) {
          setLivePrice({
            bid: response.bid,
            ask: response.ask,
            spread: response.spread,
            time: response.time
          });
          return;
        }
      }
      
      // Fall back to the broker API's getLivePrice if symbolpicker fails
      const response = await getLivePrice(symbol);
      if (response.success) {
        setLivePrice(response.data);
      }
    } catch (error) {
      //console.log('Could not fetch live price:', error);
    }
  };

  if (!isOpen) return null;

  const handleMarketTrade = async () => {
    if (!selectedAccount) {
      setError('Please select an account to trade with');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const volume = parseFloat(marketData.volume);
      const stopLoss = marketData.stop_loss ? parseFloat(marketData.stop_loss) : null;
      const takeProfit = marketData.take_profit ? parseFloat(marketData.take_profit) : null;

      if (isNaN(volume) || volume <= 0) {
        throw new Error('Volume must be greater than 0');
      }

      // Ensure minimum volume constraints (common in Forex)
      if (volume < 0.01) {
        throw new Error('Volume must be at least 0.01 lots');
      }

      // Create clean payload with proper data types
      const cleanPayload = {
        symbol: marketData.symbol?.toString().trim().toUpperCase(),
        trade_type: marketData.trade_type?.toString().toUpperCase(),
        volume: Math.round(volume * 100) / 100, // Round to 2 decimal places
      };

      // Validate required fields
      if (!cleanPayload.symbol || typeof cleanPayload.symbol !== 'string') {
        throw new Error('Valid symbol is required');
      }
      if (!cleanPayload.trade_type || !['BUY', 'SELL'].includes(cleanPayload.trade_type)) {
        throw new Error('Valid trade type (BUY/SELL) is required');
      }
      if (!cleanPayload.volume || isNaN(cleanPayload.volume) || cleanPayload.volume <= 0) {
        throw new Error('Valid volume greater than 0 is required');
      }

      // Only include optional fields if they have valid values
      if (stopLoss && stopLoss > 0) {
        cleanPayload.stop_loss = Math.round(stopLoss * 100000) / 100000; // Round to 5 decimal places
      }
      if (takeProfit && takeProfit > 0) {
        cleanPayload.take_profit = Math.round(takeProfit * 100000) / 100000; // Round to 5 decimal places
      }
      if (marketData.comment && marketData.comment.trim()) {
        cleanPayload.comment = marketData.comment.trim();
      }

      //console.log('Sending trade payload:', cleanPayload);

      const response = await placeTrade(selectedAccount.id, cleanPayload);
      
      //console.log('Trade response:', response);
      
      if (response.success) {
        const message = response.message || `Market ${cleanPayload.trade_type} order placed successfully for ${cleanPayload.volume} ${cleanPayload.symbol}`;
        toast.success(message);
        
        // Show detailed trade information if available
        if (response.order_id || response.position_id) {
          toast.success(
            <div className="text-sm">
              <p><strong>Trade Details:</strong></p>
              {response.order_id && <p>Order ID: {response.order_id}</p>}
              {response.position_id && <p>Position ID: {response.position_id}</p>}
              <p>View your position in the Order Management Panel</p>
            </div>,
            { duration: 6000 }
          );
        }
        
        // Wait a moment for the trade to be processed
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Call onPlaceTrade with the proper parameters
        if (onPlaceTrade) {
          await onPlaceTrade(selectedAccount.id, cleanPayload);
        }
        
        onClose();
      } else {
        throw new Error(response.error || response.message || 'Failed to place trade');
      }
    } catch (error) {
      setError(error.message || 'Failed to place trade. Please try again.');
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePendingOrder = async () => {
    if (!selectedAccount) {
      setError('Please select an account to trade with');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const volume = parseFloat(pendingData.volume);
      const price = parseFloat(pendingData.price);
      const stopLoss = pendingData.stop_loss ? parseFloat(pendingData.stop_loss) : null;
      const takeProfit = pendingData.take_profit ? parseFloat(pendingData.take_profit) : null;

      if (isNaN(volume) || volume <= 0) {
        throw new Error('Volume must be greater than 0');
      }
      if (isNaN(price) || price <= 0) {
        throw new Error('Order price must be greater than 0');
      }

      // Create payload that matches PlacePendingOrderRequest structure
      const payload = {
        symbol: pendingData.symbol,
        trade_type: pendingData.trade_type,  // Add trade_type to payload
        order_type: pendingData.order_type,
        volume,
        price,
        stop_loss: stopLoss,
        take_profit: takeProfit,
        expiration: pendingData.expiration || undefined,
        comment: pendingData.comment,
      };

      const response = await placePendingOrder(selectedAccount.id, payload);
      
      //console.log('Pending order response:', response);
      
      if (response.success) {
        const message = response.message || `Pending order placed successfully`;
        toast.success(message);
        
        // Show detailed order information if available
        if (response.order_id) {
          toast.success(
            <div className="text-sm">
              <p><strong>Pending Order Details:</strong></p>
              <p>Order ID: {response.order_id}</p>
              <p>Type: {payload.order_type}</p>
              <p>Entry Price: {payload.price}</p>
              <p>Check your orders in the Order Management Panel</p>
            </div>,
            { duration: 6000 }
          );
        }
        
        onClose();
      } else {
        throw new Error(response.error || response.message || 'Failed to place pending order');
      }
    } catch (error) {
      setError(error.message || 'Failed to place pending order. Please try again.');
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePairTrade = async (direction) => {
    if (!selectedAccount) {
      setError('Please select an account to trade with');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const volume1 = parseFloat(pairData.volume1);
      const volume2 = parseFloat(pairData.volume2);
      const threshold = parseFloat(pairData.correlation_threshold);

      if (isNaN(volume1) || volume1 <= 0) {
        throw new Error('Volume for Symbol 1 must be greater than 0');
      }
      if (isNaN(volume2) || volume2 <= 0) {
        throw new Error('Volume for Symbol 2 must be greater than 0');
      }
      if (isNaN(threshold) || threshold < 0 || threshold > 1) {
        throw new Error('Correlation threshold must be between 0 and 1');
      }

      // Build payload based on order type and correlation type
      const payload = {
        symbol1: pairData.symbol1.toUpperCase(),
        symbol2: pairData.symbol2.toUpperCase(),
        volume1: volume1,
        volume2: volume2,
        correlation_type: pairData.correlation_type,
        correlation_threshold: threshold,
      };

      // Add order type for pending orders
      if (pairData.order_type === 'PENDING') {
        payload.order_type = 'PENDING';
        
        // Validate required fields for pending orders
        if (!pairData.entry_spread || parseFloat(pairData.entry_spread) <= 0) {
          throw new Error('Entry spread is required for pending orders');
        }
        if (!pairData.spread_direction) {
          throw new Error('Spread direction is required for pending orders');
        }
        
        payload.entry_spread = parseFloat(pairData.entry_spread);
        payload.spread_direction = pairData.spread_direction;
        
        // Add optional fields for pending orders
        if (pairData.spread_stop_loss && parseFloat(pairData.spread_stop_loss) > 0) {
          payload.spread_stop_loss = parseFloat(pairData.spread_stop_loss);
        }
        if (pairData.spread_take_profit && parseFloat(pairData.spread_take_profit) > 0) {
          payload.spread_take_profit = parseFloat(pairData.spread_take_profit);
        }
        if (pairData.expiration) {
          payload.expiration = new Date(pairData.expiration).toISOString();
        }
      } else {
        // For market orders, include trade directions only if not using ANALYZE
        if (pairData.correlation_type !== 'ANALYZE') {
          // Determine trade types based on direction for manual correlation types
          if (direction === 'BUY') {
            payload.trade_type1 = 'BUY';
            payload.trade_type2 = 'SELL';
          } else if (direction === 'SELL') {
            payload.trade_type1 = 'SELL';
            payload.trade_type2 = 'BUY';
          }
        }
        // For ANALYZE correlation type, let the API determine the directions
      }

      // Add individual stop loss and take profit if specified
      if (pairData.stop_loss1 && parseFloat(pairData.stop_loss1) > 0) {
        payload.stop_loss1 = parseFloat(pairData.stop_loss1);
      }
      if (pairData.stop_loss2 && parseFloat(pairData.stop_loss2) > 0) {
        payload.stop_loss2 = parseFloat(pairData.stop_loss2);
      }
      if (pairData.take_profit1 && parseFloat(pairData.take_profit1) > 0) {
        payload.take_profit1 = parseFloat(pairData.take_profit1);
      }
      if (pairData.take_profit2 && parseFloat(pairData.take_profit2) > 0) {
        payload.take_profit2 = parseFloat(pairData.take_profit2);
      }
      if (pairData.comment && pairData.comment.trim()) {
        payload.comment = pairData.comment.trim();
      }

      //console.log('Sending pair trade payload:', payload);
      const response = await placePairTrade(selectedAccount.id, payload);
      
      //console.log('Pair trade response:', response);
      
      if (response.success) {
        // Handle successful pair trade
        let successMessage = response.message || 'Pair trade executed successfully';
        
        // Enhanced success message based on order type
        if (pairData.order_type === 'PENDING') {
          successMessage = `Pending spread order placed successfully`;
        } else if (pairData.correlation_type === 'ANALYZE') {
          successMessage = `Statistical pair trade executed`;
        }
        
        toast.success(successMessage);
        
        // Display correlation analysis if available
        if (response.correlation_analysis) {
          const analysis = response.correlation_analysis;
          
          if (analysis.correlation_type === 'STATISTICAL') {
            // Show detailed statistical analysis
            toast.success(
              <div className="text-sm">
                <p><strong>Statistical Analysis:</strong></p>
                <p>Correlation: {(analysis.correlation || 0).toFixed(3)}</p>
                <p>Z-Score: {(analysis.z_score || 0).toFixed(2)}</p>
                <p>Signal: {analysis.recommendation || 'Analysis complete'}</p>
                {analysis.determined_trade_type1 && analysis.determined_trade_type2 && (
                  <p>Actions: {analysis.symbol1} {analysis.determined_trade_type1}, {analysis.symbol2} {analysis.determined_trade_type2}</p>
                )}
              </div>,
              { duration: 8000 }
            );
          } else if (pairData.order_type === 'PENDING') {
            // Show pending order details
            toast.info(
              <div className="text-sm">
                <p><strong>Pending Order Details:</strong></p>
                <p>Entry Spread: {analysis.entry_spread}</p>
                <p>Current Spread: {(analysis.current_spread || 0).toFixed(5)}</p>
                <p>Direction: {analysis.spread_direction}</p>
                <p>Difference: {(analysis.spread_difference || 0).toFixed(5)}</p>
              </div>,
              { duration: 6000 }
            );
          }
        }
        
        // Display individual trade results
        if (response.symbol1_result || response.symbol2_result) {
          const symbol1Success = response.symbol1_result?.success;
          const symbol2Success = response.symbol2_result?.success;
          
          if (symbol1Success && symbol2Success) {
            toast.success(`Both trades executed successfully`);
          } else if (symbol1Success || symbol2Success) {
            toast.warning(`Partial execution: ${symbol1Success ? 'Symbol1' : 'Symbol2'} succeeded`);
          }
        }
        
        // Call onPlaceTrade callback if provided
        if (onPlaceTrade) {
          await onPlaceTrade(selectedAccount.id, payload);
        }
        
        onClose();
      } else {
        throw new Error(response.error || response.message || 'Failed to place pair trade');
      }
    } catch (error) {
      //console.error('Pair trade error:', error);
      setError(error.message || 'Failed to place pair trade. Please try again.');
      toast.error(error.message || 'Failed to place pair trade');
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: 'market', label: 'Market Order', icon: TrendingUp },
    { id: 'pending', label: 'Pending Order', icon: Clock },
    { id: 'pair', label: 'Pair Trading', icon: Scale },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#2A2A2A]">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Trading Panel
          </h3>
          <button 
            className="text-gray-400 hover:text-white transition-colors" 
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="m-6 mb-0 bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Account Selection */}
        <div className="p-6 pb-0">
          <div className="bg-[#222] border border-[#333] rounded-lg p-4 mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Trading Account
            </label>
            <div className="flex items-center gap-4">
              <select 
                className="flex-1 bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
                onChange={(e) => {
                  const accountId = e.target.value;
                  const account = accounts.find(acc => acc.id?.toString() === accountId);
                  if (account) onAccountSelect(account);
                }}
                value={selectedAccount?.id?.toString() || ''}
              >
                <option value="" disabled>Select account</option>
                {accounts && accounts.length > 0 ? accounts.map((account) => (
                  <option key={account.id} value={account.id?.toString()}>
                    {account.accountName || account.broker_name || 'Account'} 
                    {account.login ? ` - ${account.login}` : ''}
                    {account.is_demo ? ' (Demo)' : ''}
                  </option>
                )) : (
                  <option value="" disabled>No accounts available</option>
                )}
              </select>
              {selectedAccount && (
                <div className="bg-green-600/20 text-green-400 px-3 py-2 rounded-lg text-sm">
                  Balance: ${selectedAccount.balance?.toFixed(2) || '0.00'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="flex space-x-1 bg-[#222] p-1 rounded-lg mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#2F00FF] to-[#1C0099] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#333]'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-6 pb-6">
          {activeTab === 'market' && (
            <MarketOrderPanel 
              data={marketData}
              setData={setMarketData}
              livePrice={livePrice}
              onSubmit={handleMarketTrade}
              submitting={submitting}
            />
          )}
          
          {activeTab === 'pending' && (
            <PendingOrderPanel 
              data={pendingData}
              setData={setPendingData}
              onSubmit={handlePendingOrder}
              submitting={submitting}
            />
          )}
          
          {activeTab === 'pair' && (
            <PairTradingPanel 
              data={pairData}
              setData={setPairData}
              onSubmit={handlePairTrade}
              submitting={submitting}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Market Order Panel Component
const MarketOrderPanel = ({ data, setData, livePrice, onSubmit, submitting }) => {
  const [showSymbolModal, setShowSymbolModal] = useState(false);
  const updateData = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  // Function to open symbol modal
  const openSymbolSelector = () => {
    setShowSymbolModal(true);
  };

  // Function to close symbol modal
  const closeSymbolModal = () => {
    setShowSymbolModal(false);
  };

  // Function to select a symbol
  const handleSymbolSelect = (symbol) => {
    updateData('symbol', symbol);
    setShowSymbolModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#222] border border-[#333] rounded-lg p-4">
        <h4 className="text-white font-medium mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Market Order
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
            <div className="flex">
              <input
                type="text"
                value={data.symbol}
                onChange={(e) => updateData('symbol', e.target.value.toUpperCase())}
                placeholder="e.g., BTCUSD"
                className="w-full bg-[#1A1A1A] border border-[#444] rounded-l-lg px-3 py-2 text-white"
              />
              <button
                onClick={openSymbolSelector}
                className="bg-[#333] border border-[#555] border-l-0 rounded-r-lg px-3 text-blue-400 hover:text-blue-300"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Order Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => updateData('trade_type', 'BUY')}
                className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                  data.trade_type === 'BUY'
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'border-[#444] text-gray-300 hover:border-green-600'
                }`}
              >
                <TrendingUp className="w-4 h-4 mx-auto mb-1" />
                Buy
              </button>
              <button
                onClick={() => updateData('trade_type', 'SELL')}
                className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                  data.trade_type === 'SELL'
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'border-[#444] text-gray-300 hover:border-red-600'
                }`}
              >
                <TrendingDown className="w-4 h-4 mx-auto mb-1" />
                Sell
              </button>
            </div>
          </div>
        </div>

        {livePrice && (
          <div className="mt-4 bg-[#1A1A1A] border border-[#444] rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Live Price:</span>
              <div className="flex gap-4">
                <span className="text-red-400">Bid: {livePrice.bid?.toFixed(5)}</span>
                <span className="text-green-400">Ask: {livePrice.ask?.toFixed(5)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Volume</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={data.volume}
              onChange={(e) => updateData('volume', e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Stop Loss </label>
            <input
              type="number"
              step="0.00001"
              value={data.stop_loss}
              onChange={(e) => updateData('stop_loss', e.target.value)}
              placeholder="0.00000"
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Take Profit </label>
            <input
              type="number"
              step="0.00001"
              value={data.take_profit}
              onChange={(e) => updateData('take_profit', e.target.value)}
              placeholder="0.00000"
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>


        <button
          onClick={onSubmit}
          disabled={submitting}
          className={`w-full mt-6 py-3 px-4 rounded-lg font-medium transition-colors ${
            data.trade_type === 'buy'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          } ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {submitting ? 'Placing Order...' : `Place ${data.trade_type.toUpperCase()} Order`}
        </button>
      </div>
      
      {/* Symbol Selection Modal */}
      {showSymbolModal && (
        <SymbolSelectorModal 
          onClose={closeSymbolModal} 
          onSelect={handleSymbolSelect}
        />
      )}
    </div>
  );
};
// Pending Order Panel Component
const PendingOrderPanel = ({ data, setData, onSubmit, submitting }) => {
  const [showSymbolModal, setShowSymbolModal] = useState(false);
  const updateData = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  // Function to open symbol modal
  const openSymbolSelector = () => {
    setShowSymbolModal(true);
  };

  // Function to close symbol modal
  const closeSymbolModal = () => {
    setShowSymbolModal(false);
  };

  // Function to select a symbol
  const handleSymbolSelect = (symbol) => {
    updateData('symbol', symbol);
    setShowSymbolModal(false);
  };

  const orderTypes = [
    { value: 'BUY_LIMIT', label: 'Buy Limit', color: 'text-green-400' },
    { value: 'SELL_LIMIT', label: 'Sell Limit', color: 'text-red-400' },
    { value: 'BUY_STOP', label: 'Buy Stop', color: 'text-green-400' },
    { value: 'SELL_STOP', label: 'Sell Stop', color: 'text-red-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-[#222] border border-[#333] rounded-lg p-4">
        <h4 className="text-white font-medium mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Pending Order
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
            <div className="flex">
              <input
                type="text"
                value={data.symbol}
                onChange={(e) => updateData('symbol', e.target.value.toUpperCase())}
                placeholder="e.g., BTCUSD"
                className="w-full bg-[#1A1A1A] border border-[#444] rounded-l-lg px-3 py-2 text-white"
              />
              <button
                onClick={openSymbolSelector}
                className="bg-[#333] border border-[#555] border-l-0 rounded-r-lg px-3 text-blue-400 hover:text-blue-300"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Direction</label>
            <select
              value={data.trade_type}
              onChange={(e) => updateData('trade_type', e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            >
              <option value="BUY">Buy</option>
              <option value="SELL">Sell</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Order Type</label>
            <select
              value={data.order_type}
              onChange={(e) => updateData('order_type', e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            >
              {orderTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Volume</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={data.volume}
              onChange={(e) => updateData('volume', e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Order Price</label>
            <input
              type="number"
              step="0.00001"
              value={data.price}
              onChange={(e) => updateData('price', e.target.value)}
              placeholder="0.00000"
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Stop Loss </label>
            <input
              type="number"
              step="0.00001"
              value={data.stop_loss}
              onChange={(e) => updateData('stop_loss', e.target.value)}
              placeholder="0.00000"
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Take Profit </label>
            <input
              type="number"
              step="0.00001"
              value={data.take_profit}
              onChange={(e) => updateData('take_profit', e.target.value)}
              placeholder="0.00000"
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>

        <button
          onClick={onSubmit}
          disabled={submitting}
          className={`w-full mt-6 py-3 px-4 rounded-lg font-medium transition-colors ${
            data.order_type.includes('buy')
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          } ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {submitting ? 'Placing Order...' : `Place ${data.order_type.replace('_', ' ').toUpperCase()}`}
        </button>
      </div>
      
      {/* Symbol Selection Modal */}
      {showSymbolModal && (
        <SymbolSelectorModal 
          onClose={closeSymbolModal} 
          onSelect={handleSymbolSelect}
        />
      )}
    </div>
  );
};

// PairTradingPanel is now imported from a separate file

// Symbol Selector Modal
const SymbolSelectorModal = ({ onClose, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [symbols, setSymbols] = useState([]);
  const [popularSymbols, setPopularSymbols] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPopularSymbols();
  }, []);

  // Load popular symbols
  const loadPopularSymbols = async () => {
    try {
      setLoading(true);
      const response = await getPopularSymbols();
      if (response && response.popular_symbols) {
        setPopularSymbols(response.popular_symbols);
      } else {
        // Fallback to mock data
        setPopularSymbols({
          major_pairs: [],
          cross_pairs: [],
          commodities: []
        });
      }
    } catch (error) {
      //console.error('Error loading popular symbols:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle symbol search
  const handleSymbolSearch = async (term) => {
    setSearchTerm(term);
    if (!term || term.length < 2) {
      setSymbols([]);
      return;
    }
    
    try {
      setLoading(true);
      // Try to get symbols from API
      const response = await searchSymbols(term);
      if (response && response.symbols) {
        setSymbols(formatSymbolsForPicker(response));
      } else {
        // Fallback to mock search
        setSymbols(mockSearchSymbols(term));
      }
    } catch (error) {
      //console.error('Error searching symbols:', error);
      // Fallback to mock search
      setSymbols(mockSearchSymbols(term));
    } finally {
      setLoading(false);
    }
  };

  // Define categories
  const SYMBOL_CATEGORIES = {
    major_pairs: 'MAJOR FOREX PAIRS',
    cross_pairs: 'CROSS FOREX PAIRS',
    exotic_pairs: 'EXOTIC PAIRS',
    commodities: 'COMMODITIES',
    indices: 'INDICES',
    crypto: 'CRYPTOCURRENCY'
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#2A2A2A] flex justify-between items-center">
          <h3 className="text-lg font-medium text-white">Select Symbol</h3>
          <button 
            className="text-gray-400 hover:text-white" 
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 border-b border-[#2A2A2A]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSymbolSearch(e.target.value)}
              placeholder="Search symbols..."
              className="w-full bg-[#222] border border-[#444] rounded-lg pl-9 pr-3 py-2 text-white"
            />
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1 p-2">
          {loading && (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin mb-2" />
              <p>Loading symbols...</p>
            </div>
          )}
          
          {!loading && searchTerm.length < 2 && (
            <>
              {Object.entries(popularSymbols).map(([category, symbolList]) => (
                symbolList && symbolList.length > 0 && (
                  <div key={category}>
                    <div className="text-xs font-medium text-gray-500 px-2 py-1">
                      {SYMBOL_CATEGORIES[category] || category.toUpperCase()}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {symbolList.map(sym => (
                        <button
                          key={sym.symbol}
                          onClick={() => onSelect(sym.symbol)}
                          className={`bg-[#222] hover:bg-[#333] border border-[#444] rounded px-3 py-2 text-left transition-colors ${
                            sym.available ? 'text-white' : 'text-gray-500'
                          }`}
                          disabled={!sym.available}
                        >
                          {sym.symbol}
                          {sym.description && (
                            <span className="text-xs text-gray-400 block">{sym.description}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              ))}
              
              {Object.keys(popularSymbols).length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                  <p>Type to search for symbols</p>
                </div>
              )}
            </>
          )}
          
          {!loading && searchTerm.length >= 2 && (
            <>
              {symbols.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {symbols.map(symbol => (
                    <button
                      key={symbol.symbol}
                      onClick={() => onSelect(symbol.symbol)}
                      className="bg-[#222] hover:bg-[#333] border border-[#444] rounded px-3 py-2 text-white text-left transition-colors"
                    >
                      {symbol.symbol}
                      {symbol.description && (
                        <span className="text-xs text-gray-400 block">{symbol.description}</span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                  <p>No symbols found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="p-4 border-t border-[#2A2A2A]">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-[#333] hover:bg-[#444] text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradeModal;
