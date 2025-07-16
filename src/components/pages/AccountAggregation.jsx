import React, { useState, useEffect } from 'react';
import { Plus, Eye, PenSquare, Trash2, Power } from 'lucide-react';
import PlatformSelectionModal from '../modals/PlatformSelectionModal';
import ConnectionModal from '../modals/ConnectionModal';

const AccountAggregation = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('http://localhost:8000/broker/');
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformSelect = (platform) => {
    setSelectedPlatform(platform);
    setShowPlatformModal(false);
    setShowConnectionModal(true);
  };

  const handleConnect = async (formData) => {
    try {
      const response = await fetch('http://localhost:8000/broker/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to connect account');

      setShowConnectionModal(false);
      fetchAccounts();
    } catch (error) {
      console.error('Connection error:', error);
      // Handle error (show notification, etc.)
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Accounts</h1>
        <button
          onClick={() => setShowPlatformModal(true)}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus size={20} />
          <span>Add Account</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400">Loading...</div>
      ) : accounts.length > 0 ? (
        <div className="bg-[#1A1A1A] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2A2A]">
                <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                <th className="text-left p-4 text-gray-400 font-medium">Account</th>
                <th className="text-left p-4 text-gray-400 font-medium">Platform</th>
                <th className="text-left p-4 text-gray-400 font-medium">Name</th>
                <th className="text-left p-4 text-gray-400 font-medium">Balance</th>
                <th className="text-left p-4 text-gray-400 font-medium">Connection</th>
                <th className="text-left p-4 text-gray-400 font-medium">Settings</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-b border-[#2A2A2A]">
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      account.is_active ? 'bg-green-600/20 text-green-500' : 'bg-red-600/20 text-red-500'
                    }`}>
                      {account.is_active ? 'Connected' : 'Disconnected'}
                    </span>
                  </td>
                  <td className="p-4 text-white">{account.login}</td>
                  <td className="p-4 text-white">{account.platform}</td>
                  <td className="p-4 text-white">{`Account ${accounts.indexOf(account) + 1}`}</td>
                  <td className="p-4 text-white">${account.balance.toFixed(2)}</td>
                  <td className="p-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={account.is_active} />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-[#2A2A2A] rounded-lg transition-colors">
                        <Eye size={16} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-[#2A2A2A] rounded-lg transition-colors">
                        <PenSquare size={16} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-[#2A2A2A] rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1A1A1A] mb-4">
            <Power className="text-gray-400" size={24} />
          </div>
          <h3 className="text-white text-xl font-semibold mb-2">No Data</h3>
          <p className="text-gray-400">Connect your first trading account to get started</p>
        </div>
      )}

      <PlatformSelectionModal
        isOpen={showPlatformModal}
        onClose={() => setShowPlatformModal(false)}
        onSelect={handlePlatformSelect}
      />

      <ConnectionModal
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
        onSubmit={handleConnect}
        platform={selectedPlatform}
      />
    </div>
  );
};

export default AccountAggregation;
