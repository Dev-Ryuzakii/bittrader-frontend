/**
 * EA (Expert Advisor) API Client
 * 
 * Dedicated API endpoints for EA-connected trading accounts.
 * This client provides clean, real-time trading operations directly with EA connections.
 * 
 * Key features:
 * - Real-time account data from connected EAs
 * - Direct trade execution through EA queue
 * - WebSocket support for live updates
 * - Simplified, EA-focused operations
 */

import { api } from './client';

// =============================================================================
// EA ACCOUNT MANAGEMENT
// =============================================================================

/**
 * Get all connected EA accounts
 * Returns all EA accounts currently connected to the backend server.
 * Each EA connects its own account when deployed on VPS.
 */
export const getEAAccounts = async () => {
  try {
    const response = await api.get('/api/v1/ea/accounts');
    return {
      success: true,
      data: response || []
    };
  } catch (error) {
    console.error('Error fetching EA accounts:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch EA accounts',
      data: []
    };
  }
};

/**
 * Get EA connection status for a specific account
 */
export const getEAAccountStatus = async (accountId) => {
  try {
    const response = await api.get(`/api/v1/ea/accounts/${accountId}/status`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error fetching EA account status:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch EA account status'
    };
  }
};

/**
 * Get real-time balance information from EA
 */
export const getEAAccountBalance = async (accountId) => {
  try {
    const response = await api.get(`/api/v1/ea/accounts/${accountId}/balance`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error fetching EA account balance:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch EA account balance'
    };
  }
};

/**
 * Debug endpoint to see connected accounts
 */
export const debugConnectedAccounts = async () => {
  try {
    const response = await api.get('/api/v1/ea/debug/connected-accounts');
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error fetching debug connected accounts:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch connected accounts debug info'
    };
  }
};

/**
 * Link an existing EA account to the current user
 */
export const linkEAAccountToUser = async (accountNumber) => {
  try {
    const response = await api.post(`/api/v1/ea/debug/link-account/${accountNumber}`);
    return {
      success: response.success || false,
      data: response,
      message: response.message
    };
  } catch (error) {
    console.error('Error linking EA account to user:', error);
    return {
      success: false,
      error: error.message || 'Failed to link EA account'
    };
  }
};

// =============================================================================
// POSITION MANAGEMENT
// =============================================================================

/**
 * Get all open positions from EA
 */
export const getEAPositions = async (accountId) => {
  try {
    const response = await api.get(`/api/v1/ea/accounts/${accountId}/positions`);
    return {
      success: true,
      data: response || []
    };
  } catch (error) {
    console.error('Error fetching EA positions:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch EA positions',
      data: []
    };
  }
};

// =============================================================================
// ORDER MANAGEMENT
// =============================================================================

/**
 * Get all pending orders from EA
 */
export const getEAOrders = async (accountId) => {
  try {
    const response = await api.get(`/api/v1/ea/accounts/${accountId}/orders`);
    return {
      success: true,
      data: response || []
    };
  } catch (error) {
    console.error('Error fetching EA orders:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch EA orders',
      data: []
    };
  }
};

// =============================================================================
// TRADE EXECUTION
// =============================================================================

/**
 * Place a market trade via EA
 * Queues the trade request for EA execution
 */
