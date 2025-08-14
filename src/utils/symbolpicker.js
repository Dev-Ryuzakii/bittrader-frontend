/**
 * Symbol Picker API Integration Utilities
 * 
 * This module provides utilities for interacting with the backend symbol picker APIs
 * to fetch available symbols, popular symbols, and search for symbols.
 */

import axios from 'axios';

// Base API URL - replace with your actual API base URL
const API_BASE_URL = '/api/v1';

/**
 * Get all available symbols across user's accounts
 * @param {string} searchTerm - Optional search term to filter symbols
 * @param {number} limit - Maximum number of symbols to return
 * @returns {Promise<Object>} - Available symbols with metadata
 */
export const getAvailableSymbols = async (searchTerm = '', limit = 50) => {
  try {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (limit) params.append('limit', limit.toString());

    const response = await axios.get(`${API_BASE_URL}/broker/symbols/available`, {
      params,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching available symbols:', error);
    throw error;
  }
};

/**
 * Get popular symbols for quick access
 * @returns {Promise<Object>} - Popular symbols categorized by type
 */
export const getPopularSymbols = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/broker/symbols/popular`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching popular symbols:', error);
    throw error;
  }
};

/**
 * Search for symbols (for autocomplete)
 * @param {string} searchTerm - The search term (minimum 2 characters)
 * @param {number} limit - Maximum results to return
 * @returns {Promise<Object>} - Search results with relevance scoring
 */
export const searchSymbols = async (searchTerm, limit = 20) => {
  if (!searchTerm || searchTerm.trim().length < 2) {
    return { symbols: [], message: "Search term must be at least 2 characters" };
  }
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/broker/symbols/search/${encodeURIComponent(searchTerm)}`, 
      {
        params: { limit },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error searching symbols:', error);
    throw error;
  }
};

/**
 * Get symbol price for a specific account
 * @param {string} accountId - The account ID
 * @param {string} symbol - The symbol to get price for
 * @returns {Promise<Object>} - Current bid/ask prices
 */
export const getSymbolPrice = async (accountId, symbol) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/broker/${accountId}/price/${encodeURIComponent(symbol)}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    throw error;
  }
};

/**
 * Get account-specific symbols
 * @param {string} accountId - The account ID
 * @returns {Promise<Object>} - Available symbols for the account
 */
export const getAccountSymbols = async (accountId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/broker/${accountId}/symbols`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching account symbols:', error);
    throw error;
  }
};

/**
 * Refresh symbol mappings for an account
 * @param {string} accountId - The account ID
 * @returns {Promise<Object>} - Refresh status
 */
export const refreshAccountSymbols = async (accountId) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/broker/${accountId}/symbols/refresh`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error refreshing account symbols:', error);
    throw error;
  }
};

/**
 * Get symbol mapping status for an account
 * @param {string} accountId - The account ID
 * @returns {Promise<Object>} - Symbol mapping status
 */
export const getSymbolMappingStatus = async (accountId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/broker/${accountId}/symbols/status`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching symbol mapping status:', error);
    throw error;
  }
};

/**
 * Get mock symbols for development (when backend is not available)
 * @returns {Array} - Mock symbols for development
 */
export const getMockSymbols = () => {
  return [];
};

/**
 * Mock search function for development (when backend is not available)
 * @param {string} term - Search term
 * @returns {Array} - Filtered mock symbols
 */
export const mockSearchSymbols = (term) => {
  const mockSymbols = getMockSymbols();
  const upperTerm = term.toUpperCase();
  
  return mockSymbols
    .filter(s => 
      s.symbol.includes(upperTerm) || 
      s.display_name.toUpperCase().includes(upperTerm) ||
      s.description.toUpperCase().includes(upperTerm)
    )
    .map(s => ({
      ...s,
      relevance_score: s.symbol === upperTerm ? 100 : 
                      s.symbol.startsWith(upperTerm) ? 90 : 
                      s.symbol.includes(upperTerm) ? 80 : 70
    }))
    .sort((a, b) => b.relevance_score - a.relevance_score);
};

/**
 * Convert API response to SymbolPicker compatible format
 * @param {Object} apiResponse - API response from backend
 * @returns {Array} - Formatted symbols for SymbolPicker component
 */
export const formatSymbolsForPicker = (apiResponse) => {
  if (!apiResponse || !apiResponse.symbols) {
    return [];
  }
  
  return apiResponse.symbols.map(s => ({
    symbol: s.symbol,
    display_name: s.display_name || s.symbol,
    description: s.description || "",
    available_accounts: s.available_accounts || 0,
    popular: s.popular || false,
    relevance_score: s.relevance_score,
    // Add any additional fields needed by SymbolPicker component
  }));
};

export default {
  getAvailableSymbols,
  getPopularSymbols,
  searchSymbols,
  getSymbolPrice,
  getAccountSymbols,
  refreshAccountSymbols,
  getSymbolMappingStatus,
  getMockSymbols,
  mockSearchSymbols,
  formatSymbolsForPicker
};
