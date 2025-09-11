import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  Scale,
  Activity,
  Search,
  RefreshCw,
  Link2,
  BarChart3,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { 
  placeEATrade as placeTrade, 
  placeEAPendingOrder as placePendingOrder, 
  placeEAPairTrade as placePairTrade, 
  getEAMarketPrice as getMarketPrice,
  getEASymbolPrice as getSymbolPrice,
  getEALivePrices as getLivePrices,
  getEASymbols as getSymbols,
  searchEASymbols,
  EA_ORDER_TYPES as ORDER_TYPES,
  executeEAOrder as executeOrder,
  getEAOrderTypesForDropdown as getOrderTypesForDropdown
} from '../../api/ea';
import { 
  getMultiplePrices, 
  setupPriceStream 
} from '../../api/livePrices';
import { 
  getPopularSymbols, 
  searchSymbols, 
  mockSearchSymbols, 
  formatSymbolsForPicker 
} from '../../utils/symbolpicker';
import PairTradingPanel from './PairTradingPanel';
import SymbolBrowser from './SymbolBrowser';

const TradeModal = ({ isOpen, onClose, accounts, selectedAccount, onAccountSelect, onPlaceTrade }) => {
  const [activeTab, setActiveTab] = useState('order');
  const [submitting, setSubmitting] = useState(false);

  const [livePrice, setLivePrice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState(null);
  const [priceUpdateTime, setPriceUpdateTime] = useState(null);
  const [error, setError] = useState('');
  const [availableSymbols, setAvailableSymbols] = useState([]);
  const [symbolsLoading, setSymbolsLoading] = useState(false);
  const [symbolsLoadedFor, setSymbolsLoadedFor] = useState(null); // Track which account symbols were loaded for

  // Unified Order State (replaces both market and pending states)
  const [orderData, setOrderData] = useState({
    symbol: '',
    symbol2: '', // Added for spread trading
    orderType: 'MARKET_BUY',
    volume: 0.1,
    price: '', // Only used for pending orders
    stop_loss: '',
    take_profit: '',
    expiration: '', // Only used for pending orders
    comment: '',
  });

  // Pair Trading State (updated for new API structure)
  const [pairData, setPairData] = useState({
    symbol1: '',
    symbol2: 'GBPUSD',
    volume: '0.1',
    correlation_type: 'STATISTICAL',
    order_type: 'MARKET',
    entry_spread: '',
    spread_direction: 'NARROW',
    spread_stop_loss: '',
    spread_take_profit: '',
    expiration: '',
    action: 'BUY_SPREAD',  // Default to BUY_SPREAD for backend compatibility
    comment: '',
  });

  // Get order types for dropdown
  const orderTypes = getOrderTypesForDropdown();
  
  // Add spread trading options
  const spreadOrderTypes = [
    {
      value: 'BUY_SPREAD',
      label: 'BUY SPREAD',
      category: 'SPREAD',
      type: 'SPREAD',
      description: 'Buy the spread between two symbols',
      direction: 'BUY',
      requiresPrice: false,
      requiresSymbols: true // New flag to indicate this needs two symbols
    },
    {
      value: 'SELL_SPREAD',
      label: 'SELL SPREAD', 
      category: 'SPREAD',
      type: 'SPREAD',
      description: 'Sell the spread between two symbols',
      direction: 'SELL',
      requiresPrice: false,
      requiresSymbols: true
    }
  ];
  
  // Combine all order types
  const allOrderTypes = [...orderTypes, ...spreadOrderTypes];
  
  const currentOrderConfig = ORDER_TYPES[orderData.orderType] || spreadOrderTypes.find(type => type.value === orderData.orderType);

  // Fetch available symbols when account is selected
  useEffect(() => {
    if (isOpen && selectedAccount) {
      const accountId = selectedAccount.account_id || selectedAccount.id;
      // Only fetch symbols if we haven't loaded them for this account yet
      if (symbolsLoadedFor !== accountId) {
        fetchAvailableSymbols();
      }
    }
    // Clear symbols when account changes
    else if (!selectedAccount) {
      setAvailableSymbols([]);
      setSymbolsLoadedFor(null);
    }
  }, [isOpen, selectedAccount]);

  const fetchAvailableSymbols = async () => {
    if (!selectedAccount) return;
    
    const accountId = selectedAccount.account_id || selectedAccount.id;
    setSymbolsLoading(true);
    
    try {
      const response = await getSymbols(accountId);
      
      if (response.success && response.data) {
        setAvailableSymbols(response.data);
        setSymbolsLoadedFor(accountId); // Mark symbols as loaded for this account
      }
    } catch (error) {
      console.error('Error fetching available symbols:', error);
    } finally {
      setSymbolsLoading(false);
    }
  };

  // Function to force refresh symbols (for manual refresh)
  const refreshSymbols = async () => {
    if (selectedAccount) {
      setSymbolsLoadedFor(null); // Reset the loaded flag
      await fetchAvailableSymbols();
    }
  };

  // Fetch live price when symbol changes with enhanced error handling
  useEffect(() => {
    if (isOpen && selectedAccount && orderData.symbol) {
      // Add debouncing to prevent excessive API calls while typing
      const debounceTimer = setTimeout(() => {
        // Only fetch price for symbols that are at least 3 characters long
        if (orderData.symbol.length >= 3) {
          fetchLivePrice(orderData.symbol);
        }
      }, 500); // 500ms debounce
      
      return () => clearTimeout(debounceTimer);
    }
  }, [isOpen, orderData.symbol, selectedAccount]);

  const fetchLivePrice = async (symbol) => {
    if (!symbol || !selectedAccount) return;
    
    // Validate symbol format - should be at least 3 characters
    if (symbol.length < 3) {
      setPriceError('Symbol must be at least 3 characters');
      setLivePrice(null);
      return;
    }
    
    // Basic symbol format validation - allow letters, numbers, dots, underscores, hyphens
    const symbolPattern = /^[A-Za-z0-9._-]{2,20}$/;
    if (!symbolPattern.test(symbol)) {
      setPriceError('Invalid symbol format. Use letters, numbers, dots, underscores only (e.g., USDJPY.s, EUR_USD)');
      setLivePrice(null);
      return;
    }
    
    setPriceLoading(true);
    setPriceError(null);
    
    try {
      // Use the correct account ID property
      const accountId = selectedAccount.account_id || selectedAccount.id;
      
      // Use enhanced EA API for price fetching
      const response = await getMarketPrice(accountId, symbol); // Don't force uppercase here either
      
      if (response && response.success) {
        setLivePrice({
          bid: response.bid,
          ask: response.ask,
          price: response.price, // Mid price
          spread: response.spread,
          time: response.timestamp || new Date().toISOString(),
          symbol: symbol, // Keep original symbol format
          source: 'ea_live'
        });
        setPriceUpdateTime(new Date());
        setPriceError(null);
        return;
      }
      
      // Fallback to detailed symbol price if market price fails
      const detailedResponse = await getSymbolPrice(accountId, symbol); // Don't force uppercase
      if (detailedResponse && detailedResponse.success && detailedResponse.data) {
        setLivePrice({
          bid: detailedResponse.data.bid,
          ask: detailedResponse.data.ask,
          price: detailedResponse.data.price || (detailedResponse.data.bid + detailedResponse.data.ask) / 2,
          spread: detailedResponse.data.spread || (detailedResponse.data.ask - detailedResponse.data.bid),
          time: detailedResponse.data.timestamp || new Date().toISOString(),
          symbol: detailedResponse.data.symbol || symbol,
          broker_symbol: detailedResponse.data.broker_symbol,
          source: detailedResponse.data.source || 'ea_live'
        });
        setPriceUpdateTime(new Date());
        setPriceError(null);
        return;
      }
      
      // Enhanced error message for symbol not found
      const errorMsg = response.error || detailedResponse.error || 'Symbol not found';
      if (errorMsg.includes('not found')) {
        setPriceError(`Symbol "${symbol}" not available. Try symbols like EURUSD, USDJPY.s, GBP_USD, or check available symbols`);
      } else {
        setPriceError(`Failed to fetch price: ${errorMsg}`);
      }
      setLivePrice(null);
    } catch (error) {
      console.error('Price fetch error:', error);
      
      // Enhanced error handling for different error types
      let userFriendlyError = 'Failed to fetch price';
      if (error.message.includes('not found')) {
        userFriendlyError = `Symbol "${symbol}" not available for this broker. Try EURUSDm, GBPUSDm, XAUUSDm, or BTCUSDm`;
      } else if (error.message.includes('timeout')) {
        userFriendlyError = 'Request timeout. Please try again';
      } else if (error.message.includes('network')) {
        userFriendlyError = 'Network error. Check your connection';
      } else {
        userFriendlyError = `Failed to fetch price: ${error.message}`;
      }
      
      setPriceError(userFriendlyError);
      setLivePrice(null);
    } finally {
      setPriceLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleUnifiedOrder = async () => {
    if (!selectedAccount) {
      setError('Please select an account to trade with');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      // Check if this is a spread order
      if (currentOrderConfig?.type === 'SPREAD') {
        // Handle spread orders by calling the pair trading function
        const spreadDirection = orderData.orderType; // 'BUY_SPREAD' or 'SELL_SPREAD'
        
        // Set up pairData from orderData
        const spreadPairData = {
          symbol1: orderData.symbol,
          symbol2: orderData.symbol2,
          volume: orderData.volume.toString(),
          correlation_type: 'MANUAL', // Manual spread trade
          order_type: 'MARKET',
          action: spreadDirection,
          comment: orderData.comment || '',
          spread_stop_loss: orderData.stop_loss || '',
          spread_take_profit: orderData.take_profit || ''
        };
        
        // Temporarily update pairData and call handlePairTrade
        const originalPairData = pairData;
        setPairData(spreadPairData);
        
        try {
          await handlePairTrade(spreadDirection);
        } finally {
          setPairData(originalPairData);
        }
        
        return;
      }

      // Regular order handling for non-spread orders
      const volume = parseFloat(orderData.volume);
      const stopLoss = orderData.stop_loss ? parseFloat(orderData.stop_loss) : null;
      const takeProfit = orderData.take_profit ? parseFloat(orderData.take_profit) : null;
      const price = orderData.price ? parseFloat(orderData.price) : null;

      if (isNaN(volume) || volume <= 0) {
        throw new Error('Volume must be greater than 0');
      }

      // Ensure minimum volume constraints
      if (volume < 0.01) {
        throw new Error('Volume must be at least 0.01 lots');
      }

      // Validate price for pending orders
      if (currentOrderConfig.requiresPrice && (!price || price <= 0)) {
        throw new Error('Price is required for pending orders');
      }

      // Create unified payload
      const payload = {
        symbol: orderData.symbol?.toString().trim(), // Don't force uppercase, keep original format
        volume: Math.round(volume * 100) / 100,
        stop_loss: stopLoss && stopLoss > 0 ? Math.round(stopLoss * 100000) / 100000 : undefined,
        take_profit: takeProfit && takeProfit > 0 ? Math.round(takeProfit * 100000) / 100000 : undefined,
        comment: orderData.comment?.trim() || undefined,
      };

      // Add price for pending orders
      if (currentOrderConfig.requiresPrice) {
        payload.price = Math.round(price * 100000) / 100000;
      }

      // Add expiration for pending orders
      if (orderData.expiration && currentOrderConfig.requiresPrice) {
        payload.expiration = orderData.expiration;
      }

      //console.log('Sending unified order payload:', payload);

      const accountId = selectedAccount.account_id || selectedAccount.id;
      console.log('🔄 Executing trade:', {
        accountId,
        orderType: orderData.orderType,
        payload,
        account: selectedAccount.accountName || selectedAccount.account_name
      });
      
      const response = await executeOrder(accountId, orderData.orderType, payload);
      
      console.log('📋 Trade response:', response);
      
      if (response.success) {
        const orderTypeLabel = currentOrderConfig.label;
        const tradeDirection = currentOrderConfig.direction?.includes('BUY') ? 'BUY' : 'SELL';
        const directionIcon = tradeDirection === 'BUY' ? '📈' : '📉';
        const directionColor = tradeDirection === 'BUY' ? 'text-green-400' : 'text-red-400';
        
        // Main success notification
        // Primary success notification with sound
        toast.success(
          (t) => (
            <div className="flex items-center gap-3">
              <div className="text-2xl">{directionIcon}</div>
              <div className="flex-1">
                <div className="font-semibold text-white">
                  Trade Executed Successfully!
                </div>
                <div className="text-sm text-gray-300">
                  {orderTypeLabel} • {payload.volume} lots • {payload.symbol}
                </div>
              </div>
              <button 
                onClick={() => toast.dismiss(t.id)} 
                className="text-white opacity-70 hover:opacity-100"
              >
                <X size={18} />
              </button>
            </div>
          ),
          { 
            duration: 6000,
            icon: <Activity className="w-5 h-5 text-green-500" />,
            style: {
              background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
              border: '1px solid #10b981',
              color: 'white',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            },
            position: 'top-center',
            className: 'animate-pulse-once',
          }
        );
        
        // Play sound effect for trade execution
        try {
          const audio = new Audio();
          audio.src = tradeDirection === 'BUY' ? 
            'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjEwLjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADcQD///////////////////////////////////////////8AAAA8TEFNRTMuMTAwAc0AAAAAAAAAABSAJAKDQgAAQAAAA3EMplERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZB8P8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV' :
            'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjEwLjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADcQD///////////////////////////////////////////8AAAA8TEFNRTMuMTAwAc0AAAAAAAAAABSAJAKDQgAARgAAAHEMDwGXAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZB8P8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
          audio.volume = 0.3;
          audio.play().catch(e => console.log('Audio play prevented by browser policy'));
        } catch (e) {
          // Ignore audio errors
        }
        
        // Detailed order information toast
        if (response.request_id || response.order_id || response.position_id) {
          toast.success(
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <strong className="text-white">Trade Details</strong>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div className="text-gray-400">Type:</div>
                <div className={`font-medium ${directionColor}`}>{orderTypeLabel}</div>
                
                <div className="text-gray-400">Symbol:</div>
                <div className="text-white font-mono">{payload.symbol}</div>
                
                <div className="text-gray-400">Volume:</div>
                <div className="text-white">{payload.volume} lots</div>
                
                {response.current_price && (
                  <>
                    <div className="text-gray-400">Price:</div>
                    <div className="text-white font-mono">{response.current_price}</div>
                  </>
                )}
                
                {currentOrderConfig.requiresPrice && payload.price && (
                  <>
                    <div className="text-gray-400">Entry Price:</div>
                    <div className="text-white font-mono">{payload.price}</div>
                  </>
                )}
                
                {payload.stop_loss && (
                  <>
                    <div className="text-gray-400">Stop Loss:</div>
                    <div className="text-red-400 font-mono">{payload.stop_loss}</div>
                  </>
                )}
                
                {payload.take_profit && (
                  <>
                    <div className="text-gray-400">Take Profit:</div>
                    <div className="text-green-400 font-mono">{payload.take_profit}</div>
                  </>
                )}
                
                {response.status && (
                  <>
                    <div className="text-gray-400">Status:</div>
                    <div className="text-blue-400 capitalize">{response.status}</div>
                  </>
                )}
              </div>
              
              {response.request_id && (
                <div className="mt-2 pt-2 border-t border-gray-600">
                  <div className="text-xs text-gray-500">
                    Request ID: <span className="font-mono text-gray-400">{response.request_id}</span>
                  </div>
                </div>
              )}
              
              {response.order_id && (
                <div className="text-xs text-gray-500">
                  Order ID: <span className="font-mono text-gray-400">{response.order_id}</span>
                </div>
              )}
              
              {response.position_id && (
                <div className="text-xs text-gray-500">
                  Position ID: <span className="font-mono text-gray-400">{response.position_id}</span>
                </div>
              )}
            </div>,
            { 
              duration: 10000,
              position: 'top-right',
              icon: <BarChart3 className="w-5 h-5 text-blue-500" />,
              style: {
                background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                border: '1px solid #3b82f6',
                color: 'white',
                maxWidth: '400px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
              },
            }
          );
        }
        
        // Additional success sound notification (optional)
        if (typeof window !== 'undefined' && window.Audio) {
          try {
            // You can add a subtle success sound here if you have an audio file
            // const audio = new Audio('/sounds/trade-success.mp3');
            // audio.volume = 0.3;
            // audio.play().catch(() => {}); // Ignore if audio fails
          } catch (e) {
            // Ignore audio errors
          }
        }
        
        // Wait for trade processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Trade execution is complete via executeOrder for EA accounts
        // No need to call onPlaceTrade callback as it would duplicate the trade
        
        onClose();
      } else {
        const errorMsg = response.error || response.message || 'Failed to place order';
        console.error('❌ Trade failed:', {
          error: errorMsg,
          errorType: response.error_type,
          suggestions: response.suggestions,
          fullResponse: response
        });
        
        // Show helpful suggestions if available
        if (response.suggestions && response.suggestions.length > 0) {
          const suggestionText = response.suggestions.join(', ');
          throw new Error(`${errorMsg}. Suggestions: ${suggestionText}`);
        }
        
        throw new Error(errorMsg);
      }
    } catch (error) {
      setError(error.message || 'Failed to place order. Please try again.');
      
      // Enhanced error toast with icon and detailed styling
      toast.error(
        (t) => (
          <div className="flex items-center gap-3">
            <div className="text-2xl">❌</div>
            <div className="flex-1">
              <div className="font-semibold text-white">
                Trade Failed
              </div>
              <div className="text-sm text-red-200">
                {error.message || 'Failed to place order. Please try again.'}
              </div>
            </div>
            <button 
              onClick={() => toast.dismiss(t.id)} 
              className="text-white opacity-70 hover:opacity-100"
            >
              <X size={18} />
            </button>
          </div>
        ),
        { 
          duration: 8000,
          position: 'top-center',
          icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
          style: {
            background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
            border: '1px solid #dc2626',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          },
        }
      );
      
      // Play error sound
      try {
        const errorAudio = new Audio();
        errorAudio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjIwLjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAEAAABVgANTU1NTU1Q0NDQ0NDUFBQUFBQXl5eXl5ebm5ubm5ug4ODg4ODkZGRkZGRnp6enp6erKysrKysubm5ubm5x8fHx8fH1dXV1dXV4uLi4uLi8PDw8PDw//////////8AAAAATGF2YzU4LjM1AAAAAAAAAAAAAAAAJAYqAAAAAAAABVgxS3iVAAAAAAD/4zjEAANIAUcBKAGQgAAjECAALCEDBmB4YogKACAmOQ/Pjzwx3/X7vw7IP/KBj/yj/8fvw7/X/X/X/X70ETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/jOMQcAdZjpFQKMGrgAAAwAABpgUAAAZMGpTcdf+P4/c+KP/P/H8+uf5/jfH9//8QhrQwDGXPllUhCC0oCDf/5BWf/5iCT//8grf//IAhAEP//EIDgt///EIAFbv//gzSaBW///IN3Df//1Sags3//1N4Vb///U3hu///qz6Cp///Vn0FW///4oENT///igQ1P//+KATRP//+KBDf///igQ3///9AgIb////QICG////EIOqt///xCDiq///w6Bo3BAICqv//8ECG////BAhv///wQIb////BAhv///wQIb////BAhv///xChqf///EKGp///8QuTw///8Q1Cf///ENQn///xDUJ///8OAaD///w4CwIAAA/in/+NCkEAAAYB8YP/wszxQDC6GHz/+MQxAgQexjGjidMcgJ0V1EIcrk4Q1bl9/EEvh2//pWJGVa/fwtDr9+SYOFwj+dlMzYYyuRT9/TRRM0yn//0TJp///q0yn///9HiYmf////9EQQJn/////0RPLhOl//////REMS//////0ZGmL//////LiFM///////ELgn///////q2mK////////SYxmZmZgAAAAAP/4xDE8g2J8MY0TGDMAMzMzMzMzMzAAYMECBAgQJnMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMz/+MQxO0AAANIAAAAADMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMz/+MQxPcAAANIAAAAADMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMz';
        errorAudio.volume = 0.3;
        errorAudio.play().catch(e => console.log('Audio play prevented by browser policy'));
      } catch (e) {
        // Ignore audio errors
      }
    } finally {
      setSubmitting(false);
    }
  };

    const handlePairTrade = async (direction) => {
    if (!selectedAccount) {
      setError('Please select an account to trade with');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const volume = parseFloat(pairData.volume) || 0.1;

      if (isNaN(volume) || volume <= 0) {
        throw new Error('Volume must be greater than 0');
      }

      // Build payload based on the exact curl format expected by backend
      const payload = {
        symbol1: pairData.symbol1,
        symbol2: pairData.symbol2,
        volume: volume,
        trade_type: direction || pairData.action || 'BUY_SPREAD'
      };

      // Add comment if provided
      if (pairData.comment && pairData.comment.trim()) {
        payload.comment = pairData.comment.trim();
      }

      console.log('🔄 Sending pair trade payload:', payload);
      const accountId = selectedAccount.account_id || selectedAccount.id;
      const response = await placePairTrade(accountId, payload);
      
      console.log('Pair trade response:', response);
      
      if (response.success) {
        // Handle successful pair trade
        let successMessage = response.message || 'Pair trade executed successfully';
        
        // Enhanced success message based on order type
        if (pairData.order_type === 'PENDING') {
          successMessage = `Pending spread order placed: Will execute when spread reaches ${payload.entry_spread}`;
        } else if (pairData.correlation_type === 'STATISTICAL') {
          successMessage = `Statistical pair trade executed: ${response.spread_symbol || `${payload.symbol1}-${payload.symbol2}`}`;
        }
        
        // Enhanced primary success notification with icon
        toast.success(
          (t) => (
            <div className="flex items-center gap-3">
              <div className="text-2xl">⚖️</div>
              <div className="flex-1">
                <div className="font-semibold text-white">
                  Pair Trade Executed!
                </div>
                <div className="text-sm text-gray-300">
                  {payload.symbol1}/{payload.symbol2} • {payload.volume} lots
                </div>
                <div className="text-xs text-blue-300 mt-1">
                  {successMessage}
                </div>
              </div>
              <button 
                onClick={() => toast.dismiss(t.id)} 
                className="text-white opacity-70 hover:opacity-100"
              >
                <X size={18} />
              </button>
            </div>
          ),
          { 
            duration: 6000,
            position: 'top-center',
            icon: <Scale className="w-5 h-5 text-purple-500" />,
            style: {
              background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
              border: '1px solid #8b5cf6',
              color: 'white',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            },
            className: 'animate-pulse-once',
          }
        );
        
        // Play sound effect for pair trade execution
        try {
          const audio = new Audio();
          audio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjEwLjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADcQD///////////////////////////////////////////8AAAA8TEFNRTMuMTAwAc0AAAAAAAAAABSAJAKDQgAAQAAAA3EMplERAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZB8P8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
          audio.volume = 0.3;
          audio.play().catch(e => console.log('Audio play prevented by browser policy'));
        } catch (e) {
          // Ignore audio errors
        }
        
        // Display spread analysis if available
        if (response.spread_analysis) {
          const analysis = response.spread_analysis;
          
          if (analysis.correlation_coefficient || analysis.z_score) {
            // Show detailed statistical analysis
            toast.success(
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <strong className="text-white">Statistical Analysis</strong>
                </div>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {analysis.correlation_coefficient && (
                    <>
                      <div className="text-gray-400">Correlation:</div>
                      <div className="text-white font-mono">{analysis.correlation_coefficient.toFixed(3)}</div>
                    </>
                  )}
                  {analysis.z_score && (
                    <>
                      <div className="text-gray-400">Z-Score:</div>
                      <div className="text-white font-mono">{analysis.z_score.toFixed(2)}</div>
                    </>
                  )}
                  {analysis.signal_strength && (
                    <>
                      <div className="text-gray-400">Signal:</div>
                      <div className="text-blue-400">{analysis.signal_strength}</div>
                    </>
                  )}
                  {analysis.hedge_ratio && (
                    <>
                      <div className="text-gray-400">Hedge Ratio:</div>
                      <div className="text-white font-mono">{analysis.hedge_ratio.toFixed(3)}</div>
                    </>
                  )}
                  {response.current_spread && (
                    <>
                      <div className="text-gray-400">Current Spread:</div>
                      <div className="text-white font-mono">{response.current_spread.toFixed(5)}</div>
                    </>
                  )}
                </div>
              </div>,
              { 
                duration: 8000,
                position: 'top-right',
                icon: <Link2 className="w-5 h-5 text-purple-500" />,
                style: {
                  background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                  border: '1px solid #8b5cf6',
                  color: 'white',
                  maxWidth: '400px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                },
              }
            );
          } else if (pairData.order_type === 'PENDING') {
            // Show pending order details
            toast.success(
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <strong className="text-white">Pending Order Details</strong>
                </div>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div className="text-gray-400">Entry Spread:</div>
                  <div className="text-white font-mono">{payload.entry_spread}</div>
                  
                  <div className="text-gray-400">Direction:</div>
                  <div className="text-white font-mono">{payload.spread_direction}</div>
                  
                  {response.current_spread && (
                    <>
                      <div className="text-gray-400">Current Spread:</div>
                      <div className="text-white font-mono">{response.current_spread.toFixed(5)}</div>
                    </>
                  )}
                </div>
              </div>,
              { 
                duration: 6000,
                position: 'top-right',
                icon: <Clock className="w-5 h-5 text-blue-500" />,
                style: {
                  background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                  border: '1px solid #3b82f6',
                  color: 'white',
                  maxWidth: '400px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                },
              }
            );
          }
        }

        // Show individual trade results with enhanced styling
        if (response.symbol1_result && response.symbol2_result) {
          const sym1Result = response.symbol1_result;
          const sym2Result = response.symbol2_result;
          
          if (sym1Result.success && sym2Result.success) {
            // Get direction from individual_trades if available or fallback to details
            const sym1Direction = response.spread_analysis?.individual_trades?.symbol1?.action || 
                                 sym1Result.details?.direction || 
                                 (sym1Result.details?.cmd === 0 ? 'BUY' : 'SELL');
            const sym2Direction = response.spread_analysis?.individual_trades?.symbol2?.action || 
                                 sym2Result.details?.direction || 
                                 (sym2Result.details?.cmd === 0 ? 'BUY' : 'SELL');
              
            const sym1Color = sym1Direction === 'BUY' ? 'text-green-400' : 'text-red-400';
            const sym2Color = sym2Direction === 'BUY' ? 'text-green-400' : 'text-red-400';
            
            toast.success(
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <strong className="text-white">Pair Trade Positions</strong>
                </div>
                
                <div className="flex items-center gap-2 mb-2 border-b border-gray-700 pb-2">
                  <div className={`font-medium ${sym1Color}`}>
                    {sym1Direction === 'BUY' ? '📈 LONG' : '📉 SHORT'}
                  </div>
                  <div className="text-white">
                    {payload.symbol1}
                  </div>
                </div>
                
                {sym1Result.details && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3">
                    <div className="text-gray-400">Volume:</div>
                    <div className="text-white">{sym1Result.details.volume} lots</div>
                    
                    <div className="text-gray-400">Entry Price:</div>
                    <div className="text-white font-mono">{sym1Result.details.open_price}</div>
                    
                    {sym1Result.details.ticket && (
                      <>
                        <div className="text-gray-400">Ticket:</div>
                        <div className="text-blue-400 font-mono">{sym1Result.details.ticket}</div>
                      </>
                    )}
                  </div>
                )}
                
                <div className="flex items-center gap-2 mb-2 border-b border-gray-700 pb-2">
                  <div className={`font-medium ${sym2Color}`}>
                    {sym2Direction === 'BUY' ? '📈 LONG' : '📉 SHORT'}
                  </div>
                  <div className="text-white">
                    {payload.symbol2}
                  </div>
                </div>
                
                {sym2Result.details && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div className="text-gray-400">Volume:</div>
                    <div className="text-white">{sym2Result.details.volume} lots</div>
                    
                    <div className="text-gray-400">Entry Price:</div>
                    <div className="text-white font-mono">{sym2Result.details.open_price}</div>
                    
                    {sym2Result.details.ticket && (
                      <>
                        <div className="text-gray-400">Ticket:</div>
                        <div className="text-blue-400 font-mono">{sym2Result.details.ticket}</div>
                      </>
                    )}
                  </div>
                )}
              </div>,
              { 
                duration: 8000,
                position: 'bottom-right',
                icon: <Target className="w-5 h-5 text-green-500" />,
                style: {
                  background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                  border: '1px solid #10b981',
                  color: 'white',
                  maxWidth: '400px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                },
              }
            );
          }
        }
        
        // Reset form and close modal
        setPairData({
          symbol1: '',
          symbol2: '',
          volume: '0.1',
          correlation_type: 'STATISTICAL',
          order_type: 'MARKET',
          spread_stop_loss: '',
          spread_take_profit: '',
          entry_spread: '',
          spread_direction: 'NARROW',
          expiration: '',
          action: 'BUY_SPREAD',  // Reset to default BUY_SPREAD
          comment: ''
        });
        onClose();
      } else {
        throw new Error(response.error || response.message || 'Failed to place pair trade');
      }
    } catch (error) {
      setError(error.message || 'Failed to place pair trade. Please try again.');
      
      // Enhanced error toast for pair trading with icon and detailed styling
      toast.error(
        (t) => (
          <div className="flex items-center gap-3">
            <div className="text-2xl">⚠️</div>
            <div className="flex-1">
              <div className="font-semibold text-white">
                Pair Trade Failed
              </div>
              <div className="text-sm text-red-200">
                {error.message || 'Failed to place pair trade. Please try again.'}
              </div>
              {pairData?.symbol1 && pairData?.symbol2 && (
                <div className="text-xs text-red-300 mt-1">
                  Failed pair: {pairData.symbol1}/{pairData.symbol2}
                </div>
              )}
            </div>
            <button 
              onClick={() => toast.dismiss(t.id)} 
              className="text-white opacity-70 hover:opacity-100"
            >
              <X size={18} />
            </button>
          </div>
        ),
        { 
          duration: 8000,
          position: 'top-center',
          icon: <Scale className="w-5 h-5 text-red-500" />,
          style: {
            background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
            border: '1px solid #dc2626',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          },
        }
      );
      
      // Play error sound
      try {
        const errorAudio = new Audio();
        errorAudio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjIwLjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAEAAABVgANTU1NTU1Q0NDQ0NDUFBQUFBQXl5eXl5ebm5ubm5ug4ODg4ODkZGRkZGRnp6enp6erKysrKysubm5ubm5x8fHx8fH1dXV1dXV4uLi4uLi8PDw8PDw//////////8AAAAATGF2YzU4LjM1AAAAAAAAAAAAAAAAJAYqAAAAAAAABVgxS3iVAAAAAAD/4zjEAANIAUcBKAGQgAAjECAALCEDBmB4YogKACAmOQ/Pjzwx3/X7vw7IP/KBj/yj/8fvw7/X/X/X/X70ETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/jOMQcAdZjpFQKMGrgAAAwAABpgUAAAZMGpTcdf+P4/c+KP/P/H8+uf5/jfH9//8QhrQwDGXPllUhCC0oCDf/5BWf/5iCT//8grf//IAhAEP//EIDgt///EIAFbv//gzSaBW///IN3Df//1Sags3//1N4Vb///U3hu///qz6Cp///Vn0FW///4oENT///igQ1P//+KATRP//+KBDf///igQ3///9AgIb////QICG////EIOqt///xCDiq///w6Bo3BAICqv//8ECG////BAhv///wQIb////BAhv///wQIb////BAhv///xChqf///EKGp///8QuTw///8Q1Cf///ENQn///xDUJ///8OAaD///w4CwIAAA/in/+NCkEAAAYB8YP/wszxQDC6GHz/+MQxAgQexjGjidMcgJ0V1EIcrk4Q1bl9/EEvh2//pWJGVa/fwtDr9+SYOFwj+dlMzYYyuRT9/TRRM0yn//0TJp///q0yn///9HiYmf////9EQQJn/////0RPLhOl//////REMS//////0ZGmL//////LiFM///////ELgn///////q2mK////////SYxmZmZgAAAAAP/4xDE8g2J8MY0TGDMAMzMzMzMzMzAAYMECBAgQJnMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMz/+MQxO0AAANIAAAAADMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMz/+MQxPcAAANIAAAAADMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMz';
        errorAudio.volume = 0.3;
        errorAudio.play().catch(e => console.log('Audio play prevented by browser policy'));
      } catch (e) {
        // Ignore audio errors
      }
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: 'order', label: 'Trading Orders', icon: TrendingUp },
    { id: 'pair', label: 'Pair Trading', icon: Scale },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#2A2A2A]">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Trading Panel
          </h3>
          <button 
            className="text-gray-400 hover:text-white transition-colors" 
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="m-6 mb-0 bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Account Selection */}
        <div className="p-6 pb-0">
          <div className="bg-[#222] border border-[#333] rounded-lg p-4 mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Trading Account
            </label>
            <div className="flex items-center gap-4">
              <select 
                className="flex-1 bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
                onChange={(e) => {
                  const accountId = e.target.value;
                  const account = accounts.find(acc => 
                    (acc.account_id || acc.id)?.toString() === accountId
                  );
                  if (account) onAccountSelect(account);
                }}
                value={(selectedAccount?.account_id || selectedAccount?.id)?.toString() || ''}
              >
                <option value="" disabled>Select account</option>
                {accounts && accounts.length > 0 ? accounts.map((account) => (
                  <option 
                    key={account.account_id || account.id} 
                    value={(account.account_id || account.id)?.toString()}
                  >
                    {account.broker || account.accountName || account.account_name || account.broker_name || `Account ${account.account_id}`}
                    {account.server ? ` (${account.server})` : ''}
                    {account.platform ? ` - ${account.platform}` : ''}
                    {account.is_demo || (account.server && account.server.includes('Demo')) ? ' - Demo' : ''}
                  </option>
                )) : (
                  <option value="" disabled>No accounts available</option>
                )}
              </select>
              {selectedAccount && (
                <div className="bg-green-600/20 text-green-400 px-3 py-2 rounded-lg text-sm">
                  <div className="font-medium">
                    Balance: ${selectedAccount.balance?.toFixed(2) || '0.00'}
                  </div>
                  {selectedAccount.equity && selectedAccount.equity !== selectedAccount.balance && (
                    <div className="text-xs text-gray-300">
                      Equity: ${selectedAccount.equity?.toFixed(2)}
                    </div>
                  )}
                  {selectedAccount.free_margin && (
                    <div className="text-xs text-gray-300">
                      Free Margin: ${selectedAccount.free_margin?.toFixed(2)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="flex space-x-1 bg-[#222] p-1 rounded-lg mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#2F00FF] to-[#1C0099] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#333]'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-6 pb-6">
          {activeTab === 'order' && (
            <UnifiedOrderPanel 
              data={orderData}
              setData={setOrderData}
              orderTypes={orderTypes}
              allOrderTypes={allOrderTypes}
              spreadOrderTypes={spreadOrderTypes}
              currentOrderConfig={currentOrderConfig}
              livePrice={livePrice}
              priceLoading={priceLoading}
              priceError={priceError}
              priceUpdateTime={priceUpdateTime}
              onSubmit={handleUnifiedOrder}
              submitting={submitting}
              fetchLivePrice={fetchLivePrice}
              selectedAccount={selectedAccount}
              availableSymbols={availableSymbols}
              setLivePrice={setLivePrice}
              setPriceError={setPriceError}
              symbolsLoading={symbolsLoading}
              refreshSymbols={refreshSymbols}
            />
          )}
          
          {activeTab === 'pair' && (
            <PairTradingPanel 
              data={pairData}
              setData={setPairData}
              onSubmit={handlePairTrade}
              submitting={submitting}
              selectedAccount={selectedAccount}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Unified Order Panel Component (replaces MarketOrderPanel and PendingOrderPanel)
const UnifiedOrderPanel = ({ 
  data, 
  setData, 
  orderTypes, 
  allOrderTypes,
  spreadOrderTypes,
  currentOrderConfig, 
  livePrice, 
  priceLoading, 
  priceError, 
  priceUpdateTime, 
  onSubmit, 
  submitting, 
  fetchLivePrice,
  selectedAccount,
  availableSymbols,
  setLivePrice,
  setPriceError,
  symbolsLoading,
  refreshSymbols
}) => {
  const [showSymbolModal, setShowSymbolModal] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [symbolSuggestions, setSymbolSuggestions] = useState([]);
  
  const updateData = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const openSymbolSelector = () => {
    setShowSymbolModal(true);
  };

  const closeSymbolModal = () => {
    setShowSymbolModal(false);
  };

  const handleSymbolSelect = (symbol) => {
    updateData('symbol', symbol);
    setShowSymbolModal(false);
  };

  // Get symbol suggestions from available symbols using EA API
  const getSymbolSuggestions = async (input) => {
    if (!input || input.length < 2) return [];
    
    // First try to use cached available symbols if they exist
    if (availableSymbols && availableSymbols.length > 0) {
      const symbolList = availableSymbols.map(s => s.symbol || s);
      return symbolList
        .filter(symbol => symbol.toLowerCase().includes(input.toLowerCase()))
        .slice(0, 8);
    }
    
    // If no cached symbols or selected account, try to fetch suggestions from EA API
    if (selectedAccount) {
      try {
        const accountId = selectedAccount.account_id || selectedAccount.id;
        const response = await searchEASymbols(accountId, input);
        
        if (response.success && response.data) {
          return response.data.slice(0, 8);
        }
      } catch (error) {
        console.warn('Failed to fetch symbol suggestions:', error);
      }
    }
    
    // Fallback to common symbols for basic functionality
    const commonSymbols = [
      'EURUSDm', 'GBPUSDm', 'BTCUSDm', 'XAUUSDm', 'XAGUSDm',
      'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
      'EURGBP', 'EURJPY', 'GBPJPY', 'XAUUSD', 'XAGUSD', 'BTCUSD', 'ETHUSD'
    ];
    
    return commonSymbols
      .filter(symbol => symbol.toLowerCase().includes(input.toLowerCase()))
      .slice(0, 8);
  };

  const handleSymbolInputChange = async (value) => {
    // Keep the user's original case preference
    updateData('symbol', value);
    
    // Clear previous price data immediately when typing
    if (value.length < 3) {
      setLivePrice(null);
      setPriceError(null);
    }
    
    // Show suggestions for partial matches (use case-insensitive search)
    if (value.length >= 2) {
      try {
        const suggestions = await getSymbolSuggestions(value);
        setSymbolSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } catch (error) {
        console.warn('Failed to get symbol suggestions:', error);
        setSymbolSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setSymbolSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (symbol) => {
    updateData('symbol', symbol);
    setShowSuggestions(false);
    setSymbolSuggestions([]);
  };

  // Group order types by category for better UX
  const marketOrders = allOrderTypes.filter(type => type.category === 'MARKET');
  const pendingOrders = allOrderTypes.filter(type => type.category === 'PENDING');
  const spreadOrders = allOrderTypes.filter(type => type.category === 'SPREAD');

  return (
    <div className="space-y-6">
      <div className="bg-[#222] border border-[#333] rounded-lg p-4">
        <h4 className="text-white font-medium mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          {currentOrderConfig?.label || 'Trading Order'}
          <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
            {currentOrderConfig?.type || 'ORDER'}
          </span>
        </h4>
        
        {/* Order Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Order Type</label>
          <select
            value={data.orderType}
            onChange={(e) => updateData('orderType', e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
          >
            <optgroup label="Market Orders (Immediate)">
              {marketOrders.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Pending Orders (Conditional)">
              {pendingOrders.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Spread Trading">
              {spreadOrders.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </optgroup>
          </select>
          {currentOrderConfig?.description && (
            <p className="text-xs text-gray-400 mt-1">{currentOrderConfig.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Symbol Selection */}
          <div className={currentOrderConfig?.requiresSymbols ? "col-span-2" : ""}>
            {currentOrderConfig?.requiresSymbols ? (
              // Two symbols for spread trading
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300">Symbol 1 (Primary)</label>
                  </div>
                  <div className="flex relative">
                    <input
                      type="text"
                      value={data.symbol}
                      onChange={(e) => handleSymbolInputChange(e.target.value)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      placeholder="Symbol 1 (e.g., EURUSD)"
                      className="w-full bg-[#1A1A1A] border border-[#444] rounded-l-lg px-3 py-2 text-white"
                    />
                    <button
                      onClick={openSymbolSelector}
                      className="bg-[#333] border border-[#555] border-l-0 rounded-r-lg px-3 text-blue-400 hover:text-blue-300"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300">Symbol 2 (Secondary)</label>
                  </div>
                  <div className="flex relative">
                    <input
                      type="text"
                      value={data.symbol2 || ''}
                      onChange={(e) => updateData('symbol2', e.target.value)}
                      placeholder="Symbol 2 (e.g., GBPUSD)"
                      className="w-full bg-[#1A1A1A] border border-[#444] rounded-l-lg px-3 py-2 text-white"
                    />
                    <button
                      onClick={openSymbolSelector}
                      className="bg-[#333] border border-[#555] border-l-0 rounded-r-lg px-3 text-blue-400 hover:text-blue-300"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Single symbol for regular trading
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">Symbol</label>
                  {symbolsLoading && (
                    <div className="flex items-center gap-1 text-xs text-blue-400">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Loading symbols...</span>
                    </div>
                  )}
                  {availableSymbols.length > 0 && !symbolsLoading && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-green-400">{availableSymbols.length} symbols available</span>
                      <button
                        onClick={refreshSymbols}
                        className="text-xs text-blue-400 hover:text-blue-300"
                        title="Refresh symbols list"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex relative">
                  <input
                    type="text"
                    value={data.symbol}
                    onChange={(e) => handleSymbolInputChange(e.target.value)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Symbol (e.g., EURUSDm, GBPUSDm, BTCUSDm)"
                    className="w-full bg-[#1A1A1A] border border-[#444] rounded-l-lg px-3 py-2 text-white"
                  />
                  <button
                    onClick={openSymbolSelector}
                    className="bg-[#333] border border-[#555] border-l-0 px-3 text-blue-400 hover:text-blue-300"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                  {data.symbol && (
                    <button
                      onClick={() => fetchLivePrice(data.symbol)}
                      disabled={priceLoading}
                      className="bg-[#333] border border-[#555] border-l-0 rounded-r-lg px-3 text-yellow-400 hover:text-yellow-300 disabled:opacity-50"
                      title="Refresh live price"
                    >
                      <RefreshCw className={`w-4 h-4 ${priceLoading ? 'animate-spin' : ''}`} />
                    </button>
                  )}
                  
                  {/* Symbol Suggestions Dropdown */}
                  {showSuggestions && symbolSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 bg-[#1A1A1A] border border-[#444] rounded-b-lg shadow-lg">
                      {symbolSuggestions.map((symbol, index) => (
                        <button
                          key={symbol}
                          type="button"
                          onClick={() => {
                            selectSuggestion(symbol);
                            fetchLivePrice(symbol);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-[#333] text-gray-300 hover:text-white border-b border-[#444] last:border-b-0"
                        >
                          {symbol}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Volume */}
          {!currentOrderConfig?.requiresSymbols && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Volume (Lots)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={data.volume}
                onChange={(e) => updateData('volume', e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
              />
            </div>
          )}
        </div>

        {/* Volume for spread orders - full width */}
        {currentOrderConfig?.requiresSymbols && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Volume (Lots)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={data.volume}
              onChange={(e) => updateData('volume', e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            />
          </div>
        )}

        {/* Enhanced Live Price Display */}
        {data.symbol && (
          <div className="mt-4">
            {priceLoading && !livePrice && (
              <div className="bg-[#1A1A1A] border border-[#444] rounded-lg p-3">
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Loading live price for {data.symbol}...</span>
                </div>
              </div>
            )}
            
            {priceError && !livePrice && (
              <div className="bg-orange-900/30 border border-orange-700 rounded-lg p-3">
                <div className="flex items-center gap-2 text-orange-300">
                  <AlertTriangle className="w-4 h-4" />
                  <div className="text-sm">
                    <div>{priceError}</div>
                    <div className="text-xs text-orange-200 mt-1">
                      Tip: Try symbols like EURUSD, USDJPY.s, GBP_USD, or check available symbols for this broker
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {livePrice && (
              <div className="bg-[#1A1A1A] border border-[#444] rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Live Price - {livePrice.symbol}
                    {livePrice.broker_symbol && livePrice.broker_symbol !== livePrice.symbol && (
                      <span className="text-xs text-gray-500">({livePrice.broker_symbol})</span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {priceLoading && (
                      <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                    )}
                    {priceUpdateTime && (
                      <span className="text-xs text-gray-500">
                        {priceUpdateTime.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Enhanced Live Price Display with Additional Details */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">BID</div>
                    <div className="text-lg font-mono text-red-400">
                      {livePrice.bid?.toFixed(5) || '-.-----'}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">ASK</div>
                    <div className="text-lg font-mono text-green-400">
                      {livePrice.ask?.toFixed(5) || '-.-----'}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">SPREAD</div>
                    <div className="text-lg font-mono text-gray-300">
                      {livePrice.spread ? livePrice.spread.toFixed(5) : 
                       (livePrice.bid && livePrice.ask) ? (livePrice.ask - livePrice.bid).toFixed(5) : '-.-----'}
                    </div>
                  </div>
                </div>
                
                {/* Mid Price and Source Info */}
                {livePrice.price && (
                  <div className="mt-3 text-center">
                    <div className="text-xs text-gray-400 mb-1">MID PRICE</div>
                    <div className="text-xl font-mono text-blue-400">
                      {livePrice.price.toFixed(5)}
                    </div>
                  </div>
                )}
                
                {/* Price Direction Indicator and Source */}
                <div className="mt-2 flex justify-between items-center">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live EA Data</span>
                    {livePrice.source && (
                      <span className="text-blue-400">({livePrice.source})</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Updated: {priceUpdateTime?.toLocaleTimeString()}
                  </div>
                </div>
                
                {/* Enhanced Quick Price Actions */}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      if (livePrice.bid) {
                        updateData('price', livePrice.bid.toString());
                        updateData('orderType', 'SELL_LIMIT');
                      }
                    }}
                    className="text-xs bg-red-600/20 hover:bg-red-600/30 text-red-300 px-2 py-1 rounded border border-red-600/30"
                    disabled={!currentOrderConfig?.requiresPrice}
                  >
                    Use Bid
                  </button>
                  <button
                    onClick={() => {
                      if (livePrice.price) {
                        updateData('price', livePrice.price.toString());
                      }
                    }}
                    className="text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 px-2 py-1 rounded border border-blue-600/30"
                    disabled={!currentOrderConfig?.requiresPrice}
                  >
                    Use Mid
                  </button>
                  <button
                    onClick={() => {
                      if (livePrice.ask) {
                        updateData('price', livePrice.ask.toString());
                        updateData('orderType', 'BUY_LIMIT');
                      }
                    }}
                    className="text-xs bg-green-600/20 hover:bg-green-600/30 text-green-300 px-2 py-1 rounded border border-green-600/30"
                    disabled={!currentOrderConfig?.requiresPrice}
                  >
                    Use Ask
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Price Field (only for pending orders) */}
        {currentOrderConfig?.requiresPrice && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Entry Price *
              <span className="text-xs text-gray-400 ml-1">(Required for pending orders)</span>
            </label>
            <input
              type="number"
              step="0.00001"
              value={data.price}
              onChange={(e) => updateData('price', e.target.value)}
              placeholder="0.00000"
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
              required
            />
          </div>
        )}

        {/* Stop Loss and Take Profit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Stop Loss 
              <span className="text-xs text-gray-400">(Optional)</span>
            </label>
            <input
              type="number"
              step="0.00001"
              value={data.stop_loss}
              onChange={(e) => updateData('stop_loss', e.target.value)}
              placeholder="0.00000"
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Take Profit 
              <span className="text-xs text-gray-400">(Optional)</span>
            </label>
            <input
              type="number"
              step="0.00001"
              value={data.take_profit}
              onChange={(e) => updateData('take_profit', e.target.value)}
              placeholder="0.00000"
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>

        {/* Expiration (only for pending orders) */}
        {currentOrderConfig?.requiresPrice && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Expiration 
              <span className="text-xs text-gray-400">(Optional)</span>
            </label>
            <input
              type="datetime-local"
              value={data.expiration}
              onChange={(e) => updateData('expiration', e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            />
          </div>
        )}

        {/* Comment */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Comment 
            <span className="text-xs text-gray-400">(Optional)</span>
          </label>
          <input
            type="text"
            value={data.comment}
            onChange={(e) => updateData('comment', e.target.value)}
            placeholder="Order comment or note"
            className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={onSubmit}
          disabled={submitting || 
            (currentOrderConfig?.requiresPrice && !data.price) ||
            (currentOrderConfig?.requiresSymbols && (!data.symbol || !data.symbol2))
          }
          className={`w-full mt-6 py-3 px-4 rounded-lg font-medium transition-colors ${
            currentOrderConfig?.type === 'SPREAD'
              ? currentOrderConfig?.direction === 'BUY'
                ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white'
                : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white'
              : currentOrderConfig?.direction?.includes('BUY') || currentOrderConfig?.direction === 'BUY'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          } ${submitting || 
            (currentOrderConfig?.requiresPrice && !data.price) ||
            (currentOrderConfig?.requiresSymbols && (!data.symbol || !data.symbol2))
            ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {submitting ? (
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              {currentOrderConfig?.type === 'SPREAD' ? 'Executing Spread...' : 'Placing Order...'}
            </div>
          ) : (
            currentOrderConfig?.type === 'SPREAD' 
              ? `Execute ${currentOrderConfig?.label}` 
              : `${currentOrderConfig?.type === 'MARKET' ? 'Execute' : 'Place'} ${currentOrderConfig?.label || 'Order'}`
          )}
        </button>

        {/* Order Summary */}
        <div className="mt-4 bg-[#1A1A1A] border border-[#444] rounded-lg p-3">
          <h5 className="text-sm font-medium text-gray-300 mb-2">Order Summary</h5>
          <div className="space-y-1 text-xs text-gray-400">
            <div className="flex justify-between">
              <span>Type:</span>
              <span className="text-white">{currentOrderConfig?.label}</span>
            </div>
            {currentOrderConfig?.requiresSymbols ? (
              <>
                <div className="flex justify-between">
                  <span>Symbol 1:</span>
                  <span className="text-white">{data.symbol || 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Symbol 2:</span>
                  <span className="text-white">{data.symbol2 || 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Spread Pair:</span>
                  <span className="text-white">{data.symbol && data.symbol2 ? `${data.symbol}/${data.symbol2}` : 'Incomplete'}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span>Symbol:</span>
                <span className="text-white">{data.symbol}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Volume:</span>
              <span className="text-white">{data.volume} lots</span>
            </div>
            {currentOrderConfig?.requiresPrice && data.price && (
              <div className="flex justify-between">
                <span>Entry Price:</span>
                <span className="text-white">{data.price}</span>
              </div>
            )}
            {data.stop_loss && (
              <div className="flex justify-between">
                <span>{currentOrderConfig?.type === 'SPREAD' ? 'Spread Stop Loss:' : 'Stop Loss:'}</span>
                <span className="text-red-400">{data.stop_loss}</span>
              </div>
            )}
            {data.take_profit && (
              <div className="flex justify-between">
                <span>{currentOrderConfig?.type === 'SPREAD' ? 'Spread Take Profit:' : 'Take Profit:'}</span>
                <span className="text-green-400">{data.take_profit}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Symbol Selection Modal */}
      {showSymbolModal && (
        <SymbolBrowser 
          onClose={closeSymbolModal} 
          onSelect={handleSymbolSelect}
          selectedAccount={selectedAccount}
        />
      )}
    </div>
  );
};

// PairTradingPanel is now imported from a separate file

export default TradeModal;
