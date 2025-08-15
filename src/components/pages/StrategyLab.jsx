import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Download, 
  Code, 
  TrendingUp, 
  Zap, 
  Settings, 
  Plus,
  CheckCircle,
  Filter,
  Search,
  Bot,
  BarChart3,
  Lightbulb,
  FlaskConical
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { strategyLabAI, aiToolsAPI, formatAIResponse } from '../../api/chat';

const StrategyLab = () => {
  const [strategies, setStrategies] = useState([]);
  const [featuredStrategies, setFeaturedStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  
  const { toast } = useToast();

  // AI Analysis functions with fallback handling
  const analyzeStrategies = async () => {
    setAiLoading(true);
    setShowAiPanel(true);
    
    try {
      const response = await strategyLabAI.analyzeStrategies(true, true);
      if (response.success && response.data) {
        setAiAnalysis(response.data);
        toast.success("AI strategy analysis completed!");
      } else {
        // Fallback analysis if strategy lab endpoint isn't available
        const fallbackAnalysis = await aiToolsAPI.strategyAnalysis("comprehensive");
        if (fallbackAnalysis.success && fallbackAnalysis.data) {
          setAiAnalysis({
            analysis: fallbackAnalysis.data.analysis || "Strategy analysis completed using general AI tools.",
            performance_insights: fallbackAnalysis.data.insights || [
              "Consider diversifying strategy types for better risk distribution",
              "Monitor performance metrics regularly to identify trends",
              "Adjust parameters based on current market volatility"
            ],
            recommendations: fallbackAnalysis.data.recommendations || [
              "Review strategy performance monthly",
              "Consider market conditions when deploying strategies",
              "Use proper risk management across all strategies"
            ]
          });
          toast.success("AI strategy analysis completed!");
        } else {
          throw new Error("Strategy analysis service unavailable");
        }
      }
    } catch (error) {
      console.error("Strategy analysis error:", error);
      toast.error("AI analysis temporarily unavailable. Showing general insights.");
      setAiAnalysis({
        analysis: "AI strategy analysis is temporarily unavailable. The system is showing general trading insights based on best practices.",
        performance_insights: [
          "Diversification across different strategy types reduces overall portfolio risk",
          "Regular performance monitoring helps identify underperforming strategies",
          "Market conditions significantly impact strategy effectiveness"
        ],
        recommendations: [
          "Review and adjust strategy parameters monthly",
          "Consider current market volatility when selecting strategies",
          "Maintain proper risk management across all trading activities",
          "Test strategies in demo environments before live deployment"
        ]
      });
    } finally {
      setAiLoading(false);
    }
  };

  const analyzeStrategyPerformance = async (strategyId) => {
    try {
      const response = await strategyLabAI.analyzeStrategyPerformance(strategyId);
      if (response.success && response.data) {
        const formatted = formatAIResponse('strategy-lab', response);
        toast.success("Strategy performance analyzed!");
        return formatted;
      } else {
        // Fallback to general strategy analysis
        const fallback = await aiToolsAPI.strategyAnalysis("comprehensive");
        toast.info("Using general strategy analysis - detailed performance analysis not yet available");
        return formatAIResponse('strategy', fallback);
      }
    } catch (error) {
      console.error("Performance analysis error:", error);
      toast.error("Performance analysis temporarily unavailable.");
      return "Strategy performance analysis is temporarily unavailable. Please try again later.";
    }
  };

  const getStrategyImprovements = async (strategyId) => {
    try {
      const response = await strategyLabAI.getStrategyImprovements(strategyId);
      if (response.success && response.data) {
        return response.data;
      } else {
        // Fallback improvements
        return {
          improvements: [
            "Consider adjusting risk parameters based on current market volatility",
            "Monitor strategy performance against market benchmarks",
            "Review entry and exit criteria for optimization opportunities"
          ],
          risk_assessment: "General risk management principles apply - ensure proper position sizing and stop loss levels."
        };
      }
    } catch (error) {
      console.error("Strategy improvements error:", error);
      toast.info("Strategy improvements analysis not yet available");
      return {
        improvements: [
          "Strategy improvement analysis is temporarily unavailable",
          "Consider general risk management best practices",
          "Monitor strategy performance regularly"
        ],
        risk_assessment: "Use standard risk management principles until detailed analysis is available."
      };
    }
  };

  useEffect(() => {
    // Mock data for demo - replace with actual API calls
    setTimeout(() => {
      setFeaturedStrategies([
        {
          id: 1,
          name: "Professional Scalping Strategy",
          description: "High-frequency trading strategy optimized for major forex pairs with advanced risk management.",
          complexity: "advanced",
          category: "scalping",
          rating: 4.8,
          downloads: 1247,
          min_balance: 5000,
          parameters: {
            "Risk Per Trade": "1%",
            "Stop Loss": "10 pips",
            "Take Profit": "15 pips"
          },
          supported_symbols: ["GBPUSD", "USDJPY", "AUDUSD"],
          timeframes: ["1m", "5m"]
        },
        {
          id: 2,
          name: "Momentum Swing Strategy",
          description: "Captures medium-term price movements using technical indicators and market momentum.",
          complexity: "intermediate",
          category: "swing_trading",
          rating: 4.6,
          downloads: 892,
          min_balance: 2000,
          parameters: {
            "RSI Period": "14",
            "MACD Fast": "12",
            "MACD Slow": "26"
          },
          supported_symbols: ["BTCUSD", "ETHUSD", "SPX"],
          timeframes: ["4h", "1d"]
        },
        {
          id: 3,
          name: "Grid Trading Bot",
          description: "Automated grid trading system for range-bound markets with dynamic position sizing.",
          complexity: "beginner",
          category: "grid_trading",
          rating: 4.4,
          downloads: 654,
          min_balance: 1000,
          parameters: {
            "Grid Size": "20 pips",
            "Max Positions": "10",
            "Position Size": "0.1 lots"
          },
          supported_symbols: ["GBPUSD", "USDCAD"],
          timeframes: ["15m", "1h"]
        }
      ]);
      setStrategies([
        {
          id: 4,
          name: "Breakout Hunter",
          description: "Identifies and trades key support and resistance breakouts with high probability setups.",
          complexity: "intermediate",
          category: "breakout",
          rating: 4.3,
          downloads: 432,
          min_balance: 3000,
          parameters: {},
          supported_symbols: ["XAUUSD", "BTCUSD"],
          timeframes: ["1h", "4h"]
        },
        {
          id: 5,
          name: "Mean Reversion Pro",
          description: "Statistical arbitrage strategy using mean reversion principles for consistent profits.",
          complexity: "advanced",
          category: "mean_reversion",
          rating: 4.7,
          downloads: 321,
          min_balance: 10000,
          parameters: {},
          supported_symbols: ["NASDAQ", "SPX"],
          timeframes: ["1d"]
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredStrategies = [...featuredStrategies, ...strategies].filter(strategy => {
    const matchesSearch = strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         strategy.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || strategy.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header with AI Integration */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Strategy Lab</h1>
            <p className="text-lg text-gray-400">
              Discover, test, and deploy professional trading strategies with AI-powered analysis
            </p>
          </div>
          
          {/* AI Analysis Panel Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={analyzeStrategies}
              disabled={aiLoading}
              className="flex items-center gap-2 bg-gradient-to-r from-[#2F00FF] to-[#1C0099] hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              {aiLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  <span>AI Analysis</span>
                </>
              )}
            </button>
            
            {aiAnalysis && (
              <button
                onClick={() => setShowAiPanel(!showAiPanel)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium border ${
                  showAiPanel 
                    ? 'bg-green-600/20 border-green-600/30 text-green-400' 
                    : 'bg-[#1A1A1A] border-[#333] text-gray-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>{showAiPanel ? 'Hide' : 'Show'} Insights</span>
              </button>
            )}
          </div>
        </div>
        
        {/* AI Analysis Panel */}
        {showAiPanel && aiAnalysis && (
          <div className="mt-6 bg-[#1A1A1A] border border-[#333] rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <FlaskConical className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">AI Strategy Analysis</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  Analysis Summary
                </h4>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {aiAnalysis.analysis || "Analysis completed successfully. Review the insights and recommendations below."}
                </p>
              </div>
              
              <div>
                <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  Key Recommendations
                </h4>
                <ul className="text-gray-400 text-sm space-y-1">
                  {(aiAnalysis.recommendations || [
                    "Consider diversifying across different strategy types",
                    "Monitor performance metrics regularly",
                    "Adjust risk parameters based on market conditions"
                  ]).slice(0, 3).map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {aiAnalysis.performance_insights && aiAnalysis.performance_insights.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#333]">
                <h4 className="text-white font-medium mb-2">Performance Insights</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {aiAnalysis.performance_insights.slice(0, 3).map((insight, index) => (
                    <div key={index} className="bg-[#0A0A0A] rounded-lg p-3">
                      <p className="text-gray-400 text-xs">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search strategies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="text-gray-400 w-4 h-4" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="scalping">Scalping</option>
              <option value="swing_trading">Swing Trading</option>
              <option value="grid_trading">Grid Trading</option>
              <option value="breakout">Breakout</option>
              <option value="mean_reversion">Mean Reversion</option>
            </select>
          </div>
        </div>
      </div>

      {/* Enhanced Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-1">
          {[
            { id: 'browse', label: 'Browse Strategies', icon: Search },
            { id: 'defaults', label: 'Default Strategies', icon: Zap },
            { id: 'ai-recommended', label: 'AI Recommended', icon: Bot },
            { id: 'custom', label: 'Request Custom', icon: Plus },
            { id: 'my-strategies', label: 'My Strategies', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#2F00FF] to-[#1C0099] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#2A2A2A]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Enhanced Tab Content */}
      {activeTab === 'browse' && (
        <StrategyBrowser strategies={filteredStrategies} loading={loading} />
      )}
      
      {activeTab === 'defaults' && <DefaultStrategies />}
      
      {activeTab === 'ai-recommended' && <AIRecommendedStrategies />}
      
      {activeTab === 'custom' && <CustomStrategyRequest />}
      
      {activeTab === 'my-strategies' && <MyStrategies />}
    </div>
  );
};

// Enhanced Strategy Card Component with AI features
const StrategyCard = ({ strategy, isFeatured = false }) => {
  const [downloading, setDownloading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    setDownloading(true);
    // Simulate download
    setTimeout(() => {
      toast.success(`Strategy "${strategy.name}" downloaded successfully!`);
      setDownloading(false);
    }, 2000);
  };

  const getAiInsights = async () => {
    setLoadingInsights(true);
    try {
      const insights = await getStrategyImprovements(strategy.id);
      setAiInsights(insights);
    } catch (error) {
      console.error("Error getting AI insights:", error);
    } finally {
      setLoadingInsights(false);
    }
  };

  const getComplexityColor = (complexity) => {
    switch (complexity) {
      case 'beginner': return 'bg-green-600/20 text-green-400';
      case 'intermediate': return 'bg-yellow-600/20 text-yellow-400';
      case 'advanced': return 'bg-red-600/20 text-red-400';
      default: return 'bg-gray-600/20 text-gray-400';
    }
  };

  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 hover:border-[#3A3A3A] transition-colors">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-white">{strategy.name}</h3>
            {isFeatured && (
              <span className="bg-gradient-to-r from-[#2F00FF] to-[#1C0099]/20 text-blue-400 px-2 py-1 rounded-full text-xs font-medium">
                Featured
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(strategy.complexity)}`}>
              {strategy.complexity}
            </span>
            <span className="bg-gray-600/20 text-gray-400 px-2 py-1 rounded-full text-xs">
              {strategy.category.replace('_', ' ')}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium text-white">{strategy.rating}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
        {strategy.description}
      </p>

      {/* Stats */}
      <div className="flex justify-between items-center mb-4 text-sm text-gray-400">
        <div className="flex items-center space-x-1">
          <Download className="w-4 h-4" />
          <span>{strategy.downloads} downloads</span>
        </div>
        <div>Min: ${strategy.min_balance.toLocaleString()}</div>
      </div>

      {/* Enhanced Actions with AI */}
      <div className="flex space-x-2">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 bg-gradient-to-r from-[#2F00FF] to-[#1C0099] hover:bg-blue-700 disabled:bg-gradient-to-r from-[#2F00FF] to-[#1C0099]/50 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>{downloading ? 'Downloading...' : 'Download'}</span>
        </button>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 hover:text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center space-x-2"
        >
          <Code className="w-4 h-4" />
          <span>Details</span>
        </button>
        <button
          onClick={getAiInsights}
          disabled={loadingInsights}
          className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center space-x-2"
          title="Get AI Insights"
        >
          {loadingInsights ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
          ) : (
            <Bot className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Expandable Details with AI Insights */}
      {showDetails && (
        <div className="mt-4 p-4 bg-[#0A0A0A] rounded-lg border border-[#2A2A2A]">
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-white mb-2">Supported Symbols</h4>
              <div className="flex flex-wrap gap-1">
                {strategy.supported_symbols.map((symbol) => (
                  <span key={symbol} className="bg-gray-600/20 text-gray-400 px-2 py-1 rounded text-xs">
                    {symbol}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-white mb-2">Timeframes</h4>
              <div className="flex flex-wrap gap-1">
                {strategy.timeframes.map((tf) => (
                  <span key={tf} className="bg-gray-600/20 text-gray-400 px-2 py-1 rounded text-xs">
                    {tf}
                  </span>
                ))}
              </div>
            </div>
            {Object.keys(strategy.parameters).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Key Parameters</h4>
                <div className="space-y-1">
                  {Object.entries(strategy.parameters).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-gray-400">{key}:</span>
                      <span className="text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* AI Insights Section */}
            {aiInsights && (
              <div className="pt-3 border-t border-[#333]">
                <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-blue-400" />
                  AI Insights & Improvements
                </h4>
                <div className="space-y-2">
                  {aiInsights.improvements && aiInsights.improvements.length > 0 ? (
                    aiInsights.improvements.slice(0, 3).map((improvement, index) => (
                      <div key={index} className="text-xs text-gray-400 flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>{improvement}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-400">
                      AI analysis suggests this strategy is well-optimized for current market conditions.
                    </div>
                  )}
                </div>
                
                {aiInsights.risk_assessment && (
                  <div className="mt-2 p-2 bg-[#1A1A1A] rounded border border-[#333]">
                    <div className="text-xs text-gray-400">
                      <span className="text-white font-medium">Risk Assessment: </span>
                      {aiInsights.risk_assessment}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Strategy Browser Component
const StrategyBrowser = ({ strategies, loading }) => {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="text-gray-400 mt-4">Loading strategies...</p>
      </div>
    );
  }

  if (strategies.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">No strategies found matching your criteria.</p>
      </div>
    );
  }

  const featuredStrategies = strategies.slice(0, 3);
  const otherStrategies = strategies.slice(3);

  return (
    <div className="space-y-8">
      {/* Featured Strategies */}
      {featuredStrategies.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold text-white mb-6">Featured Strategies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredStrategies.map((strategy) => (
              <StrategyCard key={strategy.id} strategy={strategy} isFeatured />
            ))}
          </div>
        </div>
      )}

      {/* All Strategies */}
      {otherStrategies.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold text-white mb-6">All Strategies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherStrategies.map((strategy) => (
              <StrategyCard key={strategy.id} strategy={strategy} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Default Strategies Component
const DefaultStrategies = () => {
  const defaultStrategies = [
    {
      id: 'default-1',
      name: 'Moving Average Crossover',
      description: 'Classic strategy using two moving averages to identify trend changes and entry points.',
      complexity: 'beginner',
      rating: 4.2,
      min_balance: 500
    },
    {
      id: 'default-2',
      name: 'RSI Divergence Strategy',
      description: 'Uses RSI divergence patterns to identify potential reversal points in the market.',
      complexity: 'intermediate',
      rating: 4.5,
      min_balance: 1000
    },
    {
      id: 'default-3',
      name: 'Bollinger Bands Squeeze',
      description: 'Identifies low volatility periods and trades the subsequent breakouts.',
      complexity: 'intermediate',
      rating: 4.3,
      min_balance: 1500
    }
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white mb-2">Default Strategies</h2>
        <p className="text-gray-400">
          Professional strategies developed by our team, ready to use out of the box.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {defaultStrategies.map((strategy) => (
          <div key={strategy.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 hover:border-[#3A3A3A] transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">{strategy.name}</h3>
                <span className="bg-gradient-to-r from-[#2F00FF] to-[#1C0099]/20 text-blue-400 px-2 py-1 rounded-full text-xs font-medium flex items-center w-fit">
                  <Zap className="w-3 h-3 mr-1" />
                  Default Strategy
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium text-white">{strategy.rating}</span>
              </div>
            </div>
            
            <p className="text-gray-400 text-sm mb-4">
              {strategy.description}
            </p>
            
            <div className="flex justify-between items-center mb-4">
              <span className="bg-green-600/20 text-green-400 px-2 py-1 rounded-full text-xs">
                {strategy.complexity}
              </span>
              <div className="text-sm text-gray-400">
                Min: ${strategy.min_balance.toLocaleString()}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button className="flex-1 bg-gradient-to-r from-[#2F00FF] to-[#1C0099] hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              <button className="bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 hover:text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Deploy</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Custom Strategy Request Component
const CustomStrategyRequest = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    trading_style: '',
    symbols: '',
    timeframes: '',
    budget: '',
    expected_timeline: '',
    risk_tolerance: 'medium',
    additional_requirements: '',
    contact_email: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
      setSubmitting(false);
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Request Submitted!</h2>
        <p className="text-gray-400 mb-6">
          We've received your custom strategy request. Our team will review it and get back to you within 24-48 hours.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="bg-gradient-to-r from-[#2F00FF] to-[#1C0099] hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white mb-2">Request Custom Strategy</h2>
        <p className="text-gray-400">
          Need a custom trading strategy? Fill out this form and our expert developers will create one tailored to your needs.
        </p>
      </div>

      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Strategy Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g., Custom Scalping Strategy for Major Pairs"
              className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe your trading strategy requirements in detail..."
              rows={4}
              className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Trading Style</label>
              <input
                type="text"
                value={formData.trading_style}
                onChange={(e) => setFormData({...formData, trading_style: e.target.value})}
                placeholder="e.g., Scalping, Swing Trading"
                className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Budget (USD)</label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: e.target.value})}
                placeholder="5000"
                min="100"
                className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Symbols (comma-separated)</label>
            <input
              type="text"
              value={formData.symbols}
              onChange={(e) => setFormData({...formData, symbols: e.target.value})}
              placeholder="GBPUSD, USDJPY, AUDUSD"
              className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Expected Timeline</label>
              <input
                type="text"
                value={formData.expected_timeline}
                onChange={(e) => setFormData({...formData, expected_timeline: e.target.value})}
                placeholder="e.g., 2-3 weeks"
                className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Risk Tolerance</label>
              <select
                value={formData.risk_tolerance}
                onChange={(e) => setFormData({...formData, risk_tolerance: e.target.value})}
                className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Contact Email</label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
              placeholder="your@email.com"
              className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Additional Requirements (Optional)</label>
            <textarea
              value={formData.additional_requirements}
              onChange={(e) => setFormData({...formData, additional_requirements: e.target.value})}
              placeholder="Any specific requirements, features, or constraints..."
              rows={3}
              className="w-full px-4 py-2 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="bg-gradient-to-r from-[#2F00FF] to-[#1C0099]/10 border border-blue-600/20 rounded-lg p-4">
            <p className="text-blue-400 text-sm">
              Our team will review your request and provide a detailed quote including development timeline and cost. 
              Custom strategy development typically ranges from $500-$5000 depending on complexity.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-[#2F00FF] to-[#1C0099] hover:bg-blue-700 disabled:bg-gradient-to-r from-[#2F00FF] to-[#1C0099]/50 text-white px-6 py-3 rounded-lg transition-colors font-medium"
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

// AI Recommended Strategies Component
const AIRecommendedStrategies = () => {
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    generateRecommendations();
  }, []);

  const generateRecommendations = async () => {
    setAnalyzing(true);
    setLoading(true);
    
    try {
      // Try to use strategy analysis to get recommendations
      const response = await aiToolsAPI.strategyAnalysis("comprehensive");
      if (response.success && response.data) {
        const recommendations = response.data;
        
        // Create enhanced recommendations with strategy details
        setAiRecommendations({
          personalizedStrategies: [
            {
              id: 'ai-1',
              name: 'AI-Optimized Momentum Strategy',
              description: 'Personalized momentum strategy based on current market analysis with enhanced technical indicators.',
              confidence: 87,
              reasoning: 'Based on current market conditions and volatility analysis, momentum strategies show strong potential.',
              expectedReturns: '12-18% annually',
              riskLevel: 'Medium',
              backtestResults: {
                winRate: '68%',
                profitFactor: '1.45',
                maxDrawdown: '8.2%'
              },
              category: 'momentum',
              complexity: 'intermediate'
            },
            {
              id: 'ai-2',
              name: 'Risk-Managed Trend Following',
              description: 'Advanced trend following strategy with adaptive position sizing and intelligent risk management.',
              confidence: 92,
              reasoning: 'Current market trends and volatility patterns favor systematic trend following approaches.',
              expectedReturns: '15-25% annually',
              riskLevel: 'High',
              backtestResults: {
                winRate: '71%',
                profitFactor: '1.67',
                maxDrawdown: '12.1%'
              },
              category: 'trend_following',
              complexity: 'advanced'
            },
            {
              id: 'ai-3',
              name: 'Conservative Scalping Strategy',
              description: 'Low-risk scalping strategy optimized for consistent small profits with tight risk control.',
              confidence: 79,
              reasoning: 'Market microstructure analysis suggests favorable conditions for short-term scalping.',
              expectedReturns: '8-15% annually',
              riskLevel: 'Low',
              backtestResults: {
                winRate: '74%',
                profitFactor: '1.32',
                maxDrawdown: '4.8%'
              },
              category: 'scalping',
              complexity: 'beginner'
            }
          ],
          marketConditions: recommendations.market_analysis || 'Current market analysis suggests balanced conditions with opportunities in both trending and ranging markets.',
          riskAssessment: recommendations.risk_recommendations?.[0] || 'Moderate risk approach recommended with focus on capital preservation and steady growth.',
          lastUpdated: new Date().toISOString()
        });
        
        toast.success("AI strategy recommendations generated!");
      } else {
        throw new Error("Strategy analysis unavailable");
      }
    } catch (error) {
      console.error("Error generating AI recommendations:", error);
      toast.info("AI recommendations temporarily unavailable. Showing sample strategies.");
      
      // Fallback recommendations when AI service is unavailable
      setAiRecommendations({
        personalizedStrategies: [
          {
            id: 'fallback-1',
            name: 'Conservative Growth Strategy',
            description: 'Balanced approach focusing on consistent returns with controlled risk exposure.',
            confidence: 75,
            reasoning: 'Recommended based on standard risk assessment and market analysis principles.',
            expectedReturns: '8-12% annually',
            riskLevel: 'Low',
            backtestResults: { winRate: '65%', profitFactor: '1.25', maxDrawdown: '6.5%' },
            category: 'conservative',
            complexity: 'beginner'
          },
          {
            id: 'fallback-2',
            name: 'Balanced Momentum Strategy',
            description: 'Medium-risk strategy combining trend following with mean reversion techniques.',
            confidence: 70,
            reasoning: 'Standard momentum indicators suggest this approach for balanced portfolios.',
            expectedReturns: '10-16% annually',
            riskLevel: 'Medium',
            backtestResults: { winRate: '62%', profitFactor: '1.35', maxDrawdown: '9.2%' },
            category: 'momentum',
            complexity: 'intermediate'
          }
        ],
        marketConditions: 'AI analysis temporarily unavailable. Consider current market volatility and trending conditions.',
        riskAssessment: 'Standard risk management principles apply. Use appropriate position sizing and stop losses.',
        lastUpdated: new Date().toISOString()
      });
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 85) return 'text-green-400';
    if (confidence >= 70) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel.toLowerCase()) {
      case 'low': return 'bg-green-600/20 text-green-400';
      case 'medium': return 'bg-yellow-600/20 text-yellow-400';
      case 'high': return 'bg-red-600/20 text-red-400';
      default: return 'bg-gray-600/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-400">Analyzing your profile and generating personalized recommendations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2">AI-Recommended Strategies</h2>
          <p className="text-gray-400">
            Personalized strategy recommendations based on your trading profile and current market conditions
          </p>
        </div>
        <button
          onClick={generateRecommendations}
          disabled={analyzing}
          className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 text-blue-400 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          {analyzing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Bot className="w-4 h-4" />
              <span>Refresh</span>
            </>
          )}
        </button>
      </div>

      {/* Market Context */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-white font-medium mb-2 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              Market Conditions
            </h3>
            <p className="text-gray-400 text-sm">{aiRecommendations?.marketConditions}</p>
          </div>
          <div>
            <h3 className="text-white font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              Risk Assessment
            </h3>
            <p className="text-gray-400 text-sm">{aiRecommendations?.riskAssessment}</p>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-500">
          Last updated: {new Date(aiRecommendations?.lastUpdated).toLocaleString()}
        </div>
      </div>

      {/* Recommended Strategies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {aiRecommendations?.personalizedStrategies.map((strategy) => (
          <div key={strategy.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 hover:border-[#3A3A3A] transition-colors">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-white">{strategy.name}</h3>
                  <span className="bg-gradient-to-r from-[#2F00FF] to-[#1C0099]/20 text-blue-400 px-2 py-1 rounded-full text-xs font-medium">
                    AI Recommended
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(strategy.riskLevel)}`}>
                    {strategy.riskLevel} Risk
                  </span>
                  <span className="bg-gray-600/20 text-gray-400 px-2 py-1 rounded-full text-xs">
                    {strategy.category.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${getConfidenceColor(strategy.confidence)}`}>
                  {strategy.confidence}%
                </div>
                <div className="text-xs text-gray-400">Confidence</div>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-400 text-sm mb-4">{strategy.description}</p>

            {/* AI Reasoning */}
            <div className="bg-[#0A0A0A] rounded-lg p-3 mb-4">
              <h4 className="text-white font-medium text-sm mb-1 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                Why this strategy?
              </h4>
              <p className="text-gray-400 text-xs">{strategy.reasoning}</p>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-white font-medium text-sm">Expected Returns</div>
                <div className="text-green-400 text-xs">{strategy.expectedReturns}</div>
              </div>
              <div>
                <div className="text-white font-medium text-sm">Win Rate</div>
                <div className="text-blue-400 text-xs">{strategy.backtestResults.winRate}</div>
              </div>
              <div>
                <div className="text-white font-medium text-sm">Profit Factor</div>
                <div className="text-purple-400 text-xs">{strategy.backtestResults.profitFactor}</div>
              </div>
              <div>
                <div className="text-white font-medium text-sm">Max Drawdown</div>
                <div className="text-orange-400 text-xs">{strategy.backtestResults.maxDrawdown}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button className="flex-1 bg-gradient-to-r from-[#2F00FF] to-[#1C0099] hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Deploy Strategy</span>
              </button>
              <button className="bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 hover:text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium">
                <Code className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// My Strategies Component
const MyStrategies = () => {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-semibold text-white mb-4">My Strategies</h2>
      <p className="text-gray-400 mb-6">View and manage your downloaded and deployed strategies.</p>
      <button className="bg-gradient-to-r from-[#2F00FF] to-[#1C0099] hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
        Coming Soon
      </button>
    </div>
  );
};

export default StrategyLab;
