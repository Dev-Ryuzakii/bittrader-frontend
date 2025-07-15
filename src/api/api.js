// src/api/api.js
import axios from 'axios';

// Create Axios instance
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1', // Backend API prefix
  withCredentials: false, // Set true if backend uses cookies
});

// Add interceptors if needed (for tokens, logging, etc.)
api.interceptors.request.use(
  (config) => {
    // Attach token if exists
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
