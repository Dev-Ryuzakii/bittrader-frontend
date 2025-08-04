import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Link2, 
  Users, 
  BarChart3,
  Target,
  Plus
} from 'lucide-react';
import { 
  placeTrade, 
  placePendingOrder, 
  placePairTrade, 
  placeMultiAccountTrade,
  getSymbolPrice 
} from '../../api/broker';

const AdvancedTradingPanel = ({ userAccounts = [] }) => {
  const [activeTab, setActiveTab] = useState('market');
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD');
  const [currentPrice, setCurrentPrice] = useState({ bid: 0, ask: 0 });
  const [loading, setLoading] = useState(false);
  
  // Market Order State
  const [marketOrder, setMarketOrder] = useState({
    trade_type: 'BUY',
    volume: 0.1,
    stop_loss: '',
    take_profit: '',
    comment: ''
  });
  
  // Pending Order State
  const [pendingOrder, setPendingOrder] = useState({
    order_type: 'BUY_LIMIT',
    volume: 0.1,
    price: '',
    stop_loss: '',
    take_profit: '',
    expiration: '',
    comment: ''
  });
  
  // Pair Trade State
  const [pairTrade, setPairTrade] = useState({
    symbol1: 'EURUSD',
    symbol2: 'GBPUSD',
    trade_type1: 'BUY',
    trade_type2: 'SELL',
    volume1: 0.1,
    volume2: 0.1,
    correlation_type: 'HEDGED',
    stop_loss1: '',
    stop_loss2: '',
    take_profit1: '',
    take_profit2: '',
    comment: ''
  });

  // Get real-time price
  useEffect(() => {
    if (selectedAccounts.length > 0 && selectedSymbol) {
      fetchPrice();
      const interval = setInterval(fetchPrice, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedAccounts, selectedSymbol]);

  const fetchPrice = async () => {
    if (selectedAccounts.length === 0) return;
    
    try {
      const response = await getSymbolPrice(selectedAccounts[0], selectedSymbol);
      if (response.success) {
        setCurrentPrice({ 
          bid: response.data.bid || 0, 
          ask: response.data.ask || 0 
        });
      }
    } catch (error) {
      console.error('Error fetching price:', error);
    }
  };

  // Execute Market Order
  const executeMarketOrder = async () => {
    if (selectedAccounts.length === 0) {
      toast.error('Please select at least one account');
      return;
    }

    setLoading(true);
    try {
      if (selectedAccounts.length > 1) {
        await executeMultiAccountTrade();
      } else {
        await executeSingleAccountTrade();
      }
    } finally {
      setLoading(false);
    }
  };

  const executeSingleAccountTrade = async () => {
    try {
      const response = await placeTrade(selectedAccounts[0], {
        symbol: selectedSymbol,
        ...marketOrder
      });

      if (response.success) {
        toast.success(`Trade executed: ${response.data.message || 'Success'}`);
      } else {
        toast.error(`Trade failed: ${response.error}`);
      }
    } catch (error) {
      toast.error('Failed to execute trade');
    }
  };

  const executeMultiAccountTrade = async () => {
    try {
      const response = await placeMultiAccountTrade({
        account_ids: selectedAccounts,
        symbol: selectedSymbol,
        ...marketOrder
      });

      if (response.success) {
        const data = response.data;
        toast.success(
          `Multi-account trade: ${data.successful_accounts || 0}/${selectedAccounts.length} accounts successful`
        );
        
        // Show individual results if available
        if (data.results) {
          data.results.forEach(account => {
            if (account.success) {
              toast.success(`✅ ${account.broker_name}: Trade executed`);
            } else {
              toast.error(`❌ ${account.broker_name}: ${account.error}`);
            }
          });
        }
      } else {
        toast.error(`Multi-account trade failed: ${response.error}`);
      }
    } catch (error) {
      toast.error('Failed to execute multi-account trade');
    }
  };

  // Execute Pending Order
  const executePendingOrder = async () => {
    if (selectedAccounts.length === 0) {
      toast.error('Please select an account');
      return;
    }

    if (selectedAccounts.length > 1) {
      toast.error('Pending orders can only be placed on one account at a time');
      return;
    }

    setLoading(true);
    try {
      const response = await placePendingOrder(selectedAccounts[0], {
        symbol: selectedSymbol,
        ...pendingOrder
      });

      if (response.success) {
        toast.success(`Pending order placed: ${response.data.message || 'Success'}`);
      } else {
        toast.error(`Order failed: ${response.error}`);
      }
    } catch (error) {
      toast.error('Failed to place pending order');
    } finally {
      setLoading(false);
    }
  };

  // Execute Pair Trade
  const executePairTrade = async () => {
    if (selectedAccounts.length === 0) {
      toast.error('Please select an account');
      return;
    }

    if (selectedAccounts.length > 1) {
      toast.error('Pair trades can only be placed on one account at a time');
      return;
    }

    setLoading(true);
    try {
      const response = await placePairTrade(selectedAccounts[0], pairTrade);

      if (response.success) {
        toast.success('Pair trade executed successfully!');
        const data = response.data;
        if (data.symbol1_result?.message) {
          toast.success(`Symbol 1: ${data.symbol1_result.message}`);
        }
        if (data.symbol2_result?.message) {
          toast.success(`Symbol 2: ${data.symbol2_result.message}`);
        }
      } else {
        toast.error('Pair trade failed');
        const data = response.data;
        if (data.symbol1_result && !data.symbol1_result.success) {
          toast.error(`Symbol1: ${data.symbol1_result.error}`);
        }
        if (data.symbol2_result && !data.symbol2_result.success) {
          toast.error(`Symbol2: ${data.symbol2_result.error}`);
        }
      }
    } catch (error) {
      toast.error('Failed to execute pair trade');
    } finally {
      setLoading(false);
    }
  };

  const availableSymbols = [
    'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 
    'USDCAD', 'NZDUSD', 'EURJPY', 'GBPJPY', 'EURGBP'
  ];

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Advanced Trading Panel
        </h2>
        <div className="text-sm text-gray-400">
          {userAccounts.length} account{userAccounts.length !== 1 ? 's' : ''} available
        </div>
      </div>

      {/* Account Selection */}
      <div className="bg-[#222] border border-[#333] rounded-lg p-4">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Select Trading Accounts:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {userAccounts.map(account => (
            <label key={account.id} className="flex items-center space-x-2 p-3 bg-[#1A1A1A] rounded-lg hover:bg-[#2A2A2A] transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={selectedAccounts.includes(account.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedAccounts([...selectedAccounts, account.id]);
                  } else {
                    setSelectedAccounts(selectedAccounts.filter(id => id !== account.id));
                  }
                }}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">
                  {account.broker_name || account.accountName || 'Account'} - {account.login || 'N/A'}
                </div>
                <div className="text-xs text-gray-400">
                  {account.is_active ? '🟢 Active' : '🔴 Inactive'}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Symbol Selection */}
      <div className="bg-[#222] border border-[#333] rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <label className="block text-white font-medium mb-2">Trading Symbol:</label>
            <select 
              value={selectedSymbol} 
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-white"
            >
              {availableSymbols.map(symbol => (
                <option key={symbol} value={symbol}>
                  {symbol.replace('USD', '/USD').replace('EUR', 'EUR/').replace('GBP', 'GBP/')}
                </option>
              ))}
            </select>
          </div>
          
          {/* Real-time Price Display */}
          {currentPrice.bid > 0 && (
            <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Live Price</div>
              <div className="flex items-center gap-4 font-mono text-sm">
                <span className="text-red-400">Bid: {currentPrice.bid.toFixed(5)}</span>
                <span className="text-green-400">Ask: {currentPrice.ask.toFixed(5)}</span>
                <span className="text-gray-400">
                  Spread: {(currentPrice.ask - currentPrice.bid).toFixed(5)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trading Tabs */}
      <div className="flex bg-[#222] border border-[#333] rounded-lg p-1">
        <button 
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'market' 
              ? 'bg-green-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-[#333]'
          }`}
          onClick={() => setActiveTab('market')}
        >
          <TrendingUp className="w-4 h-4" />
          Market Orders
        </button>
        <button 
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'pending' 
              ? 'bg-yellow-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-[#333]'
          }`}
          onClick={() => setActiveTab('pending')}
        >
          <Clock className="w-4 h-4" />
          Pending Orders
        </button>
        <button 
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'pair' 
              ? 'bg-purple-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-[#333]'
          }`}
          onClick={() => setActiveTab('pair')}
        >
          <Link2 className="w-4 h-4" />
          Pair Trading
        </button>
      </div>

      {/* Market Orders Tab */}
      {activeTab === 'market' && (
        <div className="bg-[#222] border border-[#333] rounded-lg p-4">
          <h4 className="text-white font-medium mb-4 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Market Order
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Direction:</label>
                <div className="flex gap-2">
                  <button
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      marketOrder.trade_type === 'BUY'
                        ? 'bg-green-600 text-white'
                        : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#333]'
                    }`}
                    onClick={() => setMarketOrder({...marketOrder, trade_type: 'BUY'})}
                  >
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    Buy
                  </button>
                  <button
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      marketOrder.trade_type === 'SELL'
                        ? 'bg-red-600 text-white'
                        : 'bg-[#1A1A1A] text-gray-400 hover:bg-[#333]'
                    }`}
                    onClick={() => setMarketOrder({...marketOrder, trade_type: 'SELL'})}
                  >
                    <TrendingDown className="w-4 h-4 inline mr-1" />
                    Sell
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Volume (lots):</label>
                <input
                  type="number"
                  step="0.01"
                  value={marketOrder.volume}
                  onChange={(e) => setMarketOrder({...marketOrder, volume: parseFloat(e.target.value)})}
                  className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Stop Loss:</label>
                <input
                  type="number"
                  step="0.00001"
                  placeholder="Optional"
                  value={marketOrder.stop_loss}
                  onChange={(e) => setMarketOrder({...marketOrder, stop_loss: e.target.value})}
                  className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Take Profit:</label>
                <input
                  type="number"
                  step="0.00001"
                  placeholder="Optional"
                  value={marketOrder.take_profit}
                  onChange={(e) => setMarketOrder({...marketOrder, take_profit: e.target.value})}
                  className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Comment:</label>
              <input
                type="text"
                placeholder="Optional comment"
                value={marketOrder.comment}
                onChange={(e) => setMarketOrder({...marketOrder, comment: e.target.value})}
                className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-white placeholder-gray-500"
              />
            </div>
            
            <button 
              className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                selectedAccounts.length === 0 || loading
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              onClick={executeMarketOrder}
              disabled={selectedAccounts.length === 0 || loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  {selectedAccounts.length > 1 
                    ? `Execute on ${selectedAccounts.length} Accounts` 
                    : 'Execute Market Order'
                  }
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Pending Orders Tab */}
      {activeTab === 'pending' && (
        <div className="bg-[#222] border border-[#333] rounded-lg p-4">
          <h4 className="text-white font-medium mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending Order
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Order Type:</label>
                <select 
                  value={pendingOrder.order_type}
                  onChange={(e) => setPendingOrder({...pendingOrder, order_type: e.target.value})}
                  className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-white"
                >
                  <option value="BUY_LIMIT">Buy Limit</option>
                  <option value="SELL_LIMIT">Sell Limit</option>
                  <option value="BUY_STOP">Buy Stop</option>
                  <option value="SELL_STOP">Sell Stop</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Volume (lots):</label>
                <input
                  type="number"
                  step="0.01"
                  value={pendingOrder.volume}
                  onChange={(e) => setPendingOrder({...pendingOrder, volume: parseFloat(e.target.value)})}
                  className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Execution Price:</label>
                <input
                  type="number"
                  step="0.00001"
                  placeholder="Entry price"
                  value={pendingOrder.price}
                  onChange={(e) => setPendingOrder({...pendingOrder, price: e.target.value})}
                  className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Expiration:</label>
                <input
                  type="datetime-local"
                  value={pendingOrder.expiration}
                  onChange={(e) => setPendingOrder({...pendingOrder, expiration: e.target.value})}
                  className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Stop Loss:</label>
                <input
                  type="number"
                  step="0.00001"
                  placeholder="Optional"
                  value={pendingOrder.stop_loss}
                  onChange={(e) => setPendingOrder({...pendingOrder, stop_loss: e.target.value})}
                  className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Take Profit:</label>
                <input
                  type="number"
                  step="0.00001"
                  placeholder="Optional"
                  value={pendingOrder.take_profit}
                  onChange={(e) => setPendingOrder({...pendingOrder, take_profit: e.target.value})}
                  className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Comment:</label>
              <input
                type="text"
                placeholder="Optional comment"
                value={pendingOrder.comment}
                onChange={(e) => setPendingOrder({...pendingOrder, comment: e.target.value})}
                className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-white placeholder-gray-500"
              />
            </div>
            
            <button 
              className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                selectedAccounts.length !== 1 || !pendingOrder.price || loading
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-yellow-600 hover:bg-yellow-700 text-white'
              }`}
              onClick={executePendingOrder}
              disabled={selectedAccounts.length !== 1 || !pendingOrder.price || loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4" />
                  Place Pending Order
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Pair Trading Tab */}
      {activeTab === 'pair' && (
        <div className="bg-[#222] border border-[#333] rounded-lg p-4">
          <h4 className="text-white font-medium mb-4 flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Pair Trading
          </h4>
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Symbol 1 */}
              <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-4">
                <h5 className="text-white font-medium mb-3">Symbol 1</h5>
                <div className="space-y-3">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">Symbol:</label>
                    <select 
                      value={pairTrade.symbol1}
                      onChange={(e) => setPairTrade({...pairTrade, symbol1: e.target.value})}
                      className="w-full bg-[#222] border border-[#444] rounded-lg px-3 py-2 text-white"
                    >
                      {availableSymbols.map(symbol => (
                        <option key={symbol} value={symbol}>{symbol}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">Direction:</label>
                    <div className="flex gap-2">
                      <button
                        className={`flex-1 py-2 px-3 rounded text-sm ${
                          pairTrade.trade_type1 === 'BUY'
                            ? 'bg-green-600 text-white'
                            : 'bg-[#333] text-gray-400 hover:bg-[#444]'
                        }`}
                        onClick={() => setPairTrade({...pairTrade, trade_type1: 'BUY'})}
                      >
                        Buy
                      </button>
                      <button
                        className={`flex-1 py-2 px-3 rounded text-sm ${
                          pairTrade.trade_type1 === 'SELL'
                            ? 'bg-red-600 text-white'
                            : 'bg-[#333] text-gray-400 hover:bg-[#444]'
                        }`}
                        onClick={() => setPairTrade({...pairTrade, trade_type1: 'SELL'})}
                      >
                        Sell
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">Volume:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pairTrade.volume1}
                      onChange={(e) => setPairTrade({...pairTrade, volume1: parseFloat(e.target.value)})}
                      className="w-full bg-[#222] border border-[#444] rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">Stop Loss:</label>
                    <input
                      type="number"
                      step="0.00001"
                      placeholder="Optional"
                      value={pairTrade.stop_loss1}
                      onChange={(e) => setPairTrade({...pairTrade, stop_loss1: e.target.value})}
                      className="w-full bg-[#222] border border-[#444] rounded-lg px-3 py-2 text-white placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">Take Profit:</label>
                    <input
                      type="number"
                      step="0.00001"
                      placeholder="Optional"
                      value={pairTrade.take_profit1}
                      onChange={(e) => setPairTrade({...pairTrade, take_profit1: e.target.value})}
                      className="w-full bg-[#222] border border-[#444] rounded-lg px-3 py-2 text-white placeholder-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Symbol 2 */}
              <div className="bg-[#1A1A1A] border border-[#333] rounded-lg p-4">
                <h5 className="text-white font-medium mb-3">Symbol 2</h5>
                <div className="space-y-3">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">Symbol:</label>
                    <select 
                      value={pairTrade.symbol2}
                      onChange={(e) => setPairTrade({...pairTrade, symbol2: e.target.value})}
                      className="w-full bg-[#222] border border-[#444] rounded-lg px-3 py-2 text-white"
                    >
                      {availableSymbols.map(symbol => (
                        <option key={symbol} value={symbol}>{symbol}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">Direction:</label>
                    <div className="flex gap-2">
                      <button
                        className={`flex-1 py-2 px-3 rounded text-sm ${
                          pairTrade.trade_type2 === 'BUY'
                            ? 'bg-green-600 text-white'
                            : 'bg-[#333] text-gray-400 hover:bg-[#444]'
                        }`}
                        onClick={() => setPairTrade({...pairTrade, trade_type2: 'BUY'})}
                      >
                        Buy
                      </button>
                      <button
                        className={`flex-1 py-2 px-3 rounded text-sm ${
                          pairTrade.trade_type2 === 'SELL'
                            ? 'bg-red-600 text-white'
                            : 'bg-[#333] text-gray-400 hover:bg-[#444]'
                        }`}
                        onClick={() => setPairTrade({...pairTrade, trade_type2: 'SELL'})}
                      >
                        Sell
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">Volume:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={pairTrade.volume2}
                      onChange={(e) => setPairTrade({...pairTrade, volume2: parseFloat(e.target.value)})}
                      className="w-full bg-[#222] border border-[#444] rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">Stop Loss:</label>
                    <input
                      type="number"
                      step="0.00001"
                      placeholder="Optional"
                      value={pairTrade.stop_loss2}
                      onChange={(e) => setPairTrade({...pairTrade, stop_loss2: e.target.value})}
                      className="w-full bg-[#222] border border-[#444] rounded-lg px-3 py-2 text-white placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-1">Take Profit:</label>
                    <input
                      type="number"
                      step="0.00001"
                      placeholder="Optional"
                      value={pairTrade.take_profit2}
                      onChange={(e) => setPairTrade({...pairTrade, take_profit2: e.target.value})}
                      className="w-full bg-[#222] border border-[#444] rounded-lg px-3 py-2 text-white placeholder-gray-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Correlation Type:</label>
                <select 
                  value={pairTrade.correlation_type}
                  onChange={(e) => setPairTrade({...pairTrade, correlation_type: e.target.value})}
                  className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-white"
                >
                  <option value="HEDGED">Hedged (opposite directions)</option>
                  <option value="CORRELATED">Correlated (same direction)</option>
                  <option value="INVERSE">Inverse correlation</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Comment:</label>
                <input
                  type="text"
                  placeholder="Pair trading strategy notes"
                  value={pairTrade.comment}
                  onChange={(e) => setPairTrade({...pairTrade, comment: e.target.value})}
                  className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-3 py-2 text-white placeholder-gray-500"
                />
              </div>
            </div>
            
            <button 
              className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                selectedAccounts.length !== 1 || loading
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
              onClick={executePairTrade}
              disabled={selectedAccounts.length !== 1 || loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  Execute Pair Trade
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedTradingPanel;
