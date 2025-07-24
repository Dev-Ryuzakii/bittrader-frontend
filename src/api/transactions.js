import api from './api.js';

// Get paginated list of transactions with filters
export const getTransactions = async (params = {}) => {
  try {
    // Build query parameters with proper validation to match backend expectations
    const queryParams = new URLSearchParams();
    
    // Add pagination with sensible defaults (backend expects page and page_size)
    const page = Math.max(1, parseInt(params.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(params.limit || params.page_size) || 20));
    
    queryParams.append('page', page);
    queryParams.append('page_size', pageSize);
    
    // Add optional filters only if they have valid values (matching backend parameters)
    if (params.account_id && params.account_id !== '') {
      queryParams.append('account_id', params.account_id);
    }
    if (params.asset && params.asset !== '') {
      queryParams.append('asset', params.asset);
    }
    if (params.type && params.type !== '') {
      queryParams.append('type', params.type);
    }
    if (params.status && params.status !== '') {
      queryParams.append('status', params.status);
    }
    
    // Date filters - backend expects start_date and end_date as datetime
    if (params.start_date || params.date_from) {
      const startDate = params.start_date || params.date_from;
      if (startDate && !isNaN(new Date(startDate))) {
        queryParams.append('start_date', new Date(startDate).toISOString());
      }
    }
    if (params.end_date || params.date_to) {
      const endDate = params.end_date || params.date_to;
      if (endDate && !isNaN(new Date(endDate))) {
        queryParams.append('end_date', new Date(endDate).toISOString());
      }
    }
    
    // Sorting parameters (backend supports sort_by and sort_order)
    if (params.sort_by && params.sort_by !== '') {
      queryParams.append('sort_by', params.sort_by);
    }
    if (params.sort_order && ['asc', 'desc'].includes(params.sort_order.toLowerCase())) {
      queryParams.append('sort_order', params.sort_order.toLowerCase());
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Fetching transactions with params:', queryParams.toString());
    }
    
    const response = await api.get(`/transactions?${queryParams.toString()}`);
    
    // Backend returns TransactionListResponse with items, total, page, page_size
    return {
      success: true,
      data: response.data.items || response.data.transactions || response.data.data || response.data,
      meta: {
        total: response.data.total || 0,
        page: response.data.page || page,
        page_size: response.data.page_size || pageSize,
        total_pages: Math.ceil((response.data.total || 0) / pageSize)
      }
    };
    
  } catch (apiError) {
    // Log API failures in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Transactions API failed:', {
        status: apiError.response?.status,
        message: apiError.message,
        endpoint: '/transactions'
      });
    }
    
    // Return error response instead of mock data
    return {
      success: false,
      data: [],
      meta: { 
        total: 0,
        page: parseInt(params.page) || 1,
        page_size: parseInt(params.page_size || params.limit) || 20,
        total_pages: 0
      },
      error: apiError.response?.data?.detail || apiError.message
    };
  }
};

// Get specific transaction by ID
export const getTransaction = async (transactionId) => {
  try {
    const response = await api.get(`/transactions/${transactionId}`);
    return {
      success: true,
      data: response.data
    };
  } catch (apiError) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Transaction fetch by ID failed:', {
        id: transactionId,
        status: apiError.response?.status,
        message: apiError.message
      });
    }
    
    return {
      success: false,
      data: null,
      error: apiError.response?.data?.detail || apiError.message
    };
  }
};

// Create new transaction
export const createTransaction = async (transactionData) => {
  try {
    // Backend expects TransactionCreate schema
    const payload = {
      account_id: transactionData.account_id,
      account_name: transactionData.account_name || '',
      type: transactionData.type, // buy, sell, deposit, withdrawal, etc.
      asset: transactionData.asset,
      quantity: parseFloat(transactionData.quantity) || null,
      unit_price: parseFloat(transactionData.unit_price) || null,
      total_value: parseFloat(transactionData.total_value) || 0,
      trade_pl: parseFloat(transactionData.trade_pl) || null,
      status: transactionData.status || 'pending',
      description: transactionData.description || ''
    };
    
    const response = await api.post('/transactions', payload);
    return {
      success: true,
      data: response.data
    };
  } catch (apiError) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Transaction creation failed:', {
        status: apiError.response?.status,
        message: apiError.message,
        data: transactionData
      });
    }
    
    return {
      success: false,
      data: null,
      error: apiError.response?.data?.detail || apiError.message
    };
  }
};

// Update existing transaction
export const updateTransaction = async (transactionId, updateData) => {
  try {
    // Backend expects TransactionUpdate schema with only non-None fields
    const payload = {};
    if (updateData.account_id !== undefined) payload.account_id = updateData.account_id;
    if (updateData.account_name !== undefined) payload.account_name = updateData.account_name;
    if (updateData.type !== undefined) payload.type = updateData.type;
    if (updateData.asset !== undefined) payload.asset = updateData.asset;
    if (updateData.quantity !== undefined) payload.quantity = parseFloat(updateData.quantity);
    if (updateData.unit_price !== undefined) payload.unit_price = parseFloat(updateData.unit_price);
    if (updateData.total_value !== undefined) payload.total_value = parseFloat(updateData.total_value);
    if (updateData.trade_pl !== undefined) payload.trade_pl = parseFloat(updateData.trade_pl);
    if (updateData.status !== undefined) payload.status = updateData.status;
    if (updateData.description !== undefined) payload.description = updateData.description;
    
    const response = await api.put(`/transactions/${transactionId}`, payload);
    return {
      success: true,
      data: response.data
    };
  } catch (apiError) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Transaction update failed:', {
        id: transactionId,
        status: apiError.response?.status,
        message: apiError.message
      });
    }
    
    return {
      success: false,
      data: null,
      error: apiError.response?.data?.detail || apiError.message
    };
  }
};

// Delete transaction (soft delete)
export const deleteTransaction = async (transactionId) => {
  try {
    // Backend returns 204 status code for successful deletion
    await api.delete(`/transactions/${transactionId}`);
    return {
      success: true
    };
  } catch (apiError) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Transaction deletion failed:', {
        id: transactionId,
        status: apiError.response?.status,
        message: apiError.message
      });
    }
    
    return {
      success: false,
      error: apiError.response?.data?.detail || apiError.message
    };
  }
};

// Get transaction summary/stats
export const getTransactionSummary = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Backend expects start_date, end_date, account_id as query params
    if (params.start_date) {
      queryParams.append('start_date', new Date(params.start_date).toISOString());
    }
    if (params.end_date) {
      queryParams.append('end_date', new Date(params.end_date).toISOString());
    }
    if (params.account_id) {
      queryParams.append('account_id', params.account_id);
    }
    
    const response = await api.get(`/transactions/summary/stats?${queryParams.toString()}`);
    return {
      success: true,
      data: response.data
    };
  } catch (apiError) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Transaction summary failed:', {
        status: apiError.response?.status,
        message: apiError.message
      });
    }
    
    return {
      success: false,
      data: null,
      error: apiError.response?.data?.detail || apiError.message
    };
  }
};

// Get list of accounts with transactions
export const getTransactionAccounts = async () => {
  try {
    const response = await api.get('/transactions/accounts');
    return {
      success: true,
      data: response.data
    };
  } catch (apiError) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Transaction accounts failed:', {
        status: apiError.response?.status,
        message: apiError.message
      });
    }
    
    return {
      success: false,
      data: [],
      error: apiError.response?.data?.detail || apiError.message
    };
  }
};
