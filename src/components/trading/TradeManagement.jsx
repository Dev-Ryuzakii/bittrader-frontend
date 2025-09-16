import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { 
  getEAPositions, 
  getEAOrders, 
  getEAAccountBalance, 
  getEAAccounts,
  closeEAPosition,
  cancelEAOrder,
  modifyEAPosition,
  modifyEAOrder,
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
  Download,
  ChevronRight,
  ChevronDown as ChevronDownIcon
} from 'lucide-react';
import PairTradeModifyModal from '../modals/PairTradeModifyModal';

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
  // State to track which pair trades are expanded
  const [expandedPairTrades, setExpandedPairTrades] = useState(new Set());
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
  
  
  // Modal state for position modifications
  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
  const [modifyingTrade, setModifyingTrade] = useState(null);
  const [modifyValues, setModifyValues] = useState({
    stopLoss: null,
    takeProfit: null
  });
  
  // State for pair trade modification modal
  const [isPairModifyModalOpen, setIsPairModifyModalOpen] = useState(false);
  const [modifyingPairTrade, setModifyingPairTrade] = useState(null);
  
  // Debug mode - set to false for production
  const debugMode = false;
  
  // We'll use the functions from ea.js instead of direct API calls
  // These paths are included for reference but we'll use the imported functions
  const API_CONFIG = {
    baseUrl: 'http://api.tradexas.com',
    paths: {
      // These paths match the structure in the ea.js module
      eaAccounts: '/api/v1/ea/accounts',
      eaBalance: (accountId) => `/api/v1/ea/accounts/${accountId}/balance`,
      eaPositions: (accountId) => `/api/v1/ea/accounts/${accountId}/positions`,
      eaOrders: (accountId) => `/api/v1/ea/accounts/${accountId}/orders`,
      eaTradeHistory: (accountId) => `/api/v1/ea/accounts/${accountId}/trade-history`,
      eaSymbols: (accountId) => `/api/v1/ea/accounts/${accountId}/symbols`,
      eaPrices: (accountId) => `/api/v1/ea/accounts/${accountId}/prices`,
      // Close position or order endpoints
      eaClosePosition: (accountId, positionId) => `/api/v1/ea/accounts/${accountId}/positions/${positionId}`,
      eaCloseOrder: (accountId, orderId) => `/api/v1/ea/accounts/${accountId}/orders/${orderId}`,
      // Broker API paths as fallback
      brokerBalance: (accountId) => `/api/v1/broker/${accountId}/balance`,
      brokerPositions: (accountId) => `/api/v1/broker/${accountId}/positions`,
      brokerOrders: (accountId) => `/api/v1/broker/${accountId}/orders`
    },
    websocket: {
      url: (userId) => `ws://api.tradexas.com/api/v1/ea/ws/${userId}`
    }
  };
  
  // Fetch the auth token
  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };
  
  // Function to fetch available accounts
  const fetchAvailableAccounts = useCallback(async () => {
    if (availableAccounts.length > 0 || accountsLoading) {
      console.log('Skip account fetch: already have accounts or fetching in progress');
      return;
    }
    
    setAccountsLoading(true);
    console.log('Fetching available accounts...');
    
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Use getEAAccounts from ea.js instead of direct fetch
      console.log('Fetching accounts using getEAAccounts from ea.js');
      const eaAccountsResponse = await getEAAccounts();
      console.log('EA accounts response:', eaAccountsResponse);
      
      let accounts = [];
      
      if (eaAccountsResponse.success && Array.isArray(eaAccountsResponse.data)) {
        accounts = eaAccountsResponse.data;
        console.log('EA accounts API response:', accounts);
      } else {
        // Fallback to the broker API
        console.log('EA accounts API failed, trying broker API...');
        const brokerResponse = await fetch(`${API_CONFIG.baseUrl}/api/v1/accounts`, {
          headers: getAuthHeaders()
        });
        
        if (brokerResponse.ok) {
          const brokerData = await brokerResponse.json();
          accounts = Array.isArray(brokerData) ? brokerData : (brokerData.accounts || []);
          console.log('Broker accounts API response:', brokerData);
        } else {
          throw new Error(`Accounts API returned ${brokerResponse.status}: ${brokerResponse.statusText}`);
        }
      }
      
      console.log('Available accounts:', accounts);
      
      if (accounts.length > 0) {
        // Process accounts to ensure they have all required fields
        const processedAccounts = accounts.map(account => ({
          ...account,
          id: account.id || account.account_id,
          // Use broker name as the display name if available
          name: account.broker || account.name || account.account_number || account.id || account.account_id
        }));
        
        setAvailableAccounts(processedAccounts);
        
        // Auto-select the first account if none was provided
        if (!propSelectedAccount) {
          const firstAccount = processedAccounts[0];
          console.log('Auto-selecting account:', firstAccount);
          setSelectedAccount(firstAccount);
          toast.success(
            <div>
              <p className="font-bold">Account Selected</p>
              <p>{firstAccount.broker || firstAccount.name} • {firstAccount.account_number || firstAccount.id}</p>
              {firstAccount.platform && <p className="text-xs text-gray-300">Platform: {firstAccount.platform}</p>}
            </div>,
            { id: 'account-selected' }
          );
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
  }, [availableAccounts.length, accountsLoading, propSelectedAccount]);
  
  // Enhanced API fetch function with retry and error handling
  const apiCall = useCallback(async (url, options = {}) => {
    const maxRetries = options.maxRetries || 2;
    const headers = options.headers || getAuthHeaders();
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        const response = await fetch(url, {
          ...options,
          headers
        });
        
        console.log(`API call to ${url} - status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        } else if (response.status === 404) {
          // For 404s, return empty data instead of throwing
          console.warn(`API endpoint not found: ${url}`);
          return { 
            success: false, 
            data: url.includes('positions') ? [] : 
                  url.includes('orders') ? [] : 
                  url.includes('balance') ? {} : {},
            status: 404,
            message: 'Endpoint not found'
          };
        } else if (response.status === 401 && attempt < maxRetries - 1) {
          // Handle potential token refresh for 401s
          console.warn('Authentication error, attempting to refresh token...');
          // You would implement token refresh logic here
          attempt++;
          continue;
        } else {
          // Other error
          const errorText = await response.text();
          return { 
            success: false, 
            status: response.status, 
            message: `API error: ${response.status} ${response.statusText}`,
            details: errorText
          };
        }
      } catch (error) {
        console.error(`Network error on attempt ${attempt + 1}:`, error);
        if (attempt === maxRetries - 1) {
          return { 
            success: false, 
            message: `Network error: ${error.message}`, 
            isNetworkError: true
          };
        }
        attempt++;
        // Exponential backoff
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }, []);

  // Fetch trades and positions
  const fetchTrades = useCallback(async () => {
    // If no account is selected yet
    if (!selectedAccount?.id) {
      console.log('No selected account, checking if we need to fetch accounts');
      
      if (accountsLoading) {
        console.log('Accounts are being loaded, waiting...');
        return;
      }
      
      if (availableAccounts.length > 0 && !selectedAccount) {
        const firstAccount = availableAccounts[0];
        console.log('Auto-selecting first available account:', firstAccount);
        setSelectedAccount(firstAccount);
        return;
      }
      
      if (availableAccounts.length === 0 && !accountsLoading) {
        console.log('No accounts available, attempting to fetch accounts');
        fetchAvailableAccounts();
        return;
      }
      
      console.log('No selected account, skipping fetch');
      toast.error('Please select an account to view trades', { id: 'no-account' });
      setError('No trading account selected. Please select an account from the dropdown.');
      return;
    }
    
    console.log('=== FETCHING TRADES FOR ACCOUNT ===');
    console.log('Using Account:', selectedAccount);
    
    toast.loading('Fetching trading data...', { id: 'fetch-trades' });
    
    setLoading(true);
    setError(null);
    
    try {
      const isEA = isEAAccount(selectedAccount);
      console.log('Is EA Account:', isEA);
      
      if (isEA) {
        // Use EA API endpoints for real-time data
        console.log('Fetching data from EA API for account:', selectedAccount.id);
        
        // Using imported functions from ea.js instead of direct API calls
        console.log('Using EA API functions from ea.js');
        
        // Make API calls in parallel using the imported functions
        const [balanceResult, positionsResult, ordersResult] = await Promise.all([
          getEAAccountBalance(selectedAccount.id).catch(error => ({
            success: false,
            error: error.message || 'Failed to fetch balance'
          })),
          getEAPositions(selectedAccount.id).catch(error => ({
            success: false,
            data: [],
            error: error.message || 'Failed to fetch positions'
          })),
          getEAOrders(selectedAccount.id).catch(error => ({
            success: false,
            data: [],
            error: error.message || 'Failed to fetch orders'
          }))
        ]);
        
        console.log('EA API Results:', {
          balance: balanceResult,
          positions: positionsResult,
          orders: ordersResult
        });

        // Process balance data
        const balanceData = balanceResult.success ? balanceResult.data : {};
        
        // Process positions data
        const positionsArray = positionsResult.success ? (positionsResult.data || []) : [];
        
        // Process orders data
        const ordersArray = ordersResult.success ? (ordersResult.data || []) : [];

        console.log('Processed Data:', {
          balanceData,
          positionsArray: positionsArray.length,
          ordersArray: ordersArray.length
        });

        // Transform EA positions to unified format
        const positions = positionsArray.map((pos, index) => {
          // For type conversion handling different formats (number or string)
          let tradeType = pos.type;
          if (typeof pos.type === 'number') {
            tradeType = pos.type === 0 ? 'Buy' : 'Sell';
          } else if (typeof pos.type === 'string') {
            // Convert from possible enum values
            tradeType = pos.type.toLowerCase().includes('buy') ? 'Buy' : 'Sell';
          }
          
          return {
            id: pos.id || pos.ticket || `pos_${index}`,
            order_number: pos.ticket || pos.id || `POS_${index}`,
            symbol: pos.symbol || 'Unknown',
            asset: pos.symbol || 'Unknown', // For table display
            type: tradeType,
            volume: parseFloat(pos.volume || 0),
            quantity: parseFloat(pos.volume || 0),
            opening: parseFloat(pos.open_price || pos.price_open || 0),
            current_price: parseFloat(pos.current_price || pos.price_current || pos.opening || 0),
            trade_pl: parseFloat(pos.profit || 0),
            swap: parseFloat(pos.swap || 0),
            commission: parseFloat(pos.commission || 0),
            date: pos.open_time || pos.time_open || new Date().toISOString(),
            status: 'Executed',
            stop_loss: parseFloat(pos.stop_loss || pos.sl || 0) || null,
            sl: parseFloat(pos.stop_loss || pos.sl || 0) || null,
            take_profit: parseFloat(pos.take_profit || pos.tp || 0) || null,
            tp: parseFloat(pos.take_profit || pos.tp || 0) || null,
            source: 'EA',
            comment: pos.comment || ''
          };
        });

        // Transform EA orders to unified format
        const orders = ordersArray.map((order, index) => {
          // Map order types from different possible formats
          let orderType = order.type;
          if (typeof order.type === 'number') {
            // MT5 order types: 2=BUY_LIMIT, 3=SELL_LIMIT, 4=BUY_STOP, 5=SELL_STOP
            const orderTypeMap = {
              2: 'Buy Limit',
              3: 'Sell Limit',
              4: 'Buy Stop', 
              5: 'Sell Stop'
            };
            orderType = orderTypeMap[order.type] || 'Pending';
          } else if (typeof order.type === 'string') {
            // Convert from string types
            const typeStr = order.type.toLowerCase();
            if (typeStr.includes('buy') && typeStr.includes('limit')) orderType = 'Buy Limit';
            else if (typeStr.includes('sell') && typeStr.includes('limit')) orderType = 'Sell Limit';
            else if (typeStr.includes('buy') && typeStr.includes('stop')) orderType = 'Buy Stop';
            else if (typeStr.includes('sell') && typeStr.includes('stop')) orderType = 'Sell Stop';
            else orderType = 'Pending';
          }
          
          return {
            id: order.id || order.ticket || `order_${index}`,
            order_number: order.ticket || order.id || `ORD_${index}`,
            symbol: order.symbol || 'Unknown',
            asset: order.symbol || 'Unknown',
            type: orderType,
            volume: parseFloat(order.volume || 0),
            quantity: parseFloat(order.volume || 0),
            opening: parseFloat(order.open_price || order.price_open || 0),
            stop_loss: parseFloat(order.stop_loss || order.sl || 0) || null,
            sl: parseFloat(order.stop_loss || order.sl || 0) || null,
            take_profit: parseFloat(order.take_profit || order.tp || 0) || null,
            tp: parseFloat(order.take_profit || order.tp || 0) || null,
            date: order.created_time || order.time_setup || new Date().toISOString(),
            status: 'Pending',
            trade_pl: 0,
            source: 'EA',
            comment: order.comment || ''
          };
        });

        // Combine all trades
        const allTrades = [...positions, ...orders];
        console.log('Final combined trades:', allTrades.length);
        
        setTrades(allTrades);
        calculateStats(allTrades, balanceData);
        
        // Show success message
        if (allTrades.length > 0) {
          console.log(`✅ Loaded ${positions.length} positions and ${orders.length} orders from EA`);
          toast.success(`Loaded ${positions.length} positions and ${orders.length} orders`, { id: 'fetch-trades' });
        } else {
          console.log('⚠️ No trades found for EA account');
          toast.success('No trades found for this account', { id: 'fetch-trades' });
        }
        
      } else {
        // Fallback to broker API for non-EA accounts
        console.log('Using broker API for account:', selectedAccount.id);
        
        // Broker API URLs
        const balanceUrl = `${API_CONFIG.baseUrl}${API_CONFIG.paths.brokerBalance(selectedAccount.id)}`;
        const positionsUrl = `${API_CONFIG.baseUrl}${API_CONFIG.paths.brokerPositions(selectedAccount.id)}`;
        const ordersUrl = `${API_CONFIG.baseUrl}${API_CONFIG.paths.brokerOrders(selectedAccount.id)}`;
        
        // Make API calls
        const [balanceResult, positionsResult, ordersResult] = await Promise.all([
          apiCall(balanceUrl),
          apiCall(positionsUrl),
          apiCall(ordersUrl)
        ]);
        
        console.log('Broker API Results:', {
          balance: balanceResult,
          positions: positionsResult,
          orders: ordersResult
        });
        
        // Process broker API data
        const balanceData = balanceResult.success ? balanceResult.data : {};
        
        // Process positions data
        const positionsData = positionsResult.data || {};
        const positionsArray = Array.isArray(positionsData)
          ? positionsData
          : Array.isArray(positionsData.positions)
            ? positionsData.positions
            : positionsData.data && Array.isArray(positionsData.data) 
            ? positionsData.data
            : [];
            
        // Process orders data
        const ordersData = ordersResult.data || {};
        const ordersArray = Array.isArray(ordersData)
          ? ordersData
          : Array.isArray(ordersData.orders)
            ? ordersData.orders
            : ordersData.data && Array.isArray(ordersData.data)
            ? ordersData.data
            : [];

        console.log('Processed broker arrays:', { 
          positionsArray: positionsArray.length, 
          ordersArray: ordersArray.length 
        });

        // Transform broker positions to unified format
        const positions = positionsArray.map((pos, index) => ({
          id: pos.id || `broker_pos_${index}`,
          order_number: pos.id || `BROKER_POS_${index}`,
          symbol: pos.symbol || 'Unknown',
          asset: pos.symbol || 'Unknown',
          type: pos.type || 'Buy',
          volume: parseFloat(pos.volume || 0),
          quantity: parseFloat(pos.volume || 0),
          opening: parseFloat(pos.open_price || 0),
          current_price: parseFloat(pos.current_price || pos.opening || 0),
          trade_pl: parseFloat(pos.profit || 0),
          swap: parseFloat(pos.swap || 0),
          commission: parseFloat(pos.commission || 0),
          date: pos.open_time || new Date().toISOString(),
          status: 'Executed',
          stop_loss: parseFloat(pos.stop_loss || 0) || null,
          sl: parseFloat(pos.stop_loss || 0) || null,
          take_profit: parseFloat(pos.take_profit || 0) || null,
          tp: parseFloat(pos.take_profit || 0) || null,
          source: 'Broker',
          comment: pos.comment || ''
        }));

        // Transform broker orders to unified format
        const orders = ordersArray.map((order, index) => ({
          id: order.id || `broker_order_${index}`,
          order_number: order.id || `BROKER_ORD_${index}`,
          symbol: order.symbol || 'Unknown',
          asset: order.symbol || 'Unknown',
          type: order.type || 'Pending',
          volume: parseFloat(order.volume || 0),
          quantity: parseFloat(order.volume || 0),
          opening: parseFloat(order.open_price || 0),
          stop_loss: parseFloat(order.stop_loss || 0) || null,
          sl: parseFloat(order.stop_loss || 0) || null,
          take_profit: parseFloat(order.take_profit || 0) || null,
          tp: parseFloat(order.take_profit || 0) || null,
          date: order.created_time || new Date().toISOString(),
          status: 'Pending',
          trade_pl: 0,
          source: 'Broker',
          comment: order.comment || ''
        }));

        // Combine all trades
        const allTrades = [...positions, ...orders];
        console.log('Final broker trades:', allTrades.length);
        
        setTrades(allTrades);
        calculateStats(allTrades, balanceData);
        
        // Show success message
        if (allTrades.length > 0) {
          toast.success(`Loaded ${allTrades.length} trades from broker account`, { id: 'fetch-trades' });
        } else {
          toast.success('No trades found for this account', { id: 'fetch-trades' });
        }
      }
      
    } catch (error) {
      console.error('❌ Error fetching trades:', error);
      const errorMessage = error.message || 'Unknown error';
      setError(`Error fetching trades: ${errorMessage}`);
      toast.error(`Error: ${errorMessage}`, { id: 'fetch-trades' });
    } finally {
      setLoading(false);
    }
  }, [
    selectedAccount, 
    accountsLoading, 
    availableAccounts, 
    fetchAvailableAccounts, 
    apiCall
  ]);

  // Enhanced WebSocket setup for EA accounts
  useEffect(() => {
    if (!selectedAccount?.id) return;

    const isEA = isEAAccount(selectedAccount);
    
    if (isEA) {
      console.log('Setting up EA WebSocket for account:', selectedAccount.id);
      
      // Set up event listeners for real-time updates
      const handleTradeUpdate = (data) => {
        console.log('EA trade update received:', data);
        if (data.account_id === selectedAccount.id) {
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
                current_price: data.price_current || data.current_price,
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
        // Check WebSocket status
        const wsNotConnected = !eaWebSocket.ws || 
          (typeof WebSocket !== 'undefined' && 
           eaWebSocket.ws.readyState !== WebSocket.OPEN && 
           eaWebSocket.ws.readyState !== WebSocket.CONNECTING);
        
        if (wsNotConnected) {
          const userId = localStorage.getItem('user_id') || 
                         localStorage.getItem('userId') || 
                         sessionStorage.getItem('userId') ||
                         '23202c3b-411e-492e-8fbd-87fd5383ac58';
                         
          console.log(`Attempting to connect WebSocket with user ID: ${userId}`);
          
          // Get the proper WebSocket URL
          const wsUrl = API_CONFIG.websocket.url(userId);
          console.log('WebSocket URL:', wsUrl);
          
          eaWebSocket.connect(userId);
          console.log('✅ EA WebSocket connection initiated');
          
          // Send a test message after connection
          setTimeout(() => {
            try {
              if (eaWebSocket.ws && eaWebSocket.ws.readyState === WebSocket.OPEN) {
                eaWebSocket.ws.send(JSON.stringify({ 
                  type: 'subscribe', 
                  account_id: selectedAccount.id,
                  channels: ['positions', 'orders', 'balance']
                }));
                console.log('Sent subscription request to WebSocket');
              } else {
                console.warn('WebSocket not in OPEN state after timeout');
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
      }

      // Cleanup on unmount
      return () => {
        eaWebSocket.off(EA_WEBSOCKET_MESSAGE_TYPES.TRADE_RESULT, handleTradeUpdate);
        eaWebSocket.off(EA_WEBSOCKET_MESSAGE_TYPES.POSITION_UPDATE, handlePositionUpdate);
        eaWebSocket.off(EA_WEBSOCKET_MESSAGE_TYPES.BALANCE_UPDATE, handleBalanceUpdate);
        eaWebSocket.off(EA_WEBSOCKET_MESSAGE_TYPES.ORDER_UPDATE, handleOrderUpdate);
      };
    }
  }, [selectedAccount, fetchTrades]);

  // Open the modify trade modal
  const openModifyTradeModal = (trade) => {
    setModifyingTrade(trade);
    setModifyValues({
      stopLoss: trade.sl || null,
      takeProfit: trade.tp || null
    });
    setIsModifyModalOpen(true);
  };
  
  // Close the modify trade modal
  const closeModifyTradeModal = () => {
    setIsModifyModalOpen(false);
    setModifyingTrade(null);
    setModifyValues({
      stopLoss: null,
      takeProfit: null
    });
  };

  // Handle trade modification (update stop loss/take profit)
  const handleModifyTrade = async (trade, modifications) => {
    if (!selectedAccount?.id || !trade?.id) return;
    
    const tradeId = trade.id;
    const isPosition = trade.status === 'Executed';
    
    toast.loading(`Modifying ${isPosition ? 'position' : 'order'} ${tradeId}...`, { id: 'modify-trade' });
    
    try {
      const isEA = isEAAccount(selectedAccount);
      
      if (isEA) {
        console.log(`Modifying EA ${isPosition ? 'position' : 'order'}:`, tradeId, modifications);
        
        // Extract additional options if provided
        const options = modifications.options || {};
        
        if (isPosition) {
          // Modify position with enhanced API parameters matching the curl format
          // Check if at least one of the required modification parameters is provided
          if (modifications.stopLoss === null && 
              modifications.takeProfit === null && 
              modifications.price === null) {
            throw new Error('At least one of price, stop loss or take profit must be provided');
          }
          
          // Directly pass parameters as expected by the API endpoint
          const result = await modifyEAPosition(
            selectedAccount.id, 
            tradeId, 
            {
              stop_loss: modifications.stopLoss,
              take_profit: modifications.takeProfit,
              price: modifications.price,  // Include price parameter if provided
              symbol: options.symbol || trade.symbol || trade.asset || '',
              comment: options.comment || 'Modified from Trade Management',
              request_id: options.request_id || `mod_pos_${Date.now()}`
            }
          );
          
          if (result.success) {
            toast.success(
              <div>
                <p className="font-bold">Position Modified Successfully</p>
                <p>{trade.symbol} • {trade.volume || trade.quantity} lot(s)</p>
                <p className="text-xs mt-1">Your changes will be applied shortly</p>
                {result.request_id && (
                  <p className="text-xs text-gray-300">Request ID: {result.request_id}</p>
                )}
              </div>,
              { id: 'modify-trade', duration: 4000 }
            );
            fetchTrades();
            return result;
          } else {
            // Enhanced error handling
            let errorMsg = result.error || 'Failed to modify position';
            let suggestions = result.suggestions || [];
            
            if (suggestions.length > 0) {
              errorMsg += `. Suggestions: ${suggestions.join(', ')}`;
            }
            
            throw new Error(errorMsg);
          }
        } else {
          // Modify order with enhanced API parameters matching the curl format
          const result = await modifyEAOrder(
            selectedAccount.id, 
            tradeId, 
            {
              order_id: tradeId,
              price: modifications.price,
              stop_loss: modifications.stopLoss,
              take_profit: modifications.takeProfit,
              comment: options.comment || 'Modified from Trade Management',
              symbol: options.symbol || trade.symbol || trade.asset || '',
              request_id: options.request_id || `mod_ord_${Date.now()}`
            }
          );
          
          if (result.success) {
            toast.success(
              <div>
                <p className="font-bold">Order Modified Successfully</p>
                <p>{trade.symbol} • {trade.volume || trade.quantity} lot(s)</p>
                <p className="text-xs mt-1">Your changes will be applied shortly</p>
                {result.request_id && (
                  <p className="text-xs text-gray-300">Request ID: {result.request_id}</p>
                )}
              </div>,
              { id: 'modify-trade', duration: 4000 }
            );
            fetchTrades();
            return result;
          } else {
            // Enhanced error handling
            let errorMsg = result.error || 'Failed to modify order';
            let suggestions = result.suggestions || [];
            
            if (suggestions.length > 0) {
              errorMsg += `. Suggestions: ${suggestions.join(', ')}`;
            }
            
            throw new Error(errorMsg);
          }
        }
      } else {
        // Logic for non-EA accounts would go here
        toast.error('Modifying trades is currently only supported for EA accounts', { id: 'modify-trade' });
        throw new Error('Modifying trades is currently only supported for EA accounts');
      }
    } catch (error) {
      console.error('Error in handleModifyTrade:', error);
      
      toast.error(
        <div>
          <p className="font-bold">Failed to Modify Trade</p>
          <p>Trade ID: {tradeId}</p>
          <p className="text-sm text-red-300">Error: {error.message || 'Unknown error'}</p>
        </div>,
        { id: 'modify-trade', duration: 5000 }
      );
      
      return { success: false, error: error.message };
    }
  };

  // Calculate trading statistics
  const calculateStats = useCallback((tradeData, balanceData) => {
    const stats = {
      totalTrades: tradeData.length,
      winningTrades: tradeData.filter(t => (t.trade_pl || 0) > 0).length,
      totalPL: tradeData.reduce((sum, t) => sum + (t.trade_pl || 0), 0),
      volume: tradeData.reduce((sum, t) => sum + (t.quantity || t.volume || 0), 0),
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
        balance: parseFloat(balanceData.balance || 0),
        equity: parseFloat(balanceData.equity || 0),
        margin: parseFloat(balanceData.margin || 0),
        freeMargin: parseFloat(balanceData.free_margin || 0),
        currency: balanceData.currency || 'USD',
        leverage: parseInt(balanceData.leverage || 1, 10)
      } : {})
    }));
  }, []);

  // Function to identify and group pair trades
  const groupPairTrades = useCallback((trades) => {
    const regularTrades = [];
    const pairTrades = [];
    
    // Group trades by potential pair indicators and timing
    const tradeMap = new Map();
    
    // Helper function to check if trades can form a pair
    const canFormPair = (trade1, trade2) => {
      // Must have opposite directions
      const isOppositeDirection = 
        (trade1.type.toLowerCase().includes('buy') && trade2.type.toLowerCase().includes('sell')) ||
        (trade1.type.toLowerCase().includes('sell') && trade2.type.toLowerCase().includes('buy'));
      
      // Must be close in time (within 5 seconds)
      const timeGap = Math.abs(new Date(trade1.date) - new Date(trade2.date));
      const isCloseInTime = timeGap <= 5000; // 5 seconds
      
      return isOppositeDirection && isCloseInTime;
    };
    
    // Sort trades by date for proper pairing
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // First pass: Handle explicit pair_id
    sortedTrades.forEach(trade => {
      if (trade.pair_id) {
        const key = trade.pair_id;
        if (!tradeMap.has(key)) {
          tradeMap.set(key, []);
        }
        tradeMap.get(key).push(trade);
      }
    });
    
    // Second pass: Handle trades without pair_id
    const remainingTrades = sortedTrades.filter(trade => !trade.pair_id);
    
    // Group potential pairs by timestamp proximity
    for (let i = 0; i < remainingTrades.length; i++) {
      const currentTrade = remainingTrades[i];
      if (currentTrade.processed) continue;
      
      // Look for a matching trade within the next few trades
      for (let j = i + 1; j < Math.min(i + 5, remainingTrades.length); j++) {
        const potentialPair = remainingTrades[j];
        if (potentialPair.processed) continue;
        
        if (canFormPair(currentTrade, potentialPair)) {
          const pairKey = `time_${Date.now()}_${i}`;
          tradeMap.set(pairKey, [currentTrade, potentialPair]);
          currentTrade.processed = true;
          potentialPair.processed = true;
          break;
        }
      }
      
      if (!currentTrade.processed) {
        regularTrades.push(currentTrade);
      }
    }
    
    // Process grouped pair trades
    tradeMap.forEach((legs, key) => {
      if (legs.length === 2) {
        // Create pairs based on the timestamps (assuming pairs are created close in time)
        const sortedLegs = [...legs].sort((a, b) => new Date(a.date) - new Date(b.date));
        const [firstLeg, secondLeg] = sortedLegs;
        
        // Calculate the spread and combined P/L
        const entry1 = parseFloat(firstLeg.opening) || 0;
        const entry2 = parseFloat(secondLeg.opening) || 0;
        const spreadEntry = entry1 - entry2; // The spread between the two entries
        const combinedPL = legs.reduce((sum, leg) => sum + (parseFloat(leg.trade_pl) || 0), 0);
        
        // Create combined pair trade entry with enhanced details
        const pairTrade = {
          id: key,
          pair_id: key,
          order_number: `${firstLeg.order_number}/${secondLeg.order_number}`,
          asset: `${firstLeg.symbol}/${secondLeg.symbol}`,
          type: 'Pair Trade',
          quantity: `${firstLeg.volume || firstLeg.quantity}/${secondLeg.volume || secondLeg.quantity}`,
          opening: spreadEntry.toFixed(5), // Show the spread as the entry price
          entries: `${entry1.toFixed(5)}/${entry2.toFixed(5)}`, // Store original entries for reference
          trade_pl: combinedPL,
          date: new Date(Math.min(...legs.map(l => new Date(l.date)))).toISOString(),
          status: legs.every(l => l.status === 'Executed') ? 'Executed' : 'Pending',
          source: 'Pair Trade',
          isPairTrade: true,
          legs: [firstLeg, secondLeg],
          sl: legs.some(l => l.sl || l.stop_loss) ? 'Multiple' : null,
          tp: legs.some(l => l.tp || l.take_profit) ? 'Multiple' : null,
          comment: `Pair trade: ${firstLeg.symbol}/${secondLeg.symbol} (Spread: ${spreadEntry.toFixed(5)})`,
          // Additional metadata for UI
          firstLegSymbol: firstLeg.symbol,
          secondLegSymbol: secondLeg.symbol,
          firstLegQuantity: firstLeg.volume || firstLeg.quantity,
          secondLegQuantity: secondLeg.volume || secondLeg.quantity,
          timestamp: Date.now()
        };
        
        pairTrades.push(pairTrade);
      } else {
        // If not exactly 2 legs, treat as regular trades
        legs.forEach(leg => {
          if (!leg.processed) {
            regularTrades.push(leg);
          }
        });
      }
    });
    
    // Clean up processed flag
    regularTrades.forEach(trade => delete trade.processed);
    
    // Sort trades by date, with pair trades appearing near their component trades
    const allTrades = [...regularTrades, ...pairTrades].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    return allTrades;
  }, []);

  // Handle trade closure
  const handleCloseTrade = async (tradeId, options = {}) => {
    if (!selectedAccount?.id || !tradeId) return;
    
    toast.loading(`Closing trade ${tradeId}...`, { id: 'close-trade' });
    
    try {
      const isEA = isEAAccount(selectedAccount);
      
      if (isEA) {
        console.log('Closing EA trade:', tradeId);
        
        // Find the trade in our state to get details
        const trade = trades.find(t => t.id === tradeId || t.order_number === tradeId);
        const symbol = trade?.symbol || trade?.asset || '';
        const volume = trade?.volume || trade?.quantity || 0;
        const isPosition = trade?.status === 'Executed';
        
        // Try to close as position first
        try {
          console.log('Attempting to close position with ID:', tradeId);
          
          // Use the imported closeEAPosition function from ea.js with enhanced parameters
          const result = await closeEAPosition(selectedAccount.id, tradeId, {
            comment: options.comment || 'Closed from Trade Management',
            symbol: symbol,
            volume: volume,
            // Enhanced fill policy support from backend
            typeFilling: options.typeFilling || 1, // Default to IOC (Immediate-or-Cancel)
            deviation: options.deviation || 10,    // Default slippage in points
            request_id: options.request_id || `close_${Date.now()}`
          });
          
          if (result.success) {
            toast.success(
              <div>
                <p className="font-bold">Position Closed Successfully</p>
                <p>{result.symbol || symbol || ''} • {result.volume || volume || ''} lot(s)</p>
                {result.profit && <p className={result.profit >= 0 ? "text-green-400" : "text-red-400"}>
                  Profit: {result.profit >= 0 ? '+' : ''}{typeof result.profit === 'number' ? result.profit.toFixed(2) : result.profit}
                </p>}
                {result.request_id && (
                  <p className="text-xs text-gray-300">Request ID: {result.request_id}</p>
                )}
              </div>,
              { id: 'close-trade', duration: 5000 }
            );
            fetchTrades();
            return;
          }
          
          throw new Error(result.error || 'Failed to close position');
        } catch (positionError) {
          console.log('Not a position or error closing position, trying as order...', positionError);
          
          // Check if fill policy error and retry with different fill policy
          const fillPolicyError = positionError.message?.toLowerCase().includes('fill policy') || 
                                 positionError.message?.toLowerCase().includes('invalid fills');
                                 
          if (fillPolicyError && !options.retryAttempted) {
            console.log('Fill policy error detected, retrying with different fill policy');
            return handleCloseTrade(tradeId, { 
              ...options, 
              typeFilling: 2,  // Try with Return fill type
              retryAttempted: true,
              comment: 'Retry with different fill policy'
            });
          }
          
          // Try cancelling as pending order
          try {
            console.log('Attempting to cancel order with ID:', tradeId);
            
            // Use the imported cancelEAOrder function from ea.js with enhanced parameters
            const result = await cancelEAOrder(selectedAccount.id, tradeId, {
              comment: options.comment || 'Cancelled from Trade Management',
              symbol: symbol,
              request_id: options.request_id || `cancel_${Date.now()}`
            });
            
            if (result.success) {
              toast.success(
                <div>
                  <p className="font-bold">Order Cancelled Successfully</p>
                  <p>{result.symbol || symbol || ''} • {result.volume || volume || ''} lot(s)</p>
                  <p>Order #{tradeId}</p>
                  {result.request_id && (
                    <p className="text-xs text-gray-300">Request ID: {result.request_id}</p>
                  )}
                </div>,
                { id: 'close-trade', duration: 4000 }
              );
              fetchTrades();
              return;
            }
            
            throw new Error(result.error || 'Failed to cancel order');
          } catch (orderError) {
            console.error('Failed to close EA trade:', { positionError, orderError });
            
            // Extract helpful suggestions if available
            const suggestions = [];
            if (orderError.suggestions) suggestions.push(...orderError.suggestions);
            if (positionError.suggestions) suggestions.push(...positionError.suggestions);
            
            toast.error(
              <div>
                <p className="font-bold">Failed to Close Trade</p>
                <p>Trade ID: {tradeId}</p>
                <p className="text-sm text-red-300">Error: {orderError.message || positionError.message || 'Unknown error'}</p>
                {suggestions.length > 0 && (
                  <div className="mt-2 text-xs">
                    <p className="font-semibold">Suggestions:</p>
                    <ul className="list-disc pl-4">
                      {suggestions.map((suggestion, i) => (
                        <li key={i}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-xs mt-1">Please try again or contact support if this persists.</p>
              </div>,
              { id: 'close-trade', duration: 8000 }
            );
          }
        }
      } else {
        // Logic for non-EA accounts
        try {
          const positionUrl = `${API_CONFIG.baseUrl}${API_CONFIG.paths.brokerPositions(selectedAccount.id)}/${tradeId}`;
          
          const response = await fetch(positionUrl, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          
          if (response.ok) {
            const data = await response.json();
            toast.success(`Position closed successfully. Profit: ${data.profit?.toFixed(2) || 'N/A'}`, { id: 'close-trade' });
            fetchTrades();
            return;
          }
          
          throw new Error(`Failed to close position: ${response.status}`);
        } catch (error) {
          // Try cancelling as pending order
          try {
            const orderUrl = `${API_CONFIG.baseUrl}${API_CONFIG.paths.brokerOrders(selectedAccount.id)}/${tradeId}`;
            
            const response = await fetch(orderUrl, {
              method: 'DELETE',
              headers: getAuthHeaders()
            });
            
            if (response.ok) {
              const data = await response.json();
              toast.success('Order cancelled successfully', { id: 'close-trade' });
              fetchTrades();
              return;
            }
            
            throw new Error(`Failed to cancel order: ${response.status}`);
          } catch (orderError) {
            toast.error(`Error closing trade: ${error.message}`, { id: 'close-trade' });
          }
        }
      }
    } catch (error) {
      console.error('Error in handleCloseTrade:', error);
      toast.error(`Error closing trade: ${error.message}`, { id: 'close-trade' });
    }
  };

  // Sort and filter trades
  const filteredAndSortedTrades = useMemo(() => {
    // First group pair trades
    const groupedTrades = groupPairTrades(trades);
    
    return groupedTrades
      .filter(trade => {
        if (filters.status !== 'all' && trade.status !== filters.status) return false;
        if (filters.type !== 'all' && !trade.type?.includes(filters.type)) return false;
        if (filters.source !== 'all' && trade.source !== filters.source) return false;
        return true;
      })
      .sort((a, b) => {
        const direction = sortConfig.direction === 'asc' ? 1 : -1;
        
        // Handle different data types or missing values
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        
        // Handle dates specially
        if (sortConfig.key === 'date') {
          return direction * (new Date(valA).getTime() - new Date(valB).getTime());
        }
        
        // Handle numeric values
        if (typeof valA === 'number' && typeof valB === 'number') {
          return direction * (valA - valB);
        }
        
        // Handle strings
        if (valA > valB) return direction;
        if (valA < valB) return -direction;
        return 0;
      });
  }, [trades, filters, sortConfig, groupPairTrades]);

  // Export trades to CSV
  const exportToCsv = () => {
    if (filteredAndSortedTrades.length === 0) {
      toast.error('No trades to export');
      return;
    }
    
    const headers = ['Date', 'Order #', 'Symbol', 'Type', 'Volume', 'Entry', 'Current', 'SL', 'TP', 'P/L', 'Status', 'Source', 'Comment'];
    
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
          trade.current_price || '',
          trade.sl || trade.stop_loss || '',
          trade.tp || trade.take_profit || '',
          trade.trade_pl || 0,
          trade.status,
          trade.source,
          trade.comment || ''
        ].map(value => {
          // Escape values that might contain commas
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',');
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
  
  // Fetch available accounts on mount
  useEffect(() => {
    if (availableAccounts.length === 0 && !accountsLoading) {
      console.log('Initial account fetch triggered');
      fetchAvailableAccounts();
    }
  }, [fetchAvailableAccounts, availableAccounts.length, accountsLoading]);

  // Request initial data when selectedAccount changes
  useEffect(() => {
    if (selectedAccount?.id) {
      console.log('Selected account available, fetching trades:', selectedAccount);
      fetchTrades();
    } else {
      console.log('Initial load: No selected account available or still loading');
    }
  }, [selectedAccount, fetchTrades]);

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

  // Toggle expansion of pair trade
  const togglePairTradeExpansion = (pairTradeId) => {
    setExpandedPairTrades(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pairTradeId)) {
        newSet.delete(pairTradeId);
      } else {
        newSet.add(pairTradeId);
      }
      return newSet;
    });
  };

  // Handle closing a pair trade (both legs)
  const handleClosePairTrade = async (pairTrade, options = {}) => {
    if (!selectedAccount?.id || !pairTrade?.legs) return;
    
    toast.loading(`Closing pair trade with ${pairTrade.legs.length} legs...`, { id: 'close-pair-trade' });
    
    try {
      const isEA = isEAAccount(selectedAccount);
      
      if (isEA) {
        // Close both legs of the pair trade
        const closePromises = pairTrade.legs.map(leg => 
          closeEAPosition(selectedAccount.id, leg.id, {
            comment: options.comment || 'Closed pair trade leg from Trade Management',
            symbol: leg.symbol,
            volume: leg.volume,
            typeFilling: options.typeFilling || 1,
            deviation: options.deviation || 10,
            request_id: options.request_id || `close_pair_${leg.id}_${Date.now()}`
          })
        );
        
        const results = await Promise.all(closePromises);
        
        // Check if all legs were closed successfully
        const allSuccess = results.every(result => result.success);
        
        if (allSuccess) {
          toast.success(
            <div>
              <p className="font-bold">Pair Trade Closed Successfully</p>
              <p>{pairTrade.asset} • {pairTrade.quantity}</p>
              <p className="text-xs mt-1">All {pairTrade.legs.length} legs closed</p>
            </div>,
            { id: 'close-pair-trade', duration: 5000 }
          );
          fetchTrades();
        } else {
          const failedLegs = results.filter(result => !result.success);
          toast.error(
            <div>
              <p className="font-bold">Partial Failure Closing Pair Trade</p>
              <p>{failedLegs.length} of {pairTrade.legs.length} legs failed to close</p>
              <p className="text-xs mt-1">Please check individual legs</p>
            </div>,
            { id: 'close-pair-trade', duration: 5000 }
          );
        }
      } else {
        toast.error('Pair trade closing is currently only supported for EA accounts', { id: 'close-pair-trade' });
      }
    } catch (error) {
      console.error('Error closing pair trade:', error);
      toast.error(`Error closing pair trade: ${error.message}`, { id: 'close-pair-trade' });
    }
  };

  // Handle modifying a pair trade (both legs)
  const handleModifyPairTrade = async (pairTrade, modifications) => {
    if (!selectedAccount?.id || !pairTrade?.legs) return;
    
    toast.loading(`Modifying pair trade with ${pairTrade.legs.length} legs...`, { id: 'modify-pair-trade' });
    
    try {
      const isEA = isEAAccount(selectedAccount);
      
      if (isEA) {
        // Modify both legs of the pair trade
        const modifyPromises = pairTrade.legs.map(leg => 
          modifyEAPosition(selectedAccount.id, leg.id, {
            stop_loss: modifications.stopLoss,
            take_profit: modifications.takeProfit,
            price: modifications.price,
            symbol: leg.symbol,
            comment: modifications.options?.comment || 'Modified pair trade leg from Trade Management',
            request_id: modifications.options?.request_id || `modify_pair_${leg.id}_${Date.now()}`
          })
        );
        
        const results = await Promise.all(modifyPromises);
        
        // Check if all legs were modified successfully
        const allSuccess = results.every(result => result.success);
        
        if (allSuccess) {
          toast.success(
            <div>
              <p className="font-bold">Pair Trade Modified Successfully</p>
              <p>{pairTrade.asset} • {pairTrade.quantity}</p>
              <p className="text-xs mt-1">All {pairTrade.legs.length} legs modified</p>
            </div>,
            { id: 'modify-pair-trade', duration: 5000 }
          );
          fetchTrades();
        } else {
          const failedLegs = results.filter(result => !result.success);
          toast.error(
            <div>
              <p className="font-bold">Partial Failure Modifying Pair Trade</p>
              <p>{failedLegs.length} of {pairTrade.legs.length} legs failed to modify</p>
              <p className="text-xs mt-1">Please check individual legs</p>
            </div>,
            { id: 'modify-pair-trade', duration: 5000 }
          );
        }
      } else {
        toast.error('Pair trade modification is currently only supported for EA accounts', { id: 'modify-pair-trade' });
      }
    } catch (error) {
      console.error('Error modifying pair trade:', error);
      toast.error(`Error modifying pair trade: ${error.message}`, { id: 'modify-pair-trade' });
    }
  };

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
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
                    
                    // Show enhanced toast notification with broker name
                    toast.success(
                      <div>
                        <p className="font-bold">Account Changed</p>
                        <p>{account.broker || account.name} • {account.account_number || account.id}</p>
                        {account.platform && <p className="text-xs text-gray-300">Platform: {account.platform}</p>}
                      </div>,
                      { id: 'account-selected' }
                    );
                  }
                }}
                className="bg-[#222] border border-[#333] rounded-lg px-2 py-1 text-white text-sm"
              >
                {availableAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.broker || account.name || account.account_number || account.id} 
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
            className="flex items-center gap-2 px-4 py-2 bg-[#2A2A2A] hover:bg-[#333] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={filteredAndSortedTrades.length === 0}
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button 
            onClick={fetchTrades}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2F00FF] to-[#1C0099] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
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
          <option value="all">All Statuses</option>
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
          <option value="Buy Limit">Buy Limit</option>
          <option value="Sell Limit">Sell Limit</option>
          <option value="Buy Stop">Buy Stop</option>
          <option value="Sell Stop">Sell Stop</option>
        </select>

        <select
          value={filters.source}
          onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
          className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="all">All Sources</option>
          <option value="EA">EA</option>
          <option value="Broker">Broker</option>
        </select>
      </div>

      {/* Trade Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#333]">
              <th className="text-left py-3 px-4 text-gray-300 font-medium"></th>
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
                <td colSpan="13" className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mr-2" />
                    <span className="text-gray-400">Loading trades...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="13" className="text-center py-8">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="flex items-center text-red-400">
                      <AlertTriangle className="w-6 h-6 mr-2" />
                      <span>{error}</span>
                    </div>
                  </div>
                </td>
              </tr>
            ) : filteredAndSortedTrades.length === 0 ? (
              <tr>
                <td colSpan="13" className="text-center py-8">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <Activity className="w-12 h-12 mb-2" />
                    <p>No trades found</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedTrades.map((trade) => {
                // Check if this is a pair trade
                const isPairTrade = trade.isPairTrade;
                const isExpanded = expandedPairTrades.has(trade.id);
                
                return (
                  <React.Fragment key={trade.id || trade.order_number}>
                    <tr 
                      className={cn(
                        "border-b border-[#333] hover:bg-[#2A2A2A] transition-colors",
                        selectedTradeId === trade.order_number && "bg-[#2A2A2A]"
                      )}
                      onClick={() => {
                        setSelectedTradeId(trade.order_number);
                        if (onTradeSelect) onTradeSelect(trade);
                        
                        // If it's a pair trade, toggle expansion
                        if (isPairTrade) {
                          togglePairTradeExpansion(trade.id);
                        }
                      }}
                    >
                      <td className="py-3 px-4">
                        {isPairTrade && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePairTradeExpansion(trade.id);
                            }}
                            className="text-gray-400 hover:text-white"
                          >
                            {isExpanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        )}
                      </td>
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
                          trade.type?.toLowerCase().includes('buy') ? "text-green-400" : 
                          trade.type?.toLowerCase().includes('pair') ? "text-purple-400" : "text-red-400"
                        )}>
                          {trade.type?.toLowerCase().includes('buy') ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : trade.type?.toLowerCase().includes('pair') ? (
                            <Activity className="w-4 h-4" />
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
                        {typeof trade.opening === 'string' ? trade.opening : trade.opening?.toFixed(5)}
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
                          trade.source === 'Broker' && "bg-purple-500/20 text-purple-400 border border-purple-500/30",
                          trade.source === 'Pair Trade' && "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                        )}>
                          {trade.source || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isPairTrade) {
                                handleClosePairTrade(trade);
                              } else {
                                handleCloseTrade(trade.order_number);
                              }
                            }}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors"
                            title={isPairTrade ? "Close pair trade" : "Close trade"}
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isPairTrade) {
                                // For pair trades, open the pair trade modify modal
                                setModifyingPairTrade(trade);
                                setIsPairModifyModalOpen(true);
                              } else {
                                openModifyTradeModal(trade);
                              }
                            }}
                            className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                            title={isPairTrade ? "Modify pair trade" : "Edit trade"}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded view for pair trades */}
                    {isPairTrade && isExpanded && trade.legs && trade.legs.map((leg, index) => (
                      <tr 
                        key={`${trade.id}_leg_${index}`} 
                        className="border-b border-[#333] bg-[#222] hover:bg-[#2A2A2A]"
                      >
                        <td className="py-2 px-4"></td>
                        <td className="py-2 px-4 text-gray-400 text-sm">
                          {new Date(leg.date).toLocaleTimeString()}
                        </td>
                        <td className="py-2 px-4 text-gray-400 font-mono text-sm">
                          {leg.order_number}
                        </td>
                        <td className="py-2 px-4 text-gray-300 font-medium text-sm">
                          {leg.symbol}
                        </td>
                        <td className="py-2 px-4">
                          <div className={cn(
                            "flex items-center gap-1 text-sm",
                            leg.type?.toLowerCase().includes('buy') ? "text-green-400" : "text-red-400"
                          )}>
                            {leg.type?.toLowerCase().includes('buy') ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {leg.type}
                          </div>
                        </td>
                        <td className="py-2 px-4 text-gray-400 text-sm">
                          {leg.quantity || leg.volume}
                        </td>
                        <td className="py-2 px-4 text-gray-400 font-mono text-sm">
                          {leg.opening?.toFixed(5)}
                        </td>
                        <td className="py-2 px-4 text-gray-400 font-mono text-sm">
                          {(leg.sl || leg.stop_loss)?.toFixed(5) || '-'}
                        </td>
                        <td className="py-2 px-4 text-gray-400 font-mono text-sm">
                          {(leg.tp || leg.take_profit)?.toFixed(5) || '-'}
                        </td>
                        <td className={cn(
                          "py-2 px-4 font-medium text-sm",
                          (leg.trade_pl || 0) >= 0 ? "text-green-400" : "text-red-400"
                        )}>
                          {leg.trade_pl ? (
                            `${leg.trade_pl >= 0 ? '+' : ''}${leg.trade_pl.toFixed(2)}`
                          ) : '-'}
                        </td>
                        <td className="py-2 px-4">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            leg.status === 'Executed' && "bg-green-500/20 text-green-400 border border-green-500/30"
                          )}>
                            {leg.status}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-gray-400 text-sm">
                          {leg.source}
                        </td>
                        <td className="py-2 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCloseTrade(leg.order_number);
                              }}
                              className="p-1 text-red-400 hover:text-red-300 transition-colors"
                              title="Close leg"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Modify Position/Order Modal */}
      {isModifyModalOpen && modifyingTrade && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center justify-between">
              <span>Modify {modifyingTrade.status === 'Executed' ? 'Position' : 'Order'}</span>
              <button 
                onClick={closeModifyTradeModal}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </h3>
            
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Symbol:</span>
                <span className="font-semibold text-white">{modifyingTrade.symbol || modifyingTrade.asset}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">ID:</span>
                <span className="font-mono text-sm text-white">{modifyingTrade.id}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Type:</span>
                <span className={modifyingTrade.type === 'Buy' ? 'text-green-400' : 'text-red-400'}>
                  {modifyingTrade.type}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Volume:</span>
                <span className="text-white">{modifyingTrade.volume || modifyingTrade.quantity} lot(s)</span>
              </div>
              {modifyingTrade.opening && (
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Price:</span>
                  <span className="text-white">{modifyingTrade.opening}</span>
                </div>
              )}
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Stop Loss
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={modifyValues.stopLoss !== null ? modifyValues.stopLoss : ''}
                  onChange={(e) => setModifyValues(prev => ({
                    ...prev,
                    stopLoss: e.target.value === '' ? null : parseFloat(e.target.value)
                  }))}
                  className="w-full px-3 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-md text-white"
                  placeholder="Enter stop loss price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Take Profit
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={modifyValues.takeProfit !== null ? modifyValues.takeProfit : ''}
                  onChange={(e) => setModifyValues(prev => ({
                    ...prev,
                    takeProfit: e.target.value === '' ? null : parseFloat(e.target.value)
                  }))}
                  className="w-full px-3 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-md text-white"
                  placeholder="Enter take profit price"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => {
                  // Make sure at least one value is provided
                  if (modifyValues.stopLoss === null && modifyValues.takeProfit === null) {
                    toast.error('At least one of Stop Loss or Take Profit must be provided');
                    return;
                  }
                  
                  // Call the handleModifyTrade function with the values from the modal
                  handleModifyTrade(modifyingTrade, {
                    stopLoss: modifyValues.stopLoss,
                    takeProfit: modifyValues.takeProfit,
                    // Add options for the enhanced API endpoints
                    options: {
                      symbol: modifyingTrade.symbol || modifyingTrade.asset,
                      comment: `Modified from Trade Management UI on ${new Date().toISOString()}`
                    }
                  });
                  
                  // Close the modal
                  closeModifyTradeModal();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Apply Changes
              </button>
            </div>
          </div>
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
