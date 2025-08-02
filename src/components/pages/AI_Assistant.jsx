import React, { useState, useEffect, useRef } from 'react';
import { symbolMappingService } from '../../api/symbolMapping';

// Tabs for different AI features
const TABS = {
  CHAT: 'chat',
  SENTIMENT: 'sentiment',
  STRATEGY: 'strategy',
  RISK: 'risk',
  POSITION_SIZE: 'position',
  TRADE_EVAL: 'trade-eval',
  PATTERNS: 'patterns',
};

// Quick action buttons for ChatGPT-like dropdown
const QUICK_ACTIONS = [
  { 
    id: 'sentiment',
    icon: '📊', 
    label: 'Market Sentiment',
    description: 'Analyze current market sentiment for trading pairs' 
  },
  { 
    id: 'strategy',
    icon: '🎯', 
    label: 'Create Strategy',
    description: 'Generate custom trading strategies based on market conditions' 
  },
  { 
    id: 'risk',
    icon: '⚖️',
    label: 'Risk Analysis',
    description: 'Calculate risk/reward ratios and position sizing'
  },
  { 
    id: 'patterns',
    icon: '📈',
    label: 'Chart Patterns',
    description: 'Detect technical analysis patterns in price charts'
  },
  { 
    id: 'position',
    icon: '🔢',
    label: 'Position Size',
    description: 'Calculate optimal position size for your risk tolerance'
  },
  { 
    id: 'trade-eval',
    icon: '🔍',
    label: 'Trade Evaluation',
    description: 'Evaluate and analyze your trading performance'
  },
];