export const placeEATrade = async (accountId, tradeRequest) => {
  try {
    console.log('Placing EA trade with payload:', tradeRequest);
    const response = await api.post(`/api/v1/ea/accounts/${accountId}/trade`, tradeRequest);
    
    const result = {
      success: response.success || false,
      message: response.message || 'Trade queued for EA execution',
      request_id: response.request_id || null,
      account_id: response.account_id || accountId,
      symbol: response.symbol || tradeRequest.symbol,
      trade_type: response.trade_type || tradeRequest.trade_type,
      volume: response.volume || tradeRequest.volume,
      status: response.status || 'queued',
      queued_at: response.queued_at || new Date().toISOString(),
      ...response
    };
    
    console.log('EA trade response:', result);
    return result;
  } catch (error) {
    console.error('Error placing EA trade:', error);
    
    let errorMessage = 'Failed to place EA trade';
    let errorType = 'unknown';
    let suggestions = [];
    
    if (error.response?.status === 404) {
      errorMessage = 'EA account not found';
      errorType = 'account_not_found';
      suggestions = ['Verify account ID is correct', 'Check if EA is connected'];
    } else if (error.response?.status === 400) {
      errorMessage = error.response?.data?.detail || 'EA account is not connected';
      errorType = 'account_not_connected';
      suggestions = ['Check EA connection status', 'Ensure EA is running on VPS'];
    } else if (error.response?.status === 422) {
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          const validationErrors = error.response.data.detail.map(err => {
            const field = err.loc?.slice(1).join('.') || 'unknown field';
            return `${field}: ${err.msg}`;
          }).join(', ');
          errorMessage = `Validation error: ${validationErrors}`;
        } else {
          errorMessage = `Validation error: ${error.response.data.detail}`;
        }
      }
      errorType = 'validation_error';
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
      message: errorMessage,
      error_type: errorType,
      suggestions: suggestions,
      status: 'failed'
    };
  }
};

/**
 * Place a pending order via EA
 * Queues the pending order request for EA execution
 */
export const placeEAPendingOrder = async (accountId, orderRequest) => {
  try {
    console.log('Placing EA pending order with payload:', orderRequest);
    const response = await api.post(`/api/v1/ea/accounts/${accountId}/pending-order`, orderRequest);
    
    const result = {
      success: response.success || false,
      message: response.message || 'Pending order queued for EA execution',
      request_id: response.request_id || null,
      account_id: response.account_id || accountId,
      symbol: response.symbol || orderRequest.symbol,
      trade_type: response.trade_type || orderRequest.order_type,
      volume: response.volume || orderRequest.volume,
      status: response.status || 'queued',
      queued_at: response.queued_at || new Date().toISOString(),
      ...response
    };
    
    console.log('EA pending order response:', result);
    return result;
  } catch (error) {
    console.error('Error placing EA pending order:', error);
    
    let errorMessage = 'Failed to place EA pending order';
    let errorType = 'unknown';
    let suggestions = [];
    
    if (error.response?.status === 404) {
      errorMessage = 'EA account not found';
      errorType = 'account_not_found';
    } else if (error.response?.status === 403) {
      errorMessage = 'Access denied to EA account';
      errorType = 'access_denied';
    } else if (error.response?.status === 400) {
      errorMessage = error.response?.data?.detail || 'EA account is not connected';
      errorType = 'account_not_connected';
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    }
    
    return {
      success: false,
      error: errorMessage,
      message: errorMessage,
      error_type: errorType,
      suggestions: suggestions,
      status: 'failed'
    };
  }
};

/**
 * Place a pair trade (spread trading) via EA
 * Executes simultaneous trades on two symbols to trade the spread
 */
export const placeEAPairTrade = async (accountId, pairRequest) => {
  try {
    console.log('Placing EA pair trade with payload:', pairRequest);
    const response = await api.post(`/api/v1/ea/accounts/${accountId}/pair-trade`, pairRequest);
    
    const result = {
      success: response.success || false,
      message: response.message || 'Pair trade queued for EA execution',
      request_id: response.request_id || null,
      spread_symbol: response.spread_symbol || `${pairRequest.symbol1}-${pairRequest.symbol2}`,
      current_spread: response.current_spread || 0.0,
      symbol1_request_id: response.symbol1_request_id || null,
      symbol2_request_id: response.symbol2_request_id || null,
      status: response.status || 'queued',
      queued_at: response.queued_at || new Date().toISOString(),
      ...response
    };
    
    console.log('EA pair trade response:', result);
    return result;
  } catch (error) {
    console.error('Error placing EA pair trade:', error);
    
    let errorMessage = 'Failed to place EA pair trade';
    let errorType = 'unknown';
    
    if (error.response?.status === 404) {
      errorMessage = 'EA account not found';
      errorType = 'account_not_found';
    } else if (error.response?.status === 403) {
      errorMessage = 'Access denied to EA account';
      errorType = 'access_denied';
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    }
    
    return {
      success: false,
      error: errorMessage,
      message: errorMessage,
      error_type: errorType,
      status: 'failed'
    };
  }
};

