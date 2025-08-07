import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  Scale,
  Users,
  DollarSign,
  Activity,
  Search,
  RefreshCw
} from 'lucide-react';
import { 
  placeTrade, 
  placePendingOrder, 
  placePairTrade, 
  placeMultiAccountTrade,
  getLivePrice 
} from '../../api/broker';
import PairTradingPanel from './PairTradingPanel';
import { 
  getSymbolPrice, 
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
    symbol: 'BTCUSD',
    trade_type: 'buy',
    volume: 0.01,
    stop_loss: '',
    take_profit: '',
    comment: '',
  });

  // Pending Order State
  const [pendingData, setPendingData] = useState({
    symbol: 'BTCUSD',
    order_type: 'buy_limit',
    volume: 0.01,
    price: '',
    stop_loss: '',
    take_profit: '',
    expiration: '',
    comment: '',
  });

  // Pair Trading State
  const [pairData, setPairData] = useState({
    symbol1: 'EURUSD',
    symbol2: 'GBPUSD',
    volume1: 0.01,
    volume2: 0.01,
    trade_type1: 'buy',
    trade_type2: 'sell',
    correlation_type: 'SIMPLE',
    stop_loss1: '',
    stop_loss2: '',
    take_profit1: '',
    take_profit2: '',
    correlation_threshold: 0.8,
    comment: '',
  });

  // Multi-Account Trading State
  const [multiAccountData, setMultiAccountData] = useState({
    symbol: 'BTCUSD',
    trade_type: 'buy',
    total_volume: 0.1,
    distribution_method: 'equal',
    selected_accounts: [],
    stop_loss: '',
    take_profit: '',
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
      console.log('Could not fetch live price:', error);
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

      const payload = {
        symbol: marketData.symbol,
        trade_type: marketData.trade_type,
        volume,
        stop_loss: stopLoss,
        take_profit: takeProfit,
        comment: marketData.comment,
      };

      const response = await placeTrade(selectedAccount.id, payload);
      
      if (response.success) {
        toast.success(`Market order placed: ${response.data.ticket || 'Success'}`);
        onClose();
      } else {
        throw new Error(response.error || 'Failed to place trade');
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

      const payload = {
        symbol: pendingData.symbol,
        order_type: pendingData.order_type,
        volume,
        price,
        stop_loss: stopLoss,
        take_profit: takeProfit,
        expiration: pendingData.expiration || null,
        comment: pendingData.comment,
      };

      const response = await placePendingOrder(selectedAccount.id, payload);
      
      if (response.success) {
        toast.success(`Pending order placed: ${response.data.ticket || 'Success'}`);
        onClose();
      } else {
        throw new Error(response.error || 'Failed to place pending order');
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
      const stopLoss1 = pairData.stop_loss1 ? parseFloat(pairData.stop_loss1) : null;
      const stopLoss2 = pairData.stop_loss2 ? parseFloat(pairData.stop_loss2) : null;
      const takeProfit1 = pairData.take_profit1 ? parseFloat(pairData.take_profit1) : null;
      const takeProfit2 = pairData.take_profit2 ? parseFloat(pairData.take_profit2) : null;

      if (isNaN(volume1) || volume1 <= 0 || isNaN(volume2) || volume2 <= 0) {
        throw new Error('Volumes must be greater than 0');
      }

      // Set trade directions based on the direction parameter
      let trade_type1, trade_type2;
      
      if (direction === 'BUY') {
        trade_type1 = 'buy';
        trade_type2 = 'sell';
      } else if (direction === 'SELL') {
        trade_type1 = 'sell';
        trade_type2 = 'buy';
      } else {
        // Fallback to data from state if no direction provided
        trade_type1 = pairData.trade_type1;
        trade_type2 = pairData.trade_type2;
        
        // Only require trade types for SIMPLE mode when no direction is provided
        if (pairData.correlation_type === 'SIMPLE' && (!trade_type1 || !trade_type2)) {
          throw new Error('Trade directions are required for Simple mode');
        }
      }

      const payload = {
        symbol1: pairData.symbol1,
        symbol2: pairData.symbol2,
        volume1,
        volume2,
        trade_type1,
        trade_type2,
        correlation_type: pairData.correlation_type,
        stop_loss1: stopLoss1,
        stop_loss2: stopLoss2,
        take_profit1: takeProfit1,
        take_profit2: takeProfit2,
        correlation_threshold: threshold,
        comment: pairData.comment,
      };

      const response = await placePairTrade(selectedAccount.id, payload);
      
      if (response.success) {
        toast.success(`Pair trade placed: ${response.message || 'Success'}`);
        
        // If we have correlation analysis, show it in a toast notification
        if (response.correlation_analysis) {
          const analysis = response.correlation_analysis;
          toast.success(
            <div>
              <p><strong>Statistical Analysis:</strong></p>
              <p>Correlation: {analysis.correlation?.toFixed(2)}</p>
              <p>Z-Score: {analysis.z_score?.toFixed(2)}</p>
              <p>{analysis.recommendation}</p>
            </div>,
            { duration: 6000 }
          );
        }
        
        onClose();
      } else {
        throw new Error(response.error || 'Failed to place pair trade');
      }
    } catch (error) {
      setError(error.message || 'Failed to place pair trade. Please try again.');
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMultiAccountTrade = async () => {
    if (multiAccountData.selected_accounts.length === 0) {
      setError('Please select at least one account for multi-account trading');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const totalVolume = parseFloat(multiAccountData.total_volume);
      const stopLoss = multiAccountData.stop_loss ? parseFloat(multiAccountData.stop_loss) : null;
      const takeProfit = multiAccountData.take_profit ? parseFloat(multiAccountData.take_profit) : null;

      if (isNaN(totalVolume) || totalVolume <= 0) {
        throw new Error('Total volume must be greater than 0');
      }

      const payload = {
        symbol: multiAccountData.symbol,
        trade_type: multiAccountData.trade_type,
        total_volume: totalVolume,
        account_ids: multiAccountData.selected_accounts,
        distribution_method: multiAccountData.distribution_method,
        stop_loss: stopLoss,
        take_profit: takeProfit,
        comment: multiAccountData.comment,
      };

      const response = await placeMultiAccountTrade(payload);
      
      if (response.success) {
        toast.success(`Multi-account trade placed: ${response.data.successful_trades || 0} accounts executed`);
        onClose();
      } else {
        throw new Error(response.error || 'Failed to place multi-account trade');
      }
    } catch (error) {
      setError(error.message || 'Failed to place multi-account trade. Please try again.');
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: 'market', label: 'Market Order', icon: TrendingUp },
    { id: 'pending', label: 'Pending Order', icon: Clock },
    { id: 'pair', label: 'Pair Trading', icon: Scale },
    { id: 'multi', label: 'Multi-Account', icon: Users },
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
          
          {activeTab === 'multi' && (
            <MultiAccountPanel 
              data={multiAccountData}
              setData={setMultiAccountData}
              accounts={accounts}
              onSubmit={handleMultiAccountTrade}
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
                onClick={() => updateData('trade_type', 'buy')}
                className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                  data.trade_type === 'buy'
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'border-[#444] text-gray-300 hover:border-green-600'
                }`}
              >
                <TrendingUp className="w-4 h-4 mx-auto mb-1" />
                Buy
              </button>
              <button
                onClick={() => updateData('trade_type', 'sell')}
                className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                  data.trade_type === 'sell'
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
    { value: 'buy_limit', label: 'Buy Limit', color: 'text-green-400' },
    { value: 'sell_limit', label: 'Sell Limit', color: 'text-red-400' },
    { value: 'buy_stop', label: 'Buy Stop', color: 'text-green-400' },
    { value: 'sell_stop', label: 'Sell Stop', color: 'text-red-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-[#222] border border-[#333] rounded-lg p-4">
        <h4 className="text-white font-medium mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Pending Order
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

// Multi-Account Panel Component
const MultiAccountPanel = ({ data, setData, accounts, onSubmit, submitting }) => {
  const [showSymbolModal, setShowSymbolModal] = useState(false);
  
  const updateData = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const toggleAccount = (accountId) => {
    updateData('selected_accounts', 
      data.selected_accounts.includes(accountId)
        ? data.selected_accounts.filter(id => id !== accountId)
        : [...data.selected_accounts, accountId]
    );
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
          <Users className="w-4 h-4" />
          Multi-Account Trading
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Trade Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => updateData('trade_type', 'buy')}
                className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                  data.trade_type === 'buy'
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'border-[#444] text-gray-300 hover:border-green-600'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => updateData('trade_type', 'sell')}
                className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                  data.trade_type === 'sell'
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'border-[#444] text-gray-300 hover:border-red-600'
                }`}
              >
                Sell
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Total Volume</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={data.total_volume}
              onChange={(e) => updateData('total_volume', e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Distribution Method</label>
            <select
              value={data.distribution_method}
              onChange={(e) => updateData('distribution_method', e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            >
              <option value="equal">Equal Distribution</option>
              <option value="proportional">Proportional to Balance</option>
              <option value="risk_based">Risk-Based Distribution</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Accounts ({data.selected_accounts.length} selected)
          </label>
          <div className="bg-[#1A1A1A] border border-[#444] rounded-lg p-3 max-h-40 overflow-y-auto">
            {accounts && accounts.length > 0 ? accounts.map((account) => (
              <div key={account.id} className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  checked={data.selected_accounts.includes(account.id)}
                  onChange={() => toggleAccount(account.id)}
                  className="w-4 h-4 text-blue-600 bg-[#222] border-[#555] rounded"
                />
                <span className="text-white flex-1">
                  {account.accountName || account.broker_name || 'Account'}
                  {account.login ? ` - ${account.login}` : ''}
                  {account.is_demo ? ' (Demo)' : ''}
                </span>
                <span className="text-gray-400 text-sm">
                  ${account.balance?.toFixed(2) || '0.00'}
                </span>
              </div>
            )) : (
              <div className="text-gray-400 text-center py-4">No accounts available</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
          disabled={submitting || data.selected_accounts.length === 0}
          className={`w-full mt-6 py-3 px-4 bg-gradient-to-r from-[#2F00FF] to-[#1C0099] hover:bg-blue-700 text-white rounded-lg font-medium transition-colors ${
            submitting || data.selected_accounts.length === 0 ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {submitting ? 'Placing Multi-Account Trade...' : `Place Trade on ${data.selected_accounts.length} Accounts`}
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
      console.error('Error loading popular symbols:', error);
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
      console.error('Error searching symbols:', error);
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
