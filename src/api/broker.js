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
    
    // Enhanced error handling for MetaAPI specific errors
    let errorMessage = 'Failed to connect account';
    
    if (error.response?.status === 402) {
      errorMessage = 'MetaAPI account requires payment. Please use default reliability or check your MetaAPI account.';
    } else if (error.response?.status === 409) {
      errorMessage = 'This trading account is already connected. Please check your existing connections.';
    } else if (error.response?.status === 401) {
      errorMessage = 'Invalid login credentials or server for this broker account. Please check and try again.';
    } else if (error.response?.status === 404) {
      errorMessage = 'The broker server you specified could not be found. Please verify the server name.';
    } else if (error.response?.status === 504) {
      errorMessage = 'Connection to broker timed out. Please try again later.';
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
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
    const response = await api.put(`/api/v1/broker/${accountId}`, updateData);
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
    const response = await api.get(`/api/v1/broker/${accountId}`);
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
    const response = await api.get('/api/v1/broker');
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
    const response = await api.delete(`/api/v1/broker/${accountId}/positions/${positionId}`);
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
    const response = await api.post(`/api/v1/broker/${accountId}/pair-trade`, pairData);
    
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
    const response = await api.get(`/api/v1/broker/${accountId}/spread-price/${symbol1}/${symbol2}`);
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
    const response = await api.post('/api/v1/broker/multi-account-trade', tradeData);
    
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
// SYMBOL MANAGEMENT API
// =============================================================================

export const getAccountSymbols = async (accountId) => {
  try {
    const response = await api.get(`/api/v1/broker/${accountId}/symbols`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error fetching account symbols:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch account symbols'
    };
  }
};

export const getAvailableSymbols = async (search = '', limit = 50) => {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('limit', limit.toString());
    
    const response = await api.get(`/api/v1/broker/symbols/available?${params}`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error fetching available symbols:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch available symbols'
    };
  }
};

export const refreshAccountSymbols = async (accountId) => {
  try {
    const response = await api.post(`/api/v1/broker/${accountId}/symbols/refresh`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error refreshing account symbols:', error);
    return {
      success: false,
      error: error.message || 'Failed to refresh account symbols'
    };
  }
};

export const getSymbolMappingStatus = async (accountId) => {
  try {
    const response = await api.get(`/api/v1/broker/${accountId}/symbols/status`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error fetching symbol mapping status:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch symbol mapping status'
    };
  }
};

export const getPopularSymbols = async () => {
  try {
    const response = await api.get('/api/v1/broker/symbols/popular');
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error fetching popular symbols:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch popular symbols'
    };
  }
};

export const searchSymbols = async (searchTerm, limit = 20) => {
  try {
    const response = await api.get(`/api/v1/broker/symbols/search/${encodeURIComponent(searchTerm)}?limit=${limit}`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error searching symbols:', error);
    return {
      success: false,
      error: error.message || 'Failed to search symbols'
    };
  }
};

// =============================================================================
// TRADING HISTORY AND ANALYTICS
// =============================================================================

export const getTradingHistory = async (accountId, options = {}) => {
  try {
    const params = new URLSearchParams();
    if (options.startDate) params.append('start_date', options.startDate);
    if (options.endDate) params.append('end_date', options.endDate);
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    
    const response = await api.get(`/api/v1/broker/${accountId}/history?${params}`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error fetching trading history:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch trading history'
    };
  }
};

export const getTrades = async (accountId, limit = 50, offset = 0) => {
  try {
    const response = await api.get(`/api/v1/broker/${accountId}/trades?limit=${limit}&offset=${offset}`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error fetching trades:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch trades'
    };
  }
};

// =============================================================================
// PAIR TRADING ANALYSIS
// =============================================================================

export const getPairAnalysis = async (accountId, symbol1, symbol2) => {
  try {
    const response = await api.get(`/api/v1/broker/${accountId}/pair-analysis?symbol1=${symbol1}&symbol2=${symbol2}`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error fetching pair analysis:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch pair analysis'
    };
  }
};

// =============================================================================
// REAL-TIME PRICE STREAMING
// =============================================================================

export const streamSymbolPrices = async (accountId, symbols) => {
  try {
    const response = await api.post(`/api/v1/broker/${accountId}/prices/stream`, { symbols });
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error creating price stream:', error);
    return {
      success: false,
      error: error.message || 'Failed to create price stream'
    };
  }
};

export const getPriceUpdates = async (accountId, connectionId) => {
  try {
    const response = await api.get(`/api/v1/broker/${accountId}/prices/updates/${connectionId}`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error getting price updates:', error);
    return {
      success: false,
      error: error.message || 'Failed to get price updates'
    };
  }
};

// Real-time price functions
export const getRealTimePrice = async (accountId, symbol) => {
  try {
    const response = await api.get(`/api/v1/broker/${accountId}/price/${symbol}`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error getting real-time price:', error);
    return {
      success: false,
      error: error.message || 'Failed to get real-time price'
    };
  }
};

export const getRealTimePrices = async (accountId, symbols) => {
  try {
    const symbolsParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
    const response = await api.get(`/api/v1/broker/${accountId}/prices?symbols=${symbolsParam}`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error getting real-time prices:', error);
    return {
      success: false,
      error: error.message || 'Failed to get real-time prices'
    };
  }
};
