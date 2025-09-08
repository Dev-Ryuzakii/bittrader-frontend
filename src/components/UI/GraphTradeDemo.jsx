import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const GraphTradeDemo = () => {
  const [showOptions, setShowOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selected, setSelected] = useState({
    direction: 'BUY',
    amount: '0.1',
    takeProfit: '1.35400',
    stopLoss: '1.34800',
  });

  const handleDirectionChange = (direction) => {
    setSelected(prev => ({ ...prev, direction }));
    setShowOptions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Show loading state
    setIsSubmitting(true);
    
    // Show pending toast that will be updated based on result
    const toastId = toast.loading(
      `Processing ${selected.direction} order for ${selected.amount} lot(s) of GBPUSD...`,
      { position: 'top-center' }
    );
    
    try {
      // This is where you'd handle the trade submission
      console.log('Trade submitted:', selected);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate successful trade (or uncomment the error throw to test error handling)
      // throw new Error("API connection failed");
      
      // Calculate simulated trade details for the toast
      const entryPrice = selected.direction === 'BUY' ? '1.35100' : '1.35150';
      const symbol = 'GBPUSD';
      const profit = selected.direction === 'BUY' ? 
        ((parseFloat(selected.takeProfit) - parseFloat(entryPrice)) * 10000).toFixed(1) :
        ((parseFloat(entryPrice) - parseFloat(selected.takeProfit)) * 10000).toFixed(1);
      
      // Update the loading toast with success message
      toast.success(
        <div>
          <p className="font-bold">{selected.direction} Order Executed Successfully</p>
          <p>Symbol: {symbol}</p>
          <p>Amount: {selected.amount} lot(s)</p>
          <p>Entry: {entryPrice}</p>
          <p>Take Profit: {selected.takeProfit} (potential: {profit} pips)</p>
          <p>Stop Loss: {selected.stopLoss}</p>
        </div>,
        { id: toastId, duration: 5000 }
      );
      
      // Reset form or handle success
      console.log('Trade executed successfully');
    } catch (error) {
      console.error('Trade execution failed:', error);
      
      // Update the loading toast with error message
      toast.error(
        <div>
          <p className="font-bold">Trade Execution Failed</p>
          <p>{error.message || 'Unknown error occurred'}</p>
          <p>Please try again or contact support if this persists.</p>
        </div>,
        { id: toastId, duration: 4000 }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute right-10 top-32 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4 w-80 z-10">
      <h3 className="text-white text-lg font-bold mb-4">Execute Trade</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Direction selector with dropdown */}
        <div className="space-y-2">
          <label className="block text-gray-300 text-sm font-medium">Direction</label>
          <div className="relative">
            <button
              type="button"
              className={`w-full flex items-center justify-between px-4 py-2 border rounded-lg ${
                selected.direction === 'BUY'
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border-red-500/30'
              }`}
              onClick={() => setShowOptions(!showOptions)}
            >
              <span>
                {selected.direction}
              </span>
              <ChevronDown size={16} />
            </button>
            
            {showOptions && (
              <div className="absolute mt-1 w-full bg-[#222] border border-[#333] rounded-lg shadow-lg z-20">
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-green-400 hover:bg-[#2A2A2A]"
                  onClick={() => handleDirectionChange('BUY')}
                >
                  BUY
                </button>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-red-400 hover:bg-[#2A2A2A]"
                  onClick={() => handleDirectionChange('SELL')}
                >
                  SELL
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Amount */}
        <div className="space-y-2">
          <label className="block text-gray-300 text-sm font-medium">Amount (Lots)</label>
          <input
            type="number"
            value={selected.amount}
            onChange={(e) => setSelected(prev => ({ ...prev, amount: e.target.value }))}
            step="0.01"
            min="0.01"
            className="w-full bg-[#222] border border-[#333] rounded-lg px-4 py-2 text-white"
          />
        </div>
        
        {/* Take Profit */}
        <div className="space-y-2">
          <label className="block text-gray-300 text-sm font-medium">Take Profit</label>
          <input
            type="text"
            value={selected.takeProfit}
            onChange={(e) => setSelected(prev => ({ ...prev, takeProfit: e.target.value }))}
            className="w-full bg-[#222] border border-[#333] rounded-lg px-4 py-2 text-white"
          />
        </div>
        
        {/* Stop Loss */}
        <div className="space-y-2">
          <label className="block text-gray-300 text-sm font-medium">Stop Loss</label>
          <input
            type="text"
            value={selected.stopLoss}
            onChange={(e) => setSelected(prev => ({ ...prev, stopLoss: e.target.value }))}
            className="w-full bg-[#222] border border-[#333] rounded-lg px-4 py-2 text-white"
          />
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 rounded-lg font-medium transition-colors ${
            isSubmitting 
              ? 'bg-gray-600 cursor-not-allowed' 
              : selected.direction === 'BUY'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {isSubmitting 
            ? 'Processing...' 
            : selected.direction === 'BUY' 
              ? 'Buy GBPUSD' 
              : 'Sell GBPUSD'
          }
        </button>
      </form>
    </div>
  );
};

export default GraphTradeDemo;
