// TradingView Chart-to-Trade Synchronization Utility
// This utility enables seamless sync between TradingView charts and the trading interface

class TradingViewSync {
  constructor() {
    this.isListening = false;
    this.currentSymbol = null;
    this.callbacks = new Set();
    this.urlWatcher = null;
  }

  /**
   * Initialize TradingView synchronization
   * Monitors URL changes and dispatches symbol change events
   */
  initialize() {
    if (this.isListening) return;

    this.isListening = true;
    this.startUrlMonitoring();
    this.setupMessageListeners();
    this.injectTradingViewScript();
  }

  /**
   * Stop TradingView synchronization
   */
  destroy() {
    this.isListening = false;
    this.stopUrlMonitoring();
    this.callbacks.clear();
  }

  /**
   * Register a callback for symbol changes
   * @param {Function} callback - Function to call when symbol changes
   */
  onSymbolChange(callback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Update the current symbol and notify all callbacks
   * @param {string} symbol - The new symbol
   */
  updateSymbol(symbol) {
    if (symbol && symbol !== this.currentSymbol) {
      this.currentSymbol = symbol;
      this.notifyCallbacks(symbol);
      this.updateTradingViewChart(symbol);
    }
  }

  /**
   * Get the current symbol from URL or TradingView
   * @returns {string|null} Current symbol or null
   */
  getCurrentSymbol() {
    // Try to extract from URL first
    const urlSymbol = this.extractSymbolFromUrl();
    if (urlSymbol) return urlSymbol;

    // Try to get from TradingView widget if available
    return this.getTradingViewSymbol() || this.currentSymbol;
  }

  /**
   * Monitor URL changes for TradingView symbol updates
   */
  startUrlMonitoring() {
    this.urlWatcher = setInterval(() => {
      const symbol = this.extractSymbolFromUrl();
      if (symbol && symbol !== this.currentSymbol) {
        this.updateSymbol(symbol);
      }
    }, 1000);
  }

  /**
   * Stop URL monitoring
   */
  stopUrlMonitoring() {
    if (this.urlWatcher) {
      clearInterval(this.urlWatcher);
      this.urlWatcher = null;
    }
  }

  /**
   * Extract symbol from current URL
   * Supports TradingView URL patterns
   */
  extractSymbolFromUrl() {
    const url = window.location.href;
    
    // TradingView patterns
    const patterns = [
      /tradingview\.com\/chart\/.*?\/([A-Z0-9]+)/i,
      /tradingview\.com\/.*?symbol=([A-Z0-9]+)/i,
      /[?&]symbol=([A-Z0-9]+)/i,
      /chart\/([A-Z0-9]+)/i
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return this.normalizeSymbol(match[1]);
      }
    }

    return null;
  }

