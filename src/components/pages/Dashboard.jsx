import React, { useState, useEffect } from 'react';
import AccountCard from '../UI/AccountCard';
import AccountSlider from '../UI/AccountSlider';
import MarketOverview from '../UI/MarketOverview';
import TradingViewWidget from '../UI/TradingViewWidget';
import TradeModal from '../modals/TradeModal';
import TransactionsTable from '../UI/TransactionsTable';
import TradeManagement from '../trading/TradeManagement';
import Loader from '../UI/Loader';
import { TrendingUp, Users, Activity, Target, Plus, BarChart3, Zap, Signal } from 'lucide-react';
import { getTransactions } from '../../api/transactions';
import { getEAAccounts as getAccounts, placeEATrade as placeTrade } from '../../api/ea';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [brokerAccounts, setBrokerAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [tradeStatus, setTradeStatus] = useState({ loading: false, success: false, error: null });
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSD');
  const [activeSection, setActiveSection] = useState('market'); // 'market' or 'signals'
  const [shouldRefreshOrders, setShouldRefreshOrders] = useState(false);
  const { isAuthenticated } = useAuth();
  const colorVariants = [
    { bg: 'bg-gradient-to-r from-[#2F00FF] to-[#1C0099]/20', text: 'text-blue-400', border: 'border-blue-600/30' },
    { bg: 'bg-green-600/20', text: 'text-green-400', border: 'border-green-600/30' },
    { bg: 'bg-purple-600/20', text: 'text-purple-400', border: 'border-purple-600/30' },
    { bg: 'bg-orange-600/20', text: 'text-orange-400', border: 'border-orange-600/30' },
    { bg: 'bg-pink-600/20', text: 'text-pink-400', border: 'border-pink-600/30' },
    { bg: 'bg-cyan-600/20', text: 'text-cyan-400', border: 'border-cyan-600/30' },
  ];

  // Fetch transactions and accounts on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) {
        setTransactionsLoading(false);
        setAccountsLoading(false);
        return;
      }

      // Fetch transactions with error isolation
      try {
        const transactionsResponse = await getTransactions({ limit: 5 });
        if (transactionsResponse.success) {
          setTransactions(transactionsResponse.data);
        }
      } catch (transactionError) {
        //console.log('⚠️ Transactions API unavailable, dashboard will work without transaction data');
      }
      setTransactionsLoading(false);
      
      // Fetch broker accounts with error isolation  
      try {
        const accountsResponse = await getAccounts();
        if (accountsResponse.success && accountsResponse.data && accountsResponse.data.length > 0) {
          //console.log('✅ Broker accounts loaded:', accountsResponse.data);
          // Assign color variants to accounts
          const accountsWithColors = accountsResponse.data.map((account, index) => ({
            ...account,
            colorVariant: index % colorVariants.length
          }));
          setBrokerAccounts(accountsWithColors);
          setSelectedAccount(accountsWithColors[0]);
        } else {
          //console.log('⚠️ No broker accounts found');
          setBrokerAccounts([]);
        }
      } catch (brokerError) {
        //console.log('⚠️ Broker API unavailable');
        setBrokerAccounts([]);
      }
      setAccountsLoading(false);
    };

    fetchData();
  }, [isAuthenticated]);
  
  // Handle placing a trade
  const handlePlaceTrade = async (accountId, tradeData) => {
    setTradeStatus({ loading: true, success: false, error: null });
    
    try {
      const response = await placeTrade(accountId, tradeData);
      
      //console.log('Trade response:', response);
      
      if (response.success) {
        setTradeStatus({ loading: false, success: true, error: null });
        // Trigger OrderManagementPanel refresh
        setShouldRefreshOrders(true);
        
        // Return the full response data for enhanced UI feedback
        return {
          success: true,
          message: response.message,
          order_id: response.order_id,
          position_id: response.position_id,
          details: response.details
        };
      } else {
        throw new Error(response.error || response.message || 'Failed to place trade');
      }
    } catch (error) {
      //console.error('Trade placement error:', error);
      setTradeStatus({ loading: false, success: false, error: error.message });
      throw error;
    }
  };

  // Use only real broker accounts - no demo accounts
  const displayAccounts = brokerAccounts;

  // Filter only active accounts and transform to match the expected format for AccountSlider
  const formattedAccounts = displayAccounts
    .filter(account => account.status === 'connected') // Only show connected EA accounts
    .map(account => ({
      ...account,
      // Use broker name as the primary account name for EA accounts
      accountName: account.broker || account.account_name || account.broker_name || `Account ${account.account_id}`,
      account_name: account.broker || account.account_name || account.broker_name || `Account ${account.account_id}`,
      broker_name: account.broker || account.broker_name,
      balance: account.balance || 0,
      equity: account.equity || account.balance || 0,
      margin: account.margin || 0,
      free_margin: account.free_margin || 0,
      leverage: account.leverage || 1,
      currency: account.currency || 'USD',
      platform: account.platform || 'MT5',
      server: account.server || account.broker || 'EA Server',
      positions_count: account.positions_count || 0,
      orders_count: account.orders_count || 0,
      // Additional EA-specific data
      last_heartbeat: account.last_heartbeat,
      connected_at: account.connected_at,
      margin_level: account.margin_level,
      // Use colorVariant + 2 to skip the first two variants (1 is for total, 2 starts individual accounts)
      colorVariant: (account.colorVariant || 0) + 2
    }));

  // Calculate totals (only from connected EA accounts)
  const connectedAccounts = displayAccounts.filter(account => account.status === 'connected');
  const totalBalance = connectedAccounts.reduce((sum, account) => sum + (account.balance || 0), 0);
  const totalEquity = connectedAccounts.reduce((sum, account) => sum + (account.equity || 0), 0);
  // Calculate total P&L as Equity - Balance
  const totalPnl = totalEquity - totalBalance;
  const totalMargin = connectedAccounts.reduce((sum, account) => sum + (account.margin || 0), 0);
  const totalFreeMargin = connectedAccounts.reduce((sum, account) => sum + (account.free_margin || 0), 0);

  

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Portfolio</h1>
          {/* <p className="text-gray-400">Welcome back, Sam Joe. Here's your trading overview.</p> */}
        </div>
        {/* <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <button className="flex items-center space-x-2 bg-gradient-to-r from-[#2F00FF] to-[#1C0099] hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Plus size={16} />
            <span>Connect Account</span>
          </button>
        </div> */}
      </div>

      {/* Stats Grid */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4 hover:border-[#3A3A3A] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon size={20} className={stat.color} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-gray-400 text-sm">{stat.title}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className={`text-xs ${stat.color}`}>{stat.change}</p>
            </div>
          </div>
        ))}
      </div> */}

      {/* Portfolio and Accounts Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Portfolio Overview</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">{formattedAccounts.length} account{formattedAccounts.length !== 1 ? 's' : ''}</span>
            {brokerAccounts.length === 0 && (
              <button 
                onClick={() => window.location.href = '/account-aggregation'}
                className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
              >
                Connect Account
              </button>
            )}
          </div>
        </div>
        
        {accountsLoading ? (
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-8 text-center">
            <Loader size="md" text="Loading accounts..." />
          </div>
        ) : brokerAccounts.length === 0 ? (
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-8 text-center">
            <div className="text-gray-400 mb-4">No trading accounts connected</div>
            <button 
              onClick={() => window.location.href = '/account-aggregation'}
              className="bg-gradient-to-r from-[#2F00FF] to-[#1C0099] hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Connect Your First Account</span>
            </button>
          </div>
        ) : (
          <AccountSlider
            totalBalance={totalBalance}
            totalEquity={totalEquity}
            accounts={formattedAccounts}
          />
        )}
      </div>

      {/* Market Overview / Signal Strategy Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveSection('market')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeSection === 'market'
                  ? 'bg-gradient-to-r from-[#2F00FF] to-[#1C0099]/90 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
              }`}
            >
              <BarChart3 size={16} />
              <span>Market Overview</span>
            </button>
            <button
              onClick={() => setActiveSection('signals')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeSection === 'signals'
                  ? 'bg-gradient-to-r from-[#2F00FF] to-[#1C0099]/90 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
              }`}
            >
              <Signal size={16} />
              <span>Signal Strategy</span>
            </button>
          </div>
        </div>
        
        {/* Content based on active section */}
        {activeSection === 'market' ? (
          <MarketOverview />
        ) : (
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center">
                <Signal size={32} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Signal Strategy</h3>
                <p className="text-gray-400 mb-4">Advanced trading signals and automated strategies</p>
                <div className="bg-orange-600/20 text-orange-400 px-4 py-2 rounded-lg inline-block border border-orange-600/30">
                  Coming Soon
                </div>
              </div>
              <p className="text-sm text-gray-500 max-w-md">
                We're working on bringing you AI-powered trading signals and automated strategy execution. 
                Stay tuned for this exciting feature!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* TradingView Chart and Trading Panel Section */}
        <div className="mb-8">
          <div className="flex flex-col space-y-4 mb-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
              <h2 className="text-xl font-semibold text-white">Live Trading Chart</h2>
              <button
                onClick={() => setIsTradeModalOpen(true)}
                className="bg-green-600/90 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-2 w-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Place Trade</span>
              </button>
              {selectedAccount && (
                <div className="bg-gradient-to-r from-[#2F00FF] to-[#1C0099]/20 text-blue-400 px-3 py-1 rounded-full text-sm text-center sm:text-left truncate max-w-[200px] border border-blue-600/30">
                  <span className="hidden sm:inline">Trading on: </span>
                  {selectedAccount.account_name || selectedAccount.broker_name || selectedAccount.accountName}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400 hidden sm:inline">Account:</span>
              <select
                className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-sm text-white px-3 py-2 w-full sm:w-auto max-w-[200px] focus:outline-none focus:border-blue-600/70 focus:ring-1 focus:ring-blue-600/30"
                onChange={(e) => {
                  const accountId = e.target.value;
                  const account = formattedAccounts.find(a => (a.account_id || a.id)?.toString() === accountId);
                  if (account) {
                    setSelectedAccount(account);
                  }
                }}
                value={(selectedAccount?.account_id || selectedAccount?.id)?.toString() || ''}
              >
                <option value="" disabled>Select account</option>
                {formattedAccounts.map((account) => (
                  <option key={account.account_id || account.id} value={(account.account_id || account.id)?.toString()}>
                    {account.account_name || account.broker_name || account.accountName}
                    {account.is_demo ? ' (Demo)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Trading Chart */}
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg overflow-hidden">
              <div className="h-[640px] w-full">
                <TradingViewWidget 
                  symbol={selectedSymbol} 
                  theme="dark"
                />
              </div>
            </div>
          </div>

          {/* Trade Management */}
          <div className="mt-6">
            <TradeManagement 
              selectedAccount={selectedAccount}
              shouldRefresh={shouldRefreshOrders}
              onTradeSelect={(trade) => {
                // Handle trade selection - you can use this to show details in a modal or update the chart
                setSelectedSymbol(trade.asset);
              }}
              onRefreshComplete={() => setShouldRefreshOrders(false)}
            />
          </div>
          
          {/* Trading status message */}
          {tradeStatus.success && (
            <div className="mt-2 bg-green-900/30 border border-green-700/50 text-green-400 px-4 py-2 rounded">
              Trade placed successfully
            </div>
          )}
          
          {tradeStatus.error && (
            <div className="mt-2 bg-red-900/30 border border-red-700/50 text-red-400 px-4 py-2 rounded">
              Error placing trade: {tradeStatus.error}
            </div>
          )}
          
          {/* Trade Modal */}
          <TradeModal 
            isOpen={isTradeModalOpen}
            onClose={() => {
              setIsTradeModalOpen(false);
              // Reset trade status when closing modal
              setTradeStatus({ loading: false, success: false, error: null });
            }}
            accounts={formattedAccounts}
            selectedAccount={selectedAccount}
            onAccountSelect={setSelectedAccount}
            onPlaceTrade={async (accountId, tradeData) => {
              try {
                await handlePlaceTrade(accountId, tradeData);
                setIsTradeModalOpen(false);
              } catch (error) {
                // Error is already handled in handlePlaceTrade
                ////console.error('Trade placement failed:', error);
              }
            }}
          />
        </div>
      
      {/* Transactions Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Recent Transactions</h2>
          <button 
            onClick={() => window.location.href = '/transactions'} 
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors flex items-center"
          >
            View all <span className="ml-1">→</span>
          </button>
        </div>
        
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg overflow-hidden shadow-sm">
          <TransactionsTable 
            transactions={transactions}
            loading={transactionsLoading}
            limit={5}
            showActions={true}
          />
        </div>
      </div>

     

      {/* Simple Footer */}
      <footer className="mt-16 border-t border-[#2A2A2A] pt-6 pb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Left side - Logo and company info */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-[#2F00FF] to-[#1C0099]/80 rounded flex items-center justify-center">
                <div className="w-2 h-2 border-white rounded-sm"></div>
              </div>
              <span className="text-lg font-bold text-white">Bitetrader</span>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-blue-400 text-sm transition-colors">Overview</a>
              <a href="#" className="text-gray-400 hover:text-blue-400 text-sm transition-colors">Features</a>
              <a href="#" className="text-gray-400 hover:text-blue-400 text-sm transition-colors">Pricing</a>
              <a href="#" className="text-gray-400 hover:text-blue-400 text-sm transition-colors">Careers</a>
              <a href="#" className="text-gray-400 hover:text-blue-400 text-sm transition-colors">Help</a>
              <a href="#" className="text-gray-400 hover:text-blue-400 text-sm transition-colors">Privacy</a>
            </nav>
          </div>

          {/* Right side - Newsletter signup */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">Stay up to date</span>
            <div className="flex space-x-2">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white text-sm w-48 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/50"
              />
              <button className="bg-gradient-to-r from-[#2F00FF] to-[#1C0099]/90 hover:bg-gradient-to-r from-[#2F00FF] to-[#1C0099] text-white px-4 py-2 rounded-lg text-sm transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-6 pt-4 border-t border-[#2A2A2A] flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <span>© 2077 Untitled UI. All rights reserved.</span>
            <span className="hidden md:inline">•</span>
            <a href="#" className="hover:text-blue-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Cookies</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
