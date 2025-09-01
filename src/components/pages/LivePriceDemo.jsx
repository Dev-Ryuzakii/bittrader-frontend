import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  LivePriceTicker, 
  LivePriceCard, 
  MiniPriceWidget, 
  LivePriceGrid,
  PriceSpreadWidget 
} from '../components/UI/LivePriceWidgets';
import { usePopularSymbols, useSymbolSearch } from '../hooks/useLivePrices';
import { Activity, Search, TrendingUp, BarChart3, Zap } from 'lucide-react';

export default function LivePriceDemo() {
  const { user } = useAuth();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSymbols, setSelectedSymbols] = useState(['EURUSD', 'GBPUSD', 'USDJPY']);

  // Popular symbols
  const { symbols: popularSymbols, loading: popularLoading } = usePopularSymbols();
  
  // Symbol search
  const { results: searchResults } = useSymbolSearch(searchQuery, { limit: 10 });

  // Fetch user accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch('http://api.tradexas.com/api/v1/broker/', {
          headers: {
            'Authorization': localStorage.getItem('access_token'),
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAccounts(data);
          if (data.length > 0) {
            setSelectedAccount(data[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch accounts:', error);
      }
    };

    if (user) {
      fetchAccounts();
    }
  }, [user]);

  const addSymbol = (symbol) => {
    if (!selectedSymbols.includes(symbol)) {
      setSelectedSymbols([...selectedSymbols, symbol]);
    }
    setSearchQuery('');
  };

  const removeSymbol = (symbol) => {
    setSelectedSymbols(selectedSymbols.filter(s => s !== symbol));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Please log in to view live prices</h2>
          <p className="text-gray-400">You need to be authenticated to access live market data.</p>
        </div>
      </div>
    );
  }

  if (!selectedAccount) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No trading accounts found</h2>
          <p className="text-gray-400">Please connect a trading account to view live prices.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#1A1A1A] p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Zap className="h-8 w-8 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold">Live Price Feed Demo</h1>
                <p className="text-gray-400">Real-time market data from your MT5 EA</p>
              </div>
            </div>
            
            {/* Account selector */}
            <div className="flex items-center space-x-3">
              <label className="text-sm text-gray-400">Account:</label>
              <select
                value={selectedAccount || ''}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              >
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.broker_name} - {account.login}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Live Price Ticker */}
      <div className="border-b border-gray-800 bg-[#111111]">
        <div className="max-w-7xl mx-auto">
          <LivePriceTicker 
            symbols={selectedSymbols} 
            accountId={selectedAccount}
            className="py-2"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Symbol Management */}
        <div className="bg-[#1A1A1A] border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Manage Symbols</h2>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search symbols (e.g., EUR, GBP, USD)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400"
            />
          </div>

          {/* Search Results */}
          {searchQuery && searchResults.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Search Results:</h3>
              <div className="flex flex-wrap gap-2">
                {searchResults.map(result => (
                  <button
                    key={result.symbol}
                    onClick={() => addSymbol(result.symbol)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    {result.symbol}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular Symbols */}
          {!popularLoading && popularSymbols.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Popular Symbols:</h3>
              <div className="flex flex-wrap gap-2">
                {popularSymbols.slice(0, 10).map(symbol => (
                  <button
                    key={symbol.symbol}
                    onClick={() => addSymbol(symbol.symbol)}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    {symbol.symbol}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected Symbols */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">
              Selected Symbols ({selectedSymbols.length}):
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedSymbols.map(symbol => (
                <div
                  key={symbol}
                  className="flex items-center space-x-2 px-3 py-1 bg-green-600 rounded-lg text-sm font-medium"
                >
                  <span>{symbol}</span>
                  <button
                    onClick={() => removeSymbol(symbol)}
                    className="text-green-200 hover:text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Price Cards Grid */}
        <div>
          <h2 className="text-xl font-bold mb-4">Detailed Price Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedSymbols.slice(0, 6).map(symbol => (
              <LivePriceCard
                key={symbol}
                symbol={symbol}
                accountId={selectedAccount}
              />
            ))}
          </div>
        </div>

        {/* Mini Widgets */}
        <div>
          <h2 className="text-xl font-bold mb-4">Mini Price Widgets</h2>
          <div className="bg-[#1A1A1A] border border-gray-800 rounded-lg p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {selectedSymbols.map(symbol => (
                <MiniPriceWidget
                  key={symbol}
                  symbol={symbol}
                  accountId={selectedAccount}
                  showChange={true}
                  className="p-3 bg-gray-800 rounded-lg"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Price Grid */}
        <div>
          <h2 className="text-xl font-bold mb-4">Compact Price Grid</h2>
          <LivePriceGrid
            symbols={selectedSymbols}
            accountId={selectedAccount}
            columns={4}
          />
        </div>

        {/* Spread Widget Demo */}
        {selectedSymbols.length >= 2 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Spread Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <PriceSpreadWidget
                symbol1={selectedSymbols[0]}
                symbol2={selectedSymbols[1]}
                accountId={selectedAccount}
              />
              {selectedSymbols.length >= 3 && (
                <PriceSpreadWidget
                  symbol1={selectedSymbols[0]}
                  symbol2={selectedSymbols[2]}
                  accountId={selectedAccount}
                />
              )}
              {selectedSymbols.length >= 4 && (
                <PriceSpreadWidget
                  symbol1={selectedSymbols[1]}
                  symbol2={selectedSymbols[3]}
                  accountId={selectedAccount}
                />
              )}
            </div>
          </div>
        )}

        {/* API Information */}
        <div className="bg-[#1A1A1A] border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">API Integration Guide</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-green-400 mb-2">Available Endpoints:</h3>
              <ul className="space-y-1 text-gray-300 font-mono">
                <li>GET /api/v1/broker/{accountId}/price/{symbol}</li>
                <li>GET /api/v1/broker/{accountId}/prices?symbols=EUR,GBP</li>
                <li>GET /api/v1/broker/{accountId}/spread-price/{symbol1}/{symbol2}</li>
                <li>POST /api/v1/broker/{accountId}/prices/stream</li>
                <li>GET /api/v1/symbols/fast</li>
                <li>GET /api/v1/symbols/search?q=EUR</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-blue-400 mb-2">Integration Methods:</h3>
              <ul className="space-y-1 text-gray-300">
                <li>• <strong>Polling:</strong> Regular HTTP requests (2-5 second intervals)</li>
                <li>• <strong>WebSocket:</strong> Real-time streaming (recommended for live feeds)</li>
                <li>• <strong>Subscription:</strong> Hybrid approach with updates</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-orange-400 mb-2">React Hook Usage:</h3>
              <pre className="bg-gray-900 p-3 rounded text-xs text-gray-300 overflow-x-auto">
{`import { useLivePrice, useLivePrices } from '../hooks/useLivePrices';

// Single symbol
const { price, loading, connected } = useLivePrice('EURUSD', accountId);

// Multiple symbols  
const { prices, loading, connected } = useLivePrices(['EURUSD', 'GBPUSD'], accountId);`}
              </pre>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
