import { api } from './client';

export const connectAccount = (accountData) => {
  return api.post('/api/v1/broker/connect', accountData);
};

export const getAccounts = async () => {
  try {
    // This endpoint exists: GET /api/v1/ - Get Broker Accounts
    // Since api.js already has baseURL with /api/v1, we just use '/'
    const response = await api.get('/');
    return {
      success: true,
      data: response.data || []
    };
  } catch (error) {
    console.error('Error fetching broker accounts:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to fetch broker accounts',
      data: [] // Return empty array as fallback
    };
  }
};

// Place a trade on a specific broker account
export const placeTrade = async (accountId, tradeData) => {
  try {
    const response = await api.post(`/api/v1/broker/${accountId}/trade`, tradeData);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error placing trade:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to place trade'
    };
  }
};

// Get account balance
export const getAccountBalance = async (accountId) => {
  try {
    const response = await api.get(`/api/v1/broker/${accountId}/balance`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching account balance:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to fetch account balance'
    };
  }
};

// Get account positions
export const getPositions = async (accountId) => {
  try {
    const response = await api.get(`/api/v1/broker/${accountId}/positions`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching positions:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to fetch positions'
    };
  }
};

// Close a position
export const closePosition = async (accountId, positionId) => {
  try {
    const response = await api.post(`/broker/${accountId}/positions/${positionId}/close`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error closing position:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to close position'
    };
  }
};
