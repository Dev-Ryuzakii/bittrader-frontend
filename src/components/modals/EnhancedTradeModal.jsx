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
  Zap,
  Info
} from 'lucide-react';
import { 
  placeEATrade as placeTrade, 
  placeEAPendingOrder as placePendingOrder, 
  placeEAPairTrade as placePairTrade, 
  getEASymbolPrice as getSymbolPrice,
  isEAAccount
} from '../../api/ea';
import { 
  getPopularSymbols, 
  searchSymbols, 
  mockSearchSymbols, 
  formatSymbolsForPicker 
} from '../../utils/symbolpicker';
import EASymbolPicker from '../UI/EASymbolPicker';
import { CompactSymbolPicker } from '../UI/SymbolPicker';

/**
 * Enhanced Trade Modal with EA Symbol Autocomplete Support
 * Automatically detects EA accounts and uses the appropriate symbol picker
 */
const EnhancedTradeModal = ({ isOpen, onClose, accounts, selectedAccount, onAccountSelect, onPlaceTrade }) => {
  const [activeTab, setActiveTab] = useState('market');
  const [submitting, setSubmitting] = useState(false);
  const [livePrice, setLivePrice] = useState(null);
  const [error, setError] = useState('');
  const [symbolPickerOpen, setSymbolPickerOpen] = useState(false);

  // Determine if selected account is EA account
  const isSelectedAccountEA = selectedAccount && isEAAccount(selectedAccount);

  // Market Order State
  const [marketData, setMarketData] = useState({
    symbol: '',
    trade_type: 'BUY',
    volume: 0.1,
    stop_loss: '',
    take_profit: '',
    comment: '',
  });

  // Pending Order State
  const [pendingData, setPendingData] = useState({
    symbol: '',
    trade_type: 'BUY',
    order_type: 'BUY_LIMIT',
    volume: 0.01,
    price: '',
    stop_loss: '',
    take_profit: '',
    expiration: '',
    comment: '',
  });

  // Pair Trade State
  const [pairData, setPairData] = useState({
    symbol1: '',
    symbol2: '',
    volume1: 0.01,
    volume2: 0.01,
    trade_type1: 'BUY',
    trade_type2: 'SELL',
    stop_loss: '',
    take_profit: '',
    comment: 'Pair Trade',
  });

  // Symbol search state (for non-EA accounts)
  const [searchTerm, setSearchTerm] = useState('');
  const [symbols, setSymbols] = useState([]);
  const [popularSymbols, setPopularSymbols] = useState({});
  const [loading, setLoading] = useState(false);

  // Effect to clear form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError('');
      setLivePrice(null);
    }
  }, [isOpen]);

  // Effect to fetch price when symbol changes
  useEffect(() => {
    const symbol = getActiveSymbol();
    if (symbol && selectedAccount) {
      fetchLivePrice(symbol);
    }
  }, [marketData.symbol, pendingData.symbol, selectedAccount]);

  // Get the active symbol based on current tab
  const getActiveSymbol = () => {
    switch (activeTab) {
      case 'market':
        return marketData.symbol;
      case 'pending':
        return pendingData.symbol;
      case 'pair':
        return pairData.symbol1;
      default:
        return '';
    }
  };

  // Fetch live price for symbol
  const fetchLivePrice = async (symbol) => {
    if (!symbol || !selectedAccount) return;

    try {
      const accountId = selectedAccount.account_id || selectedAccount.id;
      
      if (isSelectedAccountEA) {
        // Use EA API for EA accounts
        const response = await getSymbolPrice(accountId, symbol);
        if (response.success && response.data) {
          setLivePrice({
            symbol: symbol,
            bid: response.data.bid,
            ask: response.data.ask,
            price: response.data.price,
            spread: response.data.spread
          });
        }
      } else {
        // Use regular broker API for non-EA accounts
        // This would be implemented based on your existing broker API
        console.log('Fetching price for non-EA account:', symbol);
      }
    } catch (error) {
      console.error('Error fetching live price:', error);
    }
  };

  // Handle symbol selection (unified for both EA and non-EA accounts)
  const handleSymbolSelect = (symbol) => {
    const data = {
      market: () => setMarketData(prev => ({ ...prev, symbol })),
      pending: () => setPendingData(prev => ({ ...prev, symbol })),
      pair: () => setPairData(prev => ({ ...prev, symbol1: symbol }))
    };
    
    if (data[activeTab]) {
      data[activeTab]();
    }
    
    setSymbolPickerOpen(false);
  };

  // Handle symbol selection for pair trade symbol 2
  const handlePairSymbol2Select = (symbol) => {
    setPairData(prev => ({ ...prev, symbol2: symbol }));
  };

  // Handle market order submission
  const handleMarketOrder = async () => {
    if (!selectedAccount) {
      setError('Please select an account to trade with');
      return;
    }

    if (!marketData.symbol) {
      setError('Please select a symbol to trade');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const accountId = selectedAccount.account_id || selectedAccount.id;
      const orderData = {
        symbol: marketData.symbol,
        trade_type: marketData.trade_type,
        volume: parseFloat(marketData.volume),
        stop_loss: marketData.stop_loss ? parseFloat(marketData.stop_loss) : null,
        take_profit: marketData.take_profit ? parseFloat(marketData.take_profit) : null,
        comment: marketData.comment || 'Market Order',
      };

      const result = await placeTrade(accountId, orderData);
      
      if (result.success) {
        toast.success(`${marketData.trade_type} order placed successfully!`);
        if (onPlaceTrade) onPlaceTrade(result);
        onClose();
      } else {
        setError(result.error || 'Failed to place market order');
        if (result.suggestions && result.suggestions.length > 0) {
          toast.error(result.suggestions.join(', '));
        }
      }
    } catch (error) {
      console.error('Error placing market order:', error);
      setError('Failed to place market order');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle pending order submission
  const handlePendingOrder = async () => {
    if (!selectedAccount) {
      setError('Please select an account to trade with');
      return;
    }

    if (!pendingData.symbol || !pendingData.price) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const accountId = selectedAccount.account_id || selectedAccount.id;
      const orderData = {
        symbol: pendingData.symbol,
        order_type: pendingData.order_type.toLowerCase(),
        volume: parseFloat(pendingData.volume),
        price: parseFloat(pendingData.price),
        stop_loss: pendingData.stop_loss ? parseFloat(pendingData.stop_loss) : null,
        take_profit: pendingData.take_profit ? parseFloat(pendingData.take_profit) : null,
        expiration: pendingData.expiration || null,
        comment: pendingData.comment || 'Pending Order',
      };

      const result = await placePendingOrder(accountId, orderData);
      
      if (result.success) {
        toast.success(`${pendingData.order_type} order placed successfully!`);
        if (onPlaceTrade) onPlaceTrade(result);
        onClose();
      } else {
        setError(result.error || 'Failed to place pending order');
      }
    } catch (error) {
      console.error('Error placing pending order:', error);
      setError('Failed to place pending order');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle pair trade submission
  const handlePairTrade = async () => {
    if (!selectedAccount) {
      setError('Please select an account to trade with');
      return;
    }

    if (!pairData.symbol1 || !pairData.symbol2) {
      setError('Please select both symbols for pair trading');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const accountId = selectedAccount.account_id || selectedAccount.id;
      const orderData = {
        symbol1: pairData.symbol1,
        symbol2: pairData.symbol2,
        volume1: parseFloat(pairData.volume1),
        volume2: parseFloat(pairData.volume2),
        trade_type1: pairData.trade_type1,
        trade_type2: pairData.trade_type2,
        stop_loss: pairData.stop_loss ? parseFloat(pairData.stop_loss) : null,
        take_profit: pairData.take_profit ? parseFloat(pairData.take_profit) : null,
        comment: pairData.comment || 'Pair Trade',
      };

      const result = await placePairTrade(accountId, orderData);
      
      if (result.success) {
        toast.success('Pair trade placed successfully!');
        if (onPlaceTrade) onPlaceTrade(result);
        onClose();
      } else {
        setError(result.error || 'Failed to place pair trade');
      }
    } catch (error) {
      console.error('Error placing pair trade:', error);
      setError('Failed to place pair trade');
    } finally {
      setSubmitting(false);
    }
  };

  // Render symbol selector based on account type
  const renderSymbolSelector = (value, onChange, placeholder = "Select symbol") => {
    if (isSelectedAccountEA) {
      // Use EA Symbol Picker for EA accounts
      return (
        <EASymbolPicker
          selectedSymbol={value}
          onSymbolChange={onChange}
          selectedAccount={selectedAccount}
          placeholder={placeholder}
          compact={true}
        />
      );
    } else {
      // Use regular symbol picker for non-EA accounts
      return (
        <CompactSymbolPicker
          selectedSymbol={value}
          onSymbolSelect={onChange}
          accounts={accounts}
        />
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#2A2A2A] flex justify-between items-center">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Place Trade
            {isSelectedAccountEA && (
              <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                EA
              </span>
            )}
          </h3>
          <button 
            className="text-gray-400 hover:text-white transition-colors" 
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Account Selection */}
        {selectedAccount && (
          <div className="p-4 border-b border-[#2A2A2A] bg-[#111]">
            <div className="text-xs text-gray-400 mb-1">Trading Account</div>
            <div className="text-white font-medium">
              {selectedAccount.name || `Account ${selectedAccount.account_id || selectedAccount.id}`}
            </div>
            {isSelectedAccountEA && (
              <div className="text-xs text-blue-400 mt-1">
                ✓ EA Connected - Advanced symbol search available
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-[#2A2A2A]">
          {[
            { id: 'market', label: 'Market', icon: Zap },
            { id: 'pending', label: 'Pending', icon: Clock },
            { id: 'pair', label: 'Pair Trade', icon: Link2 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
              <div className="flex items-center gap-2 text-red-300">
                <Info className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Market Order Tab */}
          {activeTab === 'market' && (
            <div className="space-y-4">
              {/* Symbol Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Symbol
                </label>
                {renderSymbolSelector(
                  marketData.symbol,
                  (symbol) => setMarketData(prev => ({ ...prev, symbol })),
                  "Select trading symbol"
                )}
              </div>

              {/* Live Price Display */}
              {livePrice && livePrice.symbol === marketData.symbol && (
                <div className="bg-[#222] rounded-lg p-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Live Price</span>
                    <span className="text-white">{livePrice.symbol}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <div className="text-center">
                      <div className="text-red-400 text-lg font-bold">{livePrice.bid}</div>
                      <div className="text-xs text-gray-400">Bid</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-400 text-lg font-bold">{livePrice.ask}</div>
                      <div className="text-xs text-gray-400">Ask</div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-400 text-lg font-bold">{livePrice.spread}</div>
                      <div className="text-xs text-gray-400">Spread</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Trade Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Trade Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['BUY', 'SELL'].map(type => (
                    <button
                      key={type}
                      onClick={() => setMarketData(prev => ({ ...prev, trade_type: type }))}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                        marketData.trade_type === type
                          ? (type === 'BUY' ? 'bg-green-600 text-white' : 'bg-red-600 text-white')
                          : 'bg-[#222] text-gray-400 hover:bg-[#333]'
                      }`}
                    >
                      {type === 'BUY' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Volume (Lots)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={marketData.volume}
                  onChange={(e) => setMarketData(prev => ({ ...prev, volume: e.target.value }))}
                  className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white"
                />
              </div>

              {/* Stop Loss & Take Profit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Stop Loss
                  </label>
                  <input
                    type="number"
                    step="0.00001"
                    value={marketData.stop_loss}
                    onChange={(e) => setMarketData(prev => ({ ...prev, stop_loss: e.target.value }))}
                    placeholder="Optional"
                    className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Take Profit
                  </label>
                  <input
                    type="number"
                    step="0.00001"
                    value={marketData.take_profit}
                    onChange={(e) => setMarketData(prev => ({ ...prev, take_profit: e.target.value }))}
                    placeholder="Optional"
                    className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Comment
                </label>
                <input
                  type="text"
                  value={marketData.comment}
                  onChange={(e) => setMarketData(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Optional comment"
                  className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleMarketOrder}
                disabled={submitting || !marketData.symbol || !selectedAccount}
                className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  marketData.trade_type === 'BUY'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {submitting ? 'Placing Order...' : `${marketData.trade_type} ${marketData.symbol || 'Market'}`}
              </button>
            </div>
          )}

          {/* Pending Order Tab */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              {/* Symbol Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Symbol
                </label>
                {renderSymbolSelector(
                  pendingData.symbol,
                  (symbol) => setPendingData(prev => ({ ...prev, symbol })),
                  "Select trading symbol"
                )}
              </div>

              {/* Order Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Order Type
                </label>
                <select
                  value={pendingData.order_type}
                  onChange={(e) => setPendingData(prev => ({ ...prev, order_type: e.target.value }))}
                  className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white"
                >
                  <option value="BUY_LIMIT">Buy Limit</option>
                  <option value="SELL_LIMIT">Sell Limit</option>
                  <option value="BUY_STOP">Buy Stop</option>
                  <option value="SELL_STOP">Sell Stop</option>
                </select>
              </div>

              {/* Price & Volume */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Price
                  </label>
                  <input
                    type="number"
                    step="0.00001"
                    value={pendingData.price}
                    onChange={(e) => setPendingData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Volume (Lots)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={pendingData.volume}
                    onChange={(e) => setPendingData(prev => ({ ...prev, volume: e.target.value }))}
                    className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Stop Loss & Take Profit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Stop Loss
                  </label>
                  <input
                    type="number"
                    step="0.00001"
                    value={pendingData.stop_loss}
                    onChange={(e) => setPendingData(prev => ({ ...prev, stop_loss: e.target.value }))}
                    placeholder="Optional"
                    className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Take Profit
                  </label>
                  <input
                    type="number"
                    step="0.00001"
                    value={pendingData.take_profit}
                    onChange={(e) => setPendingData(prev => ({ ...prev, take_profit: e.target.value }))}
                    placeholder="Optional"
                    className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handlePendingOrder}
                disabled={submitting || !pendingData.symbol || !pendingData.price || !selectedAccount}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
                {submitting ? 'Placing Order...' : 'Place Pending Order'}
              </button>
            </div>
          )}

          {/* Pair Trade Tab */}
          {activeTab === 'pair' && (
            <div className="space-y-4">
              {/* Symbol 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Symbol
                </label>
                {renderSymbolSelector(
                  pairData.symbol1,
                  (symbol) => setPairData(prev => ({ ...prev, symbol1: symbol })),
                  "Select first symbol"
                )}
              </div>

              {/* Symbol 2 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Second Symbol
                </label>
                {renderSymbolSelector(
                  pairData.symbol2,
                  (symbol) => setPairData(prev => ({ ...prev, symbol2: symbol })),
                  "Select second symbol"
                )}
              </div>

              {/* Trade Types & Volumes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {pairData.symbol1 || 'Symbol 1'} Action
                  </label>
                  <select
                    value={pairData.trade_type1}
                    onChange={(e) => setPairData(prev => ({ ...prev, trade_type1: e.target.value }))}
                    className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white"
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={pairData.volume1}
                    onChange={(e) => setPairData(prev => ({ ...prev, volume1: e.target.value }))}
                    placeholder="Volume"
                    className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white mt-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {pairData.symbol2 || 'Symbol 2'} Action
                  </label>
                  <select
                    value={pairData.trade_type2}
                    onChange={(e) => setPairData(prev => ({ ...prev, trade_type2: e.target.value }))}
                    className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white"
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={pairData.volume2}
                    onChange={(e) => setPairData(prev => ({ ...prev, volume2: e.target.value }))}
                    placeholder="Volume"
                    className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white mt-2"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handlePairTrade}
                disabled={submitting || !pairData.symbol1 || !pairData.symbol2 || !selectedAccount}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
                {submitting ? 'Placing Trade...' : 'Place Pair Trade'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2A2A2A] bg-[#111]">
          <div className="text-xs text-gray-500 text-center">
            {isSelectedAccountEA ? (
              <>✓ Using EA API for real-time symbol data and order execution</>
            ) : (
              <>Using standard broker API for symbol data and order execution</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTradeModal;
