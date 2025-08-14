import { api } from './client';

// =============================================================================
// BROKER ACCOUNT MANAGEMENT
// =============================================================================

export const connectAccount = async (accountData) => {
  try {
    const response = await api.post('/api/v1/broker/connect', accountData);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error connecting account:', error);
    return {
      success: false,
      error: error.message || 'Failed to connect account'
    };
  }
};

export const deleteAccount = async (accountId) => {
  try {
    const response = await api.delete(`/api/v1/broker/${accountId}`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error deleting account:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete account'
    };
  }
};

export const updateAccount = async (accountId, updateData) => {
  try {
    const response = await api.patch(`/api/v1/broker/${accountId}`, updateData);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error updating account:', error);
    return {
      success: false,
      error: error.message || 'Failed to update account'
    };
  }
};

export const toggleAccountStatus = async (accountId) => {
  try {
    const response = await api.patch(`/api/v1/broker/${accountId}/toggle`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error toggling account status:', error);
    return {
      success: false,
      error: error.message || 'Failed to toggle account status'
    };
  }
};

export const getAccountDetails = async (accountId) => {
  try {
    const response = await api.get(`/api/v1/broker/${accountId}/details`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error fetching account details:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch account details'
    };
  }
};

export const getAccounts = async () => {
  try {
    const response = await api.get('/api/v1/broker/');
    return {
      success: true,
      data: response || []
    };
  } catch (error) {
    console.error('Error fetching broker accounts:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch broker accounts',
      data: []
    };
  }
};

export const getAccountBalance = async (accountId) => {
  try {
    const response = await api.get(`/api/v1/broker/${accountId}/balance`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error fetching account balance:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch account balance'
    };
  }
};

// =============================================================================
// MARKET ORDERS (EXISTING)
// =============================================================================

export const placeTrade = async (accountId, tradeData) => {
  try {
    console.log('Placing trade with payload:', tradeData);
    const response = await api.post(`/api/v1/broker/${accountId}/trade`, tradeData);
    
    // The response structure matches TradeResponse from FastAPI
    const result = {
      success: response.data?.success || false,
      message: response.data?.message || 'Trade executed',
      order_id: response.data?.order_id || null,
      position_id: response.data?.position_id || null,
      details: response.data?.details || null,
      error: response.data?.error || null,
      ...response.data  // Include any additional fields
    };
    
    console.log('Trade response:', result);
    return result;
  } catch (error) {
    console.error('Error placing trade:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    
    let errorMessage = 'Failed to place trade';
    
    if (error.response?.status === 422) {
      // Handle validation errors specifically
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          // Pydantic validation errors
          const validationErrors = error.response.data.detail.map(err => {
            const field = err.loc?.slice(1).join('.') || 'unknown field';
            return `${field}: ${err.msg}`;
          }).join(', ');
          errorMessage = `Validation error: ${validationErrors}`;
        } else {
          errorMessage = `Validation error: ${error.response.data.detail}`;
        }
      }
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
      message: errorMessage
    };
  }
};

// =============================================================================
// PENDING ORDERS (NEW)
// =============================================================================

export const placePendingOrder = async (accountId, orderData) => {
  try {
    console.log('Placing pending order with payload:', orderData);
    const response = await api.post(`/api/v1/broker/${accountId}/pending-order`, orderData);
    
    // The response structure matches PendingOrderResponse from FastAPI
    const result = {
      success: response.data?.success || false,
      message: response.data?.message || 'Pending order placed',
      order_id: response.data?.order_id || null,
      details: response.data?.details || null,
      error: response.data?.error || null,
      ...response.data  // Include any additional fields
    };
    
    console.log('Pending order response:', result);
    return result;
  } catch (error) {
    console.error('Error placing pending order:', error);
    
    let errorMessage = 'Failed to place pending order';
    
    if (error.response?.status === 422) {
      // Handle validation errors specifically
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          // Pydantic validation errors
          const validationErrors = error.response.data.detail.map(err => {
            const field = err.loc?.slice(1).join('.') || 'unknown field';
            return `${field}: ${err.msg}`;
          }).join(', ');
          errorMessage = `Validation error: ${validationErrors}`;
        } else {
          errorMessage = `Validation error: ${error.response.data.detail}`;
        }
      }
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
      message: errorMessage
    };
  }
};