// =============================================================================
// SYMBOL AND PRICE DATA
// =============================================================================

/**
 * Get available symbols from EA
 */
export const getEASymbols = async (accountId) => {
  try {
    const response = await api.get(`/api/v1/ea/accounts/${accountId}/symbols`);
    return {
      success: true,
      data: response || []
    };
  } catch (error) {
    console.error('Error fetching EA symbols:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch EA symbols',
      data: []
    };
  }
};

/**
 * Get real-time prices from EA using REST endpoint
 * @param {string} accountId - EA account ID
 * @param {string|Array} symbols - Comma-separated string or array of symbols (optional)
 */
export const getEAPrices = async (accountId, symbols = null) => {
  try {
    let url = `/api/v1/ea/accounts/${accountId}/prices`;
    
    if (symbols) {
      const symbolsParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
      url += `?symbols=${encodeURIComponent(symbolsParam)}`;
    }
    
    const response = await api.get(url);
    return {
      success: true,
      data: response.data || response || []
    };
  } catch (error) {
    console.error('Error fetching EA prices:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch EA prices',
      data: []
    };
  }
};

/**
 * Get single symbol price from EA using REST endpoint
 */
export const getEASymbolPrice = async (accountId, symbol) => {
  try {
    const prices = await getEAPrices(accountId, symbol);
    if (prices.success && prices.data.length > 0) {
      const priceData = prices.data[0];
      return {
        success: true,
        data: {
          symbol: priceData.symbol,
          bid: priceData.bid,
          ask: priceData.ask,
          price: (priceData.bid + priceData.ask) / 2, // Mid price
          spread: priceData.spread,
          digits: priceData.digits,
          timestamp: priceData.timestamp,
          source: priceData.source
        }
      };
    }
    return {
      success: false,
      error: `Price not found for symbol ${symbol}`,
      data: null
    };
  } catch (error) {
    console.error('Error fetching EA symbol price:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch EA symbol price',
      data: null
    };
  }
};

/**
 * Get live prices for multiple symbols from EA
 * @param {string} accountId - EA account ID
 * @param {Array} symbols - Array of symbols
 */
export const getEALivePrices = async (accountId, symbols) => {
  try {
    if (!symbols || symbols.length === 0) {
      return {
        success: false,
        error: 'No symbols provided',
        data: {}
      };
    }

    const prices = await getEAPrices(accountId, symbols);
    if (prices.success) {
      // Convert array to object keyed by symbol for easier access
      const pricesMap = {};
      prices.data.forEach(priceData => {
        pricesMap[priceData.symbol] = {
          bid: priceData.bid,
          ask: priceData.ask,
          price: (priceData.bid + priceData.ask) / 2,
          spread: priceData.spread,
          digits: priceData.digits,
          timestamp: priceData.timestamp,
          source: priceData.source
        };
      });

      return {
        success: true,
        data: pricesMap
      };
    }

    return prices;
  } catch (error) {
    console.error('Error fetching EA live prices:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch EA live prices',
      data: {}
    };
  }
};

/**
 * Get current market price for trading (uses mid price)
 * @param {string} accountId - EA account ID  
 * @param {string} symbol - Symbol to get price for
 */
export const getEAMarketPrice = async (accountId, symbol) => {
  try {
    const result = await getEASymbolPrice(accountId, symbol);
    if (result.success && result.data) {
      return {
        success: true,
        price: result.data.price,
        bid: result.data.bid,
        ask: result.data.ask,
        spread: result.data.spread,
        timestamp: result.data.timestamp
      };
    }
    
    return {
      success: false,
      error: result.error || 'Failed to get market price',
      price: null
    };
  } catch (error) {
    console.error('Error fetching EA market price:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch EA market price',
      price: null
    };
  }
};

// =============================================================================
// TRADE QUEUE MANAGEMENT
// =============================================================================

/**
 * Get current pending trade queue for an EA account
 * Useful for debugging trade execution issues
 */
export const getEATradeQueue = async (accountId) => {
  try {
    const response = await api.get(`/api/v1/ea/accounts/${accountId}/trade-queue`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error fetching EA trade queue:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch EA trade queue'
    };
  }
};

/**
 * Get recent trade execution history for an EA account
 */
