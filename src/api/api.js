// src/api/api.js
import axios from 'axios';

// Create Axios instance
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1', // Backend API prefix
  withCredentials: true, // Required for CORS
  headers: {
    'Content-Type': 'application/json',
  },
  // Increase timeout for AI processing
  timeout: 30000, // 30 seconds for AI endpoints
});

// Add interceptors if needed (for tokens, logging, etc.)
api.interceptors.request.use(
  (config) => {
    // Attach token if exists
    const token = localStorage.getItem('access_token');
    if (token) {
      // Token is already formatted with "Bearer " prefix in auth.js
      config.headers.Authorization = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Optional: Handle global errors (like 401, 500)
    return Promise.reject(error);
  }
);

export default api;

// Authentication API functions
export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await api.post('/login', credentials);
      return response.data;
    } catch (error) {
      //console.error('Login error:', error);
      throw error;
    }
  },
  
  signup: async (userData) => {
    try {
      const response = await api.post('/signup', userData);
      return response.data;
    } catch (error) {
      //console.error('Signup error:', error);
      throw error;
    }
  },
  
  logout: async () => {
    try {
      const response = await api.post('/logout');
      return response.data;
    } catch (error) {
      //console.error('Logout error:', error);
      throw error;
    }
  }
};

// User Profile API functions
export const userAPI = {
  getProfile: async () => {
    try {
      const response = await api.get('/profile');
      return response.data;
    } catch (error) {
      //console.error('Get profile error:', error);
      throw error;
    }
  },
  
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/profile', profileData);
      return response.data;
    } catch (error) {
      //console.error('Update profile error:', error);
      throw error;
    }
  }
};

// Trading API functions
export const tradingAPI = {
  placeOrder: async (orderData) => {
    try {
      const response = await api.post('/trading/orders', orderData);
      return response.data;
    } catch (error) {
      ////console.error('Place order error:', error);
      throw error;
    }
  },
  
  getOrders: async () => {
    try {
      const response = await api.get('/trading/orders');
      return response.data;
    } catch (error) {
      //console.error('Get orders error:', error);
      throw error;
    }
  },
  
  cancelOrder: async (orderId) => {
    try {
      const response = await api.delete(`/trading/orders/${orderId}`);
      return response.data;
    } catch (error) {
      //console.error('Cancel order error:', error);
      throw error;
    }
  },
  
  getPositions: async () => {
    try {
      const response = await api.get('/trading/positions');
      return response.data;
    } catch (error) {
      //console.error('Get positions error:', error);
      throw error;
    }
  }
};

// Market Data API functions
export const marketAPI = {
  getCurrentPrice: async (symbol) => {
    try {
      const response = await api.get(`/market/price/${symbol}`);
      return response.data;
    } catch (error) {
      //console.error('Get current price error:', error);
      throw error;
    }
  },
  
  getMarketData: async (symbol, timeframe = 'D') => {
    try {
      const response = await api.get(`/market/data/${symbol}`, {
        params: { timeframe }
      });
      return response.data;
    } catch (error) {
      //console.error('Get market data error:', error);
      throw error;
    }
  },
  
  getSymbols: async () => {
    try {
      const response = await api.get('/market/symbols');
      return response.data;
    } catch (error) {
      //console.error('Get symbols error:', error);
      throw error;
    }
  }
};
