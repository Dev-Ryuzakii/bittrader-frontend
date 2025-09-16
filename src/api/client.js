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

const request = async (endpoint, options = {}, retryCount = 3) => {
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  for (let attempt = 1; attempt <= retryCount; attempt++) {
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
      
      let responseData;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
        try {
          responseData = JSON.parse(responseData);
        } catch (e) {
          // Keep as text if not JSON
        }
      }

      if (!response.ok) {
        if (response.status === 401) {
          auth.clearAuth();
          auth.redirectToLogin();
          return null;
        }
        
        // Retry on specific error codes
        if ([408, 429, 500, 502, 503, 504].includes(response.status) && attempt < retryCount) {
          console.warn(`API request failed (${response.status}), retrying... Attempt ${attempt}/${retryCount}`);
          await delay(Math.min(1000 * Math.pow(2, attempt - 1), 10000)); // Exponential backoff, max 10s
          continue;
        }
        
        const errorMessage = responseData.detail || responseData.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      return responseData;
    } catch (error) {
      if (attempt === retryCount) {
        console.error(`API request failed after ${retryCount} attempts:`, error);
        throw error;
      }
      console.warn(`API request attempt ${attempt} failed, retrying...`, error);
      await delay(Math.min(1000 * Math.pow(2, attempt - 1), 10000));
    }
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