export const modifyOrder = async (accountId, orderId, modifications) => {
  try {
    const response = await api.patch(`/api/v1/broker/${accountId}/orders/${orderId}`, modifications);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error modifying order:', error);
    return {
      success: false,
      error: error.message || 'Failed to modify order'
    };
  }
};

export const cancelOrder = async (accountId, orderId) => {
  try {
    const response = await api.delete(`/api/v1/broker/${accountId}/orders/${orderId}`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error cancelling order:', error);
    return {
      success: false,
      error: error.message || 'Failed to cancel order'
    };
  }
};

export const getOrders = async (accountId) => {
  try {
    const response = await api.get(`/api/v1/broker/${accountId}/orders`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch orders'
    };
  }
};

// =============================================================================
// POSITION MANAGEMENT (NEW)
// =============================================================================

export const getPositions = async (accountId) => {
  try {
    const response = await api.get(`/api/v1/broker/${accountId}/positions`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error fetching positions:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch positions'
    };
  }
};

export const closePosition = async (accountId, positionId) => {
  try {
    const response = await api.post(`/api/v1/broker/${accountId}/positions/${positionId}/close`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error closing position:', error);
    return {
      success: false,
      error: error.message || 'Failed to close position'
    };
  }
};

export const modifyPosition = async (accountId, positionId, modifications) => {
  try {
    const response = await api.patch(`/api/v1/broker/${accountId}/positions/${positionId}`, modifications);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error modifying position:', error);
    return {
      success: false,
      error: error.message || 'Failed to modify position'
    };
  }
};

// =============================================================================
// PAIR TRADING (UPDATED)
// =============================================================================

export const placePairTrade = async (accountId, pairData) => {
  try {
    console.log('Placing pair trade with payload:', pairData);
    const response = await api.post(`/api/v1/broker-accounts/${accountId}/pair-trade`, pairData);
    
    // The response structure matches the new PairTradeResponse from FastAPI
    const result = {
      success: response.data?.success || false,
      message: response.data?.message || 'Pair trade executed',
      spread_symbol: response.data?.spread_symbol || null,
      current_spread: response.data?.current_spread || null,
      symbol1_result: response.data?.symbol1_result || null,
      symbol2_result: response.data?.symbol2_result || null,
      spread_analysis: response.data?.spread_analysis || null,
      entry_spread: response.data?.entry_spread || null, // For pending orders
      ...response.data  // Include any additional fields
    };
    
    console.log('Pair trade response:', result);
    return result;
  } catch (error) {
    console.error('Error placing pair trade:', error);
    console.error('Error response:', error.response?.data);
    
    let errorMessage = 'Failed to place pair trade';
    
    if (error.response?.status === 422) {
      // Handle validation errors specifically
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          // Pydantic validation errors
          const validationErrors = error.response.data.detail.map(err => {
            const field = err.loc?.slice(1).join('.') || 'unknown field';
            return `${field}: ${err.msg}`;
          }).join(', ');
          errorMessage = `Validation error: ${validationErrors}`;
        } else {
          errorMessage = `Validation error: ${error.response.data.detail}`;
        }
      }
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
      message: errorMessage,
      symbol1_result: {
        success: false,
        message: errorMessage,
        error: errorMessage
      },
      symbol2_result: {
        success: false,
        message: errorMessage,
        error: errorMessage
      }
    };
  }
};

// Get current spread price between two symbols
export const getSpreadPrice = async (accountId, symbol1, symbol2) => {
  try {
    const response = await api.get(`/api/v1/broker-accounts/${accountId}/spread-price/${symbol1}/${symbol2}`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error fetching spread price:', error);
    
    let errorMessage = 'Failed to fetch spread price';
    
    if (error.response?.status === 404) {
      errorMessage = `Spread ${symbol1}-${symbol2} not found`;
    } else if (error.response?.status === 429) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
      data: { bid: 0, ask: 0, spread: 0 }
    };
  }
};

// =============================================================================
// MULTI-ACCOUNT TRADING (NEW)
// =============================================================================