  /**
   * Setup message listeners for TradingView widget communication
   */
  setupMessageListeners() {
    window.addEventListener('message', (event) => {
      if (!this.isListening) return;

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        if (data.type === 'symbol_change' && data.symbol) {
          this.updateSymbol(this.normalizeSymbol(data.symbol));
        }
      } catch (error) {
        // Ignore parsing errors for non-JSON messages
      }
    });
  }

  /**
   * Inject script to communicate with TradingView widget
   */
  injectTradingViewScript() {
    if (document.getElementById('tradingview-sync-script')) return;

    const script = document.createElement('script');
    script.id = 'tradingview-sync-script';
    script.innerHTML = `
      (function() {
        // Monitor TradingView widget symbol changes
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        
        function notifySymbolChange() {
          setTimeout(() => {
            try {
              // Try to get symbol from TradingView widget
              const symbol = window.tvWidget?.chart?.symbol() || 
                            window.TradingView?.widget?.chart?.symbol();
              
              if (symbol) {
                window.postMessage({
                  type: 'symbol_change',
                  symbol: symbol,
                  source: 'tradingview'
                }, '*');
              }
            } catch (e) {
              // Widget not available
            }
          }, 100);
        }
        
        history.pushState = function(...args) {
          originalPushState.apply(this, args);
          notifySymbolChange();
        };
        
        history.replaceState = function(...args) {
          originalReplaceState.apply(this, args);
          notifySymbolChange();
        };
        
        window.addEventListener('popstate', notifySymbolChange);
      })();
    `;
    
    document.head.appendChild(script);
  }

  /**
   * Update TradingView chart to show specified symbol
   * @param {string} symbol - Symbol to display
   */
  updateTradingViewChart(symbol) {
    try {
      // Try different methods to update TradingView chart
      if (window.tvWidget?.chart?.setSymbol) {
        window.tvWidget.chart.setSymbol(symbol);
      } else if (window.TradingView?.widget?.chart?.setSymbol) {
        window.TradingView.widget.chart.setSymbol(symbol);
      } else {
        // Fallback: update URL if possible
        const newUrl = this.buildTradingViewUrl(symbol);
        if (newUrl !== window.location.href) {
          window.history.pushState({}, '', newUrl);
        }
      }
    } catch (error) {
      //console.warn('Failed to update TradingView chart:', error);
    }
  }

  /**
   * Get current symbol from TradingView widget
   * @returns {string|null} Current symbol or null
   */
  getTradingViewSymbol() {
    try {
      return window.tvWidget?.chart?.symbol() || 
             window.TradingView?.widget?.chart?.symbol() || 
             null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Build TradingView URL for a symbol
   * @param {string} symbol - Symbol to build URL for
   * @returns {string} TradingView URL
   */
  buildTradingViewUrl(symbol) {
    const baseUrl = 'https://www.tradingview.com/chart/';
    return `${baseUrl}?symbol=${encodeURIComponent(symbol)}`;
  }

  /**
   * Normalize symbol format (remove broker prefixes, etc.)
   * @param {string} symbol - Raw symbol
   * @returns {string} Normalized symbol
   */
  normalizeSymbol(symbol) {
    if (!symbol) return symbol;

    // Remove broker prefixes (e.g., "FXCM:EURUSD" -> "EURUSD")
    const withoutPrefix = symbol.replace(/^[A-Z]+:/, '');
    
    // Convert to uppercase
    return withoutPrefix.toUpperCase();
  }

  /**
   * Notify all registered callbacks of symbol change
   * @param {string} symbol - New symbol
   */
  notifyCallbacks(symbol) {
    this.callbacks.forEach(callback => {
      try {
        callback(symbol);
      } catch (error) {
        //console.error('Error in symbol change callback:', error);
      }
    });
  }

  /**
   * Sync symbol from trading interface to TradingView
   * @param {string} symbol - Symbol to sync to TradingView
   */
  syncToTradingView(symbol) {
    this.updateTradingViewChart(symbol);
  }

  /**
   * Sync symbol from TradingView to trading interface
   */
  syncFromTradingView() {
    const symbol = this.getCurrentSymbol();
    if (symbol) {
      this.updateSymbol(symbol);
    }
  }
}

// Create singleton instance
const tradingViewSync = new TradingViewSync();

// Export for use in React components
export const useTradingViewSync = () => {
  return {
    initialize: () => tradingViewSync.initialize(),
    destroy: () => tradingViewSync.destroy(),
    onSymbolChange: (callback) => tradingViewSync.onSymbolChange(callback),
    updateSymbol: (symbol) => tradingViewSync.updateSymbol(symbol),
    getCurrentSymbol: () => tradingViewSync.getCurrentSymbol(),
    syncToTradingView: (symbol) => tradingViewSync.syncToTradingView(symbol),
    syncFromTradingView: () => tradingViewSync.syncFromTradingView()
  };
};

// Auto-initialize if TradingView is detected
if (typeof window !== 'undefined') {
  // Check if we're on TradingView or have TradingView widgets
  const isTradingViewContext = 
    window.location.hostname.includes('tradingview.com') ||
    document.querySelector('[id*="tradingview"]') ||
    window.TradingView;

  if (isTradingViewContext) {
    // Auto-initialize after a delay to ensure widgets are loaded
    setTimeout(() => {
      tradingViewSync.initialize();
    }, 2000);
  }
}

export default tradingViewSync;
