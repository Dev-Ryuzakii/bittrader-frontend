import React from 'react'

const Research = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Research</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Market Analysis</h2>
          <p className="text-gray-600">
            Access comprehensive market analysis and research reports.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Technical Reports</h2>
          <p className="text-gray-600">
            View detailed technical analysis and trading recommendations.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Economic Calendar</h2>
          <p className="text-gray-600">
            Stay updated with important economic events and releases.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Research