export const placeMultiAccountTrade = async (tradeData) => {
  try {
    console.log('Placing multi-account trade with payload:', tradeData);
    const response = await api.post('/api/v1/broker-accounts/multi-account-trade', tradeData);
    
    // The response structure matches MultiAccountTradeResponse from FastAPI
    const result = {
      success: response.data?.success || false,
      message: response.data?.message || 'Multi-account trade executed',
      successful_accounts: response.data?.successful_accounts || 0,
      failed_accounts: response.data?.failed_accounts || 0,
      results: response.data?.results || [],
      data: response.data  // Keep for backward compatibility
    };
    
    console.log('Multi-account trade response:', result);
    return result;
  } catch (error) {
    console.error('Error placing multi-account trade:', error);
    console.error('Error response:', error.response?.data);
    
    let errorMessage = 'Failed to place multi-account trade';
    
    if (error.response?.status === 422) {
      // Handle validation errors specifically
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          // Pydantic validation errors
          const validationErrors = error.response.data.detail.map(err => {
            const field = err.loc?.slice(1).join('.') || 'unknown field';
            return `${field}: ${err.msg}`;
          }).join(', ');
          errorMessage = `Validation error: ${validationErrors}`;
        } else {
          errorMessage = `Validation error: ${error.response.data.detail}`;
        }
      }
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
      message: errorMessage,
      successful_accounts: 0,
      failed_accounts: 0,
      results: []
    };
  }
};

// =============================================================================
// UNIFIED ORDER EXECUTION (NEW)
// =============================================================================

// Order types configuration for dropdown
export const ORDER_TYPES = {
  // Market Orders (immediate execution)
  MARKET_BUY: {
    label: "Market Buy",
    type: "MARKET",
    direction: "BUY",
    apiFunction: "placeTrade",
    description: "Buy immediately at current market price",
    requiresPrice: false
  },
  MARKET_SELL: {
    label: "Market Sell", 
    type: "MARKET",
    direction: "SELL",
    apiFunction: "placeTrade",
    description: "Sell immediately at current market price",
    requiresPrice: false
  },
  
  // Pending Orders (conditional execution)
  BUY_LIMIT: {
    label: "Buy Limit",
    type: "PENDING",
    direction: "BUY_LIMIT", 
    apiFunction: "placePendingOrder",
    description: "Buy when price drops to specified level",
    requiresPrice: true
  },
  SELL_LIMIT: {
    label: "Sell Limit",
    type: "PENDING", 
    direction: "SELL_LIMIT",
    apiFunction: "placePendingOrder",
    description: "Sell when price rises to specified level",
    requiresPrice: true
  },
  BUY_STOP: {
    label: "Buy Stop",
    type: "PENDING",
    direction: "BUY_STOP",
    apiFunction: "placePendingOrder", 
    description: "Buy when price breaks above specified level",
    requiresPrice: true
  },
  SELL_STOP: {
    label: "Sell Stop",
    type: "PENDING",
    direction: "SELL_STOP",
    apiFunction: "placePendingOrder",
    description: "Sell when price breaks below specified level",
    requiresPrice: true
  }
};

// Unified order execution function
export const executeOrder = async (accountId, orderType, orderData) => {
  try {
    const orderConfig = ORDER_TYPES[orderType];
    
    if (!orderConfig) {
      throw new Error(`Invalid order type: ${orderType}`);
    }

    // Prepare order payload based on type
    const payload = {
      symbol: orderData.symbol,
      volume: orderData.volume,
      stop_loss: orderData.stop_loss,
      take_profit: orderData.take_profit,
      comment: orderData.comment
    };

    if (orderConfig.type === "MARKET") {
      // Market order
      payload.trade_type = orderConfig.direction;
      return await placeTrade(accountId, payload);
    } else {
      // Pending order
      payload.order_type = orderConfig.direction;
      payload.price = orderData.price; // Required for pending orders
      payload.expiration = orderData.expiration;
      return await placePendingOrder(accountId, payload);
    }
  } catch (error) {
    console.error('Error executing order:', error);
    return {
      success: false,
      error: error.message || 'Failed to execute order'
    };
  }
};

// Helper function to get order types for dropdown
export const getOrderTypesForDropdown = () => {
  return Object.entries(ORDER_TYPES).map(([key, config]) => ({
    value: key,
    label: config.label,
    description: config.description,
    requiresPrice: config.requiresPrice,
    category: config.type
  }));
};

