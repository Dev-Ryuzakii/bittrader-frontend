import { api } from './client';

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

// Delete a broker account
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

// Update a broker account (toggle active status, change password, etc.)
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

// Toggle account active status
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

// Get detailed account information
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
    // Using the correct endpoint: GET /api/v1/broker/
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

// Get account balance
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

// Get account positions
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

// Close a position
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
