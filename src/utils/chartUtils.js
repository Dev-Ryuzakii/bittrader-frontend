/**
 * Chart Utilities for Bittrader Frontend
 * This file contains helper functions for the TradingView chart integration
 */

/**
 * Maps internal symbol names to TradingView-compatible symbols
 * @param {string} internalSymbol - The internal symbol name
 * @returns {string} - TradingView compatible symbol
 */
export const mapToTradingViewSymbol = (internalSymbol) => {
  const symbolMappings = {
    // Forex pairs
    'EURUSD': 'FX:EURUSD',
    'GBPUSD': 'FX:GBPUSD',
    'USDJPY': 'FX:USDJPY',
    'USDCAD': 'FX:USDCAD',
    'AUDUSD': 'FX:AUDUSD',
    'NZDUSD': 'FX:NZDUSD',
    'EURJPY': 'FX:EURJPY',
    'GBPJPY': 'FX:GBPJPY',
    'EURGBP': 'FX:EURGBP',
    'USDCHF': 'FX:USDCHF',
    'AUDCAD': 'FX:AUDCAD',
    'AUDCHF': 'FX:AUDCHF',
    'AUDJPY': 'FX:AUDJPY',
    'AUDNZD': 'FX:AUDNZD',
    'CADCHF': 'FX:CADCHF',
    'CADJPY': 'FX:CADJPY',
    'CHFJPY': 'FX:CHFJPY',
    'EURAUD': 'FX:EURAUD',
    'EURCAD': 'FX:EURCAD',
    'EURCHF': 'FX:EURCHF',
    'EURNZD': 'FX:EURNZD',
    'GBPAUD': 'FX:GBPAUD',
    'GBPCAD': 'FX:GBPCAD',
    'GBPCHF': 'FX:GBPCHF',
    'GBPNZD': 'FX:GBPNZD',
    'NZDCAD': 'FX:NZDCAD',
    'NZDCHF': 'FX:NZDCHF',
    'NZDJPY': 'FX:NZDJPY',
    
    // Commodities
    'XAUUSD': 'TVC:GOLD',
    'XAGUSD': 'TVC:SILVER',
    'USOIL': 'TVC:USOIL',
    'UKOIL': 'TVC:UKOIL',
    'NATGAS': 'TVC:NATURALGAS',
    
    // Crypto
    'BTCUSD': 'BINANCE:BTCUSDT',
    'ETHUSD': 'BINANCE:ETHUSDT',
    'ADAUSD': 'BINANCE:ADAUSDT',
    'DOTUSD': 'BINANCE:DOTUSDT',
    'LINKUSD': 'BINANCE:LINKUSDT',
    'LTCUSD': 'BINANCE:LTCUSDT',
    'XLMUSD': 'BINANCE:XLMUSDT',
    'XRPUSD': 'BINANCE:XRPUSDT',
    
    // Major Indices
    'SPX500': 'TVC:SPX',
    'US30': 'TVC:DJI',
    'NAS100': 'TVC:IXIC',
    'GER40': 'TVC:DAX',
    'UK100': 'TVC:UKX',
    'JPN225': 'TVC:NI225',
    'AUS200': 'TVC:AS51',
    
    // Major Stocks
    'AAPL': 'NASDAQ:AAPL',
    'MSFT': 'NASDAQ:MSFT',
    'GOOGL': 'NASDAQ:GOOGL',
    'AMZN': 'NASDAQ:AMZN',
    'TSLA': 'NASDAQ:TSLA',
    'META': 'NASDAQ:META',
    'NVDA': 'NASDAQ:NVDA',
    'NFLX': 'NASDAQ:NFLX',
  };
  
  return symbolMappings[internalSymbol] || `FX:${internalSymbol}`;
};

/**
 * Maps intervals between internal format and TradingView format
 * @param {string} interval - Internal interval format
 * @returns {string} - TradingView compatible interval
 */
export const mapInterval = (interval) => {
  const intervalMap = {
    '1m': '1',
    '5m': '5',
    '15m': '15',
    '30m': '30',
    '1h': '60',
    '4h': '240',
    '1d': 'D',
    '1w': 'W',
    '1M': 'M'
  };
  
  return intervalMap[interval] || interval;
};

/**
 * Generates chart settings optimized for different screen sizes
 * @param {string} screenSize - 'mobile', 'tablet', or 'desktop'
 * @param {string} theme - 'light' or 'dark' 
 * @returns {Object} - Chart configuration object
 */
export const getChartSettings = (screenSize = 'desktop', theme = 'dark') => {
  const baseSettings = {
    theme: theme,
    backgroundColor: theme === 'dark' ? "#131722" : "#ffffff",
    gridColor: theme === 'dark' ? "#363c4e" : "#e1e3e6",
    upColor: "#26a69a",
    downColor: "#ef5350",
  };
  
  const screenSizeSettings = {
    'mobile': {
      showToolbar: false,
      showVolumeProfile: false,
      height: 400,
      disabledFeatures: ['left_toolbar', 'header_compare', 'header_settings']
    },
    'tablet': {
      showToolbar: true,
      showVolumeProfile: false,
      height: 500,
      disabledFeatures: []
    },
    'desktop': {
      showToolbar: true,
      showVolumeProfile: true,
      height: 600,
      disabledFeatures: []
    }
  };
  
  return {
    ...baseSettings,
    ...screenSizeSettings[screenSize]
  };
};

/**
 * Helper to communicate between TradingView chart and your trading platform
 * @param {Object} chart - TradingView chart instance
 * @param {Function} onOrderCallback - Callback when order is placed from chart
 */
export const connectChartToTrading = (chart, onOrderCallback) => {
  // This would require integration with the TradingView Charting Library
  // rather than the widget. This is a placeholder for future implementation.
  console.log('Chart to trading connection ready');
  
  // When fully implemented, this would:
  // 1. Subscribe to chart events
  // 2. Handle order placement from chart
  // 3. Sync positions and orders with the chart
  
  return {
    // Methods to sync orders, positions, and account info with the chart
    syncPositions: (positions) => {
      console.log('Syncing positions with chart', positions);
      // Implementation would go here when using the full library
    },
    
    syncOrders: (orders) => {
      console.log('Syncing orders with chart', orders);
      // Implementation would go here when using the full library
    }
  };
};

/**
 * Available studies/indicators that can be applied to the chart
 */
export const availableIndicators = [
  { name: 'Moving Average', code: 'MA' },
  { name: 'Exponential Moving Average', code: 'EMA' },
  { name: 'MACD', code: 'MACD' },
  { name: 'Relative Strength Index', code: 'RSI' },
  { name: 'Bollinger Bands', code: 'BB' },
  { name: 'Ichimoku Cloud', code: 'IC' },
  { name: 'Average True Range', code: 'ATR' },
  { name: 'Volume', code: 'VOL' },
  { name: 'On Balance Volume', code: 'OBV' },
  { name: 'Stochastic', code: 'STO' },
  { name: 'Commodity Channel Index', code: 'CCI' },
  { name: 'Williams %R', code: 'WPR' },
  { name: 'Fibonacci Retracement', code: 'FIB' },
  { name: 'Volume Profile', code: 'VP' }
];
