import React from 'react'

const Settings = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="max-w-3xl bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Profile Information</span>
              <button className="text-blue-600 hover:text-blue-700">Edit</button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Security Settings</span>
              <button className="text-blue-600 hover:text-blue-700">Manage</button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Notifications</span>
              <button className="text-blue-600 hover:text-blue-700">Configure</button>
            </div>
          </div>
        </div>
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold mb-4">Trading Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Default Order Settings</span>
              <button className="text-blue-600 hover:text-blue-700">Customize</button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Risk Management</span>
              <button className="text-blue-600 hover:text-blue-700">Configure</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
