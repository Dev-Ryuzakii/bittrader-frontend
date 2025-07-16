import React from 'react'

const AnalystInsights = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Analyst Insights</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Market Overview</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium">Daily Market Summary</h3>
              <p className="text-sm text-gray-600">Expert analysis of today's market movements</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium">Weekly Outlook</h3>
              <p className="text-sm text-gray-600">Projected market trends for the week ahead</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Trading Signals</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium">Active Signals</h3>
              <p className="text-sm text-gray-600">Real-time trading opportunities</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium">Signal Performance</h3>
              <p className="text-sm text-gray-600">Track record and statistics</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Expert Recommendations</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium">Top Picks</h3>
              <p className="text-sm text-gray-600">Curated trading opportunities</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium">Risk Analysis</h3>
              <p className="text-sm text-gray-600">Key risk factors and mitigation strategies</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalystInsights
