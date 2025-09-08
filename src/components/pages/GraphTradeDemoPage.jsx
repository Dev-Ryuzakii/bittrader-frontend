import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import GraphTradeDemo from '../UI/GraphTradeDemo';

const GraphTradeDemoPage = () => {
  const [showTradePanel, setShowTradePanel] = useState(true);

  const toggleTradePanel = () => {
    setShowTradePanel(!showTradePanel);
    if (!showTradePanel) {
      toast.info('Trade panel opened', { 
        icon: '📊',
        style: {
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)',
          border: '1px solid #3b82f6',
          color: 'white',
        }
      });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#111] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Graph Trading Demo</h1>
          <p className="text-gray-400">
            This page demonstrates the trade execution flow with interactive toast notifications.
          </p>
        </div>

        <div className="bg-[#1A1A1A] border border-[#333] rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">GBPUSD Chart Simulation</h2>
            <button 
              onClick={toggleTradePanel} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              {showTradePanel ? 'Hide Trade Panel' : 'Show Trade Panel'}
            </button>
          </div>

          <div className="relative h-[500px] bg-[#0A0A0A] rounded-lg border border-[#222] overflow-hidden">
            {/* Simulated chart area - in a real app, this would be your chart component */}
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-500 text-sm">Chart simulation area - Price chart would render here</p>
            </div>

            {/* Chart overlay with price levels */}
            <div className="absolute inset-0">
              {/* Price levels */}
              <div className="absolute right-0 top-1/4 bg-[#333] bg-opacity-30 text-xs text-gray-300 px-2 py-1">
                1.35400 (TP)
              </div>
              <div className="absolute right-0 top-1/2 bg-[#333] bg-opacity-30 text-xs text-green-400 px-2 py-1">
                1.35100 (Current)
              </div>
              <div className="absolute right-0 top-3/4 bg-[#333] bg-opacity-30 text-xs text-gray-300 px-2 py-1">
                1.34800 (SL)
              </div>

              {/* Render the trade panel component */}
              {showTradePanel && <GraphTradeDemo />}
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-400">
            <p>Click the "Buy GBPUSD" or "Sell GBPUSD" button to see the toast notifications.</p>
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-[#333] rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">About This Demo</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              This demo showcases how toast notifications can enhance the trading experience by providing immediate feedback 
              when trades are executed from a chart interface.
            </p>
            <p>
              Features demonstrated:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Interactive trade panel overlay on chart</li>
              <li>Loading state with progress indication</li>
              <li>Success notifications with trade details</li>
              <li>Error handling with helpful feedback</li>
              <li>Styled notifications that match the application theme</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphTradeDemoPage;
