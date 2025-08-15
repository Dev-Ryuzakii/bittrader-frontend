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
// SYMBOL VALIDATION (NEW)
// =============================================================================

export const validateSymbol = async (accountId, symbol) => {
  try {
    const response = await api.get(`/api/v1/broker/${accountId}/symbol/${symbol}/validate`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error validating symbol:', error);
    
    let errorMessage = 'Failed to validate symbol';
    let suggestions = [];
    
    if (error.response?.status === 404) {
      errorMessage = `Symbol ${symbol} not found on this broker`;
      suggestions = [
        'Check symbol spelling',
        'Use available symbols from /symbols endpoint',
        'Try common variations (EURUSD, EUR/USD, etc.)'
      ];
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
      suggestions = error.response.data.suggestions || [];
    }
    
    return {
      success: false,
      error: errorMessage,
      suggestions: suggestions
    };
  }
};

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
      error: error.message || 'Failed to fetch account symbols',
      data: { symbols: [] }
    };
  }
};

// =============================================================================
// MARKET ORDERS (ENHANCED)
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
    let errorType = 'unknown';
    let suggestions = [];
    
    // Enhanced error handling based on backend improvements
    if (error.response?.status === 503) {
      // Service Unavailable - Market data issues
      errorMessage = error.response?.data?.detail || 'Market data unavailable';
      errorType = 'market_data_unavailable';
      suggestions = [
        'Check if markets are open',
        'Try again during market hours',
        'Contact MetaAPI support for demo account data access',
        'Consider upgrading to live account for full market data'
      ];
    } else if (error.response?.status === 504) {
      // Gateway Timeout - Connection issues
      errorMessage = 'Connection timeout. Please try again.';
      errorType = 'connection_timeout';
      suggestions = ['Try again in a few moments', 'Check your internet connection'];
    } else if (error.response?.status === 404) {
      // Not Found - Symbol issues
      errorMessage = error.response?.data?.detail || 'Symbol not found';
      errorType = 'symbol_not_found';
      suggestions = ['Check symbol spelling', 'Use /symbols endpoint to see available symbols'];
    } else if (error.response?.status === 422) {
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
      errorType = 'validation_error';
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
      error_type: errorType,
      suggestions: suggestions
    };
  }
};

