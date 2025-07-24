import React, { useState } from 'react';
import AdvancedTradingViewChart from '../UI/AdvancedTradingViewChart';
import { mapInterval, mapToTradingViewSymbol, getChartSettings, availableIndicators } from '../../utils/chartUtils';

const ChartDemoPage = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD');
  const [selectedInterval, setSelectedInterval] = useState('D');
  const [chartTheme, setChartTheme] = useState('dark');
  const [showVolumeProfile, setShowVolumeProfile] = useState(true);
  
  // Symbol categories for demonstration
  const symbolCategories = {
    'Forex Majors': ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD'],
    'Crypto': ['BTCUSD', 'ETHUSD', 'ADAUSD'],
    'Commodities': ['XAUUSD', 'USOIL', 'NATGAS'],
    'Indices': ['SPX500', 'NAS100', 'UK100'],
    'Stocks': ['AAPL', 'TSLA', 'MSFT']
  };
  
  // Available timeframes
  const timeframes = [
    { label: '1 Minute', value: '1' },
    { label: '5 Minutes', value: '5' },
    { label: '15 Minutes', value: '15' },
    { label: '30 Minutes', value: '30' },
    { label: '1 Hour', value: '60' },
    { label: '4 Hours', value: '240' },
    { label: 'Daily', value: 'D' },
    { label: 'Weekly', value: 'W' },
    { label: 'Monthly', value: 'M' }
  ];
  
  // Handle symbol selection
  const handleSymbolChange = (symbol) => {
    setSelectedSymbol(symbol);
  };
  
  // Optional: Sample function to apply an indicator to the chart
  // Note: This would require the full TradingView library to work dynamically
  const applyIndicator = (indicator) => {
    console.log(`Would apply ${indicator.name} to chart`);
    // This is where you would interact with the TradingView chart's API
    // if you were using the full library rather than the widget
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-white">Advanced TradingView Chart Demo</h1>
      
      {/* Chart Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Symbol Selector */}
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
          <select 
            value={selectedSymbol}
            onChange={(e) => handleSymbolChange(e.target.value)}
            className="bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-lg px-3 py-2 w-full"
          >
            {Object.entries(symbolCategories).map(([category, symbols]) => (
              <optgroup key={category} label={category}>
                {symbols.map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        
        {/* Timeframe Selector */}
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium text-gray-300 mb-2">Timeframe</label>
          <select 
            value={selectedInterval}
            onChange={(e) => setSelectedInterval(e.target.value)}
            className="bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-lg px-3 py-2 w-full"
          >
            {timeframes.map(tf => (
              <option key={tf.value} value={tf.value}>{tf.label}</option>
            ))}
          </select>
        </div>
        
        {/* Theme Toggle */}
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium text-gray-300 mb-2">Theme</label>
          <div className="flex gap-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={chartTheme === 'dark'}
                onChange={() => setChartTheme('dark')}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-white">Dark</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={chartTheme === 'light'}
                onChange={() => setChartTheme('light')}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-white">Light</span>
            </label>
          </div>
        </div>
        
        {/* Volume Profile Toggle */}
        <div className="w-full md:w-auto flex items-end">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={showVolumeProfile}
              onChange={() => setShowVolumeProfile(!showVolumeProfile)}
              className="form-checkbox h-4 w-4 text-blue-600"
            />
            <span className="ml-2 text-white">Show Volume Profile</span>
          </label>
        </div>
      </div>
      
      {/* Technical Indicators */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-white mb-2">Available Indicators</h3>
        <div className="flex flex-wrap gap-2">
          {availableIndicators.slice(0, 8).map(indicator => (
            <button
              key={indicator.code}
              onClick={() => applyIndicator(indicator)}
              className="bg-[#1A1A1A] border border-[#2A2A2A] hover:bg-[#2A2A2A] text-gray-300 px-3 py-1 rounded-lg text-sm"
            >
              {indicator.name}
            </button>
          ))}
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm">
            + More
          </button>
        </div>
      </div>
      
      {/* Advanced TradingView Chart */}
      <div className="mb-6">
        <AdvancedTradingViewChart 
          symbol={selectedSymbol}
          theme={chartTheme}
          height={650}
          interval={selectedInterval}
          showToolbar={true}
          showVolumeProfile={showVolumeProfile}
          enableTrading={true}
          onSymbolChange={handleSymbolChange}
        />
      </div>
      
      {/* Chart Information */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4 mb-6">
        <h3 className="text-lg font-medium text-white mb-2">Current Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
          <div>
            <p><strong>Symbol:</strong> {selectedSymbol}</p>
            <p><strong>TradingView Symbol:</strong> {mapToTradingViewSymbol(selectedSymbol)}</p>
            <p><strong>Timeframe:</strong> {selectedInterval}</p>
          </div>
          <div>
            <p><strong>Theme:</strong> {chartTheme}</p>
            <p><strong>Volume Profile:</strong> {showVolumeProfile ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
      </div>
      
      {/* Usage Information */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">
        <h3 className="text-lg font-medium text-white mb-2">How to Use the Chart</h3>
        <ul className="list-disc pl-5 text-gray-300 space-y-1">
          <li>Click and drag to move the chart</li>
          <li>Use the mouse wheel to zoom in and out</li>
          <li>Right-click for additional options</li>
          <li>Use the toolbar above the chart to add indicators and drawing tools</li>
          <li>Change timeframes using the timeframe selector</li>
          <li>Access additional features by clicking the three dots in the top right corner</li>
        </ul>
      </div>
    </div>
  );
};

export default ChartDemoPage;
