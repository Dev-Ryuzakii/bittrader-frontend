import { auth } from '../utils/auth';

// API URL configuration with fallbacks
const API_URL = import.meta.env.VITE_API_URL || 
                process.env.VITE_API_URL || 
                'http://127.0.0.1:8000';

// Secondary production URL that can be used as a fallback
const PRODUCTION_API_URL = 'http://api.tradexas.com';

// Function to determine which API URL to use
const getApiUrl = () => {
  // Use the environment variable by default
  let url = API_URL;
  
  // Check for a user preference in localStorage (allows runtime switching)
  const userPreference = localStorage.getItem('apiUrlPreference');
  if (userPreference === 'production') {
    url = PRODUCTION_API_URL;
  } else if (userPreference === 'local') {
    url = 'http://127.0.0.1:8000';
  }
  
  return url;
};

const validateToken = () => {
  const token = auth.getAuthToken();
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) {
      auth.clearAuth();
      return null;
    }
    return token;
  } catch (e) {
    //console.error('Token validation error:', e);
    auth.clearAuth();
    return null;
  }
};

const request = async (endpoint, options = {}) => {
  try {
    const token = validateToken();
    //console.log('Using token:', token);

    const headers = Object.assign(
      { 'Content-Type': 'application/json' },
      token ? { Authorization: token } : {},
      options.headers || {}
    );

    //console.log('Request headers:', headers);
    //console.log('Request URL:', `${API_URL}${endpoint}`);
    //console.log('Request options:', options);

    const currentApiUrl = getApiUrl();
    const response = await fetch(`${currentApiUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include'
    });

    //console.log('Response status:', response.status);
    //console.log('Response headers:', response.headers);

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        //console.log('Auth error detected, redirecting to login...');
        auth.clearAuth();
        auth.redirectToLogin();
        return null;
      }
      const errorMessage = data.detail || data.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    //console.error('Request failed:', {
      error: error.message,
      endpoint,
      options
    //});
    throw error;
  }
};

export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, data) => request(endpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  put: (endpoint, data) => request(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  patch: (endpoint, data) => request(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
  
  // API server management functions
  getCurrentApiUrl: () => getApiUrl(),
  setApiServer: (server) => {
    if (server === 'production') {
      localStorage.setItem('apiUrlPreference', 'production');
      return PRODUCTION_API_URL;
    } else if (server === 'local') {
      localStorage.setItem('apiUrlPreference', 'local');
      return 'http://127.0.0.1:8000';
    } else {
      // Clear preference to use the default from environment
      localStorage.removeItem('apiUrlPreference');
      return API_URL;
    }
  }
};