// =============================================================================
// REAL-TIME PRICING (NEW)
// =============================================================================

export const getSymbolPrice = async (accountId, symbol) => {
  try {
    const response = await api.get(`/api/v1/broker/${accountId}/price/${symbol}`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error fetching symbol price:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch symbol price'
    };
  }
};

export const getLivePrice = async (symbol) => {
  try {
    const response = await api.get(`/api/v1/market/price/${symbol}`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error fetching live price:', error);
    
    // Enhanced error handling for market data
    let errorMessage = 'Failed to fetch live price';
    
    if (error.response?.status === 404) {
      errorMessage = `Symbol ${symbol} not found`;
    } else if (error.response?.status === 429) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
      data: { bid: 0, ask: 0 }
    };
  }
};

// =============================================================================
// ADVANCED TRADING API CLASS
// =============================================================================

export class TradingAPI {
  constructor(baseURL = '/api/v1') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('access_token') || localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.token,
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || 'API request failed');
    }

    return data;
  }

  // Market Orders
  async placeMarketOrder(accountId, orderData) {
    return this.request(`/api/v1/broker/${accountId}/trade`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  // Pending Orders
  async placePendingOrder(accountId, orderData) {
    return this.request(`/api/v1/broker/${accountId}/pending-order`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  // Modify Orders
  async modifyOrder(accountId, orderId, modifications) {
    return this.request(`/api/v1/broker/${accountId}/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify(modifications),
    });
  }

  // Modify Positions
  async modifyPosition(accountId, positionId, modifications) {
    return this.request(`/api/v1/broker/${accountId}/positions/${positionId}`, {
      method: 'PATCH',
      body: JSON.stringify(modifications),
    });
  }

  // Pair Trading
  async placePairTrade(accountId, pairData) {
    const response = await this.request(`/api/v1/broker-accounts/${accountId}/pair-trade`, {
      method: 'POST',
      body: JSON.stringify(pairData),
    });
    
    return {
      success: response.success || false,
      message: response.message,
      spread_symbol: response.spread_symbol,
      current_spread: response.current_spread,
      symbol1_result: response.symbol1_result,
      symbol2_result: response.symbol2_result,
      spread_analysis: response.spread_analysis,
      ...response
    };
  }

  // Multi-Account Trading
  async placeMultiAccountTrade(tradeData) {
    const response = await this.request('/api/v1/broker-accounts/multi-account-trade', {
      method: 'POST',
      body: JSON.stringify(tradeData),
    });
    
    return {
      success: response.success || false,
      message: response.message,
      successful_accounts: response.successful_accounts || 0,
      failed_accounts: response.failed_accounts || 0,
      results: response.results || [],
      ...response
    };
  }

  // Get Spread Price
  async getSpreadPrice(accountId, symbol1, symbol2) {
    return this.request(`/api/v1/broker-accounts/${accountId}/spread-price/${symbol1}/${symbol2}`);
  }

  // Get Real-time Prices
  async getSymbolPrice(accountId, symbol) {
    return this.request(`/api/v1/broker/${accountId}/price/${symbol}`);
  }
  
  async getLivePrice(symbol) {
    return this.request(`/api/v1/market/price/${symbol}`);
  }

  // Position Management
  async getPositions(accountId) {
    return this.request(`/api/v1/broker/${accountId}/positions`);
  }

  async closePosition(accountId, positionId) {
    return this.request(`/api/v1/broker/${accountId}/positions/${positionId}/close`, {
      method: 'POST',
    });
  }

  // Order Management
  async getOrders(accountId) {
    return this.request(`/api/v1/broker/${accountId}/orders`);
  }

  async cancelOrder(accountId, orderId) {
    return this.request(`/api/v1/broker/${accountId}/orders/${orderId}`, {
      method: 'DELETE',
    });
  }

  // Account Management
  async getAccounts() {
    return this.request('/api/v1/broker/');
  }

  async getAccountDetails(accountId) {
    return this.request(`/api/v1/broker/${accountId}/details`);
  }
}

// Export a singleton instance
export const tradingAPI = new TradingAPI();
