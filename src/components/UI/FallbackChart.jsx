import React from 'react';

const FallbackChart = ({ onPlaceTrade, symbol = 'BTC/USD' }) => {
  return (
    <div className="relative w-full h-[500px] bg-[#1A1A1A]">
      {/* Simple price display */}
      <div className="absolute top-4 left-4 z-10">
        <div className="text-white font-medium">
          <span className="text-gray-400 mr-2">{symbol}:</span>
          <span className="text-green-400">$102.89 USD</span>
        </div>
      </div>

      {/* Place Trade Button */}
      <div className="absolute top-4 right-4 z-10">
        <button 
          onClick={onPlaceTrade}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          Place Trade
        </button>
      </div>

      {/* Static chart image with trading form */}
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-white mb-4">Chart Preview (Static)</p>
          <p className="text-sm text-gray-400 mb-8">Click "Place Trade" to execute a trade</p>
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 justify-center">
            <div className="bg-green-600/10 border border-green-600/20 text-green-400 px-8 py-4 rounded-lg">
              Buy: $102.89
            </div>
            <div className="bg-red-600/10 border border-red-600/20 text-red-400 px-8 py-4 rounded-lg">
              Sell: $102.79
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FallbackChart;
