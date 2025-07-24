/**
 * TradingView Chart Diagnostic Tools
 * Use these functions to troubleshoot chart loading and rendering issues
 */

/**
 * Check if TradingView script is properly loaded
 * @returns {boolean} Whether TradingView global object exists
 */
export const isTradingViewLoaded = () => {
  return typeof window !== 'undefined' && typeof window.TradingView !== 'undefined';
};

/**
 * Check for common chart loading errors
 * @returns {object} Object containing error diagnostics
 */
export const diagnoseTradingViewChart = () => {
  const diagnostics = {
    scriptLoaded: false,
    containerExists: false,
    widgetIdExists: false,
    errors: [],
  };
  
  // Check if TradingView script is loaded
  if (typeof window !== 'undefined') {
    diagnostics.scriptLoaded = typeof window.TradingView !== 'undefined';
    
    if (!diagnostics.scriptLoaded) {
      diagnostics.errors.push('TradingView script not loaded. Check network requests for errors.');
    }
    
    // Check DOM elements
    const containers = document.querySelectorAll('.tradingview-widget-container');
    diagnostics.containerExists = containers.length > 0;
    
    if (!diagnostics.containerExists) {
      diagnostics.errors.push('Chart container not found in DOM.');
    }
    
    // Check for widget IDs
    const widgetElements = document.querySelectorAll('[id^="tradingview_"]');
    diagnostics.widgetIdExists = widgetElements.length > 0;
    
    if (!diagnostics.widgetIdExists) {
      diagnostics.errors.push('TradingView widget ID element not found.');
    }
    
    // Check console for errors
    if (window.console && window.console.memory) {
      const memoryUsage = window.console.memory;
      diagnostics.memoryUsage = {
        totalJSHeapSize: memoryUsage.totalJSHeapSize,
        usedJSHeapSize: memoryUsage.usedJSHeapSize,
        jsHeapSizeLimit: memoryUsage.jsHeapSizeLimit
      };
    }
  } else {
    diagnostics.errors.push('Window object not available - running in a non-browser environment.');
  }
  
  return diagnostics;
};

/**
 * Creates a minimal test chart to verify TradingView works
 * @param {string} containerId - ID of container to render chart in
 * @returns {Promise} Resolves when chart is created or fails
 */
export const createTestChart = (containerId) => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject('Not running in browser environment');
      return;
    }
    
    const container = document.getElementById(containerId);
    if (!container) {
      reject(`Container with ID ${containerId} not found`);
      return;
    }
    
    // Load TradingView script if needed
    if (typeof window.TradingView === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      
      script.onload = () => {
        createWidget(container, resolve, reject);
      };
      
      script.onerror = () => {
        reject('Failed to load TradingView script');
      };
      
      document.head.appendChild(script);
    } else {
      createWidget(container, resolve, reject);
    }
  });
};

/**
 * Helper function to create a minimal widget
 */
function createWidget(container, resolve, reject) {
  try {
    const widget = new window.TradingView.widget({
      container_id: container.id,
      symbol: 'NASDAQ:AAPL',
      interval: 'D',
      theme: 'dark',
      style: '1',
      width: '100%',
      height: '400',
      locale: 'en',
      toolbar_bg: '#f1f3f6',
      enable_publishing: false,
      hide_top_toolbar: false,
      save_image: false,
      hide_volume: true,
    });
    
    widget.onChartReady(() => {
      resolve({
        success: true,
        widget: widget
      });
    });
    
    // Safety timeout
    setTimeout(() => {
      if (container.querySelector('iframe')) {
        resolve({
          success: true,
          note: 'Chart iframe found, but onChartReady may not have fired'
        });
      } else {
        reject('Chart failed to render within timeout period');
      }
    }, 10000);
  } catch (error) {
    reject(`Error creating TradingView widget: ${error.message}`);
  }
}

/**
 * Report on browser compatibility with TradingView
 * @returns {object} Browser compatibility report
 */
export const checkBrowserCompatibility = () => {
  if (typeof window === 'undefined') {
    return { compatible: false, reason: 'Not running in browser environment' };
  }
  
  const compatibility = {
    compatible: true,
    issues: [],
    browserInfo: {}
  };
  
  // Get browser info
  const userAgent = window.navigator.userAgent;
  compatibility.browserInfo.userAgent = userAgent;
  
  // Check for WebGL support (needed for optimal chart performance)
  try {
    const canvas = document.createElement('canvas');
    const hasWebGL = !!(window.WebGLRenderingContext && 
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    
    compatibility.browserInfo.hasWebGL = hasWebGL;
    
    if (!hasWebGL) {
      compatibility.compatible = false;
      compatibility.issues.push('WebGL not supported - chart performance may be degraded');
    }
  } catch (e) {
    compatibility.browserInfo.hasWebGL = false;
    compatibility.compatible = false;
    compatibility.issues.push('Error checking WebGL support');
  }
  
  // Check for localStorage (needed for settings persistence)
  try {
    compatibility.browserInfo.hasLocalStorage = !!window.localStorage;
    
    if (!compatibility.browserInfo.hasLocalStorage) {
      compatibility.issues.push('localStorage not available - chart settings will not persist');
    }
  } catch (e) {
    compatibility.browserInfo.hasLocalStorage = false;
    compatibility.issues.push('Error checking localStorage support');
  }
  
  // Check if running in a mobile browser
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  compatibility.browserInfo.isMobile = isMobile;
  
  if (isMobile) {
    compatibility.issues.push('Running on mobile device - consider using mobile-optimized chart settings');
  }
  
  return compatibility;
};
