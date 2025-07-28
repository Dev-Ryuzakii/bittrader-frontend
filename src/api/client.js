import { auth } from '../utils/auth';

const API_URL = 'http://127.0.0.1:8000';

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
    console.error('Token validation error:', e);
    auth.clearAuth();
    return null;
  }
};

const request = async (endpoint, options = {}) => {
  try {
    const token = validateToken();
    console.log('Using token:', token);

    const headers = Object.assign(
      { 'Content-Type': 'application/json' },
      token ? { Authorization: token } : {},
      options.headers || {}
    );

    console.log('Request headers:', headers);
    console.log('Request URL:', `${API_URL}${endpoint}`);
    console.log('Request options:', options);

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include'
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        console.log('Auth error detected, redirecting to login...');
        auth.clearAuth();
        auth.redirectToLogin();
        return null;
      }
      const errorMessage = data.detail || data.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error('Request failed:', {
      error: error.message,
      endpoint,
      options
    });
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
  delete: (endpoint) => request(endpoint, { method: 'DELETE' })
};
