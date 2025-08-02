import React, { useState, useEffect } from 'react';
import { symbolMappingService } from '../../api/symbolMapping';
import { Activity, DollarSign, TrendingUp, TrendingDown, AlertTriangle, Check } from 'lucide-react';

const TradingPanel = ({ accountId, selectedSymbol, onSymbolChange }) => {
  const [mappedSymbol, setMappedSymbol] = useState('');
  const [symbolAvailable, setSymbolAvailable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeType, setTradeType] = useState('BUY');

  useEffect(() => {
    if (selectedSymbol && accountId) {
      checkSymbolMapping();
    }
  }, [selectedSymbol, accountId]);

  const checkSymbolMapping = async () => {
    setLoading(true);
    try {
      const response = await symbolMappingService.mapSymbol(selectedSymbol, accountId);
      
      if (response.success) {
        setMappedSymbol(response.mapped_symbol);
        setSymbolAvailable(true);
      } else {
        setSymbolAvailable(false);
      }
    } catch (error) {
      console.error('Failed to check symbol mapping:', error);
      setSymbolAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  const handleTrade = () => {
    if (!symbolAvailable || !mappedSymbol) {
      alert('Symbol not available on this account');
      return;
    }

    // This would integrate with your trading API
    console.log('Execute trade:', {
      accountId,
      symbol: mappedSymbol,
      amount: tradeAmount,
      type: tradeType
    });
  };

  return (
    <div className="bg-[#1A1A1A] rounded-lg p-6 border border-[#2A2A2A]">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center">
        <Activity className="h-5 w-5 mr-2" />
        Trading Panel
      </h3>

      {/* Symbol Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-300">Selected Symbol:</label>
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          ) : symbolAvailable !== null && (
            symbolAvailable ? (
              <div className="flex items-center text-green-400">
                <Check className="h-4 w-4 mr-1" />
                <span className="text-sm">Available</span>
              </div>
            ) : (
              <div className="flex items-center text-red-400">
                <AlertTriangle className="h-4 w-4 mr-1" />
                <span className="text-sm">Not Available</span>
              </div>
            )
          )}
        </div>
        
        <div className="bg-[#2A2A2A] rounded-lg p-3 border border-[#333]">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-white font-mono">{selectedSymbol || 'No symbol selected'}</span>
              {mappedSymbol && mappedSymbol !== selectedSymbol && (
                <div className="text-sm text-gray-400 mt-1">
                  Mapped to: <span className="text-blue-400 font-mono">{mappedSymbol}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trade Controls */}
      <div className="space-y-4">
        {/* Trade Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Trade Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTradeType('BUY')}
              className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors ${
                tradeType === 'BUY'
                  ? 'bg-green-600 text-white'
                  : 'bg-[#2A2A2A] text-gray-400 border border-[#333] hover:bg-[#333]'
              }`}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              BUY
            </button>
            <button
              onClick={() => setTradeType('SELL')}
              className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-colors ${
                tradeType === 'SELL'
                  ? 'bg-red-600 text-white'
                  : 'bg-[#2A2A2A] text-gray-400 border border-[#333] hover:bg-[#333]'
              }`}
            >
              <TrendingDown className="h-4 w-4 mr-2" />
              SELL
            </button>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="number"
              value={tradeAmount}
              onChange={(e) => setTradeAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full pl-10 pr-4 py-2 bg-[#2A2A2A] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Execute Trade Button */}
        <button
          onClick={handleTrade}
          disabled={!symbolAvailable || !tradeAmount || loading}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
            !symbolAvailable || !tradeAmount || loading
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : tradeType === 'BUY'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <Activity className="h-4 w-4 mr-2" />
              Execute {tradeType}
            </>
          )}
        </button>
      </div>

      {/* Symbol Availability Warning */}
      {symbolAvailable === false && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium">Symbol Not Available</p>
              <p className="text-red-300 text-sm mt-1">
                The selected symbol "{selectedSymbol}" is not available on this account. 
                Please select a different symbol or check with your broker.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingPanel;
