import React, { useState, useEffect } from 'react';
import { ChevronDown, ArrowUpDown, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import AdvancedTradingViewChart from './AdvancedTradingViewChart';
import { marketAPI, tradingAPI } from '../../api/api';

const TradingSection = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [selectedType, setSelectedType] = useState('Forex');
  const [selectedOrderType, setSelectedOrderType] = useState('Market');
  const [volume, setVolume] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [expiration, setExpiration] = useState('');
  const [currentPrice, setCurrentPrice] = useState(0);
  const [previousPrice, setPreviousPrice] = useState(0);
  const [price, setPrice] = useState(''); // For Limit and Stop orders
  const [currentAmount, setCurrentAmount] = useState(0);
  const [selectedTimeframe, setSelectedTimeframe] = useState('D');
  const [errors, setErrors] = useState({});
  const [orderStatus, setOrderStatus] = useState(null); // 'success', 'error', 'processing', null
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [buyOrSell, setBuyOrSell] = useState('Buy'); // Track whether we're buying or selling

  // Available symbols for dropdown with categories
  const symbolCategories = {
    'Forex Majors': [
      'EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'AUDUSD', 'NZDUSD',
      'EURJPY', 'GBPJPY', 'EURGBP'
    ],
    'Forex Crosses': [
      'AUDCAD', 'AUDCHF', 'AUDJPY', 'AUDNZD', 'CADCHF', 'CADJPY',
      'CHFJPY', 'EURAUD', 'EURCAD', 'EURCHF', 'EURNZD', 'GBPAUD',
      'GBPCAD', 'GBPCHF', 'GBPNZD', 'NZDCAD', 'NZDCHF', 'NZDJPY'
    ],
    'Commodities': [
      'XAUUSD', 'XAGUSD', 'USOIL', 'UKOIL', 'NATGAS'
    ],
    'Cryptocurrencies': [
      'BTCUSD', 'ETHUSD', 'ADAUSD', 'DOTUSD', 'LINKUSD', 
      'LTCUSD', 'XLMUSD', 'XRPUSD'
    ],
    'Indices': [
      'SPX500', 'US30', 'NAS100', 'GER40', 'UK100', 'JPN225', 'AUS200'
    ],
    'Stocks': [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'
    ]
  };

  // Flattened symbols array for simple selection
  const symbols = Object.values(symbolCategories).flat();

  const orderTypes = ['Market', 'Pending', 'Stop'];
  const limitTypes = ['Limit', 'Stop', 'Stop Limit'];

  // Set initial values if they're empty
  // Fetch current price when symbol changes
  const fetchCurrentPrice = async (symbol) => {
    if (!symbol) return;
    
    setIsLoadingPrice(true);
    try {
      const response = await marketAPI.getCurrentPrice(symbol);
      
      // Save previous price before updating
      setPreviousPrice(currentPrice);
      setCurrentPrice(response.price);
      
      // Set suggested stop loss and take profit based on current price
      if (response.price > 0) {
        // Only suggest if not already set by user
        if (!stopLoss) {
          const suggestedStopLoss = buyOrSell === 'Buy' ? 
            (response.price * 0.95).toFixed(2) : 
            (response.price * 1.05).toFixed(2);
        }
        
        if (!takeProfit) {
          const suggestedTakeProfit = buyOrSell === 'Buy' ? 
            (response.price * 1.05).toFixed(2) : 
            (response.price * 0.95).toFixed(2);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching current price:', error);
      }
      // Set a random price for demo purposes if API fails
      const mockPrice = Math.random() * 100 + 100;
      setPreviousPrice(currentPrice);
      setCurrentPrice(mockPrice);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  // Effect to initialize default values
  useEffect(() => {
    // Initialize with default values if none selected
    if (!selectedSymbol) {
      setSelectedSymbol('EURUSD');
    }
    
    // Set default timeframe if empty
    if (!selectedTimeframe) {
      setSelectedTimeframe('D');
    }
  }, []);
  
  // Fetch price when symbol changes
  useEffect(() => {
    if (selectedSymbol) {
      fetchCurrentPrice(selectedSymbol);
      
      // Set up interval for price updates
      const interval = setInterval(() => {
        fetchCurrentPrice(selectedSymbol);
      }, 10000); // Update every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [selectedSymbol]);
  
  // Clear errors when order type changes
  useEffect(() => {
    setErrors({});
  }, [selectedOrderType]);

    const validateOrder = () => {
    let validationErrors = {};
    let isValid = true;

    // Validate price for Limit and Stop orders
    if ((selectedOrderType === 'Limit' || selectedOrderType === 'Stop') && (!price || price <= 0)) {
      validationErrors.price = `${selectedOrderType} orders require a valid price`;
      isValid = false;
    }

    // Validate volume
    if (!volume || volume <= 0) {
      validationErrors.volume = 'Volume must be greater than 0';
      isValid = false;
    }

    // Validate stop loss for Stop orders
    if (selectedOrderType === 'Stop' && (!stopLoss || stopLoss <= 0)) {
      validationErrors.stopLoss = 'Stop orders require a valid stop loss';
      isValid = false;
    }

    // Validate stop loss value for all orders if provided
    if (stopLoss && buyOrSell === 'Buy' && stopLoss >= currentPrice) {
      validationErrors.stopLoss = 'Stop loss for Buy must be below current price';
      isValid = false;
    } else if (stopLoss && buyOrSell === 'Sell' && stopLoss <= currentPrice) {
      validationErrors.stopLoss = 'Stop loss for Sell must be above current price';
      isValid = false;
    }

    setErrors(validationErrors);
    return isValid;
  };

  const handleBuy = async () => {
    // Reset previous status
    setOrderStatus('processing');
    
    // Validate form
    if (!validateOrder()) {
      setOrderStatus(null);
      return;
    }
    
    try {
      // Get latest price (to avoid stale prices)
      let orderPrice = currentPrice;
      try {
        const priceData = await marketAPI.getCurrentPrice(selectedSymbol);
        orderPrice = priceData.price;
      } catch (priceError) {
        console.warn('Could not get latest price, using current price');
      }
      
      // Prepare order data
      const orderData = {
        symbol: selectedSymbol,
        type: selectedType,
        orderType: selectedOrderType,
        volume: parseFloat(volume),
        stopLoss: parseFloat(stopLoss) || null,
        takeProfit: parseFloat(takeProfit) || null,
        expiration: expiration || null,
        direction: 'buy',
        price: selectedOrderType === 'Market' ? orderPrice : parseFloat(price)
      };
      
      console.log('Placing buy order:', orderData);
      
      // Call our trading API endpoint
      const response = await tradingAPI.placeOrder(orderData);
      
      console.log('Order placed successfully:', response);
      setOrderStatus('success');
      
      // Reset form fields after successful order
      if (selectedOrderType === 'Market') {
        setVolume('');
        setStopLoss('');
        setTakeProfit('');
      }
      
      // Display success notification
      // You can implement a toast notification here
      
    } catch (error) {
      console.error('Error placing buy order:', error);
      setOrderStatus('error');
      
      // Show more specific error message
      if (error.status === 422) {
        // Handle validation errors
        setErrors({
          ...errors,
          ...error.errors,
          form: error.message || 'Order validation failed'
        });
      } else {
        // Handle other types of errors
        setErrors({
          ...errors,
          form: error.message || 'Failed to place order'
        });
      }
    }
  };

  const handleSell = async () => {
    // Reset previous status
    setOrderStatus('processing');
    
    // Validate form
    if (!validateOrder()) {
      setOrderStatus(null);
      return;
    }
    
    try {
      // Get latest price (to avoid stale prices)
      let orderPrice = currentPrice;
      try {
        const priceData = await marketAPI.getCurrentPrice(selectedSymbol);
        orderPrice = priceData.price;
      } catch (priceError) {
        console.warn('Could not get latest price, using current price');
      }
      
      // Prepare order data
      const orderData = {
        symbol: selectedSymbol,
        type: selectedType,
        orderType: selectedOrderType,
        volume: parseFloat(volume),
        stopLoss: parseFloat(stopLoss) || null,
        takeProfit: parseFloat(takeProfit) || null,
        expiration: expiration || null,
        direction: 'sell',
        price: selectedOrderType === 'Market' ? orderPrice : parseFloat(price)
      };
      
      console.log('Placing sell order:', orderData);
      
      // Call our trading API endpoint
      const response = await tradingAPI.placeOrder(orderData);
      
      console.log('Order placed successfully:', response);
      setOrderStatus('success');
      
      // Reset form fields after successful order
      if (selectedOrderType === 'Market') {
        setVolume('');
        setStopLoss('');
        setTakeProfit('');
      }
      
      // Display success notification
      // You can implement a toast notification here
      
    } catch (error) {
      console.error('Error placing sell order:', error);
      setOrderStatus('error');
      
      // Show more specific error message
      if (error.status === 422) {
        // Handle validation errors
        setErrors({
          ...errors,
          ...error.errors,
          form: error.message || 'Order validation failed'
        });
      } else {
        // Handle other types of errors
        setErrors({
          ...errors,
          form: error.message || 'Failed to place order'
        });
      }
    }
  };

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
        <div className="flex items-center">
          <h3 className="text-xl font-semibold text-white mr-3">Trading Terminal</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400">Live Market</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Chart timeframe options */}
          <div className="flex bg-[#131313] rounded-lg overflow-hidden">
            {[
              { label: '1m', value: '1' },
              { label: '5m', value: '5' },
              { label: '15m', value: '15' },
              { label: '1h', value: '60' },
              { label: '4h', value: '240' },
              { label: '1d', value: 'D' },
              { label: '1w', value: 'W' }
            ].map((timeframe) => (
              <button
                key={timeframe.value}
                onClick={() => setSelectedTimeframe(timeframe.value)}
                className={`px-2 py-1 text-xs focus:outline-none transition-colors ${
                  selectedTimeframe === timeframe.value
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-[#2A2A2A]'
                }`}
              >
                {timeframe.label}
              </button>
            ))}
          </div>
          
          {/* Analysis tools */}
          <div className="flex bg-[#131313] rounded-lg overflow-hidden">
            {['Indicators', 'Drawing', 'Patterns'].map((tool) => (
              <button
                key={tool}
                className="px-3 py-1 text-xs text-gray-300 hover:bg-[#2A2A2A] focus:outline-none"
              >
                {tool}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Area - TradingView Chart */}
        <div className="lg:col-span-2">
          <div className="relative h-[600px]">
            <AdvancedTradingViewChart 
              symbol={selectedSymbol}
              theme="dark"
              height={600}
              interval={selectedTimeframe}
              showToolbar={true}
              showVolumeProfile={true}
              enableTrading={true}
              onSymbolChange={(symbol) => setSelectedSymbol(symbol)}
            />
            <div className="absolute top-4 right-4 bg-[#0A0A0A]/80 px-3 py-2 rounded-lg backdrop-blur-sm z-10 shadow-lg border border-gray-800/50">
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                  <span className="text-white text-sm font-medium">{selectedSymbol}</span>
                </div>
                <div className="flex items-center">
                  {isLoadingPrice ? (
                    <Loader2 size={14} className="text-gray-400 animate-spin mr-2" />
                  ) : currentPrice > previousPrice ? (
                    <TrendingUp size={14} className="text-green-400 mr-1" />
                  ) : currentPrice < previousPrice ? (
                    <TrendingDown size={14} className="text-red-400 mr-1" />
                  ) : (
                    <ArrowUpDown size={14} className="text-gray-400 mr-1" />
                  )}
                  <span className="text-white text-sm font-mono">${currentPrice.toFixed(2)}</span>
                  
                  {previousPrice > 0 && (
                    <span className={`text-xs font-medium ml-2 ${
                      currentPrice > previousPrice ? 'text-green-400' : 
                      currentPrice < previousPrice ? 'text-red-400' : 
                      'text-gray-400'
                    }`}>
                      {currentPrice > previousPrice ? '+' : ''}
                      {((currentPrice - previousPrice) / previousPrice * 100).toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trading Panel - Same height as chart */}
        <div className="bg-[#1a1a1a] rounded-xl p-4 h-[600px] flex flex-col overflow-hidden">
          {/* Exchange Header */}
          <div className="mb-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-gray-400 text-base">Exchange</h4>
              <div className="flex items-center">
                <div 
                  className={`px-3 py-1 rounded-full text-xs font-medium mr-2 ${
                    buyOrSell === 'Buy' ? 'bg-blue-600/20 text-blue-400' : 'bg-transparent text-gray-400 hover:bg-gray-800 cursor-pointer'
                  }`}
                  onClick={() => setBuyOrSell('Buy')}
                >
                  Buy
                </div>
                <div 
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    buyOrSell === 'Sell' ? 'bg-red-600/20 text-red-400' : 'bg-transparent text-gray-400 hover:bg-gray-800 cursor-pointer'
                  }`}
                  onClick={() => setBuyOrSell('Sell')}
                >
                  Sell
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 mb-2 bg-gray-800/30 p-2 rounded-lg">
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs">Price</span>
                <div className="flex items-center mt-1">
                  <span className={`text-xl font-medium ${isLoadingPrice ? 'text-gray-400' : 'text-white'}`}>
                    ${currentPrice.toFixed(2)}
                  </span>
                  {isLoadingPrice && <Loader2 size={14} className="text-gray-400 animate-spin ml-2" />}
                </div>
              </div>
              <ArrowUpDown size={14} className="text-gray-500 mx-2" />
              <div className="flex flex-col">
                <span className="text-gray-400 text-xs">Amount</span>
                <span className="text-white text-lg font-medium">
                  1 {selectedSymbol && selectedSymbol.split('/')[0] || 'NTC'}
                </span>
              </div>
            </div>
          </div>

          {/* Trading Form - Flex grow to fill space */}
          <div className="flex-1 flex flex-col justify-between min-h-0 overflow-y-auto">
            <div className="space-y-2 flex-shrink-0">
              {/* Symbol Dropdown */}
              <div className="relative">
                <select
                  value={selectedSymbol}
                  onChange={(e) => {
                    setSelectedSymbol(e.target.value);
                    setErrors({...errors, symbol: null});
                  }}
                  className={`w-full bg-[#9ca3af] text-black font-medium rounded-full py-2.5 px-3 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 ${
                    errors.symbol ? 'border-2 border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
                  }`}
                >
                  <option value="" className="bg-[#9ca3af] text-black">Select Symbol</option>
                  {Object.entries(symbolCategories).map(([category, symbols]) => (
                    <optgroup key={category} label={category} className="bg-[#9ca3af] text-black">
                      {symbols.map(symbol => (
                        <option key={symbol} value={symbol} className="bg-[#9ca3af] text-black">
                          {symbol}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black pointer-events-none" />
                {errors.symbol && <span className="absolute right-8 top-1/2 transform -translate-y-1/2 text-red-500 text-xs">!</span>}
              </div>

              {/* Type Dropdown */}
              <div className="relative">
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value);
                    setErrors({...errors, type: null});
                  }}
                  className={`w-full bg-[#9ca3af] text-black font-medium rounded-full py-2.5 px-3 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 ${
                    errors.type ? 'border-2 border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
                  }`}
                >
                  <option value="" className="bg-[#9ca3af] text-black">Select Type</option>
                  {orderTypes.map(type => (
                    <option key={type} value={type} className="bg-[#9ca3af] text-black">
                      {type}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black pointer-events-none" />
                {errors.type && <span className="absolute right-8 top-1/2 transform -translate-y-1/2 text-red-500 text-xs">!</span>}
              </div>

              {/* Limit Dropdown */}
              <div className="relative">
                <select
                  value={selectedOrderType}
                  onChange={(e) => {
                    setSelectedOrderType(e.target.value);
                    setErrors({...errors, orderType: null});
                  }}
                  className={`w-full bg-[#9ca3af] text-black font-medium rounded-full py-2.5 px-3 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 ${
                    errors.orderType ? 'border-2 border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
                  }`}
                >
                  <option value="" className="bg-[#9ca3af] text-black">Select Limit Type</option>
                  {limitTypes.map(type => (
                    <option key={type} value={type} className="bg-[#9ca3af] text-black">
                      {type}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black pointer-events-none" />
                {errors.orderType && <span className="absolute right-8 top-1/2 transform -translate-y-1/2 text-red-500 text-xs">!</span>}
              </div>

              {/* Volume */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`text-xs ${errors.volume ? 'text-red-400' : 'text-gray-400'}`}>Volume</label>
                  <span className="text-gray-400 text-xs">{volume ? `${parseFloat(volume) * (currentPrice || 100)} USD` : '0 USD'}</span>
                </div>
                <div className={`bg-[#9ca3af] rounded-full py-2 px-3 flex items-center justify-center ${
                  errors.volume ? 'border-2 border-red-500' : ''
                }`}>
                  <input
                    type="number"
                    value={volume}
                    onChange={(e) => {
                      setVolume(e.target.value);
                      if (errors.volume) setErrors({...errors, volume: null});
                    }}
                    placeholder="Enter volume"
                    step="0.01"
                    min="0.01"
                    className="bg-transparent text-black font-medium text-center focus:outline-none w-full text-sm"
                  />
                </div>
                {errors.volume && <p className="text-red-400 text-xs mt-1">{errors.volume}</p>}
              </div>
              
              {/* Price - Only for Limit and Stop orders */}
              {(selectedOrderType === 'Limit' || selectedOrderType === 'Stop') && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className={`text-xs ${errors.price ? 'text-red-400' : 'text-gray-400'}`}>
                      {selectedOrderType} Price <span className="text-red-400">*</span>
                    </label>
                    {currentPrice > 0 && price && (
                      <span className="text-gray-400 text-xs">
                        {parseFloat(price) > currentPrice ? '+' : ''}
                        {((parseFloat(price) / currentPrice - 1) * 100).toFixed(2)}% from market
                      </span>
                    )}
                  </div>
                  <div className={`bg-[#9ca3af] rounded-full py-2 px-3 flex items-center justify-center ${
                    errors.price ? 'border-2 border-red-500' : ''
                  }`}>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => {
                        setPrice(e.target.value);
                        if (errors.price) setErrors({...errors, price: null});
                      }}
                      placeholder={selectedOrderType === 'Limit' ? 
                        (currentPrice > 0 ? `${(currentPrice * 0.99).toFixed(2)}` : "Enter limit price") :
                        (currentPrice > 0 ? `${(currentPrice * 1.01).toFixed(2)}` : "Enter stop price")
                      }
                      step="0.01"
                      min="0.01"
                      className="bg-transparent text-black font-medium text-center focus:outline-none w-full text-sm"
                    />
                  </div>
                  {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price}</p>}
                </div>
              )}

              {/* Stop Loss */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`text-xs ${errors.stopLoss ? 'text-red-400' : 'text-gray-400'}`}>
                    Stop Loss {selectedOrderType === 'Stop' && <span className="text-red-400">*</span>}
                  </label>
                  {currentPrice > 0 && stopLoss && (
                    <span className="text-gray-400 text-xs">
                      {(parseFloat(stopLoss)/currentPrice * 100).toFixed(2)}% of price
                    </span>
                  )}
                </div>
                <div className={`bg-[#9ca3af] rounded-full py-2 px-3 flex items-center justify-center ${
                  errors.stopLoss ? 'border-2 border-red-500' : ''
                }`}>
                  <input
                    type="number"
                    value={stopLoss}
                    onChange={(e) => {
                      setStopLoss(e.target.value);
                      if (errors.stopLoss) setErrors({...errors, stopLoss: null});
                    }}
                    placeholder={currentPrice > 0 ? `${(currentPrice * 0.95).toFixed(2)}` : "Enter stop loss"}
                    step="0.01"
                    className="bg-transparent text-black font-medium text-center focus:outline-none w-full text-sm"
                  />
                </div>
                {errors.stopLoss && <p className="text-red-400 text-xs mt-1">{errors.stopLoss}</p>}
              </div>

              {/* Take Profit */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-gray-400 text-xs">Take Profit</label>
                  {currentPrice > 0 && takeProfit && (
                    <span className="text-gray-400 text-xs">
                      {(parseFloat(takeProfit)/currentPrice * 100).toFixed(2)}% of price
                    </span>
                  )}
                </div>
                <div className="bg-[#9ca3af] rounded-full py-2 px-3 flex items-center justify-center">
                  <input
                    type="number"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    placeholder={currentPrice > 0 ? `${(currentPrice * 1.05).toFixed(2)}` : "Enter take profit"}
                    step="0.01"
                    className="bg-transparent text-black font-medium text-center focus:outline-none w-full text-sm"
                  />
                </div>
              </div>

              {/* Expiration */}
              <div>
                <label className="block text-gray-400 text-xs mb-1">Expiration</label>
                <div className="bg-[#9ca3af] rounded-full py-2 px-3 flex items-center justify-center">
                  <input
                    type="datetime-local"
                    value={expiration}
                    onChange={(e) => setExpiration(e.target.value)}
                    className="bg-transparent text-black font-medium text-center focus:outline-none w-full text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Order Status Message */}
            {orderStatus && (
              <div className={`flex items-center justify-center py-3 px-4 rounded-lg text-sm font-medium mb-2 ${
                orderStatus === 'success' ? 'bg-green-800/30 text-green-400' : 
                orderStatus === 'error' ? 'bg-red-800/30 text-red-400' :
                'bg-blue-800/30 text-blue-400'
              }`}>
                {orderStatus === 'success' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Order placed successfully!
                  </>
                ) : orderStatus === 'error' ? (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Error placing order. Please try again.
                  </>
                ) : (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing order...
                  </>
                )}
              </div>
            )}
            
            {/* Error Summary */}
            {Object.keys(errors).length > 0 && (
              <div className="bg-red-800/30 text-red-400 p-3 rounded-lg mb-2">
                <div className="flex items-center mb-1">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <p className="text-sm font-medium">Please correct the following:</p>
                </div>
                <ul className="list-disc pl-6 text-xs space-y-1">
                  {Object.values(errors).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Buy/Sell Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-4 flex-shrink-0">
              <button
                onClick={handleSell}
                disabled={orderStatus === 'processing' || !selectedSymbol}
                className="bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3 px-3 rounded-xl transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center"
              >
                {orderStatus === 'processing' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 mr-2" />
                    SELL
                  </>
                )}
              </button>
              <button
                onClick={handleBuy}
                disabled={orderStatus === 'processing' || !selectedSymbol}
                className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-3 px-3 rounded-xl transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center"
              >
                {orderStatus === 'processing' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    BUY
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingSection;
