// src/api/api.js
import axios from 'axios';

// Create Axios instance
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1', // Backend API prefix
  withCredentials: true, // Required for CORS
  headers: {
    'Content-Type': 'application/json',
  },
  // Increase timeout if needed
  timeout: 10000,
});

// Add interceptors for tokens, logging, error handling
api.interceptors.request.use(
  (config) => {
    // Attach token if exists
    const token = localStorage.getItem('access_token');
    if (token) {
      // Token is already formatted with "Bearer " prefix in auth.js
      config.headers.Authorization = token;
    }
    
    // Add request ID for tracking
    config.headers['X-Request-ID'] = `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    
    // Log outgoing requests only in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // Log successful responses only in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Response] ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log all API errors for debugging (but less verbose in production)
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (!isProduction) {
      console.error('[API Error]', {
        status: error.response?.status,
        endpoint: originalRequest?.url,
        message: error.message,
        data: error.response?.data
      });
    } else {
      // In production, only log critical errors
      if (error.response?.status >= 500) {
        console.error('[API Server Error]', {
          status: error.response?.status,
          endpoint: originalRequest?.url
        });
      }
    }
    
    // Handle 401 Unauthorized errors (token expired or invalid)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token if refresh token exists
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          try {
            const response = await axios.post(`${originalRequest.baseURL}/auth/refresh`, {
              refresh_token: refreshToken
            });
            
            const { access_token } = response.data;
            
            // Save new token
            localStorage.setItem('access_token', access_token);
            
            // Update authorization header
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            
            // Retry the original request with new token
            return axios(originalRequest);
          } catch (refreshError) {
            // If refresh token is invalid, clear auth and redirect
            console.error('Token refresh failed:', refreshError);
            // Proceed to logout
          }
        }
        
        // Clear invalid token and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        // Only redirect if we're not already on auth pages and it's actually an auth endpoint
        const currentPath = window.location.pathname;
        const isAuthEndpoint = originalRequest.url?.includes('/auth/') || originalRequest.url?.includes('/login') || originalRequest.url?.includes('/signup');
        
        if (currentPath !== '/signin' && currentPath !== '/signup' && isAuthEndpoint) {
          window.location.href = '/signin';
        }
      } catch (e) {
        console.error('Auth redirect error:', e);
      }
      
      return Promise.reject(error);
    }
    
    // Handle 422 Unprocessable Entity (validation errors)
    if (error.response?.status === 422) {
      // Don't redirect for validation errors - these are not auth issues
      const validationErrors = error.response.data?.errors || {};
      error.validationErrors = validationErrors;
      
      // Only dispatch validation error event, don't redirect
      const validationEvent = new CustomEvent('api:validation-error', {
        detail: { errors: validationErrors, request: originalRequest }
      });
      window.dispatchEvent(validationEvent);
      
      // Return the error without redirecting
      return Promise.reject(error);
    }
    
    // Handle 429 Too Many Requests (rate limiting)
    if (error.response?.status === 429) {
      // Notify user about rate limiting
      const rateLimitEvent = new CustomEvent('api:rate-limited', {
        detail: { retryAfter: error.response.headers['retry-after'] || 60 }
      });
      window.dispatchEvent(rateLimitEvent);
    }
    
    // Handle 503 Service Unavailable (maintenance)
    if (error.response?.status === 503) {
      // Notify about maintenance
      const maintenanceEvent = new CustomEvent('api:maintenance', {
        detail: { message: error.response.data?.message || 'Service temporarily unavailable' }
      });
      window.dispatchEvent(maintenanceEvent);
    }
    
    return Promise.reject(error);
  }
);

// Custom error class for API errors
export class ApiError extends Error {
  constructor(message, status, errors = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

// Helper function to handle API errors consistently
const handleApiError = (error, customMessage = null) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const status = error.response.status;
    const message = customMessage || error.response.data?.message || 'An error occurred';
    const errors = error.response.data?.errors || {};
    
    throw new ApiError(message, status, errors);
  } else if (error.request) {
    // The request was made but no response was received
    throw new ApiError('No response from server. Please check your connection.', 0);
  } else {
    // Something happened in setting up the request that triggered an Error
    throw new ApiError(error.message, 0);
  }
};

export default api;

// Authentication API functions
export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await api.post('/login', credentials);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Login failed. Please check your credentials.');
    }
  },
  
  signup: async (userData) => {
    try {
      const response = await api.post('/signup', userData);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Signup failed. Please check your information.');
    }
  },
  
  logout: async () => {
    try {
      const response = await api.post('/logout');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Logout failed.');
    }
  },
  
  // Validate current token
  validateToken: async () => {
    try {
      const response = await api.get('/auth/validate');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Session validation failed.');
    }
  }
};

// Market data API functions
export const marketAPI = {
  // Get market overview data
  getMarketOverview: async () => {
    try {
      const response = await api.get('/market/overview');
      return response.data;
    } catch (error) {
      // If API fails, return mock data so UI doesn't break
      console.warn('Using fallback market data due to API error:', error);
      return {
        markets: [
          {
            id: 1,
            symbol: "BTC",
            name: "Bitcoin",
            price: 38769.45,
            change: -1234.55,
            changePercent: -3.1,
            chartData: [40000, 39800, 39500, 38900, 38769, 39100, 38769],
            colorVariant: 1,
            currency: "USD"
          },
          {
            id: 2,
            symbol: "ETH",
            name: "Ethereum",
            price: 2769.85,
            change: 102.34,
            changePercent: 3.8,
            chartData: [2650, 2680, 2720, 2750, 2769, 2755, 2769],
            colorVariant: 2,
            currency: "USD"
          },
          {
            id: 3,
            symbol: "BNB",
            name: "Binance",
            price: 302.89,
            change: 11.23,
            changePercent: 3.8,
            chartData: [290, 295, 298, 302, 305, 301, 302],
            colorVariant: 3,
            currency: "USD"
          }
        ]
      };
    }
  },
  
  // Get price history for a symbol
  getPriceHistory: async (symbol, timeframe = '1d') => {
    try {
      const response = await api.get(`/market/history/${symbol}`, {
        params: { timeframe }
      });
      return response.data;
    } catch (error) {
      handleApiError(error, `Failed to load price history for ${symbol}`);
    }
  },
  
  // Get current price for a symbol
  getCurrentPrice: async (symbol) => {
    try {
      const response = await api.get(`/market/price/${symbol}`);
      return response.data;
    } catch (error) {
      // Only log API failures in development, or if it's a server error
      if (process.env.NODE_ENV === 'development' || error.response?.status >= 500) {
        console.warn(`API failed to get current price for ${symbol}, using mock data:`, error.message);
      }
      
      // Return realistic mock price data based on symbol
      const mockPrices = {
        'EURUSD': { price: 1.0845 + (Math.random() - 0.5) * 0.01 },
        'GBPUSD': { price: 1.2734 + (Math.random() - 0.5) * 0.01 },
        'USDJPY': { price: 149.82 + (Math.random() - 0.5) * 2 },
        'USDCAD': { price: 1.3567 + (Math.random() - 0.5) * 0.01 },
        'AUDUSD': { price: 0.6789 + (Math.random() - 0.5) * 0.01 },
        'NZDUSD': { price: 0.6123 + (Math.random() - 0.5) * 0.01 },
        'BTCUSD': { price: 43250 + (Math.random() - 0.5) * 1000 },
        'ETHUSD': { price: 2567 + (Math.random() - 0.5) * 100 },
        'XAUUSD': { price: 2034.50 + (Math.random() - 0.5) * 20 },
        'XAGUSD': { price: 24.85 + (Math.random() - 0.5) * 2 },
        'USOIL': { price: 78.45 + (Math.random() - 0.5) * 5 },
        'SPX500': { price: 4750.25 + (Math.random() - 0.5) * 50 },
        'US30': { price: 37825.50 + (Math.random() - 0.5) * 200 },
        'NAS100': { price: 16234.75 + (Math.random() - 0.5) * 100 }
      };
      
      // Default price if symbol not found in mock data
      const defaultPrice = 100 + (Math.random() - 0.5) * 10;
      
      return {
        price: mockPrices[symbol]?.price || defaultPrice,
        symbol: symbol,
        timestamp: new Date().toISOString(),
        mock: true
      };
    }
  },
  
  // Get available symbols
  getSymbols: async () => {
    try {
      const response = await api.get('/market/symbols');
      return response.data;
    } catch (error) {
      console.warn('Using fallback symbols due to API error:', error);
      return {
        symbols: [
          { symbol: "BTC/USD", name: "Bitcoin" },
          { symbol: "ETH/USD", name: "Ethereum" },
          { symbol: "LTC/USD", name: "Litecoin" },
          { symbol: "BNB/USD", name: "Binance Coin" },
          { symbol: "XRP/USD", name: "Ripple" }
        ]
      };
    }
  }
};

// Trading API functions
export const tradingAPI = {
  // Place a new order
  placeOrder: async (orderData) => {
    try {
      const response = await api.post('/trading/order', orderData);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to place order');
    }
  },
  
  // Get user's open orders
  getOpenOrders: async () => {
    try {
      const response = await api.get('/trading/orders/open');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch open orders');
    }
  },
  
  // Get user's order history
  getOrderHistory: async (page = 1, limit = 10) => {
    try {
      const response = await api.get('/trading/orders/history', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to fetch order history');
    }
  },
  
  // Cancel an order
  cancelOrder: async (orderId) => {
    try {
      const response = await api.delete(`/trading/order/${orderId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Failed to cancel order');
    }
  }
};
