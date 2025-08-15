import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X, ArrowLeft, TrendingUp, Hash, BarChart2, Users, BookOpen } from 'lucide-react';
import './Search.css';

// Utility to get query parameters
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const Search = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const location = useLocation();
  const searchQuery = query.get('q') || '';
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Mock categories for demo
  const categories = [
    { id: 'all', name: 'All Results', icon: SearchIcon },
    { id: 'symbols', name: 'Symbols', icon: Hash },
    { id: 'strategies', name: 'Strategies', icon: TrendingUp },
    { id: 'insights', name: 'Insights', icon: BarChart2 },
    { id: 'community', name: 'Community', icon: Users },
    { id: 'education', name: 'Education', icon: BookOpen },
  ];

  // Mock search results - in a real app, this would come from an API call
  const mockResults = {
    symbols: [
      { id: 'btcusd', name: 'BTCUSD', description: 'Bitcoin vs US Dollar', category: 'symbols' },
      { id: 'gbpusd', name: 'GBPUSD', description: 'British Pound vs US Dollar', category: 'symbols' },
      { id: 'usdjpy', name: 'USDJPY', description: 'US Dollar vs Japanese Yen', category: 'symbols' },
    ],
    strategies: [
      { id: 'strat1', name: 'Moving Average Crossover', description: 'Popular trend following strategy', category: 'strategies' },
      { id: 'strat2', name: 'RSI Divergence', description: 'Reversal strategy using RSI indicator', category: 'strategies' },
    ],
    insights: [
      { id: 'insight1', name: 'Market Outlook: August 2025', description: 'Analysis of current market conditions', category: 'insights' },
      { id: 'insight2', name: 'Central Bank Policies Impact', description: 'How monetary policies affect trading', category: 'insights' },
    ],
    community: [
      { id: 'comm1', name: 'Trading Group: Forex Masters', description: 'Community of forex traders', category: 'community' },
      { id: 'comm2', name: 'User: TradingPro99', description: 'Professional trader with 5 years experience', category: 'community' },
    ],
    education: [
      { id: 'edu1', name: "Beginner's Guide to Forex", description: 'Learn the basics of forex trading', category: 'education' },
      { id: 'edu2', name: 'Advanced Technical Analysis', description: 'Master chart patterns and indicators', category: 'education' },
    ],
  };

  // Function to filter results by search query
  const filterResults = (query) => {
    if (!query) return [];
    
    // Convert to lowercase for case-insensitive search
    const lowerQuery = query.toLowerCase();
    
    // Combine all categories
    let allResults = [];
    Object.values(mockResults).forEach(categoryResults => {
      allResults = [...allResults, ...categoryResults];
    });
    
    // Filter results that match the query
    return allResults.filter(result => 
      result.name.toLowerCase().includes(lowerQuery) || 
      result.description.toLowerCase().includes(lowerQuery)
    );
  };

  // Filter by category
  const getFilteredResults = () => {
    const allFilteredResults = filterResults(searchQuery);
    
    if (activeTab === 'all') {
      return allFilteredResults;
    }
    
    return allFilteredResults.filter(result => result.category === activeTab);
  };

  // Simulate API call to get search results
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API delay
    const timer = setTimeout(() => {
      setSearchResults(filterResults(searchQuery));
      setIsLoading(false);
    }, 600);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle new search
  const [newQuery, setNewQuery] = useState(searchQuery);
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (!newQuery.trim()) return;
    
    navigate(`/search?q=${encodeURIComponent(newQuery.trim())}`);
  };

  // Get results filtered by active tab
  const filteredResults = getFilteredResults();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0A0A0A] text-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Back button and search form */}
        <div className="flex flex-col md:flex-row md:items-center mb-6 space-y-4 md:space-y-0">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-gray-400 hover:text-white mr-4"
          >
            <ArrowLeft size={20} className="mr-1" />
            <span>Back</span>
          </button>
          
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search for symbols, strategies, insights..."
                value={newQuery}
                onChange={(e) => setNewQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-[#1A1A1A] text-white rounded-lg border border-white focus:outline-none focus:ring-2 focus:ring-[#2F00FF]/70 focus:border-transparent"
              />
              {newQuery && (
                <button 
                  type="button"
                  onClick={() => setNewQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </form>
        </div>
        
        {/* Search info */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold mb-1">Search Results</h1>
          <p className="text-gray-400">
            {isLoading ? 'Searching...' : 
              filteredResults.length > 0 
                ? `Found ${filteredResults.length} results for "${searchQuery}"`
                : `No results found for "${searchQuery}"`
            }
          </p>
        </div>
        
        {/* Category tabs */}
        <div className="border-b border-gray-800 mb-6">
          <div className="flex overflow-x-auto pb-2 hide-scrollbar">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveTab(category.id)}
                className={`flex items-center px-4 py-2 mr-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === category.id
                    ? 'bg-gradient-to-r from-[#2F00FF] to-[#1C0099] text-white'
                    : 'bg-[#1A1A1A] text-gray-400 hover:text-white'
                }`}
              >
                <category.icon size={16} className="mr-2" />
                {category.name}
                {activeTab === 'all' && category.id !== 'all' && mockResults[category.id]?.filter(item => 
                  item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  item.description.toLowerCase().includes(searchQuery.toLowerCase())
                ).length > 0 && (
                  <span className="ml-2 bg-[#222222] text-xs px-2 py-0.5 rounded-full">
                    {mockResults[category.id]?.filter(item => 
                      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      item.description.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Results list */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2F00FF]"></div>
          </div>
        ) : filteredResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResults.map((result) => {
              // Determine icon based on category
              const CategoryIcon = categories.find(cat => cat.id === result.category)?.icon || SearchIcon;
              
              return (
                <div 
                  key={`${result.category}-${result.id}`}
                  className="bg-[#1A1A1A] border border-gray-800 rounded-lg p-4 hover:border-[#2F00FF]/60 transition-colors cursor-pointer"
                  onClick={() => {
                    // Navigate based on category (example implementation)
                    if (result.category === 'symbols') {
                      navigate(`/symbols/${result.id}`);
                    } else if (result.category === 'strategies') {
                      navigate(`/strategy-lab/${result.id}`);
                    } else if (result.category === 'insights') {
                      navigate(`/analyst-insights/${result.id}`);
                    } else if (result.category === 'community') {
                      navigate(`/community/${result.id}`);
                    } else if (result.category === 'education') {
                      navigate(`/education/${result.id}`);
                    }
                  }}
                >
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#2F00FF]/20 flex items-center justify-center mr-3">
                      <CategoryIcon size={16} className="text-[#2F00FF]" />
                    </div>
                    <span className="text-xs text-gray-400 capitalize">{result.category}</span>
                  </div>
                  <h3 className="font-medium mb-1">{result.name}</h3>
                  <p className="text-sm text-gray-400">{result.description}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-[#1A1A1A] inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
              <SearchIcon size={24} className="text-gray-500" />
            </div>
            <h3 className="text-xl font-medium mb-2">No results found</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              We couldn't find anything matching "{searchQuery}". Try using different keywords or check your spelling.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
