import React, { useState, useEffect } from 'react';
import { X, Settings, TrendingUp, TrendingDown } from 'lucide-react';

const PairTradeModifyModal = ({ isOpen, onClose, pairTrade, onModify }) => {
  const [modifyValues, setModifyValues] = useState({
    stopLoss: '',
    takeProfit: ''
  });
  const [loading, setLoading] = useState(false);

  // Initialize form values when pairTrade changes
  useEffect(() => {
    if (pairTrade && isOpen) {
      setModifyValues({
        stopLoss: pairTrade.stop_loss || '',
        takeProfit: pairTrade.take_profit || ''
      });
    }
  }, [pairTrade, isOpen]);

  if (!isOpen || !pairTrade) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Prepare modification data
      const modifications = {
        stopLoss: modifyValues.stopLoss === '' ? null : parseFloat(modifyValues.stopLoss),
        takeProfit: modifyValues.takeProfit === '' ? null : parseFloat(modifyValues.takeProfit),
        price: null,
        options: {
          comment: 'Modified pair trade from Trade Management'
        }
      };
      
      await onModify(pairTrade, modifications);
      onClose();
    } catch (error) {
      console.error('Error modifying pair trade:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#2A2A2A] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-600/20 text-purple-400">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Modify Pair Trade</h2>
              <p className="text-gray-400">{pairTrade.asset}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Pair Trade Info */}
            <div className="mb-6 p-4 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Type</label>
                  <p className="text-white font-medium">Pair Trade</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Quantity</label>
                  <p className="text-white">{pairTrade.quantity}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Entry</label>
                  <p className="text-white font-mono">{pairTrade.opening}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">P/L</label>
                  <p className={`font-medium ${pairTrade.trade_pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pairTrade.trade_pl >= 0 ? '+' : ''}{pairTrade.trade_pl?.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Individual Legs Info */}
            {pairTrade.legs && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">Individual Legs</h3>
                <div className="space-y-3">
                  {pairTrade.legs.map((leg, index) => (
                    <div key={index} className="p-3 bg-[#222] border border-[#333] rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{leg.symbol}</span>
                        <div className="flex items-center gap-1">
                          {leg.type?.toLowerCase().includes('buy') ? (
                            <TrendingUp className="w-4 h-4 text-green-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                          )}
                          <span className={leg.type?.toLowerCase().includes('buy') ? 'text-green-400' : 'text-red-400'}>
                            {leg.type}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <label className="text-gray-400">Volume:</label>
                          <span className="text-white ml-1">{leg.volume || leg.quantity}</span>
                        </div>
                        <div>
                          <label className="text-gray-400">Entry:</label>
                          <span className="text-white font-mono ml-1">{leg.opening?.toFixed(5)}</span>
                        </div>
                        <div>
                          <label className="text-gray-400">P/L:</label>
                          <span className={`ml-1 ${leg.trade_pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {leg.trade_pl >= 0 ? '+' : ''}{leg.trade_pl?.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modification Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Stop Loss
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={modifyValues.stopLoss}
                  onChange={(e) => setModifyValues(prev => ({
                    ...prev,
                    stopLoss: e.target.value
                  }))}
                  className="w-full px-3 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-md text-white focus:outline-none focus:border-purple-500"
                  placeholder="Enter stop loss price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Take Profit
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={modifyValues.takeProfit}
                  onChange={(e) => setModifyValues(prev => ({
                    ...prev,
                    takeProfit: e.target.value
                  }))}
                  className="w-full px-3 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-md text-white focus:outline-none focus:border-purple-500"
                  placeholder="Enter take profit price"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[#2A2A2A] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#333] hover:bg-[#444] text-white rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
              disabled={loading}
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              Apply Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PairTradeModifyModal;