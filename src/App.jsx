import React, { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext.jsx'
import { ToastProvider } from './contexts/ToastContext.jsx'
import { ConfirmProvider } from './contexts/ConfirmContext.jsx'
import { TradingSymbolProvider } from './contexts/TradingSymbolContext.jsx'
import { eaWebSocket, getEAAccounts } from './api/ea'
import { toast, Toaster } from 'react-hot-toast'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Hero from './components/pages/Hero'
import SignIn from './components/auth/SignIn'
import SignUp from './components/auth/SignUp'
import Dashboard from './components/pages/Dashboard'
import Research from './components/pages/Research'
import Analytics from './components/pages/Analytics'
import Settings from './components/pages/Settings'
import Support from './components/pages/Support'
import Sidebar from './components/UI/Sidebar'
import Navbar from './components/UI/Navbar'
import AnalystInsights from './components/pages/AnalystInsights'
import StrategyLab from './components/pages/StrategyLab'
import AccountAggregation from './components/pages/AccountAggregation'
import EnhancedAccountAggregation from './components/pages/EnhancedAccountAggregation'
import Community from './components/pages/Community'
import CardShowcase from './components/pages/CardShowcase'
import Transactions from './components/pages/Transactions'
import AI_Assistant from './components/pages/AI_Assistant.jsx'
import Search from './components/pages/Search.jsx'
import GraphTradeDemoPage from './components/pages/GraphTradeDemoPage.jsx'

const App = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [eaAccounts, setEaAccounts] = useState([]); // Store EA accounts for broker name lookup
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  
  // Fetch EA accounts for broker name lookup
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const fetchEAAccounts = async () => {
        try {
          const result = await getEAAccounts();
          if (result.success) {
            setEaAccounts(result.data);
          }
        } catch (error) {
          console.error('Failed to fetch EA accounts for notifications:', error);
        }
      };
      
      fetchEAAccounts();
    }
  }, [isAuthenticated, user?.id]);
  
  // Helper function to get account info by ID
  const getAccountInfo = (accountId) => {
    const account = eaAccounts.find(acc => acc.account_id === accountId);
    return {
      brokerName: account?.broker || `Account ${accountId}`,
      server: account?.server || account?.broker || 'EA Server',
      platform: account?.platform || 'MT5'
    };
  };
  
  // Setup EA WebSocket connection when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      console.log('Connecting to EA WebSocket for user:', user.id);
      
      // Connect to EA WebSocket for real-time updates
      eaWebSocket.connect(user.id);
      
      // Set up event listeners
      eaWebSocket.on('connected', () => {
        console.log('EA WebSocket connected successfully');
      });
      
      eaWebSocket.on('trade_result', (data) => {
        console.log('Trade executed via EA:', data);
        
        // Get account info for notification
        const accountInfo = getAccountInfo(data.account_id);
        
        // Show toast notification for EA trade execution
        if (data.data && data.data.status) {
          const status = data.data.status.toLowerCase();
          const message = data.data.message || 'Trade processed by EA';
          
          if (status.includes('success') || status.includes('executed') || status.includes('filled')) {
            // Success notification with broker name
            toast.success(
              <div className="flex items-center gap-3">
                <div className="text-2xl">🤖</div>
                <div>
                  <div className="font-semibold text-white">
                    EA Trade Executed!
                  </div>
                  <div className="text-sm text-gray-300">
                    {accountInfo.brokerName} • {message}
                  </div>
                  {data.data.request_id && (
                    <div className="text-xs text-gray-400 mt-1">
                      Request: {data.data.request_id}
                    </div>
                  )}
                </div>
              </div>,
              { 
                duration: 5000,
                style: {
                  background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
                  border: '1px solid #10b981',
                  color: 'white',
                },
              }
            );
          } else if (status.includes('error') || status.includes('failed')) {
            // Error notification with broker name
            toast.error(
              <div className="flex items-center gap-3">
                <div className="text-2xl">🤖</div>
                <div>
                  <div className="font-semibold text-white">
                    EA Trade Failed
                  </div>
                  <div className="text-sm text-gray-300">
                    {accountInfo.brokerName} • {message}
                  </div>
                </div>
              </div>,
              { 
                duration: 6000,
                style: {
                  background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
                  border: '1px solid #ef4444',
                  color: 'white',
                },
              }
            );
          } else {
            // Info notification for other statuses (queued, pending, etc.) with broker name
            toast(
              <div className="flex items-center gap-3">
                <div className="text-2xl">🤖</div>
                <div>
                  <div className="font-semibold text-white">
                    EA Processing Trade
                  </div>
                  <div className="text-sm text-gray-300">
                    {accountInfo.brokerName} • {message}
                  </div>
                </div>
              </div>,
              { 
                duration: 4000,
                style: {
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%)',
                  border: '1px solid #3b82f6',
                  color: 'white',
                },
              }
            );
          }
        }
      });
      
      eaWebSocket.on('account_update', (data) => {
        console.log('EA account update:', data);
        
        // Get account info for notification
        const accountInfo = getAccountInfo(data.account_id);
        
        // Optional: Show subtle notification for significant account changes
        if (data.data && data.data.balance_change && Math.abs(data.data.balance_change) > 10) {
          const change = data.data.balance_change;
          const isProfit = change > 0;
          
          toast(
            <div className="flex items-center gap-3">
              <div className="text-lg">{isProfit ? '💰' : '📊'}</div>
              <div>
                <div className="font-semibold text-white">
                  Account Update
                </div>
                <div className={`text-sm ${isProfit ? 'text-green-400' : 'text-yellow-400'}`}>
                  {accountInfo.brokerName} • Balance {isProfit ? '+' : ''}{change.toFixed(2)}
                </div>
              </div>
            </div>,
            { 
              duration: 3000,
              style: {
                background: 'linear-gradient(135deg, #374151 0%, #4b5563 100%)',
                border: `1px solid ${isProfit ? '#10b981' : '#f59e0b'}`,
                color: 'white',
              },
            }
          );
        }
      });
      
      eaWebSocket.on('position_update', (data) => {
        console.log('EA position update:', data);
        
        // Get account info for notification
        const accountInfo = getAccountInfo(data.account_id);
        
        // Show notification for position open/close events
        if (data.data && (data.data.event === 'position_opened' || data.data.event === 'position_closed')) {
          const isOpen = data.data.event === 'position_opened';
          const symbol = data.data.symbol || 'Symbol';
          const volume = data.data.volume || 0;
          const profit = data.data.profit || 0;
          
          toast(
            <div className="flex items-center gap-3">
              <div className="text-lg">{isOpen ? '🎯' : (profit >= 0 ? '✅' : '❌')}</div>
              <div>
                <div className="font-semibold text-white">
                  Position {isOpen ? 'Opened' : 'Closed'}
                </div>
                <div className="text-sm text-gray-300">
                  {accountInfo.brokerName} • {symbol} • {volume} lots
                  {!isOpen && profit !== 0 && (
                    <span className={`ml-2 ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {profit >= 0 ? '+' : ''}{profit.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>,
            { 
              duration: 4000,
              style: {
                background: 'linear-gradient(135deg, #374151 0%, #4b5563 100%)',
                border: `1px solid ${isOpen ? '#3b82f6' : (profit >= 0 ? '#10b981' : '#ef4444')}`,
                color: 'white',
              },
            }
          );
        }
      });
      
      eaWebSocket.on('price_update', (data) => {
        console.log('EA price update:', data);
      });
      
      eaWebSocket.on('error', (error) => {
        console.error('EA WebSocket error:', error);
      });
      
      eaWebSocket.on('disconnected', () => {
        console.log('EA WebSocket disconnected');
      });
      
      // Cleanup on unmount or authentication change
      return () => {
        console.log('Disconnecting EA WebSocket');
        eaWebSocket.disconnect();
      };
    }
  }, [isAuthenticated, user?.id]);
  
  // Check if we're on a public route
  const isPublicRoute = ['/', '/signin', '/signup'].includes(location.pathname);
  
  // Show sidebar and navbar only when authenticated and not on public routes
  const showNavigation = isAuthenticated && !isPublicRoute;

  return (
    <ToastProvider>
      <ConfirmProvider>
        <TradingSymbolProvider>
          {/* Add react-hot-toast Toaster component */}
          <Toaster
            position="top-center"
            reverseOrder={false}
            gutter={8}
            containerClassName="toast-container"
            containerStyle={{}}
            toastOptions={{
              // Default options for all toasts
              className: '',
              duration: 5000,
              style: {
                background: '#1A1A1A',
                color: '#FFFFFF',
                border: '1px solid #333',
              },
              // Default options for specific types of toast
              success: {
                duration: 6000,
                style: {
                  background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                  border: '1px solid #10b981',
                },
              },
              error: {
                duration: 8000,
                style: {
                  background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
                  border: '1px solid #dc2626',
                },
              },
              loading: {
                duration: Infinity,
                style: {
                  background: '#1A1A1A',
                  border: '1px solid #3b82f6',
                },
              },
            }}
          />
          <div className="flex h-screen bg-[#0A0A0A]">
            {showNavigation && (
              <Sidebar 
                isMobileMenuOpen={isMobileMenuOpen} 
                setIsMobileMenuOpen={setIsMobileMenuOpen} 
              />
            )}
            <div className="flex-1 flex flex-col overflow-hidden">
              {showNavigation && (
                <Navbar 
                  isMobileMenuOpen={isMobileMenuOpen} 
                  setIsMobileMenuOpen={setIsMobileMenuOpen} 
                />
              )}
              <main className={`flex-1 overflow-auto ${showNavigation ? 'bg-[#0A0A0A]' : ''}`}>
                <Routes>
                  <Route path='/' element={<Hero />} />
                  <Route path='/signin' element={<SignIn />} />
                  <Route path='/signup' element={<SignUp />} />
                  <Route path='/dashboard' element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path='/ai-assistant' element={
                    <ProtectedRoute>
                      <AI_Assistant />
                    </ProtectedRoute>
                  } />
                  <Route path='/analyst-insights' element={
                    <ProtectedRoute>
                      <AnalystInsights />
                    </ProtectedRoute>
                  } />
                  <Route path='/strategy-lab' element={
                    <ProtectedRoute>
                      <StrategyLab />
                    </ProtectedRoute>
                  } />
                  <Route path='/account-aggregation' element={
                    <ProtectedRoute>
                      <EnhancedAccountAggregation />
                    </ProtectedRoute>
                  } />
                  <Route path='/community' element={
                    <ProtectedRoute>
                      <Community />
                    </ProtectedRoute>
                  } />
                  <Route path='/research' element={
                    <ProtectedRoute>
                      <Research />
                    </ProtectedRoute>
                  } />
                  <Route path='/analytics' element={
                    <ProtectedRoute>
                      <Analytics />
                    </ProtectedRoute>
                  } />
                  <Route path='/settings' element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } />
                  <Route path='/support' element={
                    <ProtectedRoute>
                      <Support />
                    </ProtectedRoute>
                  } />
                  <Route path='/card-showcase' element={
                    <ProtectedRoute>
                      <CardShowcase />
                    </ProtectedRoute>
                  } />
                  <Route path='/transactions' element={
                    <ProtectedRoute>
                      <Transactions />
                    </ProtectedRoute>
                  } />
                  <Route path='/search' element={
                    <ProtectedRoute>
                      <Search />
                    </ProtectedRoute>
                  } />
                  <Route path='/graph-trade-demo' element={
                    <ProtectedRoute>
                      <GraphTradeDemoPage />
                    </ProtectedRoute>
                  } />
                </Routes>
              </main>
            </div>
          </div>
        </TradingSymbolProvider>
      </ConfirmProvider>
    </ToastProvider>
  )
}

export default App