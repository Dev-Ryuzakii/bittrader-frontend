import React from 'react';
import { X, TrendingUp, TrendingDown, BarChart3, Clock, CheckCircle, XCircle, Activity } from 'lucide-react';

const PairTradeResultsModal = ({ isOpen, onClose, results }) => {
  if (!isOpen || !results) return null;

  const { 
    success, 
    message, 
    spread_symbol, 
    current_spread, 
    symbol1_result, 
    symbol2_result, 
    spread_analysis 
  } = results;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#2A2A2A] flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${success ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
              {success ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Pair Trade Results</h2>
              <p className="text-gray-400">{spread_symbol || 'Pair Trading'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Status Message */}
          <div className={`mb-6 p-4 rounded-lg border ${
            success 
              ? 'bg-green-600/10 border-green-600/30 text-green-400'
              : 'bg-red-600/10 border-red-600/30 text-red-400'
          }`}>
            <p className="font-medium">{message}</p>
          </div>

          {/* Current Spread Info */}
          {current_spread !== null && current_spread !== undefined && (
            <div className="mb-6 p-4 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg">
              <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Current Spread Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Spread Symbol</label>
                  <p className="text-white font-mono text-lg">{spread_symbol}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Current Spread Value</label>
                  <p className={`font-mono text-lg ${current_spread >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {current_spread?.toFixed(5)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Individual Trade Results */}
          {(symbol1_result || symbol2_result) && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Individual Trade Results
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Symbol 1 Result */}
                {symbol1_result && (
                  <div className={`p-4 rounded-lg border ${
                    symbol1_result.success 
                      ? 'bg-green-600/10 border-green-600/30'
                      : 'bg-red-600/10 border-red-600/30'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      {symbol1_result.success ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <h4 className="font-medium text-white">Symbol 1</h4>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-300">{symbol1_result.message}</p>
                      
                      {symbol1_result.details && (
                        <div className="mt-3 space-y-1">
                          {symbol1_result.details.symbol && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Symbol:</span>
                              <span className="text-white font-mono">{symbol1_result.details.symbol}</span>
                            </div>
                          )}
                          {symbol1_result.details.volume && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Volume:</span>
                              <span className="text-white">{symbol1_result.details.volume}</span>
                            </div>
                          )}
                          {symbol1_result.details.open_price && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Price:</span>
                              <span className="text-white font-mono">{symbol1_result.details.open_price}</span>
                            </div>
                          )}
                          {symbol1_result.order_id && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Order ID:</span>
                              <span className="text-white font-mono text-xs">{symbol1_result.order_id}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Symbol 2 Result */}
                {symbol2_result && (
                  <div className={`p-4 rounded-lg border ${
                    symbol2_result.success 
                      ? 'bg-green-600/10 border-green-600/30'
                      : 'bg-red-600/10 border-red-600/30'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      {symbol2_result.success ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                      <h4 className="font-medium text-white">Symbol 2</h4>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-300">{symbol2_result.message}</p>
                      
                      {symbol2_result.details && (
                        <div className="mt-3 space-y-1">
                          {symbol2_result.details.symbol && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Symbol:</span>
                              <span className="text-white font-mono">{symbol2_result.details.symbol}</span>
                            </div>
                          )}
                          {symbol2_result.details.volume && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Volume:</span>
                              <span className="text-white">{symbol2_result.details.volume}</span>
                            </div>
                          )}
                          {symbol2_result.details.open_price && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Price:</span>
                              <span className="text-white font-mono">{symbol2_result.details.open_price}</span>
                            </div>
                          )}
                          {symbol2_result.order_id && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Order ID:</span>
                              <span className="text-white font-mono text-xs">{symbol2_result.order_id}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Spread Analysis */}
          {spread_analysis && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                Spread Analysis
              </h3>
              
              <div className="bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Current Spread Details */}
                  {spread_analysis.current_spread !== undefined && (
                    <div>
                      <label className="text-sm text-gray-400">Current Spread</label>
                      <p className={`font-mono text-lg ${spread_analysis.current_spread >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {spread_analysis.current_spread?.toFixed(5)}
                      </p>
                    </div>
                  )}

                  {/* Statistical Metrics */}
                  {spread_analysis.correlation_coefficient !== undefined && (
                    <div>
                      <label className="text-sm text-gray-400">Correlation</label>
                      <p className="text-white font-mono">{spread_analysis.correlation_coefficient?.toFixed(3)}</p>
                    </div>
                  )}

                  {spread_analysis.z_score !== undefined && (
                    <div>
                      <label className="text-sm text-gray-400">Z-Score</label>
                      <p className={`font-mono ${Math.abs(spread_analysis.z_score) > 2 ? 'text-yellow-400' : 'text-white'}`}>
                        {spread_analysis.z_score?.toFixed(2)}
                      </p>
                    </div>
                  )}

                  {spread_analysis.hedge_ratio !== undefined && (
                    <div>
                      <label className="text-sm text-gray-400">Hedge Ratio</label>
                      <p className="text-white font-mono">{spread_analysis.hedge_ratio?.toFixed(3)}</p>
                    </div>
                  )}

                  {spread_analysis.signal_strength && (
                    <div>
                      <label className="text-sm text-gray-400">Signal Strength</label>
                      <p className={`font-medium ${
                        spread_analysis.signal_strength.includes('STRONG') ? 'text-green-400' :
                        spread_analysis.signal_strength.includes('WEAK') ? 'text-yellow-400' : 'text-white'
                      }`}>
                        {spread_analysis.signal_strength}
                      </p>
                    </div>
                  )}

                  {spread_analysis.statistical_confidence !== undefined && (
                    <div>
                      <label className="text-sm text-gray-400">Confidence</label>
                      <p className="text-white font-mono">{(spread_analysis.statistical_confidence * 100)?.toFixed(1)}%</p>
                    </div>
                  )}

                  {/* Trade Direction Info */}
                  {spread_analysis.trade_direction && (
                    <div className="md:col-span-2">
                      <label className="text-sm text-gray-400">Trade Direction</label>
                      <p className={`font-medium ${spread_analysis.trade_direction === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                        {spread_analysis.trade_direction} Spread
                      </p>
                    </div>
                  )}

                  {/* Individual Trades Info */}
                  {spread_analysis.individual_trades && (
                    <div className="md:col-span-3">
                      <label className="text-sm text-gray-400 block mb-2">Individual Trades</label>
                      <div className="flex gap-4 text-sm">
                        {spread_analysis.individual_trades.symbol1 && (
                          <span className="text-white">
                            Symbol1: <span className={`font-medium ${
                              spread_analysis.individual_trades.symbol1.action === 'BUY' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {spread_analysis.individual_trades.symbol1.action}
                            </span> {spread_analysis.individual_trades.symbol1.volume}
                          </span>
                        )}
                        {spread_analysis.individual_trades.symbol2 && (
                          <span className="text-white">
                            Symbol2: <span className={`font-medium ${
                              spread_analysis.individual_trades.symbol2.action === 'BUY' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {spread_analysis.individual_trades.symbol2.action}
                            </span> {spread_analysis.individual_trades.symbol2.volume}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Real-time monitoring notice */}
                <div className="mt-4 p-3 bg-[#1A2A1A] border border-[#2A4A2A] rounded text-sm">
                  <div className="flex items-center gap-2 text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Real-time spread monitoring enabled via WebSocket</span>
                  </div>
                  <p className="text-gray-400 mt-1">
                    Automatic SL/TP trigger detection and performance optimization active
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#333] hover:bg-[#444] text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PairTradeResultsModal;
