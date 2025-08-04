import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  Scale,
  Users,
  DollarSign,
  Activity,
  Search,
  Star,
  Globe
} from 'lucide-react';
import { debounce } from 'lodash';
import { 
  placeTrade, 
  placePendingOrder, 
  placePairTrade, 
  placeMultiAccountTrade,
  getLivePrice,
  getPopularSymbols,
  searchSymbols
} from '../../api/broker';

const TradeModal = ({ isOpen, onClose, accounts, selectedAccount, onAccountSelect, onPlaceTrade }) => {
  const [activeTab, setActiveTab] = useState('market');
  const [submitting, setSubmitting] = useState(false);
  const [livePrice, setLivePrice] = useState(null);
  const [error, setError] = useState('');

  // Market Order State
  const [marketData, setMarketData] = useState({
    symbol: 'BTCUSD',
    trade_type: 'buy',
    volume: 0.01,
    stop_loss: '',
    take_profit: '',
    comment: '',
  });

  // Pending Order State
  const [pendingData, setPendingData] = useState({
    symbol: 'BTCUSD',
    order_type: 'buy_limit',
    volume: 0.01,
    price: '',
    stop_loss: '',
    take_profit: '',
    expiration: '',
    comment: '',
  });

  // Pair Trading State
  const [pairData, setPairData] = useState({
    symbol1: 'EURUSD',
    symbol2: 'GBPUSD',
    volume1: 0.01,
    volume2: 0.01,
    trade_type1: 'buy',
    trade_type2: 'sell',
    correlation_threshold: 0.8,
    comment: '',
  });

  // Multi-Account Trading State
  const [multiAccountData, setMultiAccountData] = useState({
    symbol: 'BTCUSD',
    trade_type: 'buy',
    total_volume: 0.1,
    distribution_method: 'equal',
    selected_accounts: [],
    stop_loss: '',
    take_profit: '',
    comment: '',
  });

  // Fetch live price when symbol changes
  useEffect(() => {
    if (isOpen && marketData.symbol) {
      fetchLivePrice(marketData.symbol);
    }
  }, [isOpen, marketData.symbol]);

  const fetchLivePrice = async (symbol) => {
    try {
      const response = await getLivePrice(symbol);
      if (response.success) {
        setLivePrice(response.data);
      }
    } catch (error) {
      console.log('Could not fetch live price:', error);
    }
  };

  if (!isOpen) return null;

  const handleMarketTrade = async () => {
    if (!selectedAccount) {
      setError('Please select an account to trade with');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const volume = parseFloat(marketData.volume);
      const stopLoss = marketData.stop_loss ? parseFloat(marketData.stop_loss) : null;
      const takeProfit = marketData.take_profit ? parseFloat(marketData.take_profit) : null;

      if (isNaN(volume) || volume <= 0) {
        throw new Error('Volume must be greater than 0');
      }

      const payload = {
        symbol: marketData.symbol,
        trade_type: marketData.trade_type,
        volume,
        stop_loss: stopLoss,
        take_profit: takeProfit,
        comment: marketData.comment,
      };

      const response = await placeTrade(selectedAccount.id, payload);
      
      if (response.success) {
        toast.success(`Market order placed: ${response.data.ticket || 'Success'}`);
        onClose();
      } else {
        throw new Error(response.error || 'Failed to place trade');
      }
    } catch (error) {
      setError(error.message || 'Failed to place trade. Please try again.');
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePendingOrder = async () => {
    if (!selectedAccount) {
      setError('Please select an account to trade with');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const volume = parseFloat(pendingData.volume);
      const price = parseFloat(pendingData.price);
      const stopLoss = pendingData.stop_loss ? parseFloat(pendingData.stop_loss) : null;
      const takeProfit = pendingData.take_profit ? parseFloat(pendingData.take_profit) : null;

      if (isNaN(volume) || volume <= 0) {
        throw new Error('Volume must be greater than 0');
      }
      if (isNaN(price) || price <= 0) {
        throw new Error('Order price must be greater than 0');
      }

      const payload = {
        symbol: pendingData.symbol,
        order_type: pendingData.order_type,
        volume,
        price,
        stop_loss: stopLoss,
        take_profit: takeProfit,
        expiration: pendingData.expiration || null,
        comment: pendingData.comment,
      };

      const response = await placePendingOrder(selectedAccount.id, payload);
      
      if (response.success) {
        toast.success(`Pending order placed: ${response.data.ticket || 'Success'}`);
        onClose();
      } else {
        throw new Error(response.error || 'Failed to place pending order');
      }
    } catch (error) {
      setError(error.message || 'Failed to place pending order. Please try again.');
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePairTrade = async () => {
    if (!selectedAccount) {
      setError('Please select an account to trade with');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const volume1 = parseFloat(pairData.volume1);
      const volume2 = parseFloat(pairData.volume2);
      const threshold = parseFloat(pairData.correlation_threshold);

      if (isNaN(volume1) || volume1 <= 0 || isNaN(volume2) || volume2 <= 0) {
        throw new Error('Volumes must be greater than 0');
      }

      const payload = {
        symbol1: pairData.symbol1,
        symbol2: pairData.symbol2,
        volume1,
        volume2,
        trade_type1: pairData.trade_type1,
        trade_type2: pairData.trade_type2,
        correlation_threshold: threshold,
        comment: pairData.comment,
      };

      const response = await placePairTrade(selectedAccount.id, payload);
      
      if (response.success) {
        toast.success(`Pair trade placed: ${response.data.trades?.length || 1} orders executed`);
        onClose();
      } else {
        throw new Error(response.error || 'Failed to place pair trade');
      }
    } catch (error) {
      setError(error.message || 'Failed to place pair trade. Please try again.');
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMultiAccountTrade = async () => {
    if (multiAccountData.selected_accounts.length === 0) {
      setError('Please select at least one account for multi-account trading');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const totalVolume = parseFloat(multiAccountData.total_volume);
      const stopLoss = multiAccountData.stop_loss ? parseFloat(multiAccountData.stop_loss) : null;
      const takeProfit = multiAccountData.take_profit ? parseFloat(multiAccountData.take_profit) : null;

      if (isNaN(totalVolume) || totalVolume <= 0) {
        throw new Error('Total volume must be greater than 0');
      }

      const payload = {
        symbol: multiAccountData.symbol,
        trade_type: multiAccountData.trade_type,
        total_volume: totalVolume,
        account_ids: multiAccountData.selected_accounts,
        distribution_method: multiAccountData.distribution_method,
        stop_loss: stopLoss,
        take_profit: takeProfit,
        comment: multiAccountData.comment,
      };

      const response = await placeMultiAccountTrade(payload);
      
      if (response.success) {
        toast.success(`Multi-account trade placed: ${response.data.successful_trades || 0} accounts executed`);
        onClose();
      } else {
        throw new Error(response.error || 'Failed to place multi-account trade');
      }
    } catch (error) {
      setError(error.message || 'Failed to place multi-account trade. Please try again.');
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { id: 'market', label: 'Market Order', icon: TrendingUp },
    { id: 'pending', label: 'Pending Order', icon: Clock },
    { id: 'pair', label: 'Pair Trading', icon: Scale },
    { id: 'multi', label: 'Multi-Account', icon: Users },
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
                  const account = accounts.find(acc => acc.id?.toString() === accountId);
                  if (account) onAccountSelect(account);
                }}
                value={selectedAccount?.id?.toString() || ''}
              >
                <option value="" disabled>Select account</option>
                {accounts && accounts.length > 0 ? accounts.map((account) => (
                  <option key={account.id} value={account.id?.toString()}>
                    {account.accountName || account.broker_name || 'Account'} 
                    {account.login ? ` - ${account.login}` : ''}
                    {account.is_demo ? ' (Demo)' : ''}
                  </option>
                )) : (
                  <option value="" disabled>No accounts available</option>
                )}
              </select>
              {selectedAccount && (
                <div className="bg-green-600/20 text-green-400 px-3 py-2 rounded-lg text-sm">
                  Balance: ${selectedAccount.balance?.toFixed(2) || '0.00'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:space-x-1 space-y-1 sm:space-y-0 bg-[#222] p-1 rounded-lg mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-2 sm:px-4 py-3 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#333]'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium text-sm sm:text-base">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-6 pb-6">
          {activeTab === 'market' && (
            <MarketOrderPanel 
              data={marketData}
              setData={setMarketData}
              livePrice={livePrice}
              onSubmit={handleMarketTrade}
              submitting={submitting}
            />
          )}
          
          {activeTab === 'pending' && (
            <PendingOrderPanel 
              data={pendingData}
              setData={setPendingData}
              onSubmit={handlePendingOrder}
              submitting={submitting}
            />
          )}
          
          {activeTab === 'pair' && (
            <PairTradingPanel 
              data={pairData}
              setData={setPairData}
              onSubmit={handlePairTrade}
              submitting={submitting}
            />
          )}
          
          {activeTab === 'multi' && (
            <MultiAccountPanel 
              data={multiAccountData}
              setData={setMultiAccountData}
              accounts={accounts}
              onSubmit={handleMultiAccountTrade}
              submitting={submitting}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Symbol Picker Component
const SymbolPicker = ({ 
  selectedSymbol, 
  onSymbolSelect, 
  placeholder = "Search symbols..." 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [symbols, setSymbols] = useState([]);
  const [popularSymbols, setPopularSymbols] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Debounced search function
  const debouncedSearch = useRef(
    debounce(async (term) => {
      if (term.length < 2) {
        setSymbols([]);
        return;
      }

      setLoading(true);
      try {
        const response = await searchSymbols(term, 15);
        if (response.success) {
          setSymbols(response.data.symbols || []);
        }
      } catch (error) {
        console.error('Symbol search error:', error);
        setSymbols([]);
      } finally {
        setLoading(false);
      }
    }, 300)
  ).current;

  // Load popular symbols on mount
  useEffect(() => {
    loadPopularSymbols();
  }, []);

  // Search when term changes
  useEffect(() => {
    if (searchTerm) {
      debouncedSearch(searchTerm);
    } else {
      setSymbols([]);
    }
  }, [searchTerm, debouncedSearch]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadPopularSymbols = async () => {
    try {
      const response = await getPopularSymbols();
      if (response.success && response.data.popular_symbols) {
        // Flatten major pairs for quick access
        const majorPairs = response.data.popular_symbols.major_pairs || [];
        setPopularSymbols(majorPairs.filter(s => s.available));
      }
    } catch (error) {
      console.error('Error loading popular symbols:', error);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsDropdownOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSymbolSelect = (symbol) => {
    onSymbolSelect(symbol.symbol);
    setSearchTerm('');
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    const symbolList = searchTerm ? symbols : popularSymbols;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < symbolList.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : symbolList.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && symbolList[highlightedIndex]) {
          handleSymbolSelect(symbolList[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsDropdownOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const symbolList = searchTerm ? symbols : popularSymbols;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Input Container */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={searchInputRef}
          type="text"
          value={searchTerm || selectedSymbol}
          onChange={handleInputChange}
          onFocus={() => setIsDropdownOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 bg-[#1A1A1A] border border-[#444] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
          autoComplete="off"
        />
        
        {loading && (
          <div className="absolute inset-y-0 right-8 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Dropdown */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1A1A] border border-[#444] rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {!searchTerm && (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide bg-[#222] border-b border-[#333]">
                <Star className="inline w-3 h-3 mr-1" />
                Popular Symbols
              </div>
              {popularSymbols.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400">No symbols available</div>
              ) : (
                popularSymbols.map((symbol, index) => (
                  <SymbolOption
                    key={symbol.symbol}
                    symbol={symbol}
                    isHighlighted={index === highlightedIndex}
                    onClick={() => handleSymbolSelect(symbol)}
                  />
                ))
              )}
            </div>
          )}

          {searchTerm && (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide bg-[#222] border-b border-[#333]">
                <Search className="inline w-3 h-3 mr-1" />
                Search Results {symbols.length > 0 && `(${symbols.length})`}
              </div>
              {symbols.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400">
                  {loading ? 'Searching...' : 'No symbols found'}
                </div>
              ) : (
                symbols.map((symbol, index) => (
                  <SymbolOption
                    key={symbol.symbol}
                    symbol={symbol}
                    isHighlighted={index === highlightedIndex}
                    onClick={() => handleSymbolSelect(symbol)}
                    showRelevance={true}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Individual symbol option component
const SymbolOption = ({ symbol, isHighlighted, onClick, showRelevance = false }) => {
  return (
    <div
      className={`px-4 py-3 cursor-pointer border-b border-[#333] last:border-b-0 transition-colors ${
        isHighlighted ? 'bg-blue-600/20 border-blue-600/30' : 'hover:bg-[#2A2A2A]'
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white text-sm">
            {symbol.display_name || symbol.name || symbol.symbol}
          </span>
          <span className="px-2 py-0.5 bg-[#333] text-gray-300 rounded text-xs font-mono">
            {symbol.symbol}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          {symbol.popular && <Star className="w-3 h-3 text-yellow-400" />}
          <Globe className="w-3 h-3" />
        </div>
      </div>
      
      <div className="flex justify-between items-center text-xs text-gray-400">
        <span className="flex-1 truncate">
          {symbol.description || `${symbol.symbol} trading pair`}
        </span>
        <span className="ml-2 bg-[#444] px-2 py-0.5 rounded">
          {symbol.available_accounts || symbol.accounts?.length || 0} account(s)
        </span>
      </div>
      
      {showRelevance && symbol.relevance_score && (
        <div className="mt-2 h-1 bg-[#333] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-yellow-500 rounded-full transition-all duration-300" 
            style={{ width: `${symbol.relevance_score}%` }}
          />
        </div>
      )}
    </div>
  );
};

// Market Order Panel Component
const MarketOrderPanel = ({ data, setData, livePrice, onSubmit, submitting }) => {
  const updateData = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleSymbolSelect = (symbol) => {
    updateData('symbol', symbol);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#222] border border-[#333] rounded-lg p-4">
        <h4 className="text-white font-medium mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Market Order
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
            <SymbolPicker
              selectedSymbol={data.symbol}
              onSymbolSelect={handleSymbolSelect}
              placeholder="Search or select symbol..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Order Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => updateData('trade_type', 'buy')}
                className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                  data.trade_type === 'buy'
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'border-[#444] text-gray-300 hover:border-green-600'
                }`}
              >
                <TrendingUp className="w-4 h-4 mx-auto mb-1" />
                Buy
              </button>
              <button
                onClick={() => updateData('trade_type', 'sell')}
                className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                  data.trade_type === 'sell'
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'border-[#444] text-gray-300 hover:border-red-600'
                }`}
              >
                <TrendingDown className="w-4 h-4 mx-auto mb-1" />
                Sell
              </button>
            </div>
          </div>
        </div>

        {livePrice && (
          <div className="mt-4 bg-[#1A1A1A] border border-[#444] rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Live Price:</span>
              <div className="flex gap-4">
                <span className="text-red-400">Bid: {livePrice.bid?.toFixed(5)}</span>
                <span className="text-green-400">Ask: {livePrice.ask?.toFixed(5)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Volume</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={data.volume}
              onChange={(e) => updateData('volume', e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Stop Loss (Optional)</label>
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Take Profit (Optional)</label>
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

        {/* <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Comment (Optional)</label>
          <input
            type="text"
            value={data.comment}
            onChange={(e) => updateData('comment', e.target.value)}
            placeholder="Trade comment..."
            className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
          />
        </div> */}

        <button
          onClick={onSubmit}
          disabled={submitting}
          className={`w-full mt-6 py-3 px-4 rounded-lg font-medium transition-colors ${
            data.trade_type === 'buy'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          } ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {submitting ? 'Placing Order...' : `Place ${data.trade_type.toUpperCase()} Order`}
        </button>
      </div>
    </div>
  );
};
// Pending Order Panel Component
const PendingOrderPanel = ({ data, setData, onSubmit, submitting }) => {
  const updateData = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleSymbolSelect = (symbol) => {
    updateData('symbol', symbol);
  };

  const orderTypes = [
    { value: 'buy_limit', label: 'Buy Limit', color: 'text-green-400' },
    { value: 'sell_limit', label: 'Sell Limit', color: 'text-red-400' },
    { value: 'buy_stop', label: 'Buy Stop', color: 'text-green-400' },
    { value: 'sell_stop', label: 'Sell Stop', color: 'text-red-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-[#222] border border-[#333] rounded-lg p-4">
        <h4 className="text-white font-medium mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Pending Order
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
            <SymbolPicker
              selectedSymbol={data.symbol}
              onSymbolSelect={handleSymbolSelect}
              placeholder="Search or select symbol..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Order Type</label>
            <select
              value={data.order_type}
              onChange={(e) => updateData('order_type', e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            >
              {orderTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Volume</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={data.volume}
              onChange={(e) => updateData('volume', e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Order Price</label>
            <input
              type="number"
              step="0.00001"
              value={data.price}
              onChange={(e) => updateData('price', e.target.value)}
              placeholder="0.00000"
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Stop Loss (Optional)</label>
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Take Profit (Optional)</label>
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

        {/* <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Expiration (Optional)</label>
          <input
            type="datetime-local"
            value={data.expiration}
            onChange={(e) => updateData('expiration', e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
          />
        </div> */}

        {/* <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Comment (Optional)</label>
          <input
            type="text"
            value={data.comment}
            onChange={(e) => updateData('comment', e.target.value)}
            placeholder="Order comment..."
            className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
          />
        </div> */}

        <button
          onClick={onSubmit}
          disabled={submitting}
          className={`w-full mt-6 py-3 px-4 rounded-lg font-medium transition-colors ${
            data.order_type.includes('buy')
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          } ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {submitting ? 'Placing Order...' : `Place ${data.order_type.replace('_', ' ').toUpperCase()}`}
        </button>
      </div>
    </div>
  );
};

// Pair Trading Panel Component
const PairTradingPanel = ({ data, setData, onSubmit, submitting }) => {
  const updateData = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleSymbol1Select = (symbol) => {
    updateData('symbol1', symbol);
  };

  const handleSymbol2Select = (symbol) => {
    updateData('symbol2', symbol);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#222] border border-[#333] rounded-lg p-4">
        <h4 className="text-white font-medium mb-4 flex items-center gap-2">
          <Scale className="w-4 h-4" />
          Pair Trading
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Symbol */}
          <div className="bg-[#1A1A1A] border border-[#444] rounded-lg p-4">
            <h5 className="text-green-400 font-medium mb-3">Symbol 1</h5>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
                <SymbolPicker
                  selectedSymbol={data.symbol1}
                  onSymbolSelect={handleSymbol1Select}
                  placeholder="Search first symbol..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Volume</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={data.volume1}
                  onChange={(e) => updateData('volume1', e.target.value)}
                  className="w-full bg-[#222] border border-[#555] rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Trade Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateData('trade_type1', 'buy')}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-colors ${
                      data.trade_type1 === 'buy'
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'border-[#555] text-gray-300 hover:border-green-600'
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => updateData('trade_type1', 'sell')}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-colors ${
                      data.trade_type1 === 'sell'
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'border-[#555] text-gray-300 hover:border-red-600'
                    }`}
                  >
                    Sell
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Second Symbol */}
          <div className="bg-[#1A1A1A] border border-[#444] rounded-lg p-4">
            <h5 className="text-red-400 font-medium mb-3">Symbol 2</h5>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
                <SymbolPicker
                  selectedSymbol={data.symbol2}
                  onSymbolSelect={handleSymbol2Select}
                  placeholder="Search second symbol..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Volume</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={data.volume2}
                  onChange={(e) => updateData('volume2', e.target.value)}
                  className="w-full bg-[#222] border border-[#555] rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Trade Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateData('trade_type2', 'buy')}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-colors ${
                      data.trade_type2 === 'buy'
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'border-[#555] text-gray-300 hover:border-green-600'
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => updateData('trade_type2', 'sell')}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-colors ${
                      data.trade_type2 === 'sell'
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'border-[#555] text-gray-300 hover:border-red-600'
                    }`}
                  >
                    Sell
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Correlation Threshold</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={data.correlation_threshold}
              onChange={(e) => updateData('correlation_threshold', e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            />
          </div>
          
          {/* <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Comment (Optional)</label>
            <input
              type="text"
              value={data.comment}
              onChange={(e) => updateData('comment', e.target.value)}
              placeholder="Pair trade comment..."
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            />
          </div> */}
        </div>

        <button
          onClick={onSubmit}
          disabled={submitting}
          className={`w-full mt-6 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors ${
            submitting ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {submitting ? 'Placing Pair Trade...' : 'Place Pair Trade'}
        </button>
      </div>
    </div>
  );
};

// Multi-Account Panel Component
const MultiAccountPanel = ({ data, setData, accounts, onSubmit, submitting }) => {
  const updateData = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleSymbolSelect = (symbol) => {
    updateData('symbol', symbol);
  };

  const toggleAccount = (accountId) => {
    updateData('selected_accounts', 
      data.selected_accounts.includes(accountId)
        ? data.selected_accounts.filter(id => id !== accountId)
        : [...data.selected_accounts, accountId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#222] border border-[#333] rounded-lg p-4">
        <h4 className="text-white font-medium mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Multi-Account Trading
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
            <SymbolPicker
              selectedSymbol={data.symbol}
              onSymbolSelect={handleSymbolSelect}
              placeholder="Search or select symbol..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Trade Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => updateData('trade_type', 'buy')}
                className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                  data.trade_type === 'buy'
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'border-[#444] text-gray-300 hover:border-green-600'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => updateData('trade_type', 'sell')}
                className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                  data.trade_type === 'sell'
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'border-[#444] text-gray-300 hover:border-red-600'
                }`}
              >
                Sell
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Total Volume</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={data.total_volume}
              onChange={(e) => updateData('total_volume', e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Distribution Method</label>
            <select
              value={data.distribution_method}
              onChange={(e) => updateData('distribution_method', e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
            >
              <option value="equal">Equal Distribution</option>
              <option value="proportional">Proportional to Balance</option>
              <option value="risk_based">Risk-Based Distribution</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Accounts ({data.selected_accounts.length} selected)
          </label>
          <div className="bg-[#1A1A1A] border border-[#444] rounded-lg p-3 max-h-40 overflow-y-auto">
            {accounts && accounts.length > 0 ? accounts.map((account) => (
              <div key={account.id} className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  checked={data.selected_accounts.includes(account.id)}
                  onChange={() => toggleAccount(account.id)}
                  className="w-4 h-4 text-blue-600 bg-[#222] border-[#555] rounded"
                />
                <span className="text-white flex-1">
                  {account.accountName || account.broker_name || 'Account'}
                  {account.login ? ` - ${account.login}` : ''}
                  {account.is_demo ? ' (Demo)' : ''}
                </span>
                <span className="text-gray-400 text-sm">
                  ${account.balance?.toFixed(2) || '0.00'}
                </span>
              </div>
            )) : (
              <div className="text-gray-400 text-center py-4">No accounts available</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Stop Loss (Optional)</label>
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Take Profit (Optional)</label>
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

        {/* <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Comment (Optional)</label>
          <input
            type="text"
            value={data.comment}
            onChange={(e) => updateData('comment', e.target.value)}
            placeholder="Multi-account trade comment..."
            className="w-full bg-[#1A1A1A] border border-[#444] rounded-lg px-3 py-2 text-white"
          />
        </div> */}

        <button
          onClick={onSubmit}
          disabled={submitting || data.selected_accounts.length === 0}
          className={`w-full mt-6 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors ${
            submitting || data.selected_accounts.length === 0 ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {submitting ? 'Placing Multi-Account Trade...' : `Place Trade on ${data.selected_accounts.length} Accounts`}
        </button>
      </div>
    </div>
  );
};

export default TradeModal;
