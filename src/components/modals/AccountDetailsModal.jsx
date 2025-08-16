import React, { useState, useEffect } from 'react';
import { X, Activity, DollarSign, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { getAccountDetails } from '../../api/broker';

const AccountDetailsModal = ({ isOpen, onClose, account }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && account) {
      fetchAccountDetails();
    }
  }, [isOpen, account]);

  const fetchAccountDetails = async () => {
    // Check if account is disconnected
    if (!account.is_active) {
      setError('Account is disconnected. Please connect the account to view details.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await getAccountDetails(account.id);
      if (result.success) {
        setDetails(result.data);
      } else {
        setError(result.error || 'Failed to fetch account details');
      }
    } catch (err) {
      //console.error('Error fetching account details:', err);
      setError(err.message || 'Failed to fetch account details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !account) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1A1A1A] rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Account Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center space-y-2">
              <Loader2 size={32} className="animate-spin text-blue-400" />
              <span className="text-gray-400">Loading account details...</span>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/10 mb-4">
              <Activity className="text-yellow-500" size={24} />
            </div>
            <h3 className="text-white text-xl font-semibold mb-2">Account Disconnected</h3>
            <p className="text-gray-400 mb-6">{error}</p>
            <div className="text-sm text-gray-500">
              <p>To view account details:</p>
              <p>• Go back to the Accounts page</p>
              <p>• Toggle the connection switch to "ON"</p>
              <p>• Return here to view live account data</p>
            </div>
          </div>
        ) : details ? (
          <div className="space-y-6">
            {/* Basic Account Info */}
            <div className="bg-[#2A2A2A] rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Account Name</p>
                  <p className="text-white font-medium">{details.account_name || 'No name set'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Login ID</p>
                  <p className="text-white font-medium">{details.login}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Platform</p>
                  <p className="text-white font-medium">{details.platform}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Broker</p>
                  <p className="text-white font-medium">{details.broker_name}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Server</p>
                  <p className="text-white font-medium">{details.server}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    details.is_active ? 'bg-green-600/20 text-green-500' : 'bg-red-600/20 text-red-500'
                  }`}>
                    {details.is_active ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Account Data */}
            {details.is_active && details.live_info && Object.keys(details.live_info).length > 0 && (
              <div className="bg-[#2A2A2A] rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Live Account Data</h3>
                {details.live_info.error ? (
                  <div className="text-yellow-400 text-sm">
                    ⚠️ {details.live_info.error}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-[#1A1A1A] rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <DollarSign size={16} className="text-green-400" />
                        <span className="text-gray-400 text-sm">Balance</span>
                      </div>
                      <p className="text-white font-bold">
                        ${details.live_info.balance?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    
                    <div className="bg-[#1A1A1A] rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <TrendingUp size={16} className="text-blue-400" />
                        <span className="text-gray-400 text-sm">Equity</span>
                      </div>
                      <p className="text-white font-bold">
                        ${details.live_info.equity?.toFixed(2) || '0.00'}
                      </p>
                    </div>

                    <div className="bg-[#1A1A1A] rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <Activity size={16} className="text-purple-400" />
                        <span className="text-gray-400 text-sm">Margin</span>
                      </div>
                      <p className="text-white font-bold">
                        ${details.live_info.margin?.toFixed(2) || '0.00'}
                      </p>
                    </div>

                    <div className="bg-[#1A1A1A] rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <DollarSign size={16} className="text-cyan-400" />
                        <span className="text-gray-400 text-sm">Free Margin</span>
                      </div>
                      <p className="text-white font-bold">
                        ${details.live_info.free_margin?.toFixed(2) || '0.00'}
                      </p>
                    </div>

                    <div className="bg-[#1A1A1A] rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <TrendingUp size={16} className="text-green-400" />
                        <span className="text-gray-400 text-sm">Positions</span>
                      </div>
                      <p className="text-white font-bold">
                        {details.live_info.positions_count || 0}
                      </p>
                    </div>

                    <div className="bg-[#1A1A1A] rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <Activity size={16} className="text-orange-400" />
                        <span className="text-gray-400 text-sm">Orders</span>
                      </div>
                      <p className="text-white font-bold">
                        {details.live_info.orders_count || 0}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Account Timeline */}
            <div className="bg-[#2A2A2A] rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Created</span>
                  <span className="text-white">
                    {new Date(details.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Last Updated</span>
                  <span className="text-white">
                    {new Date(details.updated_at).toLocaleString()}
                  </span>
                </div>
                {details.last_sync && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Last Sync</span>
                    <span className="text-white">
                      {new Date(details.last_sync).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-600 hover:bg-[#222222] text-white py-2 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={fetchAccountDetails}
                className="flex-1 bg-gradient-to-r from-[#2F00FF] to-[#1C0099] hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AccountDetailsModal;
