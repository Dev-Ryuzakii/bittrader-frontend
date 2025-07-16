import React from 'react'

const Analytics = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Analytics</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
          <p className="text-gray-600">
            Track your trading performance with detailed metrics and insights.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Portfolio Analysis</h2>
          <p className="text-gray-600">
            Analyze your portfolio composition and risk exposure.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Trade Statistics</h2>
          <p className="text-gray-600">
            View comprehensive statistics about your trading activities.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Analytics
