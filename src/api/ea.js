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
    // Try both endpoint formats to ensure compatibility with backend
    let response;
    try {
      response = await api.get(`/ea/account/${accountId}`);
      console.log('Balance response from /ea/account endpoint:', response);
    } catch (firstError) {
      console.warn('First EA balance endpoint failed, trying alternative:', firstError);
      response = await api.get(`/api/v1/ea/accounts/${accountId}/balance`);
      console.log('Balance response from /api/v1/ea/accounts endpoint:', response);
    }
    
    // Normalize the response structure
    const balanceData = response?.balance || response?.data?.balance || response || {};
    
    return {
      success: true,
      data: balanceData,
      message: `Retrieved balance for EA account ${accountId}`
    };
  } catch (error) {
    console.error('Error fetching EA account balance:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch EA account balance',
      data: {}
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
    // Try both endpoint formats to ensure compatibility with backend
    let response;
    try {
      response = await api.get(`/ea/positions/${accountId}`);
      console.log('Positions response from /ea/positions endpoint:', response);
    } catch (firstError) {
      console.warn('First EA positions endpoint failed, trying alternative:', firstError);
      response = await api.get(`/api/v1/ea/accounts/${accountId}/positions`);
      console.log('Positions response from /api/v1/ea/accounts endpoint:', response);
    }
    
    // Normalize the response structure
    const positions = response?.positions || response?.data || response || [];
    
    return {
      success: true,
      data: positions,
      message: `Retrieved ${positions.length} positions from EA account ${accountId}`
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

/**
 * Close an open position via EA
 * @param {string} accountId - EA account ID
 * @param {string|number} positionId - Position ID to close
 * @param {object} options - Additional options (comment, etc.)
 */
export const closeEAPosition = async (accountId, positionId, options = {}) => {
  try {
    console.log('Closing EA position:', { accountId, positionId, options });
    
    const requestData = {
      position_id: positionId,
      request_id: options.request_id || null,
      comment: options.comment || 'EA API Position Close',
      // Enhanced fill policy support
      symbol: options.symbol || '',          // Add symbol if available, EA will get from position otherwise
      volume: options.volume || 0.0,         // Add volume if available, EA will get from position otherwise
      position_type: options.positionType || null,  // Add position type if provided
      price: options.price || 0.0,           // Current market price or override price
      type_filling: options.typeFilling || 0, // Fill policy: 0=FOK (Fill-or-Kill), 1=IOC (Immediate-or-Cancel), 2=Return
      deviation: options.deviation || 10      // Default slippage in points
    };
    
    const response = await api.post(
      `/api/v1/ea/accounts/${accountId}/close-position`,
      requestData
    );
    
    const result = {
      success: response.success || true,
      message: response.message || 'Position close request queued for EA execution',
      request_id: response.request_id || null,
      position_id: positionId,
      account_id: accountId,
      status: response.status || 'queued_for_execution',
      queued_at: response.queued_at || new Date().toISOString(),
      ...response
    };
    
    console.log('EA position close response:', result);
    return result;
  } catch (error) {
    console.error('Error closing EA position:', error);
    
    let errorMessage = 'Failed to close position';
    let errorType = 'unknown';
    let suggestions = [];
    
    if (error.response?.status === 404) {
      errorMessage = 'EA account or position not found';
      errorType = 'position_not_found';
      suggestions = ['Verify position ID is correct', 'Check if EA is connected'];
    } else if (error.response?.status === 400) {
      errorMessage = error.response.data?.detail || 'Invalid request parameters';
      errorType = 'invalid_parameters';
      
      // Special handling for fill policy errors
      const errorDetail = error.response.data?.detail?.toLowerCase() || '';
      if (errorDetail.includes('invalid fills') || errorDetail.includes('10030')) {
        errorMessage = 'Failed to close position due to fill policy restrictions';
        errorType = 'fill_policy_error';
        suggestions = [
          'Try setting type_filling to 1 (IOC) or 2 (Return)',
          'Check market conditions and price deviations',
          'Increase deviation value for more slippage allowance'
        ];
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      message: errorMessage,
      error_type: errorType,
      suggestions: suggestions,
      status: 'failed',
      position_id: positionId
    };
  }
};

/**
 * Modify an existing position via EA (update SL/TP)
 * @param {string} accountId - EA account ID
 * @param {string|number} positionId - Position ID to modify
 * @param {object} modifications - Modification parameters (stop_loss, take_profit)
 * @param {object} options - Additional options (comment, etc.)
 */
export const modifyEAPosition = async (accountId, positionId, modifications, options = {}) => {
  try {
    console.log('Modifying EA position:', { accountId, positionId, modifications, options });
    
    // Normalize modification parameters - support both snake_case and camelCase
    const stopLoss = modifications.stop_loss !== undefined ? modifications.stop_loss : modifications.stopLoss;
    const takeProfit = modifications.take_profit !== undefined ? modifications.take_profit : modifications.takeProfit;
    
    // Based on the curl example and API requirements, both stop_loss and take_profit must be provided
    if ((stopLoss === undefined || stopLoss === null) || 
        (takeProfit === undefined || takeProfit === null)) {
      throw new Error('At least one of stop_loss or take_profit must be provided');
    }
    
    // Format request data according to the API structure as shown in curl example
    const requestData = {
      position_id: positionId,
      stop_loss: stopLoss !== undefined ? Number(stopLoss) : 0.0,
      take_profit: takeProfit !== undefined ? Number(takeProfit) : 0.0,
      // Include these fields directly in request body as they are in the curl example
      symbol: modifications.symbol || options.symbol || '',  // Symbol can come from modifications or options
      comment: modifications.comment || options.comment || 'EA API Position Modify',
      request_id: modifications.request_id || options.request_id || null
    };
    
    // According to the curl example, we need to ensure both stop_loss and take_profit
    // are included in the request, even if one is 0
    if (requestData.stop_loss === null || requestData.stop_loss === undefined) {
      requestData.stop_loss = 0.0;
    }
    
    if (requestData.take_profit === null || requestData.take_profit === undefined) {
      requestData.take_profit = 0.0;
    }
    
    console.log('Sending modify position request with data:', requestData);
    
    const response = await api.post(
      `/api/v1/ea/accounts/${accountId}/modify-position`,
      requestData
    );
    
    const result = {
      success: response.success || true,
      message: response.message || 'Position modification request queued for EA execution',
      request_id: response.request_id || null,
      position_id: positionId,
      account_id: accountId,
      status: response.status || 'queued_for_execution',
      queued_at: response.queued_at || new Date().toISOString(),
      ...response
    };
    
    console.log('EA position modify response:', result);
    return result;
  } catch (error) {
    console.error('Error modifying EA position:', error);
    
    let errorMessage = 'Failed to modify position';
    let errorType = 'unknown';
    let suggestions = [];
    
    if (error.response?.status === 404) {
      errorMessage = 'EA account or position not found';
      errorType = 'position_not_found';
      suggestions = ['Verify position ID is correct', 'Check if EA is connected'];
    } else if (error.response?.status === 400) {
      errorMessage = error.response.data?.detail || 'Invalid request parameters';
      errorType = 'invalid_parameters';
      suggestions = ['Check that values are within acceptable ranges for the broker'];
    }
    
    return {
      success: false,
      error: errorMessage,
      message: errorMessage,
      error_type: errorType,
      suggestions: suggestions,
      status: 'failed',
      position_id: positionId
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
    // Try both endpoint formats to ensure compatibility with backend
    let response;
    try {
      response = await api.get(`/ea/orders/${accountId}`);
      console.log('Orders response from /ea/orders endpoint:', response);
    } catch (firstError) {
      console.warn('First EA orders endpoint failed, trying alternative:', firstError);
      response = await api.get(`/api/v1/ea/accounts/${accountId}/orders`);
      console.log('Orders response from /api/v1/ea/accounts endpoint:', response);
    }
    
    // Normalize the response structure
    const orders = response?.orders || response?.data || response || [];
    
    return {
      success: true,
      data: orders,
      message: `Retrieved ${orders.length} orders from EA account ${accountId}`
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

/**
 * Cancel a pending order via EA
 * @param {string} accountId - EA account ID
 * @param {string|number} orderId - Order ID to cancel
 * @param {object} options - Additional options (comment, etc.)
 */
export const cancelEAOrder = async (accountId, orderId, options = {}) => {
  try {
    console.log('Cancelling EA order:', { accountId, orderId, options });
    
    const requestData = {
      order_id: orderId,
      request_id: options.request_id || null,
      comment: options.comment || 'EA API Order Cancel',
      // Additional fields from backend endpoint
      symbol: options.symbol || '',  // Add symbol field even if empty, EA will get from order
      volume: options.volume || 0.0  // EA will get actual volume from order
    };
    
    const response = await api.post(
      `/api/v1/ea/accounts/${accountId}/cancel-order`,
      requestData
    );
    
    const result = {
      success: response.success || true,
      message: response.message || 'Order cancellation request queued for EA execution',
      request_id: response.request_id || null,
      order_id: orderId,
      account_id: accountId,
      status: response.status || 'queued_for_execution',
      queued_at: response.queued_at || new Date().toISOString(),
      ...response
    };
    
    console.log('EA order cancel response:', result);
    return result;
  } catch (error) {
    console.error('Error cancelling EA order:', error);
    
    let errorMessage = 'Failed to cancel order';
    let errorType = 'unknown';
    let suggestions = [];
    
    if (error.response?.status === 404) {
      errorMessage = 'EA account or order not found';
      errorType = 'order_not_found';
      suggestions = ['Verify order ID is correct', 'Check if EA is connected'];
    } else if (error.response?.status === 400) {
      errorMessage = error.response.data?.detail || 'Invalid request parameters';
      errorType = 'invalid_parameters';
    }
    
    return {
      success: false,
      error: errorMessage,
      message: errorMessage,
      error_type: errorType,
      suggestions: suggestions,
      status: 'failed',
      order_id: orderId
    };
  }
};

/**
 * Modify an existing pending order via EA (update price, SL/TP)
 * @param {string} accountId - EA account ID
 * @param {string|number} orderId - Order ID to modify
 * @param {object} modifications - Modification parameters (price, stop_loss, take_profit)
 * @param {object} options - Additional options (comment, etc.)
 */
export const modifyEAOrder = async (accountId, orderId, modifications, options = {}) => {
  try {
    console.log('Modifying EA order:', { accountId, orderId, modifications, options });
    
    // Normalize modification parameters - support both snake_case and camelCase
    const price = modifications.price !== undefined ? modifications.price : modifications.price;
    const stopLoss = modifications.stop_loss !== undefined ? modifications.stop_loss : modifications.stopLoss;
    const takeProfit = modifications.take_profit !== undefined ? modifications.take_profit : modifications.takeProfit;
    
    // Validate required parameters
    if ((price === undefined || price === null) && 
        (stopLoss === undefined || stopLoss === null) && 
        (takeProfit === undefined || takeProfit === null)) {
      throw new Error('At least one of price, stop_loss or take_profit must be provided');
    }
    
    // Create request data matching the curl format
    const requestData = {
      order_id: orderId,
      price: price !== undefined && price !== null ? Number(price) : null,
      stop_loss: stopLoss !== undefined && stopLoss !== null ? Number(stopLoss) : null,
      take_profit: takeProfit !== undefined && takeProfit !== null ? Number(takeProfit) : null,
      // Include these directly in the request body as they are in the curl example
      request_id: modifications.request_id || options.request_id || null,
      comment: modifications.comment || options.comment || 'EA API Order Modify',
      symbol: modifications.symbol || options.symbol || '',  // Symbol may come from modifications or options
      volume: modifications.volume || 0.0                    // Volume can be specified or EA will use existing
    };
    
    // Remove any null values from requestData to ensure clean request
    Object.keys(requestData).forEach(key => {
      if (requestData[key] === null || requestData[key] === undefined) {
        delete requestData[key];
      }
    });
    
    console.log('Sending modify order request with data:', requestData);
    
    const response = await api.post(
      `/api/v1/ea/accounts/${accountId}/modify-order`,
      requestData
    );
    
    const result = {
      success: response.success || true,
      message: response.message || 'Order modification request queued for EA execution',
      request_id: response.request_id || null,
      order_id: orderId,
      account_id: accountId,
      status: response.status || 'queued_for_execution',
      queued_at: response.queued_at || new Date().toISOString(),
      ...response
    };
    
    console.log('EA order modify response:', result);
    return result;
  } catch (error) {
    console.error('Error modifying EA order:', error);
    
    let errorMessage = 'Failed to modify order';
    let errorType = 'unknown';
    let suggestions = [];
    
    if (error.response?.status === 404) {
      errorMessage = 'EA account or order not found';
      errorType = 'order_not_found';
      suggestions = ['Verify order ID is correct', 'Check if EA is connected'];
    } else if (error.response?.status === 400) {
      errorMessage = error.response.data?.detail || 'Invalid request parameters';
      errorType = 'invalid_parameters';
      suggestions = ['Check that values are within acceptable ranges for the broker'];
    }
    
    return {
      success: false,
      error: errorMessage,
      message: errorMessage,
      error_type: errorType,
      suggestions: suggestions,
      status: 'failed',
      order_id: orderId
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
    
    // Create a clean payload that matches the exact curl format expected by backend
    const normalizedRequest = {
      action: tradeRequest.trade_type?.toLowerCase() || 'buy',
      symbol: tradeRequest.symbol,
      volume: typeof tradeRequest.volume === 'string' ? parseFloat(tradeRequest.volume) : tradeRequest.volume,
      comment: tradeRequest.comment || 'EA API Order'
    };
    
    // Add optional SL/TP if provided
    if (tradeRequest.stop_loss !== undefined && tradeRequest.stop_loss !== null) {
      normalizedRequest.stop_loss = typeof tradeRequest.stop_loss === 'string' ? parseFloat(tradeRequest.stop_loss) : tradeRequest.stop_loss;
    }
    
    if (tradeRequest.take_profit !== undefined && tradeRequest.take_profit !== null) {
      normalizedRequest.take_profit = typeof tradeRequest.take_profit === 'string' ? parseFloat(tradeRequest.take_profit) : tradeRequest.take_profit;
    }
    
    console.log('Normalized EA trade payload (matching curl format):', normalizedRequest);
    
    const response = await api.post(`/api/v1/ea/accounts/${accountId}/trade`, normalizedRequest);
    
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
 * 
 * @param {string} accountId - EA account ID
 * @param {object} pairRequest - Pair trading request object with:
 *   - symbol1: First symbol
 *   - symbol2: Second symbol
 *   - volume: Trade volume (applies to both symbols, hedge ratio auto-calculated)
 *   - action: BUY or SELL (for spread direction) - optional, auto-detected in STATISTICAL mode
 *   - correlation_type: STATISTICAL, SIMPLE, MEAN_REVERSION
 *   - order_type: MARKET or PENDING
 *   - spread_stop_loss: Spread-based stop loss
 *   - spread_take_profit: Spread-based take profit
 *   - entry_spread: Entry level for PENDING orders
 *   - spread_direction: NARROW or WIDEN for PENDING orders
 *   - comment: Trade comment - optional
 */
export const placeEAPairTrade = async (accountId, pairRequest) => {
  try {
    console.log('Placing EA pair trade with payload:', pairRequest);
    
    // Create a clean payload that matches the exact curl format expected by backend
    const normalizedRequest = {
      symbol1: pairRequest.symbol1,
      symbol2: pairRequest.symbol2,
      // Use action instead of trade_type to match the API expectation
      action: pairRequest.action || 'buy_spread',
      // Use volume1 and volume2 as required by the API
      volume1: typeof pairRequest.volume1 === 'string' ? parseFloat(pairRequest.volume1) : pairRequest.volume1 || 0.01,
      volume2: typeof pairRequest.volume2 === 'string' ? parseFloat(pairRequest.volume2) : pairRequest.volume2 || 0.01
    };
    
    // Add optional fields if present
    if (pairRequest.comment && pairRequest.comment.trim()) {
      normalizedRequest.comment = pairRequest.comment.trim();
    }
    
    // Remove any undefined or null values
    Object.keys(normalizedRequest).forEach(key => {
      if (normalizedRequest[key] === undefined || normalizedRequest[key] === null) {
        delete normalizedRequest[key];
      }
    });
    
    console.log('Normalized EA pair trade payload (matching curl format):', normalizedRequest);

    // Ensure we're using the endpoint format that aligns with the FastAPI backend
    const response = await api.post(`/api/v1/ea/accounts/${accountId}/pair-trade`, normalizedRequest);
    
    console.log('📥 Raw API response for pair trade:', response);
    
    // Format the response to include all expected fields from FastAPI response
    const result = {
      success: response.success !== undefined ? response.success : true,
      message: response.message || 'Pair trade queued for EA execution',
      request_id: response.request_id || null,
      spread_symbol: response.spread_symbol || `${pairRequest.symbol1}-${pairRequest.symbol2}`,
      current_spread: response.current_spread || 0.0,
      symbol1_result: response.symbol1_result || null,
      symbol2_result: response.symbol2_result || null,
      spread_analysis: response.spread_analysis || null,
      status: response.status || 'queued',
      queued_at: response.queued_at || new Date().toISOString(),
      ...response
    };
    
    // Add expected FastAPI fields if they're missing
    if (response.spread_analysis && !response.spread_analysis.individual_trades) {
      result.spread_analysis.individual_trades = {
        symbol1: { 
          action: response.symbol1_result?.details?.direction || 'unknown', 
          volume: response.symbol1_result?.details?.volume || pairRequest.volume1
        },
        symbol2: { 
          action: response.symbol2_result?.details?.direction || 'unknown',
          volume: response.symbol2_result?.details?.volume || pairRequest.volume2
        }
      };
    }
    
    console.log('EA pair trade response:', result);
    return result;
  } catch (error) {
    console.error('❌ Error placing EA pair trade:', error);
    
    // Enhanced error handling to properly extract API error details
    const errorResponse = error.response || {};
    const errorData = errorResponse.data || {};
    
    console.error('❌ Error details:', {
      status: errorResponse.status,
      statusText: errorResponse.statusText,
      data: errorData,
      detail: errorData.detail,
      message: error.message
    });
    
    let errorMessage = 'Failed to place EA pair trade';
    let errorType = 'unknown';
    let suggestions = [];
    
    // Handle 422 validation errors specifically
    if (errorResponse.status === 422) {
        if (Array.isArray(errorData.detail)) {
            // Handle validation error array format
            errorMessage = errorData.detail.map(err => 
                `${err.loc.slice(1).join('.')}: ${err.msg}`
            ).join('; ');
            errorType = 'validation_error';
            suggestions = ['Check all required fields are provided', 'Verify field formats'];
        } else if (errorData.detail) {
            // Handle single error message
            errorMessage = errorData.detail;
            errorType = 'validation_error';
        }
    }
    
    if (error.response?.status === 404) {
      errorMessage = 'EA account not found';
      errorType = 'account_not_found';
      suggestions = ['Verify account ID is correct', 'Check if EA is connected'];
    } else if (error.response?.status === 403) {
      errorMessage = 'Access denied to EA account';
      errorType = 'access_denied';
      suggestions = ['Verify your permissions for this account'];
    } else if (error.response?.status === 422) {
      errorMessage = 'Invalid pair trade parameters';
      errorType = 'validation_error';
      
      // Extract detailed validation errors if available
      if (error.response?.data?.detail && Array.isArray(error.response.data.detail)) {
        const errors = error.response.data.detail;
        const errorFields = errors.map(err => {
          const field = err.loc?.slice(1).join('.') || 'unknown';
          return `${field}: ${err.msg}`;
        });
        errorMessage = `Validation error: ${errorFields.join(', ')}`;
        suggestions = ['Check input parameters', 'Verify symbol names are correct'];
      } else if (typeof error.response?.data?.detail === 'string') {
        errorMessage = error.response.data.detail;
      }
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
      
      // Look for specific error messages to provide targeted suggestions
      if (errorMessage.toLowerCase().includes('symbol not found')) {
        suggestions = ['Verify both symbols exist on this broker', 'Check symbol spelling'];
      } else if (errorMessage.toLowerCase().includes('volume')) {
        suggestions = ['Volume must be greater than 0.01', 'Check broker minimum volume requirements'];
      }
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
 * Search available symbols from EA with autocomplete functionality
 * @param {string} accountId - EA account ID
 * @param {string} searchTerm - Search term (minimum 2 characters)
 * @param {number} limit - Maximum number of results (default: 20)
 * @returns {Promise<Object>} - Filtered symbols matching the search term
 */
export const searchEASymbols = async (accountId, searchTerm, limit = 20) => {
  try {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return {
        success: false,
        error: 'Search term must be at least 2 characters',
        data: []
      };
    }

    // Get all symbols first
    const symbolsResponse = await getEASymbols(accountId);
    
    if (!symbolsResponse.success || !symbolsResponse.data) {
      return {
        success: false,
        error: 'Failed to fetch symbols for search',
        data: []
      };
    }

    const symbols = symbolsResponse.data;
    const term = searchTerm.toUpperCase().trim();
    
    // Filter and score symbols based on relevance
    const filteredSymbols = symbols
      .filter(symbolInfo => {
        const symbol = (symbolInfo.symbol || symbolInfo.standard_symbol || '').toString().toUpperCase();
        const brokerSymbol = (symbolInfo.broker_symbol || '').toString().toUpperCase();
        const description = (symbolInfo.description || '').toString().toUpperCase();
        
        return symbol.includes(term) || 
               brokerSymbol.includes(term) || 
               description.includes(term);
      })
      .map(symbolInfo => {
        const symbol = (symbolInfo.symbol || symbolInfo.standard_symbol || '').toString().toUpperCase();
        const brokerSymbol = (symbolInfo.broker_symbol || '').toString().toUpperCase();
        const description = (symbolInfo.description || '').toString().toUpperCase();
        
        // Calculate relevance score
        let score = 0;
        if (symbol === term) score = 100;
        else if (symbol.startsWith(term)) score = 90;
        else if (brokerSymbol === term) score = 85;
        else if (brokerSymbol.startsWith(term)) score = 80;
        else if (symbol.includes(term)) score = 70;
        else if (brokerSymbol.includes(term)) score = 65;
        else if (description.includes(term)) score = 60;
        else score = 50;

        return {
          ...symbolInfo,
          relevance_score: score
        };
      })
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, limit);

    return {
      success: true,
      data: filteredSymbols,
      total_results: filteredSymbols.length,
      search_term: searchTerm
    };
  } catch (error) {
    console.error('Error searching EA symbols:', error);
    return {
      success: false,
      error: error.message || 'Failed to search EA symbols',
      data: []
    };
  }
};

/**
 * Get popular/commonly traded symbols from EA account
 * @param {string} accountId - EA account ID
 * @param {number} limit - Maximum number of symbols (default: 50)
 * @returns {Promise<Object>} - Popular symbols categorized by type
 */
export const getEAPopularSymbols = async (accountId, limit = 50) => {
  try {
    const symbolsResponse = await getEASymbols(accountId);
    
    if (!symbolsResponse.success || !symbolsResponse.data) {
      return {
        success: false,
        error: 'Failed to fetch symbols',
        data: {}
      };
    }

    const symbols = symbolsResponse.data;
    
    // Categorize symbols dynamically using the same logic as getEASymbolsFiltered
    const categories = {
      major_pairs: [],
      cross_pairs: [],
      exotic_pairs: [],
      metals: [],
      indices: [],
      commodities: [],
      crypto: [],
      other: []
    };

    // Define dynamic category patterns using regex and characteristics (no hardcoded symbols)
    const categoryPatterns = {
      major_pairs: {
        condition: (symbol, type, desc) => {
          // Major pairs: 6-char forex symbols with USD + major currencies
          const majorCurrencies = /^(EUR|GBP|JPY|CHF|CAD|AUD|NZD)(USD|EUR|GBP|JPY|CHF|CAD|AUD|NZD)$/;
          const usdPairs = /^(EUR|GBP|JPY|CHF|CAD|AUD|NZD)USD$/;
          return symbol.length === 6 && (usdPairs.test(symbol) || majorCurrencies.test(symbol)) ||
                 type.includes('forex') || type.includes('currency') || desc.includes('major');
        }
      },
      metals: {
        condition: (symbol, type, desc) => {
          // Precious metals patterns
          const metalPatterns = /^(XAU|XAG|GOLD|SILVER|PLATINUM|PALLADIUM|PLAT|PALL)/i;
          return metalPatterns.test(symbol) ||
                 type.includes('metal') || type.includes('precious') ||
                 desc.includes('gold') || desc.includes('silver') || desc.includes('metal');
        }
      },
      indices: {
        condition: (symbol, type, desc) => {
          // Stock indices patterns
          const indexPatterns = /^(US30|SPX|NAS|UK100|GER|FRA|AUS|JPN|DAX|DOW|S&P|NASDAQ|FTSE|CAC|NIKKEI)/i;
          const numberPatterns = /(30|40|100|200|225|500)$/; // Common index numbers
          return indexPatterns.test(symbol) || numberPatterns.test(symbol) ||
                 type.includes('index') || type.includes('stock') ||
                 desc.includes('index') || desc.includes('stock');
        }
      },
      commodities: {
        condition: (symbol, type, desc) => {
          // Commodities patterns (energy, agriculture, etc.)
          const energyPatterns = /^(OIL|WTI|BRENT|CRUDE|NATGAS|GAS)/i;
          const agriPatterns = /^(COFFEE|SUGAR|WHEAT|CORN|SOYBEAN|COTTON|COCOA)/i;
          return energyPatterns.test(symbol) || agriPatterns.test(symbol) ||
                 type.includes('commodity') || type.includes('energy') || type.includes('agriculture') ||
                 desc.includes('oil') || desc.includes('gas') || desc.includes('wheat') || desc.includes('coffee');
        }
      },
      crypto: {
        condition: (symbol, type, desc) => {
          // Cryptocurrency patterns
          const cryptoPatterns = /^(BTC|ETH|LTC|XRP|ADA|DOT|DOGE|USDT|BNB|LINK|UNI|MATIC|SOL|AVAX)/i;
          const cryptoSuffixes = /(USD|EUR|BTC)$/; // Common crypto pair endings
          return cryptoPatterns.test(symbol) || 
                 (symbol.length >= 3 && cryptoSuffixes.test(symbol) && /^[A-Z]{3,}/.test(symbol)) ||
                 type.includes('crypto') || type.includes('digital') || type.includes('coin') ||
                 desc.includes('crypto') || desc.includes('bitcoin') || desc.includes('digital');
        }
      }
    };

    symbols.forEach(symbolInfo => {
      const symbol = (symbolInfo.symbol || symbolInfo.standard_symbol || '').toString().toUpperCase();
      const type = (symbolInfo.type || symbolInfo.symbol_type || '').toString().toLowerCase();
      const description = (symbolInfo.description || '').toString().toLowerCase();

      // Check each category dynamically
      let categorized = false;
      
      for (const [categoryName, pattern] of Object.entries(categoryPatterns)) {
        if (pattern.condition(symbol, type, description)) {
          categories[categoryName].push(symbolInfo);
          categorized = true;
          break;
        }
      }
      
      // Handle forex pairs (cross and exotic)
      if (!categorized && symbol.length === 6) {
        if (!symbol.includes('USD') && (symbol.includes('EUR') || symbol.includes('GBP') || symbol.includes('JPY'))) {
          categories.cross_pairs.push(symbolInfo);
          categorized = true;
        } else if (symbol.includes('USD')) {
          categories.exotic_pairs.push(symbolInfo);
          categorized = true;
        }
      }
      
      // If not categorized, put in other
      if (!categorized) {
        categories.other.push(symbolInfo);
      }
    });

    // Limit each category and add popular flag
    Object.keys(categories).forEach(category => {
      categories[category] = categories[category]
        .slice(0, Math.ceil(limit / Object.keys(categories).length))
        .map(symbol => ({
          ...symbol,
          popular: true,
          category: category
        }));
    });

    return {
      success: true,
      data: categories,
      total_symbols: symbols.length
    };
  } catch (error) {
    console.error('Error fetching EA popular symbols:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch popular symbols',
      data: {}
    };
  }
};

/**
 * Get symbols filtered by category from EA account
 * @param {string} accountId - EA account ID
 * @param {string} category - Category filter (forex, crypto, metals, indices, commodities, other)
 * @param {number} limit - Maximum number of symbols (default: 50)
 * @returns {Promise<Object>} - Filtered symbols by category
 */
export const getEASymbolsFiltered = async (accountId, category, limit = 50) => {
  try {
    const symbolsResponse = await getEASymbols(accountId);
    
    if (!symbolsResponse.success || !symbolsResponse.data) {
      return {
        success: false,
        error: 'Failed to fetch symbols for filtering',
        data: []
      };
    }

    const symbols = symbolsResponse.data;
    const categoryLower = category.toLowerCase();
    
    // Define dynamic category patterns using regex and characteristics (no hardcoded symbols)
    const categoryPatterns = {
      forex: {
        condition: (symbol, type, desc) => {
          // Forex pairs: 6-character symbols with major currencies
          const forexPattern = /^[A-Z]{6}$/; // 6-letter symbols
          const majorCurrencies = /^(EUR|GBP|USD|JPY|CHF|CAD|AUD|NZD|GBP|SEK|NOK|DKK)/;
          return (forexPattern.test(symbol) && majorCurrencies.test(symbol.slice(0, 3))) ||
                 type.includes('forex') || type.includes('currency') || type.includes('fx');
        }
      },
      crypto: {
        condition: (symbol, type, desc) => {
          // Cryptocurrency patterns
          const cryptoPatterns = /^(BTC|ETH|LTC|XRP|ADA|DOT|DOGE|USDT|BNB|LINK|UNI|MATIC|SOL|AVAX)/i;
          const cryptoSuffixes = /(USD|EUR|BTC)$/; // Common crypto pair endings
          return cryptoPatterns.test(symbol) || 
                 (symbol.length >= 3 && cryptoSuffixes.test(symbol) && /^[A-Z]{3,}/.test(symbol)) ||
                 type.includes('crypto') || type.includes('digital') || type.includes('coin') ||
                 desc.includes('crypto') || desc.includes('bitcoin') || desc.includes('digital');
        }
      },
      metals: {
        condition: (symbol, type, desc) => {
          // Precious metals patterns
          const metalPatterns = /^(XAU|XAG|GOLD|SILVER|PLATINUM|PALLADIUM|PLAT|PALL)/i;
          return metalPatterns.test(symbol) ||
                 type.includes('metal') || type.includes('precious') ||
                 desc.includes('gold') || desc.includes('silver') || desc.includes('metal');
        }
      },
      indices: {
        condition: (symbol, type, desc) => {
          // Stock indices patterns
          const indexPatterns = /^(US30|SPX|NAS|UK100|GER|FRA|AUS|JPN|DAX|DOW|S&P|NASDAQ|FTSE|CAC|NIKKEI)/i;
          const numberPatterns = /(30|40|100|200|225|500)$/; // Common index numbers
          return indexPatterns.test(symbol) || numberPatterns.test(symbol) ||
                 type.includes('index') || type.includes('stock') ||
                 desc.includes('index') || desc.includes('stock');
        }
      },
      commodities: {
        condition: (symbol, type, desc) => {
          // Commodities patterns (energy, agriculture, etc.)
          const energyPatterns = /^(OIL|WTI|BRENT|CRUDE|NATGAS|GAS)/i;
          const agriPatterns = /^(COFFEE|SUGAR|WHEAT|CORN|SOYBEAN|COTTON|COCOA)/i;
          return energyPatterns.test(symbol) || agriPatterns.test(symbol) ||
                 type.includes('commodity') || type.includes('energy') || type.includes('agriculture') ||
                 desc.includes('oil') || desc.includes('gas') || desc.includes('wheat') || desc.includes('coffee');
        }
      }
    };

    // Filter symbols by category
    let filteredSymbols = [];
    
    if (categoryPatterns[categoryLower]) {
      const pattern = categoryPatterns[categoryLower];
      
      filteredSymbols = symbols.filter(symbolInfo => {
        const symbol = (symbolInfo.symbol || symbolInfo.standard_symbol || '').toString().toUpperCase();
        const type = (symbolInfo.type || symbolInfo.symbol_type || '').toString().toLowerCase();
        const description = (symbolInfo.description || '').toString().toLowerCase();
        
        return pattern.condition(symbol, type, description);
      });
    } else if (categoryLower === 'other') {
      // Get symbols that don't match any specific category
      filteredSymbols = symbols.filter(symbolInfo => {
        const symbol = (symbolInfo.symbol || symbolInfo.standard_symbol || '').toString().toUpperCase();
        const type = (symbolInfo.type || symbolInfo.symbol_type || '').toString().toLowerCase();
        const description = (symbolInfo.description || '').toString().toLowerCase();
        
        // Check if symbol matches any category
        const matchesAnyCategory = Object.values(categoryPatterns).some(pattern => 
          pattern.condition(symbol, type, description)
        );
        
        return !matchesAnyCategory;
      });
    } else {
      return {
        success: false,
        error: `Invalid category: ${category}. Valid categories: forex, crypto, metals, indices, commodities, other`,
        data: []
      };
    }

    // Limit results and add category info
    const limitedResults = filteredSymbols
      .slice(0, limit)
      .map(symbolInfo => ({
        ...symbolInfo,
        category: categoryLower,
        filtered: true
      }));

    return {
      success: true,
      data: limitedResults,
      category: categoryLower,
      total_results: limitedResults.length,
      total_available: filteredSymbols.length
    };
  } catch (error) {
    console.error(`Error filtering EA symbols by category ${category}:`, error);
    return {
      success: false,
      error: error.message || `Failed to filter symbols by category ${category}`,
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
   * @param {string} userId - User ID to connect with
   * @param {string} customUrl - Optional custom WebSocket URL
   */
  connect(userId, customUrl = null) {
    try {
      this.userId = userId;
      let wsUrl;
      
      if (customUrl) {
        // Use the provided custom WebSocket URL
        wsUrl = customUrl;
      } else {
        // Generate URL from API base URL
        const baseURL = api.getCurrentApiUrl();
        if (!baseURL) {
          throw new Error('API base URL not available');
        }
        wsUrl = `${baseURL.replace('http', 'ws')}/api/v1/ea/ws/${userId}`;
      }
      
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

    console.log('🔄 Executing trade:', {accountId, orderType, payload: orderData, account: orderData.account});

    // Prepare order payload with proper formatting
    const payload = {
      symbol: orderData.symbol,
      volume: typeof orderData.volume === 'string' ? parseFloat(orderData.volume) : orderData.volume,
      comment: orderData.comment || 'EA API Order'
    };

    // Add SL/TP if provided
    if (orderData.stop_loss !== undefined && orderData.stop_loss !== null) {
      payload.stop_loss = typeof orderData.stop_loss === 'string' ? parseFloat(orderData.stop_loss) : orderData.stop_loss;
    }
    
    if (orderData.take_profit !== undefined && orderData.take_profit !== null) {
      payload.take_profit = typeof orderData.take_profit === 'string' ? parseFloat(orderData.take_profit) : orderData.take_profit;
    }

    if (orderConfig.type === "MARKET") {
      // Market order - use action field instead of trade_type
      payload.action = orderConfig.direction.toLowerCase();
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
      data: response,
      ...response
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
    // Prepare the request body based on backend ExportRequest schema
    const requestBody = {
      // Add any additional parameters if needed
      ...params
    };

    // Try using the API client first with proper request body
    console.log('Attempting export with endpoint:', endpoint, 'and params:', requestBody);
    
    try {
      const response = await api.post(`/api/v1/trading/analysis/export/excel/${endpoint}`, requestBody);
      
      // The API client doesn't handle blob responses well, so if we get here,
      // it means the request was accepted but we need to handle it differently
      return {
        success: true,
        message: 'Export request submitted successfully',
        data: response
      };
    } catch (apiError) {
      console.log('API client failed, trying direct fetch approach...', apiError.message);
      
      // Fallback to direct fetch with proper blob handling
      const baseURL = api.getCurrentApiUrl();
      
      // Get auth token using the auth utility
      const { auth } = await import('../utils/auth');
      const token = auth.getAuthToken();
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      console.log('Making direct fetch request to:', `${baseURL}/api/v1/trading/analysis/export/excel/${endpoint}`);
      
      const response = await fetch(`${baseURL}/api/v1/trading/analysis/export/excel/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      console.log('Direct fetch response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Export error response:', errorText);
        
        // Try to parse the error response
        let errorDetail = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorDetail = errorJson.detail || errorJson.message || errorText;
        } catch (e) {
          // Use raw text if JSON parsing fails
        }
        
        throw new Error(`Export failed: ${errorDetail}`);
      }

      // Check if response is actually a blob (Excel file)
      const contentType = response.headers.get('content-type');
      console.log('Response content type:', contentType);
      
      if (contentType && (contentType.includes('application/vnd.openxmlformats') || contentType.includes('application/octet-stream'))) {
        // Handle blob response (Excel file)
        const blob = await response.blob();
        
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
      } else {
        // Response is not a blob, might be JSON error
        const responseText = await response.text();
        console.log('Non-blob response:', responseText);
        
        return {
          success: true,
          message: 'Export request processed',
          data: responseText
        };
      }
    }
  } catch (error) {
    console.error('Error exporting analysis to Excel:', error);
    return {
      success: false,
      error: error.message || 'Failed to export analysis',
      message: error.message || 'Failed to export analysis'
    };
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
      data: response,
      ...response
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
      data: response,
      ...response
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
      data: response,
      ...response
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
  closeEAPosition,
  modifyEAPosition,
  cancelEAOrder,
  modifyEAOrder,
  
  // Trade Execution
  placeEATrade,
  placeEAPendingOrder,
  placeEAPairTrade,
  executeEAOrder,
  
  // Symbol & Price Data
  getEASymbols,
  searchEASymbols,
  getEASymbolsFiltered,
  getEAPopularSymbols,
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
