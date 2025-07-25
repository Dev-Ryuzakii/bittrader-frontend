import React, { useState, useEffect } from 'react';
import AccountCard from '../UI/AccountCard';
import AccountSlider from '../UI/AccountSlider';
import MarketOverview from '../UI/MarketOverview';
import TradingViewWidget from '../UI/TradingViewWidget';
import FallbackChart from '../UI/FallbackChart';
import ErrorBoundary from '../UI/ErrorBoundary';
import TradeModal from '../modals/TradeModal';
import TransactionsTable from '../UI/TransactionsTable';
import { TrendingUp, Users, Activity, Target, Plus, BarChart3, Zap } from 'lucide-react';
import { getTransactions } from '../../api/transactions';
import { getAccounts, placeTrade } from '../../api/broker';

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [brokerAccounts, setBrokerAccounts] = useState([]);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [tradeStatus, setTradeStatus] = useState({ loading: false, success: false, error: null });

  // Fetch transactions and accounts on component mount
  useEffect(() => {
    const fetchData = async () => {
      // Don't let API errors block the dashboard from loading
      setTransactionsLoading(true);
      
      // Fetch transactions with error isolation
      try {
        const transactionsResponse = await getTransactions({ limit: 5 });
        if (transactionsResponse.success) {
          setTransactions(transactionsResponse.data);
        }
      } catch (transactionError) {
        console.log('⚠️ Transactions API unavailable, dashboard will work without transaction data');
      }
      
      // Fetch broker accounts with error isolation  
      try {
        const accountsResponse = await getAccounts();
        if (accountsResponse.success && accountsResponse.data && accountsResponse.data.length > 0) {
          console.log('✅ Broker accounts loaded:', accountsResponse.data);
          setBrokerAccounts(accountsResponse.data);
          setSelectedAccount(accountsResponse.data[0]);
        } else {
          console.log('⚠️ No broker accounts found, using demo accounts');
          if (demoAccounts.length > 0) {
            setSelectedAccount(demoAccounts[0]);
          }
        }
      } catch (brokerError) {
        console.log('⚠️ Broker API unavailable, using demo accounts');
        if (demoAccounts.length > 0) {
          setSelectedAccount(demoAccounts[0]);
        }
      }
      
      setTransactionsLoading(false);
    };

    fetchData();
  }, []);
  
  // Handle placing a trade
  const handlePlaceTrade = async (accountId, tradeData) => {
    setTradeStatus({ loading: true, success: false, error: null });
    
    try {
      const response = await placeTrade(accountId, tradeData);
      
      if (response.success) {
        setTradeStatus({ loading: false, success: true, error: null });
        // You could update the UI or show a success message here
        console.log('Trade placed successfully:', response.data);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to place trade');
      }
    } catch (error) {
      setTradeStatus({ loading: false, success: false, error: error.message });
      throw error;
    }
  };

  // Demo data - this will later come from backend when accounts are linked
  const demoAccounts = [
    {
      id: 1,
      accountName: "PepperStone",
      balance: 17228.17,
      pnl: 5459.05,
      equity: 9475.12,
      colorVariant: 2
    },
    {
      id: 2,
      accountName: "FXPRO",
      balance: 27413.21,
      pnl: 11512.47,
      equity: 3715.31,
      colorVariant: 3
    },
    {
      id: 3,
      accountName: "FINALTO",
      balance: 24148.06,
      pnl: 17721.76,
      equity: 4312.91,
      colorVariant: 4
    }
  ];

  // Calculate total balance
  const totalBalance = demoAccounts.reduce((sum, account) => sum + account.balance, 0);
  const totalPnl = demoAccounts.reduce((sum, account) => sum + account.pnl, 0);
  const totalEquity = demoAccounts.reduce((sum, account) => sum + account.equity, 0);

  // Stats data
  const stats = [
    {
      title: "Total Profit",
      value: "+$34,691.28",
      change: "+12.5%",
      icon: TrendingUp,
      color: "text-green-400",
      bgColor: "bg-green-500/10"
    },
    {
      title: "Active Strategies",
      value: "8",
      change: "+2 this week",
      icon: Target,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Win Rate",
      value: "73.2%",
      change: "+5.1%",
      icon: Activity,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "Community Rank",
      value: "#147",
      change: "↑23 positions",
      icon: Users,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10"
    }
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Portfolio</h1>
          {/* <p className="text-gray-400">Welcome back, Sam Joe. Here's your trading overview.</p> */}
        </div>
        {/* <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
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
            <span className="text-sm text-gray-400">{demoAccounts.length + 1} cards</span>
            <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
              Manage
            </button>
          </div>
        </div>
        
        {/* Account Slider */}
        <AccountSlider
          totalBalance={totalBalance}
          totalPnl={totalPnl}
          totalEquity={totalEquity}
          accounts={demoAccounts}
        />
      </div>

      {/* Market Overview */}
      <div className="mb-8">
        <MarketOverview />
      </div>

      {/* TradingView Chart Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-white">Live Trading Chart</h2>
            {selectedAccount && (
              <div className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-sm">
                Trading on: {selectedAccount.broker_name || selectedAccount.accountName}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <select 
              className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-sm text-white px-3 py-1"
              onChange={(e) => {
                const accountId = e.target.value;
                // First check demo accounts
                let account = demoAccounts.find(a => a.id.toString() === accountId);
                // If not found in demo accounts, check broker accounts
                if (!account && brokerAccounts.length > 0) {
                  account = brokerAccounts.find(a => a.id === accountId);
                }
                if (account) {
                  setSelectedAccount(account);
                }
              }}
              value={selectedAccount?.id?.toString() || ''}
            >
              <option value="" disabled>Select account</option>
              {demoAccounts.map((account) => (
                <option key={`demo-${account.id}`} value={account.id}>
                  {account.accountName}
                </option>
              ))}
              {brokerAccounts && brokerAccounts.length > 0 && brokerAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.broker_name || 'Broker'} - {account.login || 'Account'}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg overflow-hidden">
            <TradingViewWidget />
        </div>
        
        {/* Trading status message */}
        {tradeStatus.success && (
          <div className="mt-2 bg-green-900/30 border border-green-700 text-green-200 px-4 py-2 rounded">
            Trade placed successfully
          </div>
        )}
        
        {tradeStatus.error && (
          <div className="mt-2 bg-red-900/30 border border-red-700 text-red-200 px-4 py-2 rounded">
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
          accounts={[...demoAccounts, ...brokerAccounts]}
          selectedAccount={selectedAccount}
          onAccountSelect={setSelectedAccount}
          onPlaceTrade={handlePlaceTrade}
        />
      </div>
      
      {/* Transactions Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Recent Transactions</h2>
          <button 
            onClick={() => window.location.href = '/transactions'} 
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            View all
          </button>
        </div>
        
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg overflow-hidden">
          <TransactionsTable 
            transactions={transactions}
            loading={transactionsLoading}
            limit={5}
            showActions={true}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <BarChart3 size={20} className="text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button className="bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/20 text-blue-400 px-4 py-3 rounded-lg transition-colors text-sm">
              View Analytics
            </button>
            <button className="bg-green-600/10 hover:bg-green-600/20 border border-green-600/20 text-green-400 px-4 py-3 rounded-lg transition-colors text-sm">
              Strategy Lab
            </button>
            <button className="bg-purple-600/10 hover:bg-purple-600/20 border border-purple-600/20 text-purple-400 px-4 py-3 rounded-lg transition-colors text-sm">
              AI Assistant
            </button>
            <button className="bg-orange-600/10 hover:bg-orange-600/20 border border-orange-600/20 text-orange-400 px-4 py-3 rounded-lg transition-colors text-sm">
              Research
            </button>
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Zap size={20} className="text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-white text-sm">Strategy Updated</p>
                <p className="text-gray-400 text-xs">Momentum Strategy v2.1</p>
              </div>
              <span className="text-green-400 text-xs">2m ago</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-white text-sm">Trade Executed</p>
                <p className="text-gray-400 text-xs">EUR/USD Buy +$1,247</p>
              </div>
              <span className="text-blue-400 text-xs">15m ago</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-white text-sm">Account Connected</p>
                <p className="text-gray-400 text-xs">MT5 Demo Account</p>
              </div>
              <span className="text-purple-400 text-xs">1h ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
