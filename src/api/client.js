import { auth } from '../utils/auth';

// Production URL - only use this URL for all environments
const API_URL = 'http://api.tradexas.com';

// Always return the production API URL
const getApiUrl = () => {
  return API_URL;
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

    const headers = Object.assign(
      { 'Content-Type': 'application/json' },
      token ? { Authorization: token } : {},
      options.headers || {}
    );

    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include'
    });
    
    const responseData = await response.json();

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
  
  // Simple method to get current API URL (always returns production URL)
  getCurrentApiUrl: () => getApiUrl()
};