// Presentational component
function AI_Assistant({ 
  prompt, 
  setPrompt, 
  loading, 
  error, 
  chatHistory, 
  handleSend,
  activeTab,
  setActiveTab,
  sentimentData,
  strategyData,
  riskData,
  patternData,
  handleTabAction,
  symbols,
  setSymbols,
  symbol,
  setSymbol,
  entryPrice,
  setEntryPrice,
  stopLoss,
  setStopLoss,
  direction,
  setDirection,
  riskPercentage,
  setRiskPercentage,
  timeframe,
  setTimeframe,
  tradeId,
  setTradeId,
  handleQuickAction,
}) {
  // State for feature dropdown
  const [showFeatureDropdown, setShowFeatureDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowFeatureDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);
  return (
    <div className="min-h-screen flex flex-col bg-[#111]">
      {/* Main Content Area */}
      <div className="flex-grow flex flex-col justify-center items-center p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">ChatGPT</h1>
        </div>

        {/* Chat Messages - Show when there's chat history */}
        {chatHistory.length > 0 && (
          <div className="w-full max-w-4xl space-y-4 mb-8">
            {chatHistory.map((message, index) => (
              <div 
                key={index} 
                className={`px-6 py-4 rounded-lg ${
                  message.sender === 'user' 
                    ? 'bg-[#2a2a33] ml-12' 
                    : 'bg-[#2d2d8a] mr-12'
                }`}
              >
                <p className="text-white font-medium">
                  {message.sender === 'user' ? 'You' : 'AI Assistant'}
                </p>
                <p className="text-gray-200 whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}
            
            {loading && (
              <div className="bg-[#2d2d8a] px-6 py-4 rounded-lg mr-12">
                <p className="text-white font-medium">AI Assistant</p>
                <p className="text-gray-200">Thinking...</p>
              </div>
            )}
            
            {error && (
              <div className="bg-[#8a2d2d] px-6 py-4 rounded-lg">
                <p className="text-white font-medium">Error</p>
                <p className="text-gray-200">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Examples, Capabilities, Limitations - Show only when no chat history */}
        {chatHistory.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full mb-12">
            {/* Examples */}
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-[#2a2a33] rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h3 className="text-white text-lg font-semibold mb-4">Examples</h3>
              <div className="space-y-3">
                <button 
                  className="w-full bg-[#2a2a33] hover:bg-[#333] text-gray-200 p-3 rounded-lg text-sm transition-colors text-left"
                  onClick={() => setPrompt("Analyze BTCUSD sentiment for today")}
                >
                  "Analyze BTCUSD sentiment for today" →
                </button>
                <button 
                  className="w-full bg-[#2a2a33] hover:bg-[#333] text-gray-200 p-3 rounded-lg text-sm transition-colors text-left"
                  onClick={() => setPrompt("Create a scalping strategy for EURUSD")}
                >
                  "Create a scalping strategy for EURUSD" →
                </button>
                <button 
                  className="w-full bg-[#2a2a33] hover:bg-[#333] text-gray-200 p-3 rounded-lg text-sm transition-colors text-left"
                  onClick={() => setPrompt("Calculate position size for 2% risk on GBPUSD")}
                >
                  "Calculate position size for 2% risk on GBPUSD" →
                </button>
              </div>
            </div>

            {/* Capabilities */}
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-[#2a2a33] rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h3 className="text-white text-lg font-semibold mb-4">Capabilities</h3>
              <div className="space-y-3 text-gray-300 text-sm">
                <div className="bg-[#2a2a33] p-3 rounded-lg">
                  Market sentiment analysis for trading pairs
                </div>
                <div className="bg-[#2a2a33] p-3 rounded-lg">
                  Custom trading strategy generation
                </div>
                <div className="bg-[#2a2a33] p-3 rounded-lg">
                  Risk management and position sizing
                </div>
              </div>
            </div>

            {/* Limitations */}
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-[#2a2a33] rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h3 className="text-white text-lg font-semibold mb-4">Limitations</h3>
              <div className="space-y-3 text-gray-300 text-sm">
                <div className="bg-[#2a2a33] p-3 rounded-lg">
                  May occasionally generate incorrect trading information
                </div>
                <div className="bg-[#2a2a33] p-3 rounded-lg">
                  Not real-time market data - use for educational purposes
                </div>
                <div className="bg-[#2a2a33] p-3 rounded-lg">
                  Limited knowledge of current market events
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Box - Always visible */}
      <div className="relative mx-4 mb-6 mt-2">
        {/* Quick Features Dropdown */}
        <div className="relative max-w-4xl mx-auto" ref={dropdownRef}>
          <div className="flex gap-4">
            <div className="relative flex-grow bg-[#333] rounded-xl flex items-center">
              {/* Feature toggle button */}
              <button 
                onClick={() => setShowFeatureDropdown(!showFeatureDropdown)}
                className="absolute left-3 text-gray-400 hover:text-white p-1 rounded transition-colors z-10"
                title="Quick actions"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v18M3 12h18"></path>
                </svg>
              </button>
              
              {/* Input with padding for the icon */}
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-transparent text-white p-4 pl-12 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ask me about market analysis, trading strategies, or risk management..."
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
            </div>
            
            <button 
              onClick={handleSend}
              disabled={loading || !prompt.trim()}
              className={`px-6 py-2 rounded-xl font-semibold text-white ${
                loading || !prompt.trim() ? 'bg-[#444] cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              } transition-colors`}
            >
              Send
            </button>
          </div>
          
          {/* Feature Dropdown Menu */}
          {showFeatureDropdown && (
            <div className="absolute z-20 left-0 right-0 mt-2 bg-[#333] rounded-xl shadow-lg overflow-hidden">
              <div className="p-2 bg-[#222] border-b border-[#444] text-white font-medium">
                Quick Actions
              </div>
              
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#444] text-left text-white transition-colors"
                  onClick={() => {
                    handleQuickAction(action.id);
                    setShowFeatureDropdown(false);
                  }}
                >
                  <span className="text-xl">{action.icon}</span>
                  <div>
                    <div className="font-medium">{action.label}</div>
                    <div className="text-sm text-gray-300">{action.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Container component with state and logic
function AI_AssistantWrapper() {
  // Chat state
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  
  // Tab state
  const [activeTab, setActiveTab] = useState(TABS.CHAT);
  
  // Form states
  const [symbol, setSymbol] = useState("");
  const [timeframe, setTimeframe] = useState("1h");
  const [direction, setDirection] = useState("buy");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [riskPercentage, setRiskPercentage] = useState("1");
  const [tradeId, setTradeId] = useState("");
  const [symbols, setSymbols] = useState([]);
  
  // Data states
  const [sentimentData, setSentimentData] = useState(null);
  const [strategyData, setStrategyData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [patternData, setPatternData] = useState(null);

  // Handle chat send
  async function handleSend(e) {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError("");
    
    // Add user message to chat
    setChatHistory(prev => [...prev, {
      sender: 'user',
      content: prompt
    }]);
    
    const userPrompt = prompt;
    setPrompt(""); // Clear input immediately
    
    try {
      // Call API endpoint
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userPrompt })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Add AI response to chat
      setChatHistory(prev => [...prev, {
        sender: 'ai',
        content: data.message || (data.data && data.data.message) || data.response || "Sorry, I couldn't generate a response."
      }]);
    } catch (err) {
      setError(err.message || "An error occurred while communicating with the AI service.");
      console.error("AI chat error:", err);
    } finally {
      setLoading(false);
    }
  }

  // Handle tab-specific actions
  async function handleTabAction(tab) {
    setLoading(true);
    setError("");
    
    try {
      let endpoint = "";
      let requestData = {};
      
      // Determine endpoint and data based on tab
      switch (tab) {
        case TABS.SENTIMENT:
          endpoint = "/api/ai/sentiment";
          requestData = { symbol, timeframe };
          break;
        case TABS.STRATEGY:
          endpoint = "/api/ai/strategy";
          requestData = { symbol, timeframe };
          break;
        case TABS.RISK:
        case TABS.POSITION_SIZE:
          endpoint = "/api/ai/risk";
          requestData = { 
            symbol, 
            direction,
            entryPrice: parseFloat(entryPrice),
            stopLoss: parseFloat(stopLoss),
            riskPercentage: parseFloat(riskPercentage)
          };
          break;
        case TABS.TRADE_EVAL:
          endpoint = "/api/ai/evaluate-trade";
          requestData = { tradeId, symbol };
          break;
        case TABS.PATTERNS:
          endpoint = "/api/ai/patterns";
          requestData = { symbol, timeframe };
          break;
        default:
          throw new Error("Unknown tab action");
      }
      
      // Call API
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update corresponding data state based on tab
      switch (tab) {
        case TABS.SENTIMENT:
          setSentimentData(data);
          break;
        case TABS.STRATEGY:
          setStrategyData(data);
          break;
        case TABS.RISK:
        case TABS.POSITION_SIZE:
          setRiskData(data);
          break;
        case TABS.TRADE_EVAL:
          // Handle trade evaluation response
          break;
        case TABS.PATTERNS:
          setPatternData(data);
          break;
      }
    } catch (err) {
      setError(err.message || "An error occurred while communicating with the AI service.");
      console.error("AI action error:", err);
    } finally {
      setLoading(false);
    }
  }

  // Handle quick action button clicks
  const handleQuickAction = (actionId) => {
    // Handle different quick actions by sending appropriate prompts to chat
    switch(actionId) {
      case 'sentiment':
        setPrompt("Analyze the current market sentiment for BTCUSD and provide insights on potential price movements.");
        break;
      case 'strategy':
        setPrompt("Create a comprehensive trading strategy for EURUSD including entry/exit rules and risk management.");
        break;
      case 'risk':
        setPrompt("Help me analyze the risk/reward ratio for a trade on GBPUSD with entry at 1.2500, stop loss at 1.2450, and take profit at 1.2600.");
        break;
      case 'patterns':
        setPrompt("Detect and analyze current chart patterns on the 4H timeframe for major currency pairs.");
        break;
      case 'position':
        setPrompt("Calculate the optimal position size for a trade with 2% account risk on EURUSD.");
        break;
      case 'trade-eval':
        setPrompt("Evaluate my recent trading performance and suggest improvements to my strategy.");
        break;
      default:
        break;
    }
  };

  // Load available symbols on component mount
  useEffect(() => {
    async function fetchSymbols() {
      try {
        const response = await fetch("/api/symbols");
        if (response.ok) {
          const data = await response.json();
          setSymbols(data.symbols || []);
        }
      } catch (error) {
        console.error("Error fetching symbols:", error);
      }
    }
    
    fetchSymbols();
  }, []);

  return (
    <AI_Assistant
      // Chat props
      prompt={prompt}
      setPrompt={setPrompt}
      loading={loading}
      error={error}
      chatHistory={chatHistory}
      handleSend={handleSend}
      
      // Tab props
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      
      // Data props
      sentimentData={sentimentData}
      strategyData={strategyData}
      riskData={riskData}
      patternData={patternData}
      
      // Form props
      symbol={symbol}
      setSymbol={setSymbol}
      symbols={symbols}
      setSymbols={setSymbols}
      timeframe={timeframe}
      setTimeframe={setTimeframe}
      direction={direction}
      setDirection={setDirection}
      entryPrice={entryPrice}
      setEntryPrice={setEntryPrice}
      stopLoss={stopLoss}
      setStopLoss={setStopLoss}
      riskPercentage={riskPercentage}
      setRiskPercentage={setRiskPercentage}
      tradeId={tradeId}
      setTradeId={setTradeId}
      
      // Action handlers
      handleTabAction={handleTabAction}
      handleQuickAction={handleQuickAction}
    />
  );
}

export default AI_AssistantWrapper;
