import { auth } from '../utils/auth';

// Production URLs from environment variables with fallbacks
const PRODUCTION_API_URL = import.meta.env.VITE_API_URL || 'http://api.tradexas.com';
const IP_API_URL = import.meta.env.VITE_API_IP_URL || 'http://157.245.171.215:8000';

// Local development URL (only used in development mode)
const LOCAL_API_URL = 'http://127.0.0.1:8000';

// Determine default API URL based on environment - ALWAYS use production in production mode
// In development, still use production by default to avoid connection errors
const DEFAULT_API_URL = PRODUCTION_API_URL;

// Function to determine which API URL to use
const getApiUrl = () => {
  // Always use production URL as default
  let url = DEFAULT_API_URL;
  
  // Check for a user preference in localStorage (allows runtime switching)
  const userPreference = localStorage.getItem('apiUrlPreference');
  if (userPreference === 'production') {
    url = PRODUCTION_API_URL;
  } else if (userPreference === 'local' && import.meta.env.MODE !== 'production') {
    // Only allow local in development mode
    url = LOCAL_API_URL;
  } else if (userPreference === 'ip') {
    url = IP_API_URL;
  }
  
  return url;
};

// Force using production API in deployment
if (import.meta.env.MODE === 'production') {
  localStorage.setItem('apiUrlPreference', 'production');
}

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

    const headers = Object.assign(
      { 'Content-Type': 'application/json' },
      token ? { Authorization: token } : {},
      options.headers || {}
    );

    let currentApiUrl = getApiUrl();
    let response;
    let responseData;
    let error;

    try {
      // Try with the primary URL first
      response = await fetch(`${currentApiUrl}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include'
      });
      responseData = await response.json();
    } catch (primaryError) {
      // If the primary URL fails, try with the IP URL
      error = primaryError;
      
      // If we're already using the IP URL, don't try again
      if (currentApiUrl === IP_API_URL) {
        throw primaryError;
      }
      
      try {
        // Try with IP endpoint as fallback
        response = await fetch(`${IP_API_URL}${endpoint}`, {
          ...options,
          headers,
          credentials: 'include'
        });
        responseData = await response.json();
        
        // If IP endpoint worked, use it for future requests
        localStorage.setItem('apiUrlPreference', 'ip');
      } catch (fallbackError) {
        // Both attempts failed
        throw error; // Throw the original error
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        auth.clearAuth();
        auth.redirectToLogin();
        return null;
      }
      const errorMessage = responseData.detail || responseData.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return responseData;
  } catch (error) {
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
    } else if (server === 'local' && import.meta.env.MODE !== 'production') {
      localStorage.setItem('apiUrlPreference', 'local');
      return LOCAL_API_URL;
    } else if (server === 'ip') {
      localStorage.setItem('apiUrlPreference', 'ip');
      return IP_API_URL;
    } else {
      // Clear preference to use the default from environment
      localStorage.removeItem('apiUrlPreference');
      return DEFAULT_API_URL;
    }
  }
};
