import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target, Clock, AlertCircle } from 'lucide-react';
import { useTradingSymbol } from '../../contexts/TradingSymbolContext';
import AccountSelector from './AccountSelector';
import { CompactSymbolPicker } from './SymbolPicker';
import { SymbolAvailabilityBadge } from './SymbolMappingIndicator';

const TradingPanel = ({ 
  selectedSymbol, 
  onSymbolChange,
  accounts = [],
  selectedAccount,
  onAccountSelect,
  className = '' 
}) => {
  const { checkSymbolAvailability, updateSelectedSymbol } = useTradingSymbol();
  const [orderType, setOrderType] = useState('market');
  const [side, setSide] = useState('buy');
  const [volume, setVolume] = useState('0.01');
  const [price, setPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if selected symbol is available on selected account
  const symbolAvailability = selectedAccount && selectedSymbol 
    ? checkSymbolAvailability(selectedSymbol, [selectedAccount.id])
    : {};
  
  const isSymbolAvailable = symbolAvailability[selectedAccount?.id]?.available || false;
  const brokerSymbol = symbolAvailability[selectedAccount?.id]?.broker_symbol;

  const handleSymbolSelect = (symbol) => {
    onSymbolChange(symbol);
    updateSelectedSymbol(symbol);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAccount || !selectedSymbol || !isSymbolAvailable) {
      alert('Please select a valid account and symbol');
      return;
    }

    setLoading(true);
    try {
      // Simulate order placement
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Placing order:', {
        account: selectedAccount.id,
        symbol: selectedSymbol,
        brokerSymbol,
        side,
        volume,
        orderType,
        price: orderType === 'market' ? 'market' : price,
        stopLoss,
        takeProfit
      });

      alert(`Order placed successfully!\nSymbol: ${selectedSymbol}\nAccount: ${selectedAccount.account_name}\nSide: ${side.toUpperCase()}\nVolume: ${volume}`);
    } catch (error) {
      console.error('Failed to place order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getVolumeOptions = () => {
    return ['0.01', '0.1', '0.5', '1.0', '2.0', '5.0'];
  };

  const isFormValid = () => {
    return selectedAccount && 
           selectedSymbol && 
           isSymbolAvailable && 
           volume && 
           parseFloat(volume) > 0 &&
           (orderType === 'market' || (price && parseFloat(price) > 0));
  };

  return (
    <div className={`trading-panel bg-gray-900 border border-white rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Trading Panel</h2>
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-green-400" />
          <span className="text-sm text-gray-400">Live Trading</span>
        </div>
      </div>

      {/* Account Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Trading Account
        </label>
        <AccountSelector
          accounts={accounts}
          selectedAccount={selectedAccount}
          onAccountSelect={onAccountSelect}
          showSymbolStatus={true}
        />
      </div>

      {/* Symbol Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Trading Symbol
        </label>
        <CompactSymbolPicker
          selectedSymbol={selectedSymbol}
          onSymbolSelect={handleSymbolSelect}
          accounts={accounts}
        />
        
        {selectedSymbol && selectedAccount && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-gray-400">
              {selectedSymbol} → {brokerSymbol || 'Not mapped'}
            </span>
            <SymbolAvailabilityBadge 
              symbol={selectedSymbol} 
              accounts={[selectedAccount]} 
            />
          </div>
        )}

        {selectedSymbol && selectedAccount && !isSymbolAvailable && (
          <div className="mt-2 p-3 bg-red-900/20 border border-red-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-sm text-red-400">
                Symbol not available on selected account
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Order Configuration */}
      <div className="space-y-4 mb-6">
        {/* Order Type and Side */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Order Type
            </label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              className="w-full bg-gray-800 border border-white rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="market">Market Order</option>
              <option value="limit">Limit Order</option>
              <option value="stop">Stop Order</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Side
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setSide('buy')}
                className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                  side === 'buy'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-[#222222]'
                }`}
              >
                <TrendingUp className="h-4 w-4 inline mr-1" />
                Buy
              </button>
              <button
                onClick={() => setSide('sell')}
                className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                  side === 'sell'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-[#222222]'
                }`}
              >
                <TrendingDown className="h-4 w-4 inline mr-1" />
                Sell
              </button>
            </div>
          </div>
        </div>

        {/* Volume */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Volume (Lots)
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              step="0.01"
              min="0.01"
              className="flex-1 bg-gray-800 border border-white rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="0.01"
            />
            <div className="flex space-x-1">
              {getVolumeOptions().map((vol) => (
                <button
                  key={vol}
                  onClick={() => setVolume(vol)}
                  className={`px-2 py-2 text-xs rounded transition-colors ${
                    volume === vol
                      ? 'bg-gradient-to-r from-[#2F00FF] to-[#1C0099] text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-[#222222]'
                  }`}
                >
                  {vol}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Price (for non-market orders) */}
        {orderType !== 'market' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <DollarSign className="h-4 w-4 inline mr-1" />
              Price
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              step="0.00001"
              min="0"
              className="w-full bg-gray-800 border border-white rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="Enter price..."
            />
          </div>
        )}

        {/* Stop Loss and Take Profit */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Target className="h-4 w-4 inline mr-1" />
              Stop Loss
            </label>
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              step="0.00001"
              min="0"
              className="w-full bg-gray-800 border border-white rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Target className="h-4 w-4 inline mr-1" />
              Take Profit
            </label>
            <input
              type="number"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              step="0.00001"
              min="0"
              className="w-full bg-gray-800 border border-white rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="Optional"
            />
          </div>
        </div>
      </div>

      {/* Place Order Button */}
      <button
        onClick={handlePlaceOrder}
        disabled={!isFormValid() || loading}
        className={`w-full py-3 rounded-lg font-semibold transition-colors ${
          isFormValid() && !loading
            ? side === 'buy'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-[#222222] text-gray-400 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <Clock className="h-4 w-4 animate-spin mr-2" />
            Placing Order...
          </div>
        ) : (
          `${side === 'buy' ? 'Buy' : 'Sell'} ${selectedSymbol || 'Symbol'}`
        )}
      </button>

      {/* Order Summary */}
      {isFormValid() && (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-white">
          <h4 className="text-sm font-medium text-white mb-2">Order Summary</h4>
          <div className="space-y-1 text-xs text-gray-400">
            <div className="flex justify-between">
              <span>Symbol:</span>
              <span className="text-white">{selectedSymbol} ({brokerSymbol})</span>
            </div>
            <div className="flex justify-between">
              <span>Account:</span>
              <span className="text-white">{selectedAccount?.account_name}</span>
            </div>
            <div className="flex justify-between">
              <span>Side:</span>
              <span className={side === 'buy' ? 'text-green-400' : 'text-red-400'}>
                {side.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Volume:</span>
              <span className="text-white">{volume} lots</span>
            </div>
            <div className="flex justify-between">
              <span>Type:</span>
              <span className="text-white">{orderType.toUpperCase()}</span>
            </div>
            {orderType !== 'market' && price && (
              <div className="flex justify-between">
                <span>Price:</span>
                <span className="text-white">{price}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingPanel;
