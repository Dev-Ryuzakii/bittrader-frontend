/**
 * Symbol utilities for handling broker-specific symbol mappings
 */

import { symbolMappingService } from '../api/symbolMapping.js';

/**
 * Normalize a symbol to standard format
 * @param {string} brokerSymbol - Broker-specific symbol
 * @returns {Promise<string>} Normalized symbol
 */
export const normalizeSymbol = async (brokerSymbol) => {
  try {
    const result = await symbolMappingService.normalizeSymbol(brokerSymbol);
    return result.normalized_symbol;
  } catch (error) {
    console.error('Error normalizing symbol:', error);
    // Fallback: basic normalization
    return brokerSymbol.replace(/[^A-Z]/g, '').substring(0, 6);
  }
};

/**
 * Get broker-specific symbol for an account
 * @param {string} accountId - MetaAPI account ID
 * @param {string} standardSymbol - Standard symbol (e.g., EURUSD)
 * @returns {Promise<string|null>} Broker symbol or null if not found
 */
export const getBrokerSymbolForAccount = async (accountId, standardSymbol) => {
  try {
    const result = await symbolMappingService.getBrokerSymbol(accountId, standardSymbol);
    return result.success ? result.broker_symbol : null;
  } catch (error) {
    console.error('Error getting broker symbol:', error);
    return null;
  }
};

/**
 * Validate if a symbol is available across multiple accounts
 * @param {string} standardSymbol - Standard symbol to validate
 * @param {Array<string>} accountIds - List of account IDs
 * @returns {Promise<Object>} Validation results
 */
export const validateSymbolAcrossAccounts = async (standardSymbol, accountIds) => {
  try {
    const result = await symbolMappingService.validateSymbolAcrossAccounts(standardSymbol, accountIds);
    return result.account_availability || {};
  } catch (error) {
    console.error('Error validating symbol:', error);
    return {};
  }
};

/**
 * Get common symbols available across all provided accounts
 * @param {Array<string>} accountIds - List of account IDs
 * @returns {Promise<Array<string>>} List of common symbols
 */
export const getCommonSymbols = async (accountIds) => {
  try {
    const result = await symbolMappingService.getSymbolStatistics(accountIds);
    if (result.success && result.statistics.common_symbols) {
      return result.statistics.common_symbols;
    }
    return [];
  } catch (error) {
    console.error('Error getting common symbols:', error);
    return [];
  }
};

/**
 * Get all standard symbols available in the system
 * @returns {Promise<Array<string>>} List of standard symbols
 */
export const getStandardSymbols = async () => {
  try {
    const result = await symbolMappingService.getStandardSymbols();
    return result.success ? result.standard_symbols : [];
  } catch (error) {
    console.error('Error getting standard symbols:', error);
    return [];
  }
};

/**
 * Format symbol for display (adds separator if needed)
 * @param {string} symbol - Symbol to format
 * @returns {string} Formatted symbol
 */
export const formatSymbolForDisplay = (symbol) => {
  if (!symbol || symbol.length < 6) return symbol;
  
  // Common currency pairs
  const majorPairs = [
    'GBPUSD', 'USDJPY', 'EURUSD', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
    'EURGBP', 'EURJPY', 'GBPJPY', 'EURCHF', 'AUDCAD', 'GBPAUD', 'EURAUD'
  ];
  
  if (majorPairs.includes(symbol)) {
    return `${symbol.substring(0, 3)}/${symbol.substring(3, 6)}`;
  }
  
  // For crypto or other instruments, return as-is
  return symbol;
};

/**
 * Check if symbol is a major currency pair
 * @param {string} symbol - Symbol to check
 * @returns {boolean} True if major pair
 */
export const isMajorPair = (symbol) => {
  const majorPairs = [
    'GBPUSD', 'USDJPY', 'EURUSD', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD'
  ];
  return majorPairs.includes(symbol.toUpperCase());
};

/**
 * Get symbol category
 * @param {string} symbol - Symbol to categorize
 * @returns {string} Category name
 */
export const getSymbolCategory = (symbol) => {
  const upperSymbol = symbol.toUpperCase();
  
  if (upperSymbol.includes('BTC') || upperSymbol.includes('ETH') || upperSymbol.includes('ADA') || 
      upperSymbol.includes('DOT') || upperSymbol.includes('CRYPTO')) {
    return 'Cryptocurrency';
  }
  
  if (upperSymbol.includes('USD') || upperSymbol.includes('EUR') || upperSymbol.includes('GBP') || 
      upperSymbol.includes('JPY') || upperSymbol.includes('CHF') || upperSymbol.includes('AUD') || 
      upperSymbol.includes('CAD') || upperSymbol.includes('NZD')) {
    return 'Forex';
  }
  
  if (upperSymbol.includes('GOLD') || upperSymbol.includes('SILVER') || upperSymbol.includes('OIL') || 
      upperSymbol.includes('WTI') || upperSymbol.includes('BRENT')) {
    return 'Commodities';
  }
  
  if (upperSymbol.includes('SPX') || upperSymbol.includes('NDX') || upperSymbol.includes('DJI') || 
      upperSymbol.includes('FTSE') || upperSymbol.includes('DAX')) {
    return 'Indices';
  }
  
  return 'Other';
};

export default {
  normalizeSymbol,
  getBrokerSymbolForAccount,
  validateSymbolAcrossAccounts,
  getCommonSymbols,
  getStandardSymbols,
  formatSymbolForDisplay,
  isMajorPair,
  getSymbolCategory
};
