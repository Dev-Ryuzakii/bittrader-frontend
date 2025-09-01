import React, { useState, useEffect } from 'react';
import { Plus, Eye, PenSquare, Trash2, Power, BarChart3, Shuffle, Settings } from 'lucide-react';
import PlatformSelectionModal from '../modals/PlatformSelectionModal';
import ConnectionModal from '../modals/ConnectionModal';
import EditAccountModal from '../modals/EditAccountModal';
import AccountDetailsModal from '../modals/AccountDetailsModal';
import SymbolMappingModal from '../modals/SymbolMappingModal';
import CrossBrokerAnalysis from '../UI/CrossBrokerAnalysis';
import SymbolPicker from '../UI/SymbolPicker';
import AccountSelector from '../UI/AccountSelector';
import SymbolMappingIndicator from '../UI/SymbolMappingIndicator';
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
import { symbolMappingService } from '../../api/symbolMapping';
import { useTradingSymbol } from '../../contexts/TradingSymbolContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { SymbolProvider } from '../../contexts/SymbolContext';

const EnhancedAccountAggregation = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { refreshAccountSymbols, loadAccountSymbols } = useTradingSymbol();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSymbolMappingModal, setShowSymbolMappingModal] = useState(false);
  const [showCrossBrokerAnalysis, setShowCrossBrokerAnalysis] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [viewingAccount, setViewingAccount] = useState(null);
  const [selectedAccountForMapping, setSelectedAccountForMapping] = useState(null);
  
  // Symbol mapping state
  const [symbolMappings, setSymbolMappings] = useState({});
  const [loadingMappings, setLoadingMappings] = useState(false);
  const [showSymbolView, setShowSymbolView] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  
  // View states for enhanced functionality
  const [activeView, setActiveView] = useState('accounts'); // 'accounts', 'trading', 'symbols', 'analysis'

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
        // Assign color variants to accounts
        const accountsWithColors = result.data.map((account, index) => ({
          ...account,
          colorVariant: index % colorVariants.length
        }));
        setAccounts(accountsWithColors);
        
        // Auto-select first account if none selected
        if (accountsWithColors.length > 0 && !selectedAccount) {
          setSelectedAccount(accountsWithColors[0]);
        }
        
        // Load symbols for all accounts
        for (const account of accountsWithColors) {
          await loadAccountSymbols(account.id);
        }
      } else {
        //console.error('Failed to fetch accounts:', result.error);
        setAccounts([]);
        // If it's an auth error, the client.js will handle redirect
        if (result.error.includes('unauthorized') || result.error.includes('403')) {
          toast.error('Session expired. Please login again.');
        }
      }
    } catch (error) {
      //console.error('Failed to fetch accounts:', error);
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
      //console.log('Connecting account with data:', formData);
      const result = await connectAccount(formData);
      if (result.success) {
        setShowConnectionModal(false);
        await fetchAccounts();
        toast.success('Account connected successfully!');
        
        // Start symbol mapping for the new account
        if (result.account_id) {
          await refreshAccountSymbols(result.account_id);
        }
        
        return { account_id: result.account_id };
      } else {
        //console.error('Connection error:', result.error);
        toast.error(`Connection failed: ${result.error}`);
        throw new Error(result.error || 'Connection failed');
      }
    } catch (error) {
      //console.error('Connection error:', error);
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

  // Symbol mapping functions
  const fetchSymbolMappings = async () => {
    const activeAccounts = accounts.filter(acc => acc.status === 'connected');
    if (activeAccounts.length === 0) {
      toast.info('Connect at least one account to view symbol mappings');
      return;
    }

    setLoadingMappings(true);
    try {
      // For EA accounts, use account_id directly
      const accountIds = activeAccounts.map(acc => acc.account_id).filter(id => id);

      console.log('EA Account IDs for symbol mapping:', accountIds);

      if (accountIds.length === 0) {
        toast.error('No valid EA account IDs found. Please check account configuration.');
        return;
      }
      
      // For EA accounts, we don't need cross-broker mappings as they handle symbols directly
      // Instead, show available symbols for each account
      toast.info('EA accounts handle symbols directly - no cross-broker mapping needed');
      
    } catch (error) {
      console.error('Error fetching symbol mappings:', error);
      toast.error(`Failed to fetch symbol mappings: ${error.message}`);
    } finally {
      setLoadingMappings(false);
    }
  };

  const refreshAccountMappings = async (account) => {
    try {
      const accountId = account.account_id;
      
      if (!accountId) {
        toast.error('No valid EA account ID found for this account');
        return;
      }

      console.log('Refreshing data for EA account ID:', accountId);
      // For EA accounts, we can refresh the account data directly
      await fetchAccounts(); // Refresh all account data
      toast.success(`Refreshed data for account ${accountId}`);
      
    } catch (error) {
      console.error('Error refreshing account data:', error);
      toast.error('Failed to refresh account data');
    }
  };

  const getSymbolStatistics = async () => {
    const activeAccounts = accounts.filter(acc => acc.status === 'connected');
    if (activeAccounts.length === 0) {
      toast.info('Connect at least one account to view statistics');
      return;
    }

    try {
      const accountIds = activeAccounts.map(acc => acc.account_id).filter(id => id);

      console.log('Getting symbol statistics for EA account IDs:', accountIds);

      if (accountIds.length === 0) {
        toast.error('No valid EA account IDs found for statistics.');
        return;
      }

      // For EA accounts, show cross-broker analysis with available data
      setShowCrossBrokerAnalysis(true);
      toast.success('Cross-broker analysis opened for EA accounts');
      
    } catch (error) {
      console.error('Error getting statistics:', error);
      toast.error('Failed to get symbol statistics');
    }
  };

  const handleOpenSymbolMappings = (account) => {
    setSelectedAccountForMapping(account);
    setShowSymbolMappingModal(true);
  };

  const handleMappingUpdate = () => {
    // Refresh data when mappings are updated
    if (showCrossBrokerAnalysis) {
      // The CrossBrokerAnalysis component will auto-refresh
    }
    fetchAccounts();
  };

  const handleRefreshAllSymbols = async () => {
    for (const account of accounts) {
      try {
        await refreshAccountSymbols(account.id);
      } catch (error) {
        //console.error(`Failed to refresh symbols for account ${account.id}:`, error);
      }
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
    <SymbolProvider>
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
                {accounts.filter(acc => acc.status === 'connected').length > 0 && (
                  <>
                    <button
                      onClick={fetchSymbolMappings}
                      disabled={loadingMappings}
                      className="flex items-center justify-center space-x-2 bg-gradient-to-r from-[#2F00FF] to-[#1C0099] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Shuffle size={20} />
                      <span>{loadingMappings ? 'Loading...' : 'EA Symbols'}</span>
                    </button>
                    <button
                      onClick={getSymbolStatistics}
                      className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <BarChart3 size={20} />
                      <span>Account Analysis</span>
                    </button>
                    <button
                      onClick={handleRefreshAllSymbols}
                      className="flex items-center justify-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-[#222222] transition-colors"
                    >
                      <Settings size={20} />
                      <span>Refresh Data</span>
                    </button>
                  </>
                )}
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
                    {[
                      { id: 'accounts', label: 'Accounts Overview', icon: Power },
                      { id: 'trading', label: 'Trading Panel', icon: BarChart3 },
                      { id: 'symbols', label: 'Symbol Explorer', icon: Shuffle },
                      { id: 'analysis', label: 'Cross-Broker Analysis', icon: Settings }
                    ].map((view) => (
                      <button
                        key={view.id}
                        onClick={() => setActiveView(view.id)}
                        className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                          activeView === view.id
                            ? 'bg-gradient-to-r from-[#2F00FF] to-[#1C0099] text-white'
                            : 'text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
                        }`}
                      >
                        <view.icon className="h-4 w-4" />
                        <span className="font-medium hidden sm:inline">{view.label}</span>
                        <span className="font-medium sm:hidden">{view.label.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Symbol Picker for testing - only show in symbols view */}
            {activeView === 'symbols' && accounts.filter(acc => acc.status === 'connected').length > 0 && (
              <div className="mb-6">
                <SymbolPicker
                  selectedSymbol={selectedSymbol}
                  onSymbolSelect={setSelectedSymbol}
                  accounts={accounts.filter(acc => acc.status === 'connected')}
                  showFavorites={true}
                  showAvailability={true}
                />
              </div>
            )}

            {/* Cross-Broker Analysis */}
            {(activeView === 'analysis' || showCrossBrokerAnalysis) && accounts.filter(acc => acc.status === 'connected').length > 1 && (
              <div className="mb-6">
                <CrossBrokerAnalysis
                  accountIds={accounts.filter(acc => acc.status === 'connected').map(acc => acc.account_id).filter(id => id)}
                  accounts={accounts}
                />
              </div>
            )}

          {/* Main Accounts View */}
          {(activeView === 'accounts' || accounts.length === 0) && (
            <>
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
                                  {isConnected && (
                                    <button 
                                      onClick={() => refreshAccountMappings(account)}
                                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-[#2A2A2A] rounded-lg transition-colors"
                                      title="Refresh account data"
                                    >
                                      <Shuffle size={16} />
                                    </button>
                                  )}
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
                              {isConnected && (
                                <button 
                                  onClick={() => refreshAccountMappings(account)}
                                  className="p-2 text-gray-400 hover:text-blue-400 hover:bg-[#2A2A2A] rounded-lg transition-colors"
                                  title="Refresh account data"
                                >
                                  <Shuffle size={16} />
                                </button>
                              )}
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
            </>
          )}

          {/* Symbol Mappings View */}
          {showSymbolView && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-[#1A1A1A] rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A]">
                  <h2 className="text-xl font-bold text-white">Symbol Mappings Across Accounts</h2>
                  <button
                    onClick={() => setShowSymbolView(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                  {Object.keys(symbolMappings).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(symbolMappings).map(([standardSymbol, accountMappings]) => (
                        <div key={standardSymbol} className="bg-[#2A2A2A] rounded-lg p-4">
                          <h3 className="text-white font-semibold mb-3">{standardSymbol}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(accountMappings).map(([accountId, brokerSymbol]) => {
                              const account = accounts.find(acc => (acc.account_id || acc.id) === accountId);
                              return (
                                <div key={`${standardSymbol}-${accountId}`} className="bg-[#333] rounded p-3">
                                  <div className="text-sm text-gray-400 mb-1">
                                    {account?.broker || account?.platform || 'EA Account'} ({account?.account_id || account?.id || accountId})
                                  </div>
                                  <div className="text-white font-medium">{brokerSymbol}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-400">No symbol mappings available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Modals */}
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

          <SymbolMappingModal
            isOpen={showSymbolMappingModal}
            onClose={() => {
              setShowSymbolMappingModal(false);
              setSelectedAccountForMapping(null);
            }}
            accountId={selectedAccountForMapping?.account_id}
            selectedSymbol={selectedSymbol}
            onMappingUpdate={handleMappingUpdate}
          />
        </>
      )}
    </div>
    </SymbolProvider>
  );
};

export default EnhancedAccountAggregation;
