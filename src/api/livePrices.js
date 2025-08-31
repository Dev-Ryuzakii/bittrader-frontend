/**
 * Live Price Feed API Service
 * Integrates with BitTrader backend for real-time price updates
 */

class LivePriceFeed {
  constructor() {
    this.baseURL = 'http://api.tradexas.com/api/v1';
    this.wsURL = 'ws://api.tradexas.com/ws/prices';
    this.priceCache = new Map();
    this.lastUpdate = 0;
    this.updateInterval = 2000; // 2 seconds
    this.ws = null;
    this.subscribers = new Map(); // For component subscriptions
  }

  /**
   * Get authentication headers
   */
  getHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': token || '',
      'Content-Type': 'application/json'
    };
  }

  /**
   * Get single symbol price with broker symbol mapping
   * @param {string} symbol - Trading symbol (e.g., 'EURUSD' or 'eurusd')
   * @param {string} accountId - Broker account ID
   * @returns {Promise<Object>} Price data
   */
  async getSinglePrice(symbol, accountId) {
    try {
      // Normalize symbol to uppercase for consistency
      const normalizedSymbol = symbol.toString().trim().toUpperCase();
      
      // First try with the normalized symbol
      let response = await fetch(`${this.baseURL}/broker/${accountId}/price/${normalizedSymbol}`, {
        headers: this.getHeaders()
      });

      let workingSymbol = normalizedSymbol;

      // If it fails with 400 (symbol not found), try common broker variations
      if (!response.ok && response.status === 400) {
        console.log(`Symbol ${normalizedSymbol} not found, trying broker variations...`);
        
        const variations = this.generateSymbolVariations(normalizedSymbol);
        
        for (const variation of variations) {
          try {
            console.log(`Trying variation: ${variation} (length: ${variation.length})`);
            const url = `${this.baseURL}/broker/${accountId}/price/${variation}`;
            console.log(`Full URL: ${url}`);
            response = await fetch(url, {
              headers: this.getHeaders()
            });
            
            if (response.ok) {
              console.log(`✓ Found working symbol variation: ${variation} for ${normalizedSymbol}`);
              workingSymbol = variation;
              break;
            }
          } catch (variationError) {
            console.log(`✗ Failed variation: ${variation}`);
            continue;
          }
        }
      }

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error(`Symbol "${normalizedSymbol}" not available on this broker. Try: ${this.generateSymbolVariations(normalizedSymbol).slice(0, 3).join(', ')}`);
        } else {
          throw new Error(`Failed to fetch price for ${normalizedSymbol}: ${response.statusText}`);
        }
      }

      const priceData = await response.json();
      
      // Cache the price with both original and working symbols
      const cachedData = {
        ...priceData,
        symbol: normalizedSymbol, // Keep normalized symbol for UI consistency
        broker_symbol: workingSymbol, // The actual symbol that worked
        timestamp: Date.now()
      };

      this.priceCache.set(normalizedSymbol, cachedData);
      this.priceCache.set(workingSymbol, cachedData); // Also cache with broker symbol

      return {
        ...priceData,
        symbol: normalizedSymbol,
        broker_symbol: workingSymbol,
        success: true
      };
    } catch (error) {
      console.error('Single price fetch error:', error);
      throw error;
    }
  }

  /**
   * Generate common broker symbol variations
   * @param {string} baseSymbol - Base symbol (e.g., 'EURUSD')
   * @returns {Array<string>} Array of symbol variations to try
   */
  generateSymbolVariations(baseSymbol) {
    if (!baseSymbol || baseSymbol.length < 3) {
      console.log(`Invalid baseSymbol: "${baseSymbol}", length: ${baseSymbol?.length}`);
      return [];
    }

    const base = baseSymbol.toString().trim().toUpperCase();
    console.log(`Generating variations for: "${baseSymbol}" -> normalized: "${base}"`);
    const variations = [];
    
    // Start with just the most common suffixes to reduce noise
    const commonSuffixes = ['m', 's', 'c', 'pro'];
    
    // Try suffixes first (most likely to work)
    commonSuffixes.forEach(suffix => {
      const variation = base + suffix;
      variations.push(variation);
      console.log(`Added variation: ${variation}`);
    });
    
    // Add a few common prefixes
    const prefixes = ['#', '.'];
    prefixes.forEach(prefix => {
      const variation = prefix + base;
      variations.push(variation);
      console.log(`Added variation: ${variation}`);
    });
    
    // Specific crypto handling for BTC symbols
    if (base.includes('BTC')) {
      variations.push(base.replace('BTC', 'XBT')); // Some brokers use XBT
      variations.push(base + 'USD');   // Add USD if missing
      variations.push(base + 'f');     // Futures
      console.log(`Added crypto variations for ${base}`);
    }
    
    // Remove duplicates and filter out empty strings
    const uniqueVariations = [...new Set(variations)].filter(v => v && v.length > 0 && v !== base);
    
    console.log(`Final ${uniqueVariations.length} variations for ${base}:`, uniqueVariations);
    
    return uniqueVariations;
  }

  /**
   * Get multiple symbol prices at once
   * @param {Array<string>} symbols - Array of symbols
   * @param {string} accountId - Broker account ID
   * @returns {Promise<Object>} Bulk price data
   */
  async getMultiplePrices(symbols, accountId) {
    try {
      const symbolsParam = symbols.join(',');
      const response = await fetch(`${this.baseURL}/broker/${accountId}/prices?symbols=${symbolsParam}`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache successful prices
      if (data.prices) {
        data.prices.forEach(price => {
          if (price.success) {
            this.priceCache.set(price.symbol, {
              ...price,
              timestamp: Date.now()
            });
          }
        });
      }

      return data;
    } catch (error) {
      console.error('Multiple prices fetch error:', error);
      throw error;
    }
  }

  /**
   * Get spread price between two symbols
   * @param {string} symbol1 - First symbol
   * @param {string} symbol2 - Second symbol
   * @param {string} accountId - Broker account ID
   * @returns {Promise<Object>} Spread price data
   */
  async getSpreadPrice(symbol1, symbol2, accountId) {
    try {
      const response = await fetch(`${this.baseURL}/broker/${accountId}/spread-price/${symbol1}/${symbol2}`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch spread price: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Spread price fetch error:', error);
      throw error;
    }
  }

  /**
   * Setup WebSocket connection for real-time price streaming
   * @param {Array<string>} symbols - Symbols to subscribe to
   * @param {string} accountId - Broker account ID
   * @param {Function} onPriceUpdate - Callback for price updates
   * @returns {Promise<WebSocket>} WebSocket connection
   */
  async setupWebSocketStream(symbols, accountId, onPriceUpdate) {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsURL);

        this.ws.onopen = () => {
          console.log('📡 Connected to live price stream');
          
          // Subscribe to symbols
          this.ws.send(JSON.stringify({
            action: 'subscribe',
            symbols: symbols,
            account_id: accountId
          }));

          resolve(this.ws);
        };

        this.ws.onmessage = (event) => {
          try {
            const priceData = JSON.parse(event.data);
            
            // Cache the price update
            this.priceCache.set(priceData.symbol, {
              ...priceData,
              timestamp: Date.now()
            });

            // Notify callback
            if (onPriceUpdate) {
              onPriceUpdate(priceData);
            }

            // Notify subscribers
            this.notifySubscribers(priceData);
          } catch (parseError) {
            console.error('Error parsing WebSocket message:', parseError);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('📡 Price stream disconnected');
          // Auto-reconnect after 5 seconds
          setTimeout(() => {
            if (symbols.length > 0) {
              this.setupWebSocketStream(symbols, accountId, onPriceUpdate);
            }
          }, 5000);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Setup price stream subscription (hybrid approach)
   * @param {string} accountId - Broker account ID
   * @param {Array<string>} symbols - Symbols to subscribe to
   * @returns {Promise<string>} Connection ID for updates
   */
  async setupPriceSubscription(accountId, symbols) {
    try {
      const response = await fetch(`${this.baseURL}/broker/${accountId}/prices/stream`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ symbols })
      });

      if (!response.ok) {
        throw new Error(`Failed to setup price subscription: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache initial prices
      if (data.initial_prices) {
        data.initial_prices.forEach(price => {
          this.priceCache.set(price.symbol, {
            ...price,
            timestamp: Date.now()
          });
        });
      }

      return data.connection_id;
    } catch (error) {
      console.error('Price subscription setup error:', error);
      throw error;
    }
  }

  /**
   * Get price updates for subscription
   * @param {string} accountId - Broker account ID
   * @param {string} connectionId - Connection ID from subscription
   * @returns {Promise<Array>} Price updates
   */
  async getPriceUpdates(accountId, connectionId) {
    try {
      const response = await fetch(`${this.baseURL}/broker/${accountId}/prices/updates/${connectionId}`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get price updates: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache price updates
      if (data.prices) {
        data.prices.forEach(price => {
          this.priceCache.set(price.symbol, {
            ...price,
            timestamp: Date.now()
          });
        });
      }

      return data.prices || [];
    } catch (error) {
      console.error('Price updates fetch error:', error);
      throw error;
    }
  }

  /**
   * Get popular symbols with live prices
   * @returns {Promise<Array>} Popular symbols with prices
   */
  async getPopularSymbols() {
    try {
      const response = await fetch(`${this.baseURL}/symbols/fast?limit=20`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch popular symbols: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Popular symbols fetch error:', error);
      throw error;
    }
  }

  /**
   * Get available symbols for a specific account
   * @param {string} accountId - Broker account ID
   * @returns {Promise<Array>} Available symbols
   */
  async getAccountSymbols(accountId) {
    try {
      const response = await fetch(`${this.baseURL}/broker/${accountId}/symbols`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch account symbols: ${response.statusText}`);
      }

      const data = await response.json();
      return data.symbols || [];
    } catch (error) {
      console.error('Account symbols fetch error:', error);
      throw error;
    }
  }

  /**
   * Search symbols available on a specific account
   * @param {string} query - Search term
   * @param {string} accountId - Broker account ID
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} Symbol search results
   */
  async searchAccountSymbols(query, accountId, limit = 20) {
    try {
      const response = await fetch(`${this.baseURL}/symbols/search?q=${encodeURIComponent(query)}&account_id=${accountId}&limit=${limit}`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to search account symbols: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Account symbol search error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to price updates for a component
   * @param {string} componentId - Unique component identifier
   * @param {Function} callback - Callback function for price updates
   */
  subscribe(componentId, callback) {
    this.subscribers.set(componentId, callback);
  }

  /**
   * Unsubscribe from price updates
   * @param {string} componentId - Component identifier
   */
  unsubscribe(componentId) {
    this.subscribers.delete(componentId);
  }

  /**
   * Notify all subscribers of price updates
   * @param {Object} priceData - Price update data
   */
  notifySubscribers(priceData) {
    this.subscribers.forEach(callback => {
      try {
        callback(priceData);
      } catch (error) {
        console.error('Error notifying price subscriber:', error);
      }
    });
  }

  /**
   * Get cached price if available and fresh
   * @param {string} symbol - Trading symbol
   * @param {number} maxAge - Maximum age in milliseconds (default: 5 seconds)
   * @returns {Object|null} Cached price data or null
   */
  getCachedPrice(symbol, maxAge = 5000) {
    const cached = this.priceCache.get(symbol);
    if (cached && (Date.now() - cached.timestamp) < maxAge) {
      return cached;
    }
    return null;
  }

  /**
   * Start polling for price updates
   * @param {Array<string>} symbols - Symbols to poll
   * @param {string} accountId - Broker account ID
   * @param {number} interval - Polling interval in milliseconds
   * @returns {number} Interval ID for stopping
   */
  startPolling(symbols, accountId, interval = 2000) {
    return setInterval(async () => {
      try {
        await this.getMultiplePrices(symbols, accountId);
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, interval);
  }

  /**
   * Stop polling
   * @param {number} intervalId - Interval ID from startPolling
   */
  stopPolling(intervalId) {
    if (intervalId) {
      clearInterval(intervalId);
    }
  }

  /**
   * Close WebSocket connection
   */
  closeWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Clear price cache
   */
  clearCache() {
    this.priceCache.clear();
  }

  /**
   * Get all cached prices
   * @returns {Map} All cached prices
   */
  getAllCachedPrices() {
    return new Map(this.priceCache);
  }
}

// Create singleton instance
const livePriceFeed = new LivePriceFeed();

export default livePriceFeed;

// Named exports for convenience
export {
  LivePriceFeed,
  livePriceFeed
};

// Convenience wrapper functions
export const getSinglePrice = (symbol, accountId) => livePriceFeed.getSinglePrice(symbol, accountId);
export const getMultiplePrices = (symbols, accountId) => livePriceFeed.getMultiplePrices(symbols, accountId);
export const getSpreadPrice = (symbol1, symbol2, accountId) => livePriceFeed.getSpreadPrice(symbol1, symbol2, accountId);
export const setupPriceStream = (symbols, accountId, onPriceUpdate) => livePriceFeed.setupWebSocketStream(symbols, accountId, onPriceUpdate);
export const setupPriceSubscription = (accountId, symbols) => livePriceFeed.setupPriceSubscription(accountId, symbols);
export const getPriceUpdates = (accountId, connectionId) => livePriceFeed.getPriceUpdates(accountId, connectionId);
export const getPopularSymbolsWithPrices = () => livePriceFeed.getPopularSymbols();
export const searchSymbolsWithPrices = (query, limit) => livePriceFeed.searchSymbols(query, limit);
export const getAccountSymbols = (accountId) => livePriceFeed.getAccountSymbols(accountId);
export const searchAccountSymbols = (query, accountId, limit) => livePriceFeed.searchAccountSymbols(query, accountId, limit);
export const getCachedPrice = (symbol, maxAge) => livePriceFeed.getCachedPrice(symbol, maxAge);
export const startPolling = (symbols, accountId, interval) => livePriceFeed.startPolling(symbols, accountId, interval);
export const stopPolling = (intervalId) => livePriceFeed.stopPolling(intervalId);
export const subscribeToPrices = (componentId, callback) => livePriceFeed.subscribe(componentId, callback);
export const unsubscribeFromPrices = (componentId) => livePriceFeed.unsubscribe(componentId);
export const clearPriceCache = () => livePriceFeed.clearCache();
export const getAllCachedPrices = () => livePriceFeed.getAllCachedPrices();
