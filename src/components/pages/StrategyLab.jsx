import React from 'react'

const StrategyLab = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Strategy Lab</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Strategy Builder</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium">Create Strategy</h3>
              <p className="text-sm text-gray-600">Build and customize your trading strategies</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium">Template Library</h3>
              <p className="text-sm text-gray-600">Pre-built strategy templates</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Backtest Engine</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium">Run Backtest</h3>
              <p className="text-sm text-gray-600">Test strategies against historical data</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium">Performance Analytics</h3>
              <p className="text-sm text-gray-600">Detailed strategy performance metrics</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Strategy Optimization</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium">Parameter Optimization</h3>
              <p className="text-sm text-gray-600">Fine-tune your strategy parameters</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium">Risk Management</h3>
              <p className="text-sm text-gray-600">Configure risk parameters and limits</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StrategyLab
