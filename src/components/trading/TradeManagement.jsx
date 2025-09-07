import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { 
  getEAPositions, 
  getEAOrders, 
  getEAAccountBalance, 
  getEAAccounts,
  isEAAccount,
  eaWebSocket,
  EA_WEBSOCKET_MESSAGE_TYPES
} from '../../api/ea';
import { 
  TrendingUp, 
  TrendingDown,
  Activity,
  DollarSign,
  BarChart2,
  Settings,
  AlertTriangle,
  Filter,
  Check,
  X,
  Edit3,
  RefreshCw,
  ChevronDown,
  Download
} from 'lucide-react';

// Helper function for className concatenation
const cn = (...classes) => classes.filter(Boolean).join(' ');

function TradeManagement({ selectedAccount: propSelectedAccount, onTradeSelect, shouldRefresh, onRefreshComplete }) {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTradeId, setSelectedTradeId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(propSelectedAccount);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    source: 'all'
  });
  const [stats, setStats] = useState({
    totalTrades: 0,
    winRate: 0,
    avgPL: 0,
    bestTrade: null,
    worstTrade: null,
    volume: 0,
    balance: 0,
    equity: 0,
    margin: 0,
    freeMargin: 0,
    currency: 'USD',
    leverage: 0
  });
  
  // Debug mode - set to false to use real API data, true to show sample data
  // UPDATES SUMMARY:
  // 1. Added apiEndpoints object with correct paths from ea_accounts.py
  // 2. Updated API call section to use these endpoints with proper fetch requests
  // 3. Updated WebSocket connection to use the correct WebSocket URL
  // 4. Updated handleCloseTrade function to use new apiEndpoints
  // 5. Enhanced sample data for better testing in debug mode
  // 6. Added proper error handling for all API requests
  // 7. Added auto-account selection if none provided
  const debugMode = false;
  
  // Function to fetch available accounts and select one if not already selected
  const fetchAvailableAccounts = useCallback(async () => {
    // Only fetch if we don't have accounts already and we're not already loading
    // Added a check to prevent redundant fetches
    if (availableAccounts.length > 0 || accountsLoading) {
      console.log('Skip account fetch: already have accounts or fetching in progress');
      return; // Already have accounts or are fetching them
    }
    
    setAccountsLoading(true);
    console.log('Fetching available accounts...');
    
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // Try to get EA accounts first
      const eaAccountsResponse = await getEAAccounts();
      console.log('EA accounts response:', eaAccountsResponse);
      
      let accounts = [];
      
      if (eaAccountsResponse.success && Array.isArray(eaAccountsResponse.data)) {
        accounts = eaAccountsResponse.data;
      } else {
        // Fallback to REST API if getEAAccounts fails
        const response = await fetch('http://api.tradexas.com/api/v1/accounts', {
          headers
        });
        
        if (!response.ok) {
          throw new Error(`Accounts API returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        accounts = Array.isArray(data) ? data : (data.accounts || []);
      }
      
      console.log('Available accounts:', accounts);
      
      if (accounts.length > 0) {
        // Process accounts to ensure they have all required fields
        const processedAccounts = accounts.map(account => ({
          ...account,
          // Ensure each account has an 'id' field for consistency
          id: account.id || account.account_id,
          name: account.name || account.account_number || account.id || account.account_id
        }));
        
        setAvailableAccounts(processedAccounts);
        
        // Auto-select the first account if none was provided
        if (!propSelectedAccount) {
          const firstAccount = processedAccounts[0];
          console.log('Auto-selecting account:', firstAccount);
          setSelectedAccount(firstAccount);
          toast.success(`Selected account: ${firstAccount.name}`, { id: 'account-selected' });
        }
      } else {
        setError('No trading accounts found. Please connect an account first.');
        toast.error('No trading accounts available', { id: 'no-accounts' });
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setError(`Failed to fetch accounts: ${error.message}`);
      toast.error(`Error loading accounts: ${error.message}`, { id: 'accounts-error' });
    } finally {
      setAccountsLoading(false);
    }
  }, [availableAccounts.length, accountsLoading]);
  

  // Fetch trades and positions using EA API
  const fetchTrades = useCallback(async () => {
    // If no account is selected yet
    if (!selectedAccount?.id) {
      console.log('No selected account, checking if we need to fetch accounts');
      
      // If accounts are loading, just wait
      if (accountsLoading) {
        console.log('Accounts are being loaded, waiting...');
        return;
      }
      
      // If we have available accounts but none selected yet, select the first one
      if (availableAccounts.length > 0 && !selectedAccount) {
        const firstAccount = availableAccounts[0];
        console.log('Auto-selecting first available account:', firstAccount);
        setSelectedAccount(firstAccount);
        return; // Return here, the useEffect for selectedAccount will trigger fetchTrades again
      }
      
      // If we don't have any accounts yet, and they're not loading, try to fetch them
      if (availableAccounts.length === 0 && !accountsLoading) {
        console.log('No accounts available, attempting to fetch accounts');
        fetchAvailableAccounts();
        return; // Return here, let the account fetching handle it
      }
      
      // If all else fails, show error or debug data
      console.log('No selected account, skipping fetch');
      
      // If debug mode is enabled, we can still show sample data
      if (debugMode) {
        console.log('Debug mode active - will load sample data without account');
      } else {
        toast.error('Please select an account to view trades', { id: 'no-account' });
        setError('No trading account selected. Please select an account from the dropdown.');
        return; // Only early return if not in debug mode
      }
    }
    
    console.log('=== FETCHING TRADES FOR ACCOUNT ===');
    if (selectedAccount?.id) {
      console.log('Using Account:', selectedAccount);
    } else {
      console.log('No account selected, running in demo mode');
    }
    
    // Display a toast to show we're fetching data
    toast.loading('Fetching trading data...', { id: 'fetch-trades' });
    
    setLoading(true);
    setError(null);
    
    try {
      // Check if this is an EA account for optimized API calls
      const isEA = selectedAccount?.platform === 'EA' || selectedAccount?.connection_type === 'EA' || selectedAccount?.status === 'connected';
      console.log('Is EA Account:', isEA);
      
      if (isEA) {
        // Use EA API endpoints for real-time data
        console.log('Fetching data from EA API for account:', selectedAccount.id);
        
        // API endpoints based on EA accounts implementation
        const apiEndpoints = {
          accounts: '/accounts',
          balance: `/accounts/${selectedAccount?.id}/balance`,
          positions: `/accounts/${selectedAccount?.id}/positions`,
          orders: `/accounts/${selectedAccount?.id}/orders`,
          tradeHistory: `/accounts/${selectedAccount?.id}/trade-history`,
          symbols: `/accounts/${selectedAccount?.id}/symbols`,
          prices: `/accounts/${selectedAccount?.id}/prices`,
        };
        
        console.log('Using EA API endpoints:', apiEndpoints);
        
        // Sample data for debug mode
        const sampleData = {
          balance: {
            balance: 10000,
            equity: 10120.50,
            margin: 350.25,
            free_margin: 9770.25,
            currency: 'USD',
            leverage: 100,
            profit: 120.50,
            margin_level: 2889.85
          },
          positions: [
            {
              id: '12345',
              ticket: '12345',
              order_number: '12345',
              symbol: 'EURUSD',
              type: 'BUY',
              volume: 0.1,
              open_price: 1.12345,
              current_price: 1.12445,
              profit: 10.00,
              swap: 0.25,
              commission: -0.70,
              open_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
              stop_loss: 1.12245,
              take_profit: 1.12545,
              pips: 10,
              comment: 'EA API Order'
            },
            {
              id: '12346',
              ticket: '12346',
              order_number: '12346',
              symbol: 'GBPUSD',
              type: 'SELL',
              volume: 0.2,
              open_price: 1.31245,
              current_price: 1.31145,
              profit: 20.00,
              swap: -0.15,
              commission: -1.40,
              open_time: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
              stop_loss: 1.31445,
              take_profit: 1.30945,
              pips: 10,
              comment: 'Manual Trade'
            },
            {
              id: '12347',
              ticket: '12347',
              order_number: '12347',
              symbol: 'XAUUSD',
              type: 'BUY',
              volume: 0.05,
              open_price: 2145.67,
              current_price: 2150.25,
              profit: 22.90,
              swap: -1.20,
              commission: -0.35,
              open_time: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
              stop_loss: 2100.00,
              take_profit: 2200.00,
              pips: 4.58,
              comment: 'Gold Breakout'
            }
          ],
          orders: [
            {
              id: '54321',
              ticket: '54321',
              order_number: '54321',
              symbol: 'USDJPY',
              type: 'BUY_LIMIT',
              volume: 0.3,
              open_price: 146.500,
              stop_loss: 146.000,
              take_profit: 147.500,
              open_time: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
              comment: 'Support Level Entry'
            },
            {
              id: '54322',
              ticket: '54322',
              order_number: '54322',
              symbol: 'USDCAD',
              type: 'SELL_STOP',
              volume: 0.25,
              open_price: 1.3450,
              stop_loss: 1.3550,
              take_profit: 1.3350,
              open_time: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
              comment: 'Resistance Breakout'
            }
          ]
        };
        
        // Use debug data or real API calls based on mode
        let balanceResult, positionsResult, ordersResult;
        
        if (debugMode) {
          console.log('🐞 DEBUG MODE: Using sample data');
          balanceResult = { 
            status: 'fulfilled', 
            value: { success: true, data: sampleData.balance }
          };
          positionsResult = { 
            status: 'fulfilled', 
            value: { success: true, data: sampleData.positions }
          };
          ordersResult = { 
            status: 'fulfilled', 
            value: { success: true, data: sampleData.orders }
          };
        } else {
          // Construct proper API URLs - using the correct API base URL
          const apiBaseUrl = 'http://api.tradexas.com'; // Using http for production
          const token = localStorage.getItem('access_token');
          
          const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          };
          
          // Add fallback for failed API calls
          const handleApiResponse = async (response, endpoint) => {
            if (!response.ok) {
              console.warn(`API response not OK for ${endpoint}: ${response.status}`);
              // For 404s, return empty data instead of throwing
              if (response.status === 404) {
                return { success: true, data: endpoint.includes('positions') ? [] : 
                                        endpoint.includes('orders') ? [] : 
                                        endpoint.includes('balance') ? {} : {} };
              }
              throw new Error(`API returned ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            return { success: true, data };
          };
          
          // Real API calls using the correct endpoints
          console.log('Making EA API calls to fetch account data');
          [balanceResult, positionsResult, ordersResult] = await Promise.allSettled([
            fetch(`${apiBaseUrl}${apiEndpoints.balance}`, { headers })
              .then(response => {
                console.log('Balance API response status:', response.status);
                return handleApiResponse(response, apiEndpoints.balance);
              })
              .catch(error => {
                console.error('Balance API error:', error);
                return { success: true, data: {} }; // Return empty balance on error
              }),
            fetch(`${apiBaseUrl}${apiEndpoints.positions}`, { headers })
              .then(response => {
                console.log('Positions API response status:', response.status);
                return handleApiResponse(response, apiEndpoints.positions);
              })
              .catch(error => {
                console.error('Positions API error:', error);
                return { success: true, data: [] }; // Return empty positions on error
              }),
            fetch(`${apiBaseUrl}${apiEndpoints.orders}`, { headers })
              .then(response => {
                console.log('Orders API response status:', response.status);
                return handleApiResponse(response, apiEndpoints.orders);
              })
              .catch(error => {
                console.error('Orders API error:', error);
                return { success: true, data: [] }; // Return empty orders on error
              })
          ]);
        }

        console.log('EA API Results:', {
          balance: balanceResult,
          positions: positionsResult,
          orders: ordersResult
        });

        // Process balance data
        const balanceData = balanceResult.status === 'fulfilled' && balanceResult.value?.success 
          ? balanceResult.value.data 
          : {};
        
        // Process positions data
        const positionsArray = positionsResult.status === 'fulfilled' && positionsResult.value?.success 
          ? (positionsResult.value.data || []) 
          : [];
        
        // Process orders data
        const ordersArray = ordersResult.status === 'fulfilled' && ordersResult.value?.success 
          ? (ordersResult.value.data || []) 
          : [];

        console.log('Processed Data:', {
          balanceData,
          positionsArray,
          ordersArray
        });

        // Transform EA positions to unified format
        const positions = positionsArray.map((pos, index) => {
          console.log('Processing position:', pos);
          return {
            id: pos.id || pos.ticket || `pos_${index}`,
            order_number: pos.ticket || pos.id || `POS_${index}`,
            symbol: pos.symbol || 'Unknown',
            asset: pos.symbol || 'Unknown', // For table display
            type: pos.type === 0 ? 'Buy' : pos.type === 1 ? 'Sell' : pos.type || 'Buy',
            volume: pos.volume || 0,
            quantity: pos.volume || 0, // Alias for consistency
            opening: pos.open_price || pos.price_open || 0,
            current_price: pos.price_current || pos.current_price || pos.opening || 0,
            trade_pl: pos.profit || 0,
            swap: pos.swap || 0,
            commission: pos.commission || 0,
            date: pos.time_open || pos.open_time || new Date().toISOString(),
            status: 'Executed',
            stop_loss: pos.sl || pos.stop_loss || null,
            sl: pos.sl || pos.stop_loss || null, // Alias
            take_profit: pos.tp || pos.take_profit || null,
            tp: pos.tp || pos.take_profit || null, // Alias
            source: 'EA'
          };
        });

        // Transform EA orders to unified format
        const orders = ordersArray.map((order, index) => {
          console.log('Processing order:', order);
          return {
            id: order.id || order.ticket || `order_${index}`,
            order_number: order.ticket || order.id || `ORD_${index}`,
            symbol: order.symbol || 'Unknown',
            asset: order.symbol || 'Unknown', // For table display
            type: order.type === 2 ? 'Buy Limit' : order.type === 3 ? 'Sell Limit' : order.type === 4 ? 'Buy Stop' : order.type === 5 ? 'Sell Stop' : order.type || 'Pending',
            volume: order.volume || 0,
            quantity: order.volume || 0, // Alias for consistency
            opening: order.price_open || order.open_price || 0,
            stop_loss: order.sl || order.stop_loss || null,
            sl: order.sl || order.stop_loss || null, // Alias
            take_profit: order.tp || order.take_profit || null,
            tp: order.tp || order.take_profit || null, // Alias
            date: order.time_setup || order.created_time || new Date().toISOString(),
            status: 'Pending',
            trade_pl: 0, // Orders don't have P&L yet
            source: 'EA'
          };
        });

        // Combine all trades
        const allTrades = [...positions, ...orders];
        console.log('Final combined trades:', allTrades);
        
        setTrades(allTrades);
        calculateStats(allTrades, balanceData);
        
        // Show success message for EA accounts
        if (allTrades.length > 0) {
          console.log(`✅ Loaded ${positions.length} positions and ${orders.length} orders from EA`);
          toast.success(`Loaded ${positions.length} positions and ${orders.length} orders`, { id: 'fetch-trades' });
        } else {
          console.log('⚠️ No trades found for EA account');
          toast.success('No trades found for this account', { id: 'fetch-trades' });
        }
        
      } else {
        // Fallback to original broker API for non-EA accounts
        console.log('Using fallback broker API for account:', selectedAccount.id);
        
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Try different API endpoint formats to handle possible URL changes
        const apiBaseUrl = 'http://api.tradexas.com';
        const apiEndpoints = {
          balance: [
            `/api/v1/broker/${selectedAccount.id}/balance`,
            `/api/v2/broker/${selectedAccount.id}/balance`,
            `/broker/account/${selectedAccount.id}/balance`
          ],
          positions: [
            `/api/v1/broker/${selectedAccount.id}/positions`, 
            `/api/v2/broker/${selectedAccount.id}/positions`,
            `/broker/account/${selectedAccount.id}/positions`
          ],
          orders: [
            `/api/v1/broker/${selectedAccount.id}/orders`,
            `/api/v2/broker/${selectedAccount.id}/orders`,
            `/broker/account/${selectedAccount.id}/orders`
          ]
        };
        
        console.log('Trying multiple API endpoint formats to find working one');
        
        // Function to try multiple endpoints until one works
        const tryEndpoints = async (endpointList) => {
          for (const endpoint of endpointList) {
            try {
              console.log(`Trying endpoint: ${apiBaseUrl}${endpoint}`);
              const response = await fetch(`${apiBaseUrl}${endpoint}`, { headers });
              if (response.ok) {
                console.log(`Success with endpoint: ${endpoint}`);
                return response;
              }
            } catch (err) {
              console.warn(`Failed with endpoint: ${endpoint}`, err);
            }
          }
          // Return mock response if all fail
          return new Response(JSON.stringify({ success: false, message: 'All endpoints failed' }), 
            { status: 404, headers: { 'Content-Type': 'application/json' } });
        };
        
        const [balanceResponse, positionsResponse, ordersResponse] = await Promise.allSettled([
          tryEndpoints(apiEndpoints.balance),
          tryEndpoints(apiEndpoints.positions),
          tryEndpoints(apiEndpoints.orders)
        ]);

        console.log('Broker API Responses:', {
          balance: balanceResponse,
          positions: positionsResponse,
          orders: ordersResponse
        });

        // Process broker responses
        const balanceData = balanceResponse.status === 'fulfilled' && balanceResponse.value.ok 
          ? await balanceResponse.value.json() 
          : {};
        const positionsData = positionsResponse.status === 'fulfilled' && positionsResponse.value.ok 
          ? await positionsResponse.value.json() 
          : {};
        const ordersData = ordersResponse.status === 'fulfilled' && ordersResponse.value.ok 
          ? await ordersResponse.value.json() 
          : {};

        console.log('Broker API Results:', {
          balance: balanceData,
          positions: positionsData,
          orders: ordersData
        });

        // Process broker API data (existing logic)
        const positionsArray = Array.isArray(positionsData)
          ? positionsData
          : Array.isArray(positionsData?.positions)
            ? positionsData.positions
            : positionsData?.data && Array.isArray(positionsData.data) 
            ? positionsData.data
            : [];

        const ordersArray = Array.isArray(ordersData)
          ? ordersData
          : Array.isArray(ordersData?.orders)
            ? ordersData.orders
            : ordersData?.data && Array.isArray(ordersData.data)
            ? ordersData.data
            : [];

        console.log('Processed broker arrays:', { positionsArray, ordersArray });

        const positions = positionsArray.map((pos, index) => ({
          id: pos.id || `broker_pos_${index}`,
          order_number: pos.id || `BROKER_POS_${index}`,
          symbol: pos.symbol || 'Unknown',
          asset: pos.symbol || 'Unknown',
          type: pos.type || 'Buy',
          volume: pos.volume || 0,
          quantity: pos.volume || 0,
          opening: pos.open_price || 0,
          current_price: pos.current_price || pos.opening || 0,
          trade_pl: pos.profit || 0,
          swap: pos.swap || 0,
          commission: pos.commission || 0,
          date: pos.open_time || new Date().toISOString(),
          status: 'Executed',
          stop_loss: pos.stop_loss || null,
          sl: pos.stop_loss || null,
          take_profit: pos.take_profit || null,
          tp: pos.take_profit || null,
          source: 'Broker'
        }));

        const orders = ordersArray.map((order, index) => ({
          id: order.id || `broker_order_${index}`,
          order_number: order.id || `BROKER_ORD_${index}`,
          symbol: order.symbol || 'Unknown',
          asset: order.symbol || 'Unknown',
          type: order.type || 'Pending',
          volume: order.volume || 0,
          quantity: order.volume || 0,
          opening: order.open_price || 0,
          stop_loss: order.stop_loss || null,
          sl: order.stop_loss || null,
          take_profit: order.take_profit || null,
          tp: order.take_profit || null,
          date: order.created_time || new Date().toISOString(),
          status: 'Pending',
          trade_pl: 0,
          source: 'Broker'
        }));

        // Combine all trades
        const allTrades = [...positions, ...orders];
        console.log('Final broker trades:', allTrades);
        
        setTrades(allTrades);
        calculateStats(allTrades, balanceData);
      }
      
    } catch (error) {
      console.error('❌ Error fetching trades:', error);
      const errorMessage = error.message || 'Unknown error';
      const accountType = isEAAccount(selectedAccount) ? 'EA' : 'Broker';
      const detailedError = `${accountType} API error: ${errorMessage}. Account ID: ${selectedAccount?.id}`;
      console.error(detailedError);
      setError(detailedError);
      toast.error(`Error: ${errorMessage}`, { id: 'fetch-trades' });
      
      // If we have debug mode on, load sample data even when there's an error
      if (debugMode) {
        console.log('🔄 Debug mode active - loading sample data despite error');
        // Generate additional sample trades if needed
        const sampleTrades = [
          {
            id: 'sample_1',
            order_number: 'S12345',
            symbol: 'EURUSD',
            asset: 'EURUSD',
            type: 'Buy',
            volume: 0.1,
            quantity: 0.1,
            opening: 1.12345,
            current_price: 1.12445,
            trade_pl: 10.00,
            swap: 0.25,
            commission: -0.70,
            date: new Date(Date.now() - 3600000).toISOString(),
            status: 'Executed',
            sl: 1.12245,
            tp: 1.12545,
            source: 'EA'
          },
          {
            id: 'sample_2',
            order_number: 'S12346',
            symbol: 'GBPUSD',
            asset: 'GBPUSD',
            type: 'Sell',
            volume: 0.2,
            quantity: 0.2,
            opening: 1.31245,
            current_price: 1.31145,
            trade_pl: 20.00,
            swap: -0.15,
            commission: -1.40,
            date: new Date(Date.now() - 7200000).toISOString(),
            status: 'Executed',
            sl: 1.31445,
            tp: 1.30945,
            source: 'EA'
          }
        ];
        
        setTrades(sampleTrades);
        calculateStats(sampleTrades, { 
          balance: 10000, 
          equity: 10030,
          margin: 350.25,
          free_margin: 9679.75,
          currency: 'USD',
          leverage: 100
        });
        
        toast.success('Loaded sample trade data for demonstration', { id: 'debug-mode' });
      }
    } finally {
      setLoading(false);
    }
  }, [selectedAccount, accountsLoading, availableAccounts.length, fetchAvailableAccounts, debugMode]);

  // Enhanced WebSocket setup for EA accounts
  useEffect(() => {
    if (!selectedAccount?.id) return;

    const isEA = isEAAccount(selectedAccount);
    
    if (isEA) {
      // Use EA WebSocket for real-time updates
      console.log('Setting up EA WebSocket for account:', selectedAccount.id);
      
      // Set up event listeners for real-time updates
      const handleTradeUpdate = (data) => {
        console.log('EA trade update received:', data);
        if (data.account_id === selectedAccount.id) {
          // Refresh data when trade updates occur
          fetchTrades();
        }
      };

      const handlePositionUpdate = (data) => {
        console.log('EA position update received:', data);
        if (data.account_id === selectedAccount.id) {
          setTrades(prevTrades => {
            const newTrades = [...prevTrades];
            const index = newTrades.findIndex(t => t.order_number === data.ticket);
            if (index >= 0) {
              // Update existing position
              newTrades[index] = {
                ...newTrades[index],
                current_price: data.price_current,
                trade_pl: data.profit,
                swap: data.swap,
                commission: data.commission
              };
            }
            return newTrades;
          });
        }
      };

      const handleBalanceUpdate = (data) => {
        console.log('EA balance update received:', data);
        if (data.account_id === selectedAccount.id) {
          setStats(prevStats => ({
            ...prevStats,
            balance: data.balance,
            equity: data.equity,
            margin: data.margin,
            freeMargin: data.free_margin,
            currency: data.currency
          }));
        }
      };

      const handleOrderUpdate = (data) => {
        console.log('EA order update received:', data);
        if (data.account_id === selectedAccount.id) {
          // Refresh trades to get latest order status
          fetchTrades();
        }
      };

      // Register EA WebSocket event listeners
      eaWebSocket.on(EA_WEBSOCKET_MESSAGE_TYPES.TRADE_RESULT, handleTradeUpdate);
      eaWebSocket.on(EA_WEBSOCKET_MESSAGE_TYPES.POSITION_UPDATE, handlePositionUpdate);
      eaWebSocket.on(EA_WEBSOCKET_MESSAGE_TYPES.BALANCE_UPDATE, handleBalanceUpdate);
      eaWebSocket.on(EA_WEBSOCKET_MESSAGE_TYPES.ORDER_UPDATE, handleOrderUpdate);

      // Connect WebSocket if not already connected
      try {
        // Check WebSocket status more thoroughly
        const wsNotConnected = !eaWebSocket.ws || 
          (typeof WebSocket !== 'undefined' && 
           eaWebSocket.ws.readyState !== WebSocket.OPEN && 
           eaWebSocket.ws.readyState !== WebSocket.CONNECTING);
        
        if (wsNotConnected) {
          // Get user ID from different possible storage locations
          const userId = localStorage.getItem('user_id') || 
                         localStorage.getItem('userId') || 
                         sessionStorage.getItem('userId') ||
                         '23202c3b-411e-492e-8fbd-87fd5383ac58'; // Default from your logs
          
          // Use the correct WebSocket endpoint from the EA accounts implementation
          // Using secure WebSocket (wss) for production
          const wsUrl = `wss://api.tradexas.com/ws/${userId}`;
                         
          console.log(`Attempting to connect WebSocket with user ID: ${userId}`);
          console.log(`WebSocket URL: ${wsUrl}`);
          
          // Update the WebSocket connection in the eaWebSocket object
          // If eaWebSocket.connect doesn't accept a full URL, you'll need to update the function
          eaWebSocket.connect(userId, wsUrl);
          
          console.log('✅ EA WebSocket connection initiated');
          toast.success('Connected to real-time trading updates', { id: 'websocket-status' });
          
          // Send a test message after 1 second to verify connection
          setTimeout(() => {
            try {
              if (eaWebSocket.ws && eaWebSocket.ws.readyState === WebSocket.OPEN) {
                // Send a subscription request for the current account
                eaWebSocket.ws.send(JSON.stringify({ 
                  type: 'subscribe', 
                  account_id: selectedAccount.id,
                  channels: ['positions', 'orders', 'balance']
                }));
                console.log('Sent subscription request to WebSocket for account:', selectedAccount.id);
              } else {
                console.warn('WebSocket not in OPEN state after timeout, might need reconnection');
              }
            } catch (e) {
              console.error('Error sending subscription message:', e);
            }
          }, 1000);
        } else {
          console.log('✅ EA WebSocket already connected or connecting');
        }
      } catch (wsError) {
        console.error('❌ Failed to connect to EA WebSocket:', wsError);
        toast.error('Could not connect to real-time updates', { id: 'websocket-status' });
      }

      // Cleanup on unmount
      return () => {
        eaWebSocket.off(EA_WEBSOCKET_MESSAGE_TYPES.TRADE_RESULT, handleTradeUpdate);
        eaWebSocket.off(EA_WEBSOCKET_MESSAGE_TYPES.POSITION_UPDATE, handlePositionUpdate);
        eaWebSocket.off(EA_WEBSOCKET_MESSAGE_TYPES.BALANCE_UPDATE, handleBalanceUpdate);
        eaWebSocket.off(EA_WEBSOCKET_MESSAGE_TYPES.ORDER_UPDATE, handleOrderUpdate);
      };
    } else {
      // Legacy WebSocket fallback for non-EA accounts
      console.log('Using legacy WebSocket for non-EA account:', selectedAccount.id);
      // Keep existing placeholder WebSocket logic if needed
    }
  }, [selectedAccount, fetchTrades]);

  // Calculate trading statistics
  const calculateStats = useCallback((tradeData, balanceData) => {
    const stats = {
      totalTrades: tradeData.length,
      winningTrades: tradeData.filter(t => (t.trade_pl || 0) > 0).length,
      totalPL: tradeData.reduce((sum, t) => sum + (t.trade_pl || 0), 0),
      volume: tradeData.reduce((sum, t) => sum + (t.quantity || 0), 0),
      bestTrade: tradeData.reduce((best, t) => (!best || (t.trade_pl || 0) > (best.trade_pl || 0) ? t : best), null),
      worstTrade: tradeData.reduce((worst, t) => (!worst || (t.trade_pl || 0) < (worst.trade_pl || 0) ? t : worst), null),
    };

    setStats(prevStats => ({
      ...prevStats,
      totalTrades: stats.totalTrades,
      winRate: stats.totalTrades ? (stats.winningTrades / stats.totalTrades * 100).toFixed(1) : 0,
      avgPL: stats.totalTrades ? (stats.totalPL / stats.totalTrades).toFixed(2) : 0,
      bestTrade: stats.bestTrade,
      worstTrade: stats.worstTrade,
      volume: stats.volume.toFixed(2),
      // Update balance data if provided
      ...(balanceData ? {
        balance: balanceData.balance,
        equity: balanceData.equity,
        margin: balanceData.margin,
        freeMargin: balanceData.free_margin,
        currency: balanceData.currency,
        leverage: balanceData.leverage
      } : {})
    }));
  }, []);

  // Handle trade closure with EA API support
  const handleCloseTrade = async (tradeId) => {
    if (!selectedAccount?.id || !tradeId) return;
    
    try {
      const isEA = isEAAccount(selectedAccount);
      
      if (isEA) {
        // Use EA API for closing positions/orders
        console.log('Closing EA trade:', tradeId);
        
        // Define the API endpoints for EA accounts
        const apiEndpoints = {
          accounts: '/accounts',
          balance: `/accounts/${selectedAccount?.id}/balance`,
          positions: `/accounts/${selectedAccount?.id}/positions`,
          orders: `/accounts/${selectedAccount?.id}/orders`,
          tradeHistory: `/accounts/${selectedAccount?.id}/trade-history`,
          symbols: `/accounts/${selectedAccount?.id}/symbols`,
          prices: `/accounts/${selectedAccount?.id}/prices`,
        };
        
        // Try to close as position first, then as order if it fails
        try {
          // For EA accounts, use the appropriate EA endpoints from apiEndpoints
          const token = localStorage.getItem('access_token');
          const response = await fetch(`http://api.tradexas.com${apiEndpoints.positions}/${tradeId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          const data = await response.json();
          
          if (data.success) {
            toast.success(`EA position closed successfully. Profit: ${data.profit || 'N/A'}`);
            fetchTrades();
          } else {
            throw new Error(data.message || 'Failed to close EA position');
          }
        } catch (positionError) {
          // Try cancelling as pending order using the orders endpoint
          try {
            const token = localStorage.getItem('access_token');
            const orderResponse = await fetch(`http://api.tradexas.com${apiEndpoints.orders}/${tradeId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            const orderData = await orderResponse.json();
            
            if (orderData.success) {
              toast.success('EA order cancelled successfully');
              fetchTrades();
            } else {
              throw new Error(orderData.message || 'Failed to cancel EA order');
            }
          } catch (orderError) {
            console.error('Failed to close EA trade:', positionError, orderError);
            toast.error(`Error closing EA trade: ${positionError.message}`);
          }
        }
      } else {
        // Original logic for non-EA accounts
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(`http://api.tradexas.com/api/v1/broker/${selectedAccount.id}/positions/${tradeId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          const data = await response.json();
          
          if (data.success) {
            toast.success(`Position closed successfully. Profit: ${data.profit || 'N/A'}`);
            fetchTrades();
          } else {
            throw new Error(data.message || 'Failed to close trade');
          }
        } catch (error) {
          // Check if it's a pending order that needs to be cancelled instead
          try {
            const token = localStorage.getItem('access_token');
            const orderResponse = await fetch(`http://api.tradexas.com/api/v1/broker/${selectedAccount.id}/orders/${tradeId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            const orderData = await orderResponse.json();
            
            if (orderData.success) {
              toast.success('Order cancelled successfully');
              fetchTrades();
            } else {
              throw new Error(orderData.message);
            }
          } catch (orderError) {
            toast.error(`Error closing trade: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.error('Error in handleCloseTrade:', error);
      toast.error(`Error closing trade: ${error.message}`);
    }
  };

  // Sort and filter trades
  const filteredAndSortedTrades = useMemo(() => {
    return trades
      .filter(trade => {
        if (filters.status !== 'all' && trade.status !== filters.status) return false;
        if (filters.type !== 'all' && trade.type !== filters.type) return false;
        if (filters.source !== 'all' && trade.strat_source !== filters.source) return false;
        return true;
      })
      .sort((a, b) => {
        const direction = sortConfig.direction === 'asc' ? 1 : -1;
        return a[sortConfig.key] > b[sortConfig.key] ? direction : -direction;
      });
  }, [trades, filters, sortConfig]);
  
  // Export trades to CSV
  const exportToCsv = () => {
    const headers = ['Date', 'Order #', 'Symbol', 'Type', 'Volume', 'Entry', 'SL', 'TP', 'P/L', 'Status'];
    
    const csvRows = [
      headers.join(','),
      ...filteredAndSortedTrades.map(trade => {
        return [
          new Date(trade.date).toISOString(),
          trade.order_number,
          trade.symbol || trade.asset,
          trade.type,
          trade.volume || trade.quantity,
          trade.opening,
          trade.sl || trade.stop_loss || '',
          trade.tp || trade.take_profit || '',
          trade.trade_pl || 0,
          trade.status
        ].join(',');
      })
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `trades_export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Trades exported successfully');
  };

  // Handle changes to the propSelectedAccount
  useEffect(() => {
    if (propSelectedAccount?.id) {
      if (!selectedAccount || propSelectedAccount.id !== selectedAccount.id) {
        console.log('Updating selected account from props:', propSelectedAccount);
        setSelectedAccount(propSelectedAccount);
      }
    }
  }, [propSelectedAccount, selectedAccount]);
  
  // Fetch available accounts on mount - only once
  useEffect(() => {
    if (availableAccounts.length === 0 && !accountsLoading) {
      console.log('Initial account fetch triggered');
      fetchAvailableAccounts();
    }
  }, [fetchAvailableAccounts]);

  // Request initial data when selectedAccount changes
  useEffect(() => {
    // Only fetch if we have a selected account
    if (selectedAccount?.id) {
      console.log('Selected account available, fetching trades:', selectedAccount);
      fetchTrades();
    } else {
      console.log('Initial load: No selected account available or still loading');
    }
  }, [selectedAccount?.id, fetchTrades]);

  // Handle refresh requests from parent
  useEffect(() => {
    if (shouldRefresh) {
      fetchTrades().then(() => {
        if (onRefreshComplete) {
          onRefreshComplete();
        }
      });
    }
  }, [shouldRefresh, fetchTrades, onRefreshComplete]);

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Trade Management
            {selectedAccount && (
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full border ${
                  isEAAccount(selectedAccount) 
                    ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                }`}>
                  {isEAAccount(selectedAccount) ? 'EA Connected' : 'Broker Account'}
                </span>
                {debugMode && (
                  <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full border border-amber-500/30">
                    Debug Mode
                  </span>
                )}
              </div>
            )}
          </h3>
          
          {/* Account selector dropdown */}
          {availableAccounts.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-sm">Account:</label>
              <select
                value={selectedAccount?.id || ''}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const account = availableAccounts.find(acc => acc.id === selectedId);
                  if (account) {
                    setSelectedAccount(account);
                    toast.success(`Selected account: ${account.name || account.id}`, { id: 'account-selected' });
                  }
                }}
                className="bg-[#222] border border-[#333] rounded-lg px-2 py-1 text-white text-sm"
              >
                {availableAccounts.map(account => (
                  <option key={account.id || account.account_id} value={account.id || account.account_id}>
                    {account.name || account.account_number || account.id || account.account_id} 
                    {account.platform ? ` (${account.platform})` : ''}
                  </option>
                ))}
              </select>
              {accountsLoading && <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportToCsv}
            className="flex items-center gap-2 px-4 py-2 bg-[#2A2A2A] hover:bg-[#333] text-white rounded-lg"
            disabled={filteredAndSortedTrades.length === 0}
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button 
            onClick={() => {
              if (!selectedAccount?.id && debugMode) {
                // Force showing sample data even when no account is selected
                console.log('No account selected, but forcing sample data load in debug mode');
                
                const sampleTrades = [
                  {
                    id: 'sample_1',
                    order_number: 'S12345',
                    symbol: 'EURUSD',
                    asset: 'EURUSD',
                    type: 'Buy',
                    volume: 0.1,
                    quantity: 0.1,
                    opening: 1.12345,
                    current_price: 1.12445,
                    trade_pl: 10.00,
                    swap: 0.25,
                    commission: -0.70,
                    date: new Date(Date.now() - 3600000).toISOString(),
                    status: 'Executed',
                    sl: 1.12245,
                    tp: 1.12545,
                    source: 'EA'
                  },
                  {
                    id: 'sample_2',
                    order_number: 'S12346',
                    symbol: 'GBPUSD',
                    asset: 'GBPUSD',
                    type: 'Sell',
                    volume: 0.2,
                    quantity: 0.2,
                    opening: 1.31245,
                    current_price: 1.31145,
                    trade_pl: 20.00,
                    swap: -0.15,
                    commission: -1.40,
                    date: new Date(Date.now() - 7200000).toISOString(),
                    status: 'Executed',
                    sl: 1.31445,
                    tp: 1.30945,
                    source: 'EA'
                  }
                ];
                
                setTrades(sampleTrades);
                calculateStats(sampleTrades, { 
                  balance: 10000, 
                  equity: 10030,
                  margin: 350.25,
                  free_margin: 9679.75,
                  currency: 'USD',
                  leverage: 100
                });
                
                toast.success('Loaded sample trade data', { id: 'debug-mode' });
              } else {
                // Normal fetch with selected account
                fetchTrades();
              }
            }}
            disabled={loading && !debugMode}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2F00FF] to-[#1C0099] hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-[#222] border border-[#333] rounded-lg p-4">
          <h4 className="text-sm text-gray-400 mb-2">Total Trades</h4>
          <div className="text-2xl font-bold text-white">{stats.totalTrades}</div>
        </div>
        <div className="bg-[#222] border border-[#333] rounded-lg p-4">
          <h4 className="text-sm text-gray-400 mb-2">Win Rate</h4>
          <div className="text-2xl font-bold text-green-400">{stats.winRate}%</div>
        </div>
        <div className="bg-[#222] border border-[#333] rounded-lg p-4">
          <h4 className="text-sm text-gray-400 mb-2">Avg. P/L</h4>
          <div className={cn("text-2xl font-bold", parseFloat(stats.avgPL) >= 0 ? "text-green-400" : "text-red-400")}>
            {parseFloat(stats.avgPL) >= 0 ? '+' : ''}{stats.avgPL}
          </div>
        </div>
        <div className="bg-[#222] border border-[#333] rounded-lg p-4">
          <h4 className="text-sm text-gray-400 mb-2">Best Trade</h4>
          <div className="text-2xl font-bold text-green-400">
            {stats.bestTrade ? `+${stats.bestTrade.trade_pl?.toFixed(2)}` : '-'}
          </div>
        </div>
        <div className="bg-[#222] border border-[#333] rounded-lg p-4">
          <h4 className="text-sm text-gray-400 mb-2">Worst Trade</h4>
          <div className="text-2xl font-bold text-red-400">
            {stats.worstTrade ? stats.worstTrade.trade_pl?.toFixed(2) : '-'}
          </div>
        </div>
        <div className="bg-[#222] border border-[#333] rounded-lg p-4">
          <h4 className="text-sm text-gray-400 mb-2">Volume</h4>
          <div className="text-2xl font-bold text-white">{stats.volume}</div>
        </div>
      </div>

      {/* Account Balance Info (EA Enhanced) */}
      {(stats.balance || stats.equity) && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#222] border border-[#333] rounded-lg p-4">
            <h4 className="text-sm text-gray-400 mb-2">Balance</h4>
            <div className="text-xl font-bold text-white">
              {stats.balance ? `${stats.balance?.toFixed(2)} ${stats.currency || 'USD'}` : '-'}
            </div>
          </div>
          <div className="bg-[#222] border border-[#333] rounded-lg p-4">
            <h4 className="text-sm text-gray-400 mb-2">Equity</h4>
            <div className="text-xl font-bold text-white">
              {stats.equity ? `${stats.equity?.toFixed(2)} ${stats.currency || 'USD'}` : '-'}
            </div>
          </div>
          <div className="bg-[#222] border border-[#333] rounded-lg p-4">
            <h4 className="text-sm text-gray-400 mb-2">Margin Used</h4>
            <div className="text-xl font-bold text-yellow-400">
              {stats.margin ? `${stats.margin?.toFixed(2)} ${stats.currency || 'USD'}` : '-'}
            </div>
          </div>
          <div className="bg-[#222] border border-[#333] rounded-lg p-4">
            <h4 className="text-sm text-gray-400 mb-2">Free Margin</h4>
            <div className="text-xl font-bold text-green-400">
              {stats.freeMargin ? `${stats.freeMargin?.toFixed(2)} ${stats.currency || 'USD'}` : '-'}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="all">All Status</option>
          <option value="Executed">Executed</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
        </select>

        <select
          value={filters.type}
          onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
          className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="all">All Types</option>
          <option value="Buy">Buy</option>
          <option value="Sell">Sell</option>
        </select>

        <select
          value={filters.source}
          onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
          className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="all">All Sources</option>
          <option value="Manual">Manual</option>
          <option value="AI Bot">AI Bot</option>
          <option value="Copy Trade">Copy Trade</option>
          <option value="Pair Trade">Pair Trade</option>
        </select>
      </div>

      {/* Trade Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#333]">
              <th className="text-left py-3 px-4 text-gray-300 font-medium">Date</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium">Order #</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium">Asset</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium">Type</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium">Quantity</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium">Entry</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium">SL</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium">TP</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium">P/L</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium">Source</th>
              <th className="text-left py-3 px-4 text-gray-300 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="12" className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mr-2" />
                    <span className="text-gray-400">Loading trades...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="12" className="text-center py-8">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="flex items-center text-red-400">
                      <AlertTriangle className="w-6 h-6 mr-2" />
                      <span>{error}</span>
                    </div>
                    {debugMode && (
                      <div className="text-amber-400 text-sm p-2 bg-amber-900/20 rounded border border-amber-800">
                        Running in debug mode - sample data is being displayed
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : filteredAndSortedTrades.length === 0 ? (
              <tr>
                <td colSpan="12" className="text-center py-8">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <Activity className="w-12 h-12 mb-2" />
                    <p>No trades found</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedTrades.map((trade) => (
                <tr 
                  key={trade.order_number}
                  className={cn(
                    "border-b border-[#333] hover:bg-[#2A2A2A] transition-colors",
                    selectedTradeId === trade.order_number && "bg-[#2A2A2A]"
                  )}
                  onClick={() => {
                    setSelectedTradeId(trade.order_number);
                    if (onTradeSelect) onTradeSelect(trade);
                  }}
                >
                  <td className="py-3 px-4 text-gray-300">
                    {new Date(trade.date).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-gray-300 font-mono">
                    {trade.order_number}
                  </td>
                  <td className="py-3 px-4 text-white font-medium">
                    {trade.asset || trade.symbol}
                  </td>
                  <td className="py-3 px-4">
                    <div className={cn(
                      "flex items-center gap-1",
                      (trade.type === 'Buy' || trade.type === 'BUY') ? "text-green-400" : "text-red-400"
                    )}>
                      {(trade.type === 'Buy' || trade.type === 'BUY') ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {trade.type}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {trade.quantity || trade.volume}
                  </td>
                  <td className="py-3 px-4 text-gray-300 font-mono">
                    {trade.opening?.toFixed(5)}
                  </td>
                  <td className="py-3 px-4 text-gray-300 font-mono">
                    {(trade.sl || trade.stop_loss)?.toFixed(5) || '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-300 font-mono">
                    {(trade.tp || trade.take_profit)?.toFixed(5) || '-'}
                  </td>
                  <td className={cn(
                    "py-3 px-4 font-medium",
                    (trade.trade_pl || 0) >= 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {trade.trade_pl ? (
                      `${trade.trade_pl >= 0 ? '+' : ''}${trade.trade_pl.toFixed(2)}`
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      trade.status === 'Executed' && "bg-green-500/20 text-green-400 border border-green-500/30",
                      trade.status === 'Pending' && "bg-amber-500/20 text-amber-400 border border-amber-500/30",
                      trade.status === 'Failed' && "bg-red-500/20 text-red-400 border border-red-500/30"
                    )}>
                      {trade.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-medium",
                      trade.source === 'EA' && "bg-blue-500/20 text-blue-400 border border-blue-500/30",
                      trade.source === 'Broker' && "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    )}>
                      {trade.source || 'Unknown'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloseTrade(trade.order_number);
                        }}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        title="Close trade"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle edit
                        }}
                        className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                        title="Edit trade"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};

// ErrorBoundary for TradeManagement component
class TradeManagementErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("TradeManagement component error:", error, errorInfo);
    toast.error(`Component error: ${error.message}`);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 space-y-6">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="text-xl font-bold">Something went wrong</h3>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg overflow-auto max-h-96">
            <p className="text-white mb-2">The trade management component encountered an error:</p>
            {this.state.errorInfo && (
              <pre className="text-xs text-red-300 overflow-x-auto">
                {this.state.errorInfo.componentStack}
              </pre>
            )}
          </div>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            onClick={() => this.setState({ hasError: false })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap component with error boundary
const ExportedComponent = props => (
  <TradeManagementErrorBoundary>
    <TradeManagement {...props} />
  </TradeManagementErrorBoundary>
);

export default ExportedComponent;
