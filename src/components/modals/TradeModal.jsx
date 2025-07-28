import React, { useState } from 'react';
import FormField from '../UI/FormField';

const TradeModal = ({ isOpen, onClose, accounts, selectedAccount, onAccountSelect, onPlaceTrade }) => {
  const [formData, setFormData] = useState({
    symbol: '',
    type: 'market',
    trade_type: 'buy',
    volume: 0.01,
    stop_loss: null,
    take_profit: null,
    comment: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedAccount) {
      setError('Please select an account to trade with');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      // Validate inputs
      const volume = parseFloat(formData.volume);
      const stopLoss = formData.stop_loss ? parseFloat(formData.stop_loss) : null;
      const takeProfit = formData.take_profit ? parseFloat(formData.take_profit) : null;

      if (isNaN(volume) || volume <= 0) {
        throw new Error('Volume must be greater than 0');
      }

      const payload = {
        symbol: formData.symbol,
        trade_type: formData.trade_type,
        volume,
        stop_loss: stopLoss,
        take_profit: takeProfit,
        comment: formData.comment,
      };

      await onPlaceTrade(selectedAccount.id, payload);
      onClose();
    } catch (error) {
      console.error('Error placing trade:', error);
      setError(error.message || 'Failed to place trade. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">Place Trade</h3>
          <button 
            className="text-gray-400 hover:text-white" 
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Select Trading Account
            </label>
            <select 
              className="w-full bg-[#222222] border border-[#333333] rounded-lg px-3 py-2 text-gray-300"
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
                  {account.accountName || account.broker_name || 'Account'} {account.login ? `- ${account.login}` : ''}
                </option>
              )) : (
                <option value="" disabled>No accounts available</option>
              )}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Symbol
            </label>
            <input
              type="text"
              name="symbol"
              value={formData.symbol}
              onChange={handleInputChange}
              placeholder="e.g. BTC/USD"
              className="w-full bg-[#222222] border border-[#333333] rounded-lg px-3 py-2 text-gray-300 placeholder-gray-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Type
              </label>
              <div className="flex items-center space-x-4">
                <label className="inline-flex items-center">
                  <input 
                    type="radio" 
                    name="trade_type" 
                    value="buy" 
                    checked={formData.trade_type === "buy"}
                    onChange={handleInputChange}
                    className="text-blue-600" 
                  />
                  <span className="ml-2 text-white">Buy</span>
                </label>
                <label className="inline-flex items-center">
                  <input 
                    type="radio" 
                    name="trade_type" 
                    value="sell" 
                    checked={formData.trade_type === "sell"}
                    onChange={handleInputChange}
                    className="text-red-600" 
                  />
                  <span className="ml-2 text-white">Sell</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Volume
              </label>
              <input
                type="number"
                name="volume"
                value={formData.volume}
                onChange={handleInputChange}
                min="0.01"
                step="0.01"
                className="w-full bg-[#222222] border border-[#333333] rounded-lg px-3 py-2 text-gray-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <FormField
              label="Stop Loss"
              name="stop_loss"
              type="number"
              value={formData.stop_loss || ''}
              onChange={handleInputChange}
              placeholder="Optional"
            />
            <FormField
              label="Take Profit"
              name="take_profit"
              type="number"
              value={formData.take_profit || ''}
              onChange={handleInputChange}
              placeholder="Optional"
            />
          </div>

          

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors ${
                submitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? 'Placing...' : 'Confirm Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TradeModal;
