import React from 'react'

const Community = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Traders Community</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Discussion Forums</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium">Trading Strategies</h3>
              <p className="text-sm text-gray-600">Share and discuss trading strategies</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium">Market Analysis</h3>
              <p className="text-sm text-gray-600">Daily market discussions</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Active Traders</h2>
          <div className="space-y-3">
            {[1, 2, 3].map((trader) => (
              <div key={trader} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-md">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  👤
                </div>
                <div>
                  <p className="font-medium">Trader {trader}</p>
                  <p className="text-sm text-gray-600">Online</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Trading Events</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium">Weekly Webinar</h3>
              <p className="text-sm text-gray-600">Every Wednesday at 2 PM UTC</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium">Trading Workshop</h3>
              <p className="text-sm text-gray-600">Coming this weekend</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Community
