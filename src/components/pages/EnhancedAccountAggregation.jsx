import React, { useState, useEffect } from 'react';
import { Plus, Eye, PenSquare, Trash2, Power } from 'lucide-react';
import PlatformSelectionModal from '../modals/PlatformSelectionModal';
import ConnectionModal from '../modals/ConnectionModal';
import EditAccountModal from '../modals/EditAccountModal';
import AccountDetailsModal from '../modals/AccountDetailsModal';
import Loader from '../UI/Loader';
import { getEAAccounts as getAccounts } from '../../api/ea';

// EA account management stubs - EA accounts are auto-connected when EA runs
const connectAccount = async (formData) => {
  return { success: false, error: 'EA accounts are automatically connected when EA is deployed' };
};

const deleteAccount = async (accountId) => {
  return { success: false, error: 'EA accounts cannot be deleted from frontend. Stop EA to disconnect.' };
};

const updateAccount = async (accountId, updateData) => {
  return { success: false, error: 'EA account settings are managed by the EA configuration' };
};

const toggleAccountStatus = async (accountId) => {
  return { success: false, error: 'EA account status is managed by EA connection state' };
};
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';

const EnhancedAccountAggregation = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [viewingAccount, setViewingAccount] = useState(null);

  // Define color variants for account cards
  const colorVariants = [
    { bg: 'bg-gradient-to-r from-[#2F00FF] to-[#1C0099]/20', text: 'text-blue-400', border: 'border-blue-600/30' },
    { bg: 'bg-green-600/20', text: 'text-green-400', border: 'border-green-600/30' },
    { bg: 'bg-purple-600/20', text: 'text-purple-400', border: 'border-purple-600/30' },
    { bg: 'bg-orange-600/20', text: 'text-orange-400', border: 'border-orange-600/30' },
    { bg: 'bg-pink-600/20', text: 'text-pink-400', border: 'border-pink-600/30' },
    { bg: 'bg-cyan-600/20', text: 'text-cyan-400', border: 'border-cyan-600/30' },
  ];

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchAccounts();
    } else if (!authLoading && !isAuthenticated) {
      // Redirect to login if not authenticated
      window.location.href = '/signin';
    }
  }, [isAuthenticated, authLoading]);

  const fetchAccounts = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      const result = await getAccounts();
      if (result.success) {
        // Transform EA accounts with broker names and real data
        const transformedAccounts = result.data.map((account, index) => ({
          ...account,
          // Use broker name as the primary account name
          accountName: account.broker || `Account ${account.account_id}`,
          account_name: account.broker || `Account ${account.account_id}`,
          broker_name: account.broker,
          name: account.broker || `Account ${account.account_id}`,
          // Real EA account data
          balance: account.balance || 0,
          equity: account.equity || account.balance || 0,
          margin: account.margin || 0,
          free_margin: account.free_margin || 0,
          margin_level: account.margin_level || 0,
          profit: account.profit || 0,
          leverage: account.leverage || 1,
          currency: account.currency || 'USD',
          server: account.server || account.broker || 'EA Server',
          platform: account.platform || 'MT5',
          // Connection status
          is_connected: account.status === 'connected',
          connection_status: account.status,
          connected_at: account.connected_at,
          last_heartbeat: account.last_heartbeat,
          // Trading statistics
          positions_count: account.positions_count || 0,
          orders_count: account.orders_count || 0,
          // Visual
          colorVariant: index % colorVariants.length,
          // Additional metadata for display
          type: 'EA', // Mark as EA account
          is_demo: account.server?.includes('Demo') || account.server?.includes('Trial'),
          is_active: account.status === 'connected'
        }));
        
        setAccounts(transformedAccounts);
      } else {
        setAccounts([]);
        if (result.error.includes('unauthorized') || result.error.includes('403')) {
          toast.error('Session expired. Please login again.');
        }
      }
    } catch (error) {
      setAccounts([]);
      if (error.message.includes('unauthorized') || error.message.includes('403')) {
        toast.error('Session expired. Please login again.');
      }
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
    if (!isAuthenticated) {
      toast.warning('Please login to connect an account.');
      return;
    }

    try {
      const result = await connectAccount(formData);
      if (result.success) {
        setShowConnectionModal(false);
        await fetchAccounts();
        toast.success('Account connected successfully!');
        return { account_id: result.account_id };
      } else {
        toast.error(`Connection failed: ${result.error}`);
        throw new Error(result.error || 'Connection failed');
      }
    } catch (error) {
      toast.error(`Connection failed: ${error.message}`);
      throw error;
    }
  };

  const handleDeleteAccount = async (accountId, accountName) => {
    if (!isAuthenticated) {
      toast.warning('Please login to delete an account.');
      return;
    }

    const confirmed = await confirm({
      title: 'Delete Account',
      message: `Are you sure you want to delete account "${accountName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger'
    });

    if (!confirmed) return;

    try {
      const result = await deleteAccount(accountId);
      if (result.success) {
        fetchAccounts();
        toast.success('Account deleted successfully!');
      } else {
        //console.error('Delete error:', result.error);
        toast.error(`Delete failed: ${result.error}`);
      }
    } catch (error) {
      //console.error('Delete error:', error);
      toast.error(`Delete failed: ${error.message}`);
    }
  };

  const handleViewAccount = (account) => {
    if (!account.is_active) {
      toast.warning('Please connect the account first to view details.');
      return;
    }
    setViewingAccount(account);
    setShowDetailsModal(true);
  };

  const handleEditAccount = (account) => {
    setSelectedAccount(account);
    setShowEditModal(true);
  };

  const handleToggleConnection = async (account) => {
    if (!isAuthenticated) {
      toast.warning('Please login to toggle account connection.');
      return;
    }

    try {
      const result = await toggleAccountStatus(account.id);
      if (result.success) {
        fetchAccounts();
        const status = !account.is_active ? 'connected' : 'disconnected';
        toast.success(`Account ${status} successfully!`);
      } else {
        //console.error('Toggle error:', result.error);
        toast.error(`Failed to toggle connection: ${result.error}`);
      }
    } catch (error) {
      //console.error('Toggle error:', error);
      toast.error(`Failed to toggle connection: ${error.message}`);
    }
  };

  const handleUpdateAccount = async (updateData) => {
    if (!selectedAccount) return;

    try {
      const result = await updateAccount(selectedAccount.id, updateData);
      if (result.success) {
        setShowEditModal(false);
        setSelectedAccount(null);
        fetchAccounts();
        toast.success('Account updated successfully!');
      } else {
        //console.error('Update error:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      //console.error('Update error:', error);
      throw error; // Re-throw to be handled by the modal
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader size="lg" text="Loading accounts..." />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {authLoading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader size="lg" text="Authenticating..." />
        </div>
      ) : !isAuthenticated ? (
        <div className="text-center py-12">
          <h3 className="text-white text-xl font-semibold mb-2">Authentication Required</h3>
          <p className="text-gray-400">Please login to access your accounts</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Accounts</h1>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setShowPlatformModal(true)}
                className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto"
              >
                <Plus size={20} />
                <span>Add Account</span>
              </button>
            </div>
          </div>

          {/* Enhanced View Tabs */}
          {accounts.length > 0 && (
            <div className="mb-6">
              <div className="bg-[#1A1A1A] rounded-lg p-1 border border-[#2A2A2A]">
                  <div className="flex space-x-1">
                    <div className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-gradient-to-r from-[#2F00FF] to-[#1C0099] text-white">
                      <Power className="h-4 w-4" />
                      <span className="font-medium">Accounts Overview</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Main Accounts View */}
          {loading ? (
                <div className="flex justify-center items-center min-h-[300px]">
                  <Loader size="lg" text="Loading accounts..." />
                </div>
              ) : accounts.length > 0 ? (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block bg-[#1A1A1A] rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#2A2A2A]">
                          <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                          <th className="text-left p-4 text-gray-400 font-medium">Account</th>
                          <th className="text-left p-4 text-gray-400 font-medium">Platform</th>
                          <th className="text-left p-4 text-gray-400 font-medium">Name</th>
                          <th className="text-left p-4 text-gray-400 font-medium">Balance</th>
                          <th className="text-left p-4 text-gray-400 font-medium">Symbols</th>
                          <th className="text-left p-4 text-gray-400 font-medium">Connection</th>
                          <th className="text-left p-4 text-gray-400 font-medium">Settings</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accounts.map((account) => {
                          const colors = colorVariants[account.colorVariant];
                          const accountKey = account.account_id || account.id;
                          const accountName = account.broker || account.account_name || account.name || `${account.platform} Account`;
                          const isConnected = account.status === 'connected';
                          
                          return (
                            <tr key={accountKey} className="border-b border-[#2A2A2A]">
                              <td className="p-4">
                                <span className={`px-3 py-1 rounded-full text-sm ${
                                  isConnected ? 'bg-green-600/20 text-green-500' : 'bg-red-600/20 text-red-500'
                                }`}>
                                  {isConnected ? 'Connected' : 'Disconnected'}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className={`px-3 py-2 rounded-lg ${colors.bg} ${colors.border} border`}>
                                  <span className={`font-medium ${colors.text}`}>{accountKey}</span>
                                </div>
                              </td>
                              <td className="p-4 text-white">{account.platform}</td>
                              <td className="p-4 text-white">{accountName}</td>
                              <td className="p-4 text-white">
                                {isConnected ? (
                                  <div>
                                    <div className="text-white font-medium">
                                      ${account.balance?.toFixed(2) || '0.00'}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      Equity: ${account.equity?.toFixed(2) || '0.00'}
                                    </div>
                                  </div>
                                ) : '----'}
                              </td>
                              <td className="p-4">
                                <div className="text-xs text-gray-400">
                                  {isConnected ? (
                                    <div>
                                      <div>Positions: {account.positions_count || 0}</div>
                                      <div>Orders: {account.orders_count || 0}</div>
                                    </div>
                                  ) : '----'}
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center">
                                  <div className={`w-2 h-2 rounded-full mr-2 ${
                                    isConnected ? 'bg-green-500' : 'bg-red-500'
                                  }`}></div>
                                  <span className="text-xs text-gray-400">
                                    {isConnected ? 'Live' : 'Offline'}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex space-x-2">
                                  <button 
                                    onClick={() => handleViewAccount(account)}
                                    className={`p-2 text-gray-400 rounded-lg transition-colors ${
                                      isConnected 
                                        ? 'hover:text-white hover:bg-[#2A2A2A] cursor-pointer' 
                                        : 'opacity-50 cursor-not-allowed'
                                    }`}
                                    disabled={!isConnected}
                                    title={!isConnected ? 'Account offline' : 'View account details'}
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleEditAccount(account)}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-[#2A2A2A] rounded-lg transition-colors"
                                    title="Account settings"
                                  >
                                    <PenSquare size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-4">
                    {accounts.map((account) => {
                      const colors = colorVariants[account.colorVariant];
                      const accountKey = account.account_id || account.id;
                      const accountName = account.broker || account.account_name || account.name || `${account.platform} Account`;
                      const isConnected = account.status === 'connected';
                      
                      return (
                        <div key={accountKey} className="bg-[#1A1A1A] rounded-lg p-4 border border-[#2A2A2A]">
                          {/* Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className={`px-3 py-2 rounded-lg ${colors.bg} ${colors.border} border`}>
                              <span className={`font-medium ${colors.text}`}>{accountKey}</span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm ${
                              isConnected ? 'bg-green-600/20 text-green-500' : 'bg-red-600/20 text-red-500'
                            }`}>
                              {isConnected ? 'Connected' : 'Disconnected'}
                            </span>
                          </div>

                          {/* Account Details */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-gray-400 text-sm">Platform</p>
                              <p className="text-white font-medium">{account.platform}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-sm">Balance</p>
                              <p className="text-white font-medium">
                                {isConnected ? `$${account.balance?.toFixed(2) || '0.00'}` : '----'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-sm">Equity</p>
                              <p className="text-white font-medium">
                                {isConnected ? `$${account.equity?.toFixed(2) || '0.00'}` : '----'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-sm">Leverage</p>
                              <p className="text-white font-medium">
                                {isConnected ? `1:${account.leverage || 'N/A'}` : '----'}
                              </p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <p className="text-gray-400 text-sm">Broker</p>
                            <p className="text-white font-medium">{accountName}</p>
                          </div>

                          {/* Trading Info */}
                          {isConnected && (
                            <div className="mb-4">
                              <p className="text-gray-400 text-sm mb-2">Trading Status</p>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Positions:</span>
                                <span className="text-white">{account.positions_count || 0}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Orders:</span>
                                <span className="text-white">{account.orders_count || 0}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Server:</span>
                                <span className="text-white text-xs">{account.server || 'N/A'}</span>
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center justify-between pt-4 border-t border-[#2A2A2A]">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                isConnected ? 'bg-green-500' : 'bg-red-500'
                              }`}></div>
                              <span className="text-xs text-gray-400">
                                {isConnected ? 'Live Connection' : 'Offline'}
                              </span>
                            </div>
                            
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleViewAccount(account)}
                                className={`p-2 text-gray-400 rounded-lg transition-colors ${
                                  isConnected 
                                    ? 'hover:text-white hover:bg-[#2A2A2A] cursor-pointer' 
                                    : 'opacity-50 cursor-not-allowed'
                                }`}
                                disabled={!isConnected}
                                title={!isConnected ? 'Account offline' : 'View account details'}
                              >
                                <Eye size={16} />
                              </button>
                              <button 
                                onClick={() => handleEditAccount(account)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-[#2A2A2A] rounded-lg transition-colors"
                                title="Account settings"
                              >
                                <PenSquare size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1A1A1A] mb-4">
                    <Power className="text-gray-400" size={24} />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-2">No Data</h3>
                  <p className="text-gray-400">Connect your first trading account to get started</p>
                </div>
              )}

          {/* Modals */}
          <>
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

            <EditAccountModal
              isOpen={showEditModal}
              onClose={() => {
                setShowEditModal(false);
                setSelectedAccount(null);
              }}
              onSubmit={handleUpdateAccount}
              account={selectedAccount}
            />

            <AccountDetailsModal
              isOpen={showDetailsModal}
              onClose={() => {
                setShowDetailsModal(false);
                setViewingAccount(null);
              }}
              account={viewingAccount}
            />
          </>
        </>
      )}
    </div>
  );
};

export default EnhancedAccountAggregation;