// =============================================================================
// PENDING ORDERS
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
    let errorType = 'unknown';
    let suggestions = [];
    
    // Enhanced error handling
    if (error.response?.status === 503) {
      errorMessage = error.response?.data?.detail || 'Market data unavailable';
      errorType = 'market_data_unavailable';
      suggestions = [
        'Check if markets are open',
        'Try again during market hours',
        'Contact support if issue persists'
      ];
    } else if (error.response?.status === 422) {
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
      errorType = 'validation_error';
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
      error_type: errorType,
      suggestions: suggestions
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
// POSITION MANAGEMENT (ENHANCED)
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
    // Fixed: Should be DELETE, not POST
    const response = await api.delete(`/api/v1/broker/${accountId}/positions/${positionId}`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error closing position:', error);
    
    let errorMessage = 'Failed to close position';
    
    if (error.response?.status === 404) {
      errorMessage = 'Position not found or already closed';
    } else if (error.response?.status === 503) {
      errorMessage = 'Trading system unavailable. Please try again.';
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    }
    
    return {
      success: false,
      error: errorMessage
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
    let errorType = 'unknown';
    let suggestions = [];
    
    if (error.response?.status === 503) {
      errorMessage = error.response?.data?.detail || 'Market data unavailable for pair trading';
      errorType = 'market_data_unavailable';
      suggestions = [
        'Check if markets are open for both symbols',
        'Try again during market hours',
        'Verify both symbols are available on this broker'
      ];
    } else if (error.response?.status === 422) {
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
      errorType = 'validation_error';
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
      error_type: errorType,
      suggestions: suggestions,
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
    } else if (error.response?.status === 503) {
      errorMessage = 'Market data unavailable for spread calculation';
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
// MULTI-ACCOUNT TRADING
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
// UNIFIED ORDER EXECUTION
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
// REAL-TIME PRICING (ENHANCED)
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
    
    let errorMessage = 'Failed to fetch symbol price';
    let suggestions = [];
    
    if (error.response?.status === 404) {
      errorMessage = `Symbol ${symbol} not found`;
      suggestions = ['Check symbol spelling', 'Verify symbol is available on this broker'];
    } else if (error.response?.status === 503) {
      errorMessage = 'Price data unavailable';
      suggestions = ['Check if markets are open', 'Try again during market hours'];
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
      suggestions = error.response.data.suggestions || [];
    }
    
    return {
      success: false,
      error: errorMessage,
      suggestions: suggestions
    };
  }
};

export const getMultipleSymbolPrices = async (accountId, symbols) => {
  try {
    // Convert array to comma-separated string
    const symbolsParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
    const response = await api.get(`/api/v1/broker/${accountId}/prices?symbols=${symbolsParam}`);
    
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error fetching multiple symbol prices:', error);
    
    let errorMessage = 'Failed to fetch symbol prices';
    
    if (error.response?.status === 400) {
      errorMessage = 'Invalid symbols provided or too many symbols requested (max 20)';
    } else if (error.response?.status === 503) {
      errorMessage = 'Price data service unavailable';
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    }
    
    return {
      success: false,
      error: errorMessage,
      data: { prices: [] }
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
    } else if (error.response?.status === 503) {
      errorMessage = 'Market data service unavailable';
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
// TRADING HELPERS (NEW)
// =============================================================================

export const validateTradeParameters = (tradeData, symbolSpecs) => {
  const errors = [];
  const warnings = [];
  
  if (!symbolSpecs) {
    return { valid: true, errors, warnings };
  }
  
  // Volume validation
  const minVolume = symbolSpecs.min_volume || 0.01;
  const maxVolume = symbolSpecs.max_volume || 100;
  const volumeStep = symbolSpecs.volume_step || 0.01;
  
  if (tradeData.volume < minVolume) {
    errors.push(`Volume ${tradeData.volume} is below minimum ${minVolume}`);
  }
  
  if (tradeData.volume > maxVolume) {
    errors.push(`Volume ${tradeData.volume} exceeds maximum ${maxVolume}`);
  }
  
  // Check volume step alignment
  if (volumeStep > 0) {
    const adjustedVolume = Math.round(tradeData.volume / volumeStep) * volumeStep;
    if (Math.abs(adjustedVolume - tradeData.volume) > 0.0001) {
      warnings.push(`Volume will be adjusted from ${tradeData.volume} to ${adjustedVolume.toFixed(4)} to match step ${volumeStep}`);
    }
  }
  
  // Stop loss validation for buy orders
  if (tradeData.trade_type === 'BUY' && tradeData.stop_loss && tradeData.current_price) {
    if (tradeData.stop_loss >= tradeData.current_price) {
      errors.push('Stop loss must be below current price for buy orders');
    }
  }
  
  // Stop loss validation for sell orders
  if (tradeData.trade_type === 'SELL' && tradeData.stop_loss && tradeData.current_price) {
    if (tradeData.stop_loss <= tradeData.current_price) {
      errors.push('Stop loss must be above current price for sell orders');
    }
  }
  
  // Take profit validation for buy orders
  if (tradeData.trade_type === 'BUY' && tradeData.take_profit && tradeData.current_price) {
    if (tradeData.take_profit <= tradeData.current_price) {
      errors.push('Take profit must be above current price for buy orders');
    }
  }
  
  // Take profit validation for sell orders
  if (tradeData.trade_type === 'SELL' && tradeData.take_profit && tradeData.current_price) {
    if (tradeData.take_profit >= tradeData.current_price) {
      errors.push('Take profit must be below current price for sell orders');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

// Calculate position size based on risk parameters
export const calculatePositionSize = (accountBalance, riskPercent, stopLossPips, pipValue) => {
  try {
    const riskAmount = accountBalance * (riskPercent / 100);
    const positionSize = riskAmount / (stopLossPips * pipValue);
    
    return {
      success: true,
      positionSize: Math.round(positionSize * 100) / 100, // Round to 2 decimal places
      riskAmount: riskAmount,
      calculations: {
        accountBalance,
        riskPercent,
        stopLossPips,
        pipValue,
        riskAmount
      }
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to calculate position size',
      positionSize: 0
    };
  }
};

// Format trading response for UI display
export const formatTradeResponse = (response) => {
  if (!response) return null;
  
  return {
    success: response.success,
    message: response.message,
    details: response.details,
    error: response.error,
    errorType: response.error_type,
    suggestions: response.suggestions || [],
    orderId: response.order_id,
    positionId: response.position_id,
    timestamp: new Date().toISOString()
  };
};

// =============================================================================
// TRADE HISTORY AND ANALYTICS
// =============================================================================

export const getTradeHistory = async (accountId, limit = 50, offset = 0) => {
  try {
    const response = await api.get(`/api/v1/broker/${accountId}/trades?limit=${limit}&offset=${offset}`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error fetching trade history:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch trade history',
      data: []
    };
  }
};

export const getTradingHistory = async (accountId, limit = 50, offset = 0) => {
  try {
    const response = await api.get(`/api/v1/broker/${accountId}/history?limit=${limit}&offset=${offset}`);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error fetching trading history:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch trading history',
      data: { trades: [], pagination: { total: 0, limit, offset } }
    };
  }
};

// =============================================================================
// ERROR HANDLING UTILITIES
// =============================================================================

export const handleApiError = (error, context = 'API call') => {
  console.error(`${context} error:`, error);
  
  let errorMessage = `${context} failed`;
  let errorType = 'unknown';
  let suggestions = [];
  
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    
    switch (status) {
      case 400:
        errorMessage = data?.detail || 'Bad request';
        errorType = 'bad_request';
        break;
      case 401:
        errorMessage = 'Authentication failed';
        errorType = 'authentication_failed';
        suggestions = ['Please log in again'];
        break;
      case 403:
        errorMessage = 'Access denied';
        errorType = 'access_denied';
        suggestions = ['Check your permissions'];
        break;
      case 404:
        errorMessage = data?.detail || 'Resource not found';
        errorType = 'not_found';
        break;
      case 422:
        errorMessage = 'Validation error';
        errorType = 'validation_error';
        if (data?.detail && Array.isArray(data.detail)) {
          const validationErrors = data.detail.map(err => {
            const field = err.loc?.slice(1).join('.') || 'unknown field';
            return `${field}: ${err.msg}`;
          }).join(', ');
          errorMessage = `Validation error: ${validationErrors}`;
        }
        break;
      case 429:
        errorMessage = 'Rate limit exceeded';
        errorType = 'rate_limit';
        suggestions = ['Please wait before trying again'];
        break;
      case 503:
        errorMessage = data?.detail || 'Service unavailable';
        errorType = 'service_unavailable';
        suggestions = ['Try again later', 'Check system status'];
        break;
      case 504:
        errorMessage = 'Request timeout';
        errorType = 'timeout';
        suggestions = ['Try again', 'Check your connection'];
        break;
      default:
        errorMessage = data?.detail || data?.message || `HTTP ${status} error`;
        errorType = 'http_error';
    }
    
    // Extract suggestions from backend if available
    if (data?.suggestions && Array.isArray(data.suggestions)) {
      suggestions = [...suggestions, ...data.suggestions];
    }
  } else if (error.request) {
    errorMessage = 'Network error - no response received';
    errorType = 'network_error';
    suggestions = ['Check your internet connection', 'Try again later'];
  } else {
    errorMessage = error.message || 'Unknown error occurred';
    errorType = 'unknown';
  }
  
  return {
    success: false,
    error: errorMessage,
    error_type: errorType,
    suggestions: [...new Set(suggestions)], // Remove duplicates
    timestamp: new Date().toISOString()
  };
};

// =============================================================================
// CONSTANTS AND CONFIGURATIONS
// =============================================================================

export const TRADE_TYPES = {
  BUY: 'BUY',
  SELL: 'SELL'
};

export const ORDER_STATUSES = {
  PENDING: 'pending',
  FILLED: 'filled',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
};

export const POSITION_STATUSES = {
  OPEN: 'open',
  CLOSED: 'closed'
};

export const ERROR_TYPES = {
  VALIDATION_ERROR: 'validation_error',
  SYMBOL_NOT_FOUND: 'symbol_not_found',
  MARKET_DATA_UNAVAILABLE: 'market_data_unavailable',
  CONNECTION_TIMEOUT: 'connection_timeout',
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  TRADING_DISABLED: 'trading_disabled',
  MARKET_CLOSED: 'market_closed'
};

// Default configuration values
export const DEFAULT_CONFIG = {
  MAX_SYMBOLS_PER_REQUEST: 20,
  DEFAULT_TRADE_VOLUME: 0.01,
  DEFAULT_RISK_PERCENT: 2,
  PRICE_REFRESH_INTERVAL: 1000, // 1 second
  TRADE_HISTORY_PAGE_SIZE: 50
};
