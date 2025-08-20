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
  getSymbolPrice,
  getLivePrice,
  ORDER_TYPES,
  executeOrder,
  getOrderTypesForDropdown
} from '../../api/broker';
import { 
  getPopularSymbols, 
  searchSymbols, 
  mockSearchSymbols, 
  formatSymbolsForPicker 
} from '../../utils/symbolpicker';
import PairTradingPanel from './PairTradingPanel';

const TradeModal = ({ isOpen, onClose, accounts, selectedAccount, onAccountSelect, onPlaceTrade }) => {
  const [activeTab, setActiveTab] = useState('order');
  const [submitting, setSubmitting] = useState(false);
  const [livePrice, setLivePrice] = useState(null);
  const [error, setError] = useState('');

  // Unified Order State (replaces both market and pending states)
  const [orderData, setOrderData] = useState({
    symbol: '',
    orderType: 'MARKET_BUY',
    volume: 0.1,
    price: '', // Only used for pending orders
    stop_loss: '',
    take_profit: '',
    expiration: '', // Only used for pending orders
    comment: '',
  });

  // Pair Trading State (updated for new API structure)
  const [pairData, setPairData] = useState({
    symbol1: '',
    symbol2: 'GBPUSD',
    volume: '0.1',
    correlation_type: 'STATISTICAL',
    order_type: 'MARKET',
    entry_spread: '',
    spread_direction: 'NARROW',
    spread_stop_loss: '',
    spread_take_profit: '',
    expiration: '',
    trade_type: '',
    comment: '',
  });

  // Get order types for dropdown
  const orderTypes = getOrderTypesForDropdown();
  const currentOrderConfig = ORDER_TYPES[orderData.orderType];

  // Fetch live price when symbol changes
  useEffect(() => {
    if (isOpen && selectedAccount && orderData.symbol) {
      fetchLivePrice(orderData.symbol);
    }
  }, [isOpen, orderData.symbol, selectedAccount]);

  const fetchLivePrice = async (symbol) => {
    try {
      // Try to use the symbolpicker's getSymbolPrice function first
      if (selectedAccount) {
        const response = await getSymbolPrice(selectedAccount.id, symbol);
        if (response && response.success && response.data) {
          setLivePrice({
            bid: response.data.bid,
            ask: response.data.ask,
            spread: response.data.spread || (response.data.ask - response.data.bid),
            time: response.data.time
          });
          return;
        }
      }
      
      // Fall back to the broker API's getLivePrice if symbolpicker fails
      const response = await getLivePrice(symbol);
      if (response && response.success && response.data) {
        setLivePrice(response.data);
      }
    } catch (error) {
      //console.log('Could not fetch live price:', error);
      // Don't show error to user for price fetching failures
      // Just silently fail and don't display price
    }
  };

  if (!isOpen) return null;

  const handleUnifiedOrder = async () => {
    if (!selectedAccount) {
      setError('Please select an account to trade with');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const volume = parseFloat(orderData.volume);
      const stopLoss = orderData.stop_loss ? parseFloat(orderData.stop_loss) : null;
      const takeProfit = orderData.take_profit ? parseFloat(orderData.take_profit) : null;
      const price = orderData.price ? parseFloat(orderData.price) : null;

      if (isNaN(volume) || volume <= 0) {
        throw new Error('Volume must be greater than 0');
      }

      // Ensure minimum volume constraints
      if (volume < 0.01) {
        throw new Error('Volume must be at least 0.01 lots');
      }

      // Validate price for pending orders
      if (currentOrderConfig.requiresPrice && (!price || price <= 0)) {
        throw new Error('Price is required for pending orders');
      }

      // Create unified payload
      const payload = {
        symbol: orderData.symbol?.toString().trim().toUpperCase(),
        volume: Math.round(volume * 100) / 100,
        stop_loss: stopLoss && stopLoss > 0 ? Math.round(stopLoss * 100000) / 100000 : undefined,
        take_profit: takeProfit && takeProfit > 0 ? Math.round(takeProfit * 100000) / 100000 : undefined,
        comment: orderData.comment?.trim() || undefined,
      };

      // Add price for pending orders
      if (currentOrderConfig.requiresPrice) {
        payload.price = Math.round(price * 100000) / 100000;
      }

      // Add expiration for pending orders
      if (orderData.expiration && currentOrderConfig.requiresPrice) {
        payload.expiration = orderData.expiration;
      }

      //console.log('Sending unified order payload:', payload);

      const response = await executeOrder(selectedAccount.id, orderData.orderType, payload);
      
      //console.log('Order response:', response);
      
      if (response.success) {
        const orderTypeLabel = currentOrderConfig.label;
        const message = response.message || `${orderTypeLabel} placed successfully for ${payload.volume} ${payload.symbol}`;
        toast.success(message);
        
        // Show detailed order information
        if (response.order_id || response.position_id) {
          toast.success(
            <div className="text-sm">
              <p><strong>Order Details:</strong></p>
              <p>Type: {orderTypeLabel}</p>
              <p>Symbol: {payload.symbol}</p>
              <p>Volume: {payload.volume}</p>
              {response.order_id && <p>Order ID: {response.order_id}</p>}
              {response.position_id && <p>Position ID: {response.position_id}</p>}
              {currentOrderConfig.requiresPrice && <p>Entry Price: {payload.price}</p>}
            </div>,
            { duration: 6000 }
          );
        }
        
        // Wait for trade processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Call onPlaceTrade callback
        if (onPlaceTrade) {
          await onPlaceTrade(selectedAccount.id, payload);
        }
        
        onClose();
      } else {
        throw new Error(response.error || response.message || 'Failed to place order');
      }
    } catch (error) {
      setError(error.message || 'Failed to place order. Please try again.');
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
      const volume = parseFloat(pairData.volume) || 0.1;

      if (isNaN(volume) || volume <= 0) {
        throw new Error('Volume must be greater than 0');
      }

      // Build payload based on the new backend structure
      const payload = {
        symbol1: pairData.symbol1?.toUpperCase(),
        symbol2: pairData.symbol2?.toUpperCase(),
        volume: volume,
        correlation_type: pairData.correlation_type || 'STATISTICAL',
        order_type: pairData.order_type || 'MARKET',
      };

      // Add trade type for manual direction override (not needed for STATISTICAL)
      if (direction && direction !== 'STATISTICAL' && direction !== 'PENDING') {
        payload.trade_type = direction;
      }

      // Add spread-based risk management
      if (pairData.spread_stop_loss && parseFloat(pairData.spread_stop_loss) !== 0) {
        payload.spread_stop_loss = parseFloat(pairData.spread_stop_loss);
      }
      if (pairData.spread_take_profit && parseFloat(pairData.spread_take_profit) !== 0) {
        payload.spread_take_profit = parseFloat(pairData.spread_take_profit);
      }

      // Add pending order specific fields
      if (pairData.order_type === 'PENDING') {
        if (!pairData.entry_spread || parseFloat(pairData.entry_spread) === 0) {
          throw new Error('Entry spread is required for pending orders');
        }
        
        payload.entry_spread = parseFloat(pairData.entry_spread);
        payload.spread_direction = pairData.spread_direction || 'NARROW';
        
        if (pairData.expiration) {
          payload.expiration = new Date(pairData.expiration).toISOString();
        }
      }

      // Add comment if provided
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
          successMessage = `Pending spread order placed: Will execute when spread reaches ${payload.entry_spread}`;
        } else if (pairData.correlation_type === 'STATISTICAL') {
          successMessage = `Statistical pair trade executed: ${response.spread_symbol || `${payload.symbol1}-${payload.symbol2}`}`;
        }
        
        toast.success(successMessage);
        
        // Display spread analysis if available
        if (response.spread_analysis) {
          const analysis = response.spread_analysis;
          
          if (analysis.correlation_coefficient || analysis.z_score) {
            // Show detailed statistical analysis
            toast.success(
              <div className="text-sm">
                <p><strong>Statistical Analysis:</strong></p>
                {analysis.correlation_coefficient && (
                  <p>Correlation: {analysis.correlation_coefficient.toFixed(3)}</p>
                )}
                {analysis.z_score && (
                  <p>Z-Score: {analysis.z_score.toFixed(2)}</p>
                )}
                {analysis.signal_strength && (
                  <p>Signal: {analysis.signal_strength}</p>
                )}
                {analysis.hedge_ratio && (
                  <p>Hedge Ratio: {analysis.hedge_ratio.toFixed(3)}</p>
                )}
                {response.current_spread && (
                  <p>Current Spread: {response.current_spread.toFixed(5)}</p>
                )}
              </div>,
              { duration: 8000 }
            );
          } else if (pairData.order_type === 'PENDING') {
            // Show pending order details
            toast.info(
              <div className="text-sm">
                <p><strong>Pending Order Details:</strong></p>
                <p>Entry Spread: {payload.entry_spread}</p>
                <p>Direction: {payload.spread_direction}</p>
                {response.current_spread && (
                  <p>Current Spread: {response.current_spread.toFixed(5)}</p>
                )}
              </div>,
              { duration: 6000 }
            );
          }
        }

        // Show individual trade results
        if (response.symbol1_result && response.symbol2_result) {
          const sym1Result = response.symbol1_result;
          const sym2Result = response.symbol2_result;
          
          if (sym1Result.success && sym2Result.success) {
            toast.success(
              <div className="text-sm">
                <p><strong>Trade Results:</strong></p>
                {sym1Result.details && (
                  <p>{payload.symbol1}: {sym1Result.details.volume} lots @ {sym1Result.details.open_price}</p>
                )}
                {sym2Result.details && (
                  <p>{payload.symbol2}: {sym2Result.details.volume} lots @ {sym2Result.details.open_price}</p>
                )}
              </div>,
              { duration: 6000 }
            );
          }
        }
        
        // Reset form and close modal
        setPairData({
          symbol1: '',
          symbol2: '',
          volume: '0.1',
          correlation_type: 'STATISTICAL',
          order_type: 'MARKET',
          spread_stop_loss: '',
          spread_take_profit: '',
          entry_spread: '',
          spread_direction: 'NARROW',
          expiration: '',
          trade_type: '',
          comment: ''
        });
        onClose();
      } else {
        throw new Error(response.error || response.message || 'Failed to place pair trade');
      }
    } catch (error) {
      setError(error.message || 'Failed to place pair trade. Please try again.');
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: 'order', label: 'Trading Orders', icon: TrendingUp },
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
          {activeTab === 'order' && (
            <UnifiedOrderPanel 
              data={orderData}
              setData={setOrderData}
              orderTypes={orderTypes}
              currentOrderConfig={currentOrderConfig}
              livePrice={livePrice}
              onSubmit={handleUnifiedOrder}
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

// Unified Order Panel Component (replaces MarketOrderPanel and PendingOrderPanel)
const UnifiedOrderPanel = ({ data, setData, orderTypes, currentOrderConfig, livePrice, onSubmit, submitting }) => {
  const [showSymbolModal, setShowSymbolModal] = useState(false);
  
  const updateData = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const openSymbolSelector = () => {
    setShowSymbolModal(true);
  };

  const closeSymbolModal = () => {
    setShowSymbolModal(false);
  };

  const handleSymbolSelect = (symbol) => {
    updateData('symbol', symbol);
    setShowSymbolModal(false);
  };

  // Group order types by category for better UX
  const marketOrders = orderTypes.filter(type => type.category === 'MARKET');
  const pendingOrders = orderTypes.filter(type => type.category === 'PENDING');

  return (
    <div className="space-y-6">
      <div className="bg-[#222] border border-[#333] rounded-lg p-4">
        <h4 className="text-white font-medium mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          {currentOrderConfig?.label || 'Trading Order'}
          <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
            {currentOrderConfig?.type || 'ORDER'}
          </span>
        </h4>
        
        {/* Order Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Order Type</label>
          <select
            value={data.orderType}
            onChange={(e) => updateData('orderType', e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
          >
            <optgroup label="Market Orders (Immediate)">
              {marketOrders.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Pending Orders (Conditional)">
              {pendingOrders.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </optgroup>
          </select>
          {currentOrderConfig?.description && (
            <p className="text-xs text-gray-400 mt-1">{currentOrderConfig.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Symbol Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
            <div className="flex">
              <input
                type="text"
                value={data.symbol}
                onChange={(e) => updateData('symbol', e.target.value.toUpperCase())}
                placeholder="Symbol (e.g., GBPUSD)"
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
          
          {/* Volume */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Volume (Lots)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={data.volume}
              onChange={(e) => updateData('volume', e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>

        {/* Live Price Display */}
        {livePrice && (
          <div className="mt-4 bg-[#1A1A1A] border border-[#444] rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Live Price:</span>
              <div className="flex gap-4">
                <span className="text-red-400">Bid: {livePrice.bid?.toFixed(5)}</span>
                <span className="text-green-400">Ask: {livePrice.ask?.toFixed(5)}</span>
                <span className="text-gray-400">Spread: {((livePrice.ask - livePrice.bid) || 0).toFixed(5)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Price Field (only for pending orders) */}
        {currentOrderConfig?.requiresPrice && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Entry Price *
              <span className="text-xs text-gray-400 ml-1">(Required for pending orders)</span>
            </label>
            <input
              type="number"
              step="0.00001"
              value={data.price}
              onChange={(e) => updateData('price', e.target.value)}
              placeholder="0.00000"
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
              required
            />
          </div>
        )}

        {/* Stop Loss and Take Profit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Stop Loss 
              <span className="text-xs text-gray-400">(Optional)</span>
            </label>
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
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Take Profit 
              <span className="text-xs text-gray-400">(Optional)</span>
            </label>
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

        {/* Expiration (only for pending orders) */}
        {currentOrderConfig?.requiresPrice && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Expiration 
              <span className="text-xs text-gray-400">(Optional)</span>
            </label>
            <input
              type="datetime-local"
              value={data.expiration}
              onChange={(e) => updateData('expiration', e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            />
          </div>
        )}

        {/* Comment */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Comment 
            <span className="text-xs text-gray-400">(Optional)</span>
          </label>
          <input
            type="text"
            value={data.comment}
            onChange={(e) => updateData('comment', e.target.value)}
            placeholder="Order comment or note"
            className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={onSubmit}
          disabled={submitting || (currentOrderConfig?.requiresPrice && !data.price)}
          className={`w-full mt-6 py-3 px-4 rounded-lg font-medium transition-colors ${
            currentOrderConfig?.direction?.includes('BUY') || currentOrderConfig?.direction === 'BUY'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          } ${submitting || (currentOrderConfig?.requiresPrice && !data.price) ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {submitting ? (
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Placing Order...
            </div>
          ) : (
            `${currentOrderConfig?.type === 'MARKET' ? 'Execute' : 'Place'} ${currentOrderConfig?.label || 'Order'}`
          )}
        </button>

        {/* Order Summary */}
        <div className="mt-4 bg-[#1A1A1A] border border-[#444] rounded-lg p-3">
          <h5 className="text-sm font-medium text-gray-300 mb-2">Order Summary</h5>
          <div className="space-y-1 text-xs text-gray-400">
            <div className="flex justify-between">
              <span>Type:</span>
              <span className="text-white">{currentOrderConfig?.label}</span>
            </div>
            <div className="flex justify-between">
              <span>Symbol:</span>
              <span className="text-white">{data.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span>Volume:</span>
              <span className="text-white">{data.volume} lots</span>
            </div>
            {currentOrderConfig?.requiresPrice && data.price && (
              <div className="flex justify-between">
                <span>Entry Price:</span>
                <span className="text-white">{data.price}</span>
              </div>
            )}
            {data.stop_loss && (
              <div className="flex justify-between">
                <span>Stop Loss:</span>
                <span className="text-red-400">{data.stop_loss}</span>
              </div>
            )}
            {data.take_profit && (
              <div className="flex justify-between">
                <span>Take Profit:</span>
                <span className="text-green-400">{data.take_profit}</span>
              </div>
            )}
          </div>
        </div>
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