export const getEATradeHistory = async (accountId, limit = 10) => {
  try {
    const response = await api.get(`/api/v1/ea/accounts/${accountId}/trade-history?limit=${limit}`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error fetching EA trade history:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch EA trade history',
      data: {
        account_id: accountId,
        trade_history: [],
        message: 'Trade history feature requires database integration'
      }
    };
  }
};

// =============================================================================
// WEBSOCKET CONNECTION MANAGEMENT
// =============================================================================

/**
 * WebSocket connection manager for EA updates
 */
export class EAWebSocketManager {
  constructor() {
    this.ws = null;
    this.userId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 1000; // Start with 1 second
    this.listeners = new Map();
  }

  /**
   * Connect to EA WebSocket endpoint
   */
  connect(userId) {
    try {
      this.userId = userId;
      const baseURL = api.getCurrentApiUrl();
      if (!baseURL) {
        throw new Error('API base URL not available');
      }
      const wsUrl = `${baseURL.replace('http', 'ws')}/api/v1/ea/ws/${userId}`;
      
      console.log('Connecting to EA WebSocket:', wsUrl);
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = (event) => {
        console.log('EA WebSocket connected');
        this.reconnectAttempts = 0;
        this.reconnectInterval = 1000;
        this.emit('connected', event);
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('EA WebSocket message received:', message);
          this.emit('message', message);
          this.emit(message.type, message);
        } catch (error) {
          console.error('Error parsing EA WebSocket message:', error);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log('EA WebSocket disconnected:', event);
        this.emit('disconnected', event);
        this.handleReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('EA WebSocket error:', error);
        this.emit('error', error);
      };
      
    } catch (error) {
      console.error('Error connecting to EA WebSocket:', error);
      this.emit('error', error);
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
  }

  /**
   * Send ping to keep connection alive
   */
  ping() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send('ping');
    }
  }

  /**
   * Handle automatic reconnection
   */
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.userId) {
      this.reconnectAttempts++;
      console.log(`EA WebSocket reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectInterval}ms`);
      
      setTimeout(() => {
        this.connect(this.userId);
      }, this.reconnectInterval);
      
      // Exponential backoff
      this.reconnectInterval = Math.min(this.reconnectInterval * 2, 30000);
    } else {
      console.error('EA WebSocket max reconnection attempts reached');
      this.emit('reconnect_failed');
    }
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in EA WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }
}

// Create singleton instance
export const eaWebSocket = new EAWebSocketManager();

// =============================================================================
// EA-SPECIFIC TRADING HELPERS
// =============================================================================

/**
 * EA Order types configuration
 */
export const EA_ORDER_TYPES = {
  // Market Orders
  MARKET_BUY: {
    label: "Market Buy",
    type: "MARKET",
    direction: "BUY",
    apiFunction: "placeEATrade",
    description: "Buy immediately at current market price via EA",
    requiresPrice: false
  },
  MARKET_SELL: {
    label: "Market Sell",
    type: "MARKET", 
    direction: "SELL",
    apiFunction: "placeEATrade",
    description: "Sell immediately at current market price via EA",
    requiresPrice: false
  },
  
  // Pending Orders
  BUY_LIMIT: {
    label: "Buy Limit",
    type: "PENDING",
    direction: "buy_limit",
    apiFunction: "placeEAPendingOrder",
    description: "Buy when price drops to specified level (EA)",
    requiresPrice: true
  },
  SELL_LIMIT: {
    label: "Sell Limit",
    type: "PENDING",
    direction: "sell_limit", 
    apiFunction: "placeEAPendingOrder",
    description: "Sell when price rises to specified level (EA)",
    requiresPrice: true
  },
  BUY_STOP: {
    label: "Buy Stop",
    type: "PENDING",
    direction: "buy_stop",
    apiFunction: "placeEAPendingOrder",
    description: "Buy when price breaks above specified level (EA)",
    requiresPrice: true
  },
  SELL_STOP: {
    label: "Sell Stop", 
    type: "PENDING",
    direction: "sell_stop",
    apiFunction: "placeEAPendingOrder",
    description: "Sell when price breaks below specified level (EA)",
    requiresPrice: true
  }
};

