/**
 * Enhanced Symbol Mapping API Service
 * Handles automatic symbol normalization and broker-specific mappings
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class SymbolMappingService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/v1/symbol-mapping`;
    this.brokerAccountsURL = `${API_BASE_URL}/api/v1/broker-accounts`;
  }

  /**
   * Get authentication headers
   */
  getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': token } : {})
    };
  }

  /**
   * Get account symbols with automatic mapping status
   * @param {string} accountId - Account ID
   * @returns {Promise<Object>} Account symbols response
   */
  async getAccountSymbols(accountId) {
    try {
      const response = await fetch(`${this.brokerAccountsURL}/${accountId}/symbols`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error getting account symbols for ${accountId}:`, error);
      throw error;
    }
  }

  /**
   * Refresh symbols for an account
   * @param {string} accountId - Account ID
   * @returns {Promise<Object>} Refresh response
   */
  async refreshAccountSymbols(accountId) {
    try {
      const response = await fetch(`${this.brokerAccountsURL}/${accountId}/refresh-symbols`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error refreshing symbols for ${accountId}:`, error);
      throw error;
    }
  }

  /**
   * Poll symbol mapping status for account connection
   * @param {string} accountId - Account ID
   * @param {number} maxAttempts - Maximum polling attempts
   * @returns {Promise<Object>} Final account status
   */
  async pollSymbolMappingStatus(accountId, maxAttempts = 30) {
    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      try {
        const response = await fetch(`${this.brokerAccountsURL}/${accountId}`, {
          method: 'GET',
          headers: this.getAuthHeaders()
        });

        if (response.ok) {
          const account = await response.json();
          if (account.symbols_mapped) {
            return account; // Success!
          }
        }

        // Wait 1 second before next attempt
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error polling symbol mapping status (attempt ${attempts + 1}):`, error);
      }
    }

    throw new Error("Symbol mapping timed out");
  }

  /**
   * Normalize a broker-specific symbol to standard format
   * @param {string} brokerSymbol - Broker-specific symbol to normalize
   * @returns {Promise<Object>} Normalized symbol response
   */
  async normalizeSymbol(brokerSymbol) {
    try {
      const response = await fetch(`${this.baseURL}/normalize`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          broker_symbol: brokerSymbol
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error normalizing symbol:', error);
      throw error;
    }
  }

  /**
   * Get broker-specific symbol for a standard symbol on a specific account
   * @param {string} accountId - MetaAPI account ID
   * @param {string} standardSymbol - Standard symbol (e.g., EURUSD)
   * @returns {Promise<Object>} Broker symbol response
   */
  async getBrokerSymbol(accountId, standardSymbol) {
    try {
      const response = await fetch(`${this.baseURL}/broker-symbol`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          account_id: accountId,
          standard_symbol: standardSymbol
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting broker symbol:', error);
      throw error;
    }
  }

  /**
   * Get all symbol mappings for a specific account
   * @param {string} accountId - MetaAPI account ID
   * @returns {Promise<Object>} Symbol mappings response
   */
  async getAccountSymbolMapping(accountId) {
    try {
      const response = await fetch(`${this.baseURL}/account/${accountId}/symbols`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting account symbol mapping:', error);
      throw error;
    }
  }

  /**
   * Get symbol mappings across multiple broker accounts
   * @param {Array<string>} accountIds - List of MetaAPI account IDs
   * @returns {Promise<Object>} Cross-broker mappings response
   */
  async getCrossBrokerMappings(accountIds) {
    try {
      // Validate and filter account IDs
      if (!Array.isArray(accountIds)) {
        throw new Error('Account IDs must be an array');
      }

      const validAccountIds = accountIds.filter(id => 
        id && 
        typeof id === 'string' && 
        id.trim() !== '' && 
        id !== 'undefined' && 
        id !== 'null'
      );

      if (validAccountIds.length === 0) {
        throw new Error('No valid account IDs provided');
      }

      console.log('Fetching cross-broker mappings for accounts:', validAccountIds);
      
      const response = await fetch(`${this.baseURL}/cross-broker`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          account_ids: validAccountIds
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('Cross-broker mappings result:', result);
      return result;
    } catch (error) {
      console.error('Error getting cross-broker mappings:', error);
      throw error;
    }
  }

  /**
   * Validate if a standard symbol is available across given accounts
   * @param {string} standardSymbol - Standard symbol to validate
   * @param {Array<string>} accountIds - List of account IDs to check
   * @returns {Promise<Object>} Validation results
   */
  async validateSymbolAcrossAccounts(standardSymbol, accountIds) {
    try {
      const response = await fetch(`${this.baseURL}/validate`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          standard_symbol: standardSymbol,
          account_ids: accountIds
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error validating symbol:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive statistics about symbol coverage across accounts
   * @param {Array<string>} accountIds - List of MetaAPI account IDs
   * @returns {Promise<Object>} Symbol statistics response
   */
  async getSymbolStatistics(accountIds) {
    try {
      // Validate and filter account IDs
      if (!Array.isArray(accountIds)) {
        throw new Error('Account IDs must be an array');
      }

      const validAccountIds = accountIds.filter(id => 
        id && 
        typeof id === 'string' && 
        id.trim() !== '' && 
        id !== 'undefined' && 
        id !== 'null'
      );

      if (validAccountIds.length === 0) {
        throw new Error('No valid account IDs provided');
      }

      console.log('Fetching symbol statistics for accounts:', validAccountIds);
      
      const response = await fetch(`${this.baseURL}/statistics`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          account_ids: validAccountIds
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('Symbol statistics result:', result);
      return result;
    } catch (error) {
      console.error('Error getting symbol statistics:', error);
      throw error;
    }
  }

  /**
   * Get a list of all standard symbols available across all accounts
   * @returns {Promise<Object>} Standard symbols list
   */
  async getStandardSymbols() {
    try {
      const response = await fetch(`${this.baseURL}/standard-symbols`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting standard symbols:', error);
      throw error;
    }
  }

  /**
   * Manually refresh symbol mappings for a specific account
   * @param {string} accountId - MetaAPI account ID
   * @returns {Promise<Object>} Refresh response
   */
  async refreshAccountMappings(accountId) {
    try {
      const response = await fetch(`${this.baseURL}/refresh/${accountId}`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error refreshing account mappings:', error);
      throw error;
    }
  }

  /**
   * Map a symbol to broker-specific format for a given account
   * @param {string} symbol - Symbol to map
   * @param {string} accountId - MetaAPI account ID
   * @returns {Promise<Object>} Mapped symbol response
   */
  async mapSymbol(symbol, accountId) {
    try {
      const response = await fetch(`${this.baseURL}/map`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          symbol: symbol,
          account_id: accountId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error mapping symbol:', error);
      throw error;
    }
  }

  /**
   * Check if a symbol is available on a specific account
   * @param {string} symbol - Symbol to check
   * @param {string} accountId - MetaAPI account ID
   * @returns {Promise<Object>} Availability response
   */
  async checkSymbolAvailability(symbol, accountId) {
    try {
      const response = await fetch(`${this.baseURL}/availability`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          symbol: symbol,
          account_id: accountId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking symbol availability:', error);
      throw error;
    }
  }

  /**
   * Get available symbols for a list of accounts
   * @param {Array<string>} accountIds - List of MetaAPI account IDs
   * @returns {Promise<Object>} Available symbols response
   */
  async getAvailableSymbols(accountIds) {
    try {
      const response = await fetch(`${this.baseURL}/available-symbols`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          account_ids: accountIds
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting available symbols:', error);
      throw error;
    }
  }

  /**
   * Get symbol mappings for a specific account
   * @param {string} accountId - MetaAPI account ID
   * @returns {Promise<Object>} Symbol mappings response
   */
  async getSymbolMappings(accountId) {
    try {
      const response = await fetch(`${this.baseURL}/mappings/${accountId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting symbol mappings:', error);
      throw error;
    }
  }

  /**
   * Create a new symbol mapping
   * @param {string} accountId - MetaAPI account ID
   * @param {string} standardSymbol - Standard symbol
   * @param {string} brokerSymbol - Broker-specific symbol
   * @returns {Promise<Object>} Create mapping response
   */
  async createSymbolMapping(accountId, standardSymbol, brokerSymbol) {
    try {
      const response = await fetch(`${this.baseURL}/mappings`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          account_id: accountId,
          standard_symbol: standardSymbol,
          broker_symbol: brokerSymbol
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating symbol mapping:', error);
      throw error;
    }
  }

  /**
   * Update an existing symbol mapping
   * @param {string} mappingId - Mapping ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Update mapping response
   */
  async updateSymbolMapping(mappingId, updates) {
    try {
      const response = await fetch(`${this.baseURL}/mappings/${mappingId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating symbol mapping:', error);
      throw error;
    }
  }

  /**
   * Delete a symbol mapping
   * @param {string} mappingId - Mapping ID
   * @returns {Promise<Object>} Delete mapping response
   */
  async deleteSymbolMapping(mappingId) {
    try {
      const response = await fetch(`${this.baseURL}/mappings/${mappingId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting symbol mapping:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const symbolMappingService = new SymbolMappingService();
export default symbolMappingService;
