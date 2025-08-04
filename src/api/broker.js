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
    const response = await api.get(`/api/v1/broker-accounts/${accountId}/details`);
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
    const response = await api.get('/api/v1/broker-accounts/');
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
    const response = await api.get(`/api/v1/broker-accounts/${accountId}/balance`);
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
    const response = await api.post(`/api/v1/broker-accounts/${accountId}/trade`, tradeData);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error placing trade:', error);
    return {
      success: false,
      error: error.message || 'Failed to place trade'
    };
  }
};

// =============================================================================
// PENDING ORDERS (NEW)
// =============================================================================

export const placePendingOrder = async (accountId, orderData) => {
  try {
    const response = await api.post(`/api/v1/broker-accounts/${accountId}/pending-order`, orderData);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error placing pending order:', error);
    return {
      success: false,
      error: error.message || 'Failed to place pending order'
    };
  }
};

export const modifyOrder = async (accountId, orderId, modifications) => {
  try {
    const response = await api.patch(`/api/v1/broker-accounts/${accountId}/orders/${orderId}`, modifications);
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
    const response = await api.delete(`/api/v1/broker-accounts/${accountId}/orders/${orderId}`);
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
    const response = await api.get(`/api/v1/broker-accounts/${accountId}/orders`);
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
    const response = await api.get(`/api/v1/broker-accounts/${accountId}/positions`);
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
    const response = await api.post(`/api/v1/broker-accounts/${accountId}/positions/${positionId}/close`);
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
    const response = await api.patch(`/api/v1/broker-accounts/${accountId}/positions/${positionId}`, modifications);
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
// PAIR TRADING (NEW)
// =============================================================================

export const placePairTrade = async (accountId, pairData) => {
  try {
    const response = await api.post(`/api/v1/broker-accounts/${accountId}/pair-trade`, pairData);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error placing pair trade:', error);
    return {
      success: false,
      error: error.message || 'Failed to place pair trade'
    };
  }
};

// =============================================================================
// MULTI-ACCOUNT TRADING (NEW)
// =============================================================================

export const placeMultiAccountTrade = async (tradeData) => {
  try {
    const response = await api.post('/api/v1/broker-accounts/multi-account-trade', tradeData);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error placing multi-account trade:', error);
    return {
      success: false,
      error: error.message || 'Failed to place multi-account trade'
    };
  }
};

// =============================================================================
// REAL-TIME PRICING (NEW)
// =============================================================================

export const getSymbolPrice = async (accountId, symbol) => {
  try {
    const response = await api.get(`/api/v1/broker-accounts/${accountId}/price/${symbol}`);
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
    // Try to get price from the first available account
    const accountsResponse = await getAccounts();
    if (accountsResponse.success && accountsResponse.data.length > 0) {
      const firstAccount = accountsResponse.data[0];
      const response = await api.get(`/api/v1/broker-accounts/${firstAccount.id}/price/${symbol}`);
      return {
        success: true,
        data: response
      };
    } else {
      // Fallback: try generic price endpoint if available
      const response = await api.get(`/api/v1/market/price/${symbol}`);
      return {
        success: true,
        data: response
      };
    }
  } catch (error) {
    console.error('Error fetching live price:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch live price',
      data: null
    };
  }
};

// =============================================================================
// SYMBOL SELECTION & SEARCH (NEW)
// =============================================================================

export const getAvailableSymbols = async (searchTerm = '', limit = 50) => {
  try {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const url = queryString ? `/api/v1/broker-accounts/symbols/available?${queryString}` : '/api/v1/broker-accounts/symbols/available';
    
    const response = await api.get(url);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error fetching available symbols:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch available symbols',
      data: { symbols: [] }
    };
  }
};

export const getPopularSymbols = async () => {
  try {
    const response = await api.get('/api/v1/broker-accounts/symbols/popular');
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error fetching popular symbols:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch popular symbols',
      data: { popular_symbols: { major_pairs: [], cross_pairs: [], exotic_pairs: [] } }
    };
  }
};

export const searchSymbols = async (searchTerm, limit = 15) => {
  try {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const url = queryString ? 
      `/api/v1/broker-accounts/symbols/search/${encodeURIComponent(searchTerm)}?${queryString}` : 
      `/api/v1/broker-accounts/symbols/search/${encodeURIComponent(searchTerm)}`;
    
    const response = await api.get(url);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error searching symbols:', error);
    return {
      success: false,
      error: error.message || 'Failed to search symbols',
      data: { symbols: [] }
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
    return this.request(`/broker-accounts/${accountId}/trade`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  // Pending Orders
  async placePendingOrder(accountId, orderData) {
    return this.request(`/broker-accounts/${accountId}/pending-order`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  // Modify Orders
  async modifyOrder(accountId, orderId, modifications) {
    return this.request(`/broker-accounts/${accountId}/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify(modifications),
    });
  }

  // Modify Positions
  async modifyPosition(accountId, positionId, modifications) {
    return this.request(`/broker-accounts/${accountId}/positions/${positionId}`, {
      method: 'PATCH',
      body: JSON.stringify(modifications),
    });
  }

  // Pair Trading
  async placePairTrade(accountId, pairData) {
    return this.request(`/broker-accounts/${accountId}/pair-trade`, {
      method: 'POST',
      body: JSON.stringify(pairData),
    });
  }

  // Multi-Account Trading
  async placeMultiAccountTrade(tradeData) {
    return this.request('/broker-accounts/multi-account-trade', {
      method: 'POST',
      body: JSON.stringify(tradeData),
    });
  }

  // Get Real-time Prices
  async getSymbolPrice(accountId, symbol) {
    return this.request(`/broker-accounts/${accountId}/price/${symbol}`);
  }

  // Position Management
  async getPositions(accountId) {
    return this.request(`/broker-accounts/${accountId}/positions`);
  }

  async closePosition(accountId, positionId) {
    return this.request(`/broker-accounts/${accountId}/positions/${positionId}/close`, {
      method: 'POST',
    });
  }

  // Order Management
  async getOrders(accountId) {
    return this.request(`/broker-accounts/${accountId}/orders`);
  }

  async cancelOrder(accountId, orderId) {
    return this.request(`/broker-accounts/${accountId}/orders/${orderId}`, {
      method: 'DELETE',
    });
  }

  // Account Management
  async getAccounts() {
    return this.request('/broker-accounts/');
  }

  async getAccountDetails(accountId) {
    return this.request(`/broker-accounts/${accountId}/details`);
  }
}

// Export a singleton instance
export const tradingAPI = new TradingAPI();