/**
 * Execute EA order with unified interface
 */
export const executeEAOrder = async (accountId, orderType, orderData) => {
  try {
    const orderConfig = EA_ORDER_TYPES[orderType];
    
    if (!orderConfig) {
      throw new Error(`Invalid EA order type: ${orderType}`);
    }

    // Prepare order payload
    const payload = {
      symbol: orderData.symbol,
      volume: orderData.volume,
      stop_loss: orderData.stop_loss,
      take_profit: orderData.take_profit,
      comment: orderData.comment || 'EA API Order',
      request_id: orderData.request_id || null
    };

    if (orderConfig.type === "MARKET") {
      // Market order
      payload.trade_type = orderConfig.direction;
      return await placeEATrade(accountId, payload);
    } else {
      // Pending order
      payload.order_type = orderConfig.direction;
      payload.price = orderData.price;
      payload.expiration = orderData.expiration;
      return await placeEAPendingOrder(accountId, payload);
    }
  } catch (error) {
    console.error('Error executing EA order:', error);
    return {
      success: false,
      error: error.message || 'Failed to execute EA order',
      status: 'failed'
    };
  }
};

/**
 * Format EA trade response for UI display
 */
export const formatEATradeResponse = (response) => {
  if (!response) return null;
  
  return {
    success: response.success,
    message: response.message,
    requestId: response.request_id,
    accountId: response.account_id,
    symbol: response.symbol,
    tradeType: response.trade_type,
    volume: response.volume,
    status: response.status,
    queuedAt: response.queued_at,
    error: response.error,
    errorType: response.error_type,
    suggestions: response.suggestions || [],
    timestamp: new Date().toISOString()
  };
};

/**
 * Check if account is EA-connected
 */
export const isEAAccount = (account) => {
  return account && (
    account.platform === 'EA' ||
    account.connection_type === 'EA' ||
    account.status === 'connected'
  );
};

/**
 * Get EA order types for dropdown
 */
export const getEAOrderTypesForDropdown = () => {
  return Object.entries(EA_ORDER_TYPES).map(([key, config]) => ({
    value: key,
    label: config.label,
    description: config.description,
    requiresPrice: config.requiresPrice,
    category: config.type
  }));
};

// =============================================================================
// CONSTANTS AND CONFIGURATIONS
// =============================================================================

export const EA_TRADE_TYPES = {
  BUY: 'BUY',
  SELL: 'SELL'
};

export const EA_ORDER_STATUSES = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  EXECUTED: 'executed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

export const EA_ACCOUNT_STATUSES = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error'
};

export const EA_WEBSOCKET_MESSAGE_TYPES = {
  TRADE_RESULT: 'trade_result',
  ACCOUNT_UPDATE: 'account_update',
  POSITION_UPDATE: 'position_update',
  PRICE_UPDATE: 'price_update',
  ORDER_UPDATE: 'order_update',
  BALANCE_UPDATE: 'balance_update'
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Handle EA API errors consistently
 */
const handleEAError = (error, defaultMessage) => {
  let errorMessage = defaultMessage;
  let errorDetails = null;
  
  if (error.response) {
    // HTTP error response
    errorDetails = {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data
    };
    
    if (error.response.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.response.data?.message) {
      errorMessage = error.response.data.message;
    }
  } else if (error.message) {
    errorMessage = error.message;
  }
  
  return {
    success: false,
    error: errorMessage,
    details: errorDetails
  };
};

// =============================================================================
// TRADING ANALYSIS AND ANALYTICS
// =============================================================================

/**
 * Get comprehensive trading analysis data
 */
export const getEAAnalysisData = async (endpoint, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add date range parameters if provided
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    
    const url = `/api/v1/trading/analysis/${endpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await api.get(url);
    
    return {
      success: true,
      data: response.data,
      ...response.data
    };
  } catch (error) {
    console.error(`Error fetching EA analysis data (${endpoint}):`, error);
    return handleEAError(error, 'Failed to fetch EA analysis data');
  }
};

/**
 * Export trading analysis to Excel
 */
export const exportAnalysisToExcel = async (endpoint, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add date range parameters if provided
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    
    const url = `/api/v1/trading/analysis/export/excel/${endpoint}`;
    
    const response = await api.post(url, params, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Create download link
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    
    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    link.download = `trading_analysis_${endpoint.replace(/\//g, '_')}_${timestamp}.xlsx`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    
    return {
      success: true,
      message: 'Analysis exported successfully'
    };
  } catch (error) {
    console.error('Error exporting analysis to Excel:', error);
    return handleEAError(error, 'Failed to export analysis');
  }
};

/**
 * Generate market outlook report
 */
export const generateMarketOutlook = async (requestData) => {
  try {
    const response = await api.post('/api/v1/trading/analysis/market-outlook', requestData);
    
    return {
      success: true,
      data: response.data,
      ...response.data
    };
  } catch (error) {
    console.error('Error generating market outlook:', error);
    return handleEAError(error, 'Failed to generate market outlook');
  }
};

/**
 * Export market outlook to Excel
 */
export const exportMarketOutlookToExcel = async (requestData) => {
  try {
    const response = await api.post('/api/v1/trading/analysis/export/excel/market-outlook', requestData, {
      responseType: 'blob'
    });
    
    // Create download link
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    
    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const reportName = requestData.report_name ? requestData.report_name.replace(/\s+/g, '_') : 'market_outlook';
    link.download = `${reportName}_${timestamp}.xlsx`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    
    return {
      success: true,
      message: 'Market outlook exported successfully'
    };
  } catch (error) {
    console.error('Error exporting market outlook to Excel:', error);
    return handleEAError(error, 'Failed to export market outlook');
  }
};

/**
 * Get instrument categories and symbol information
 */
export const getEAInstrumentCategories = async () => {
  try {
    const response = await api.get('/api/v1/trading/analysis/categories');
    
    return {
      success: true,
      data: response.data,
      ...response.data
    };
  } catch (error) {
    console.error('Error fetching EA instrument categories:', error);
    return handleEAError(error, 'Failed to fetch instrument categories');
  }
};

/**
 * Test symbol categorization
 */
export const testEASymbolCategorization = async (symbol) => {
  try {
    const response = await api.get(`/api/v1/trading/analysis/test-categorization/${symbol}`);
    
    return {
      success: true,
      data: response.data,
      ...response.data
    };
  } catch (error) {
    console.error(`Error testing symbol categorization for ${symbol}:`, error);
    return handleEAError(error, 'Failed to test symbol categorization');
  }
};

// Default EA configuration values
export const EA_DEFAULT_CONFIG = {
  RECONNECT_INTERVAL: 1000,
  MAX_RECONNECT_ATTEMPTS: 5,
  PING_INTERVAL: 30000, // 30 seconds
  DEFAULT_TRADE_VOLUME: 0.01,
  QUEUE_CHECK_INTERVAL: 2000 // 2 seconds
};

export default {
  // Account Management
  getEAAccounts,
  getEAAccountStatus,
  getEAAccountBalance,
  debugConnectedAccounts,
  linkEAAccountToUser,
  
  // Position & Order Management
  getEAPositions,
  getEAOrders,
  
  // Trade Execution
  placeEATrade,
  placeEAPendingOrder,
  placeEAPairTrade,
  executeEAOrder,
  
  // Symbol & Price Data
  getEASymbols,
  getEAPrices,
  getEASymbolPrice,
  getEALivePrices,
  getEAMarketPrice,
  
  // Trading Analysis & Analytics
  getEAAnalysisData,
  exportAnalysisToExcel,
  generateMarketOutlook,
  exportMarketOutlookToExcel,
  getEAInstrumentCategories,
  testEASymbolCategorization,
  
  // Trade Queue Management
  getEATradeQueue,
  getEATradeHistory,
  
  // WebSocket
  eaWebSocket,
  EAWebSocketManager,
  
  // Helpers
  formatEATradeResponse,
  isEAAccount,
  getEAOrderTypesForDropdown,
  
  // Constants
  EA_ORDER_TYPES,
  EA_TRADE_TYPES,
  EA_ORDER_STATUSES,
  EA_ACCOUNT_STATUSES,
  EA_WEBSOCKET_MESSAGE_TYPES,
  EA_DEFAULT_CONFIG
};
