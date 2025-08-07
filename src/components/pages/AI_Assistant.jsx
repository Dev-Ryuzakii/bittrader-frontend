import React, { useState, useEffect, useRef } from 'react';
import { chatAPI, aiToolsAPI, executeAITool, formatAIResponse, getDefaultPromptForTool } from '../../api/chat';
import { 
  BarChart3, 
  Target, 
  Scale, 
  TrendingUp, 
  Calculator, 
  Search, 
  Shield, 
  Microscope, 
  FlaskConical,
  Bot 
} from 'lucide-react';

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

// Quick action buttons for comprehensive AI features
const QUICK_ACTIONS = [
  { 
    id: 'sentiment',
    icon: BarChart3, 
    label: 'Market Sentiment',
    description: 'Analyze current market sentiment for trading pairs'
  },
  { 
    id: 'strategy',
    icon: Target, 
    label: 'Strategy Suggestions',
    description: 'Get AI-powered strategy suggestions based on market conditions'
  },
  { 
    id: 'risk',
    icon: Scale,
    label: 'Risk Analysis',
    description: 'Comprehensive portfolio risk analysis and recommendations'
  },
  { 
    id: 'patterns',
    icon: TrendingUp,
    label: 'Chart Patterns',
    description: 'Detect chart patterns and generate trading signals'
  },
  { 
    id: 'position',
    icon: Calculator,
    label: 'Position Size',
    description: 'Calculate optimal position size based on risk management'
  },
  { 
    id: 'trade-eval',
    icon: Search,
    label: 'Trade Evaluation',
    description: 'Comprehensive evaluation of trading performance'
  },
  { 
    id: 'stop-loss',
    icon: Shield,
    label: 'Stop Loss Suggestions',
    description: 'Get intelligent stop loss suggestions'
  },
  { 
    id: 'analyze-trade',
    icon: Microscope,
    label: 'Analyze Trade',
    description: 'Analyze individual trade for learning purposes'
  },
  { 
    id: 'strategy-lab',
    icon: FlaskConical,
    label: 'Strategy Lab Analysis',
    description: 'Analyze your Strategy Lab strategies with AI insights'
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
  handleQuickAction,
  selectedTool,
  setSelectedTool,
}) {
  // State for tool dropdown
  const [showToolDropdown, setShowToolDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowToolDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);
  
  return (
    <div className="min-h-screen flex flex-col bg-[#111]">
      {/* Chat Messages Area */}
      <div className="flex-grow flex flex-col">
        {chatHistory.length === 0 ? (
          /* Welcome Screen */
          <div className="flex-grow flex flex-col justify-center items-center p-6">
            <div className="text-center mb-12 max-w-2xl">
              <h1 className="text-4xl font-bold text-white mb-4">AI Trading Assistant</h1>
              <p className="text-gray-400 text-lg mb-8">
                Get comprehensive trading analysis, strategy suggestions, and market insights powered by AI
              </p>
              
              {/* Tool Selection Grid
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {QUICK_ACTIONS.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setSelectedTool(tool);
                      handleQuickAction(tool.id);
                    }}
                    className="bg-[#1A1A1A] hover:bg-[#2A2A2A] border border-[#333] rounded-lg p-4 text-left transition-colors group"
                  >
                    <div className="text-2xl mb-2">{tool.icon}</div>
                    <div className="text-white font-medium text-sm mb-1">{tool.label}</div>
                    <div className="text-gray-400 text-xs">{tool.description}</div>
                  </button>
                ))}
              </div> */}
              
              {/* Sample Prompts */}
              <div className="space-y-2">
                <h3 className="text-white text-sm font-medium mb-3">Try asking:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <button 
                    className="bg-[#1A1A1A] hover:bg-[#2A2A2A] text-gray-300 text-sm p-3 rounded-lg text-left transition-colors"
                    onClick={() => setPrompt("Analyze EURUSD sentiment and suggest entry points")}
                  >
                    "Analyze EURUSD sentiment and suggest entry points"
                  </button>
                  <button 
                    className="bg-[#1A1A1A] hover:bg-[#2A2A2A] text-gray-300 text-sm p-3 rounded-lg text-left transition-colors"
                    onClick={() => setPrompt("Create a risk management strategy for my portfolio")}
                  >
                    "Create a risk management strategy for my portfolio"
                  </button>
                  <button 
                    className="bg-[#1A1A1A] hover:bg-[#2A2A2A] text-gray-300 text-sm p-3 rounded-lg text-left transition-colors"
                    onClick={() => setPrompt("Calculate position size for 2% risk on GBPUSD")}
                  >
                    "Calculate position size for 2% risk on GBPUSD"
                  </button>
                  <button 
                    className="bg-[#1A1A1A] hover:bg-[#2A2A2A] text-gray-300 text-sm p-3 rounded-lg text-left transition-colors"
                    onClick={() => setPrompt("Detect chart patterns on major forex pairs")}
                  >
                    "Detect chart patterns on major forex pairs"
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Chat Messages */
          <div className="flex-grow p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-6">
              {chatHistory.map((message, index) => (
                <div key={index} className="flex gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.sender === 'user' 
                        ? 'bg-gradient-to-r from-[#2F00FF] to-[#1C0099]' 
                        : 'bg-green-600'
                    }`}>
                      {message.sender === 'user' ? (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  
                  {/* Message Content */}
                  <div className="flex-grow">
                    <div className="text-white font-medium text-sm mb-1">
                      {message.sender === 'user' ? 'You' : 'AI Trading Assistant'}
                    </div>
                    <div className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Loading Message */}
              {loading && (
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="text-white font-medium text-sm mb-1">AI Trading Assistant</div>
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                      <span className="text-gray-400">Analyzing your request...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="px-6 pb-2">
            <div className="max-w-4xl mx-auto">
              <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
                <button 
                  onClick={() => setError("")}
                  className="text-red-400 hover:text-red-300"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area - Fixed at Bottom */}
      <div className="border-t border-[#333] bg-[#111] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center bg-[#1A1A1A] rounded-xl border border-[#333] focus-within:border-[#555]">
              {/* Tool Selector Button */}
              <button
                onClick={() => setShowToolDropdown(!showToolDropdown)}
                className="flex items-center gap-2 px-4 py-3 text-gray-400 hover:text-white transition-colors border-r border-[#333]"
                title="Select AI Tool"
              >
                {selectedTool?.icon ? (
                  <selectedTool.icon className="w-5 h-5" />
                ) : (
                  <Bot className="w-5 h-5" />
                )}
                <span className="text-sm hidden sm:inline">{selectedTool?.label || 'General Chat'}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Text Input */}
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={`Ask ${selectedTool?.label || 'the AI assistant'} about trading analysis, strategies, or risk management...`}
                className="flex-grow bg-transparent text-white px-4 py-3 resize-none focus:outline-none min-h-[48px] max-h-32"
                rows="1"
                style={{ 
                  height: 'auto',
                  minHeight: '48px'
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                }}
              />
              
              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={loading || !prompt.trim()}
                className={`p-3 m-2 rounded-lg transition-colors ${
                  loading || !prompt.trim()
                    ? 'bg-[#333] text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#2F00FF] to-[#1C0099] text-white hover:bg-blue-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            
            {/* Tool Dropdown */}
            {showToolDropdown && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1A1A1A] border border-[#333] rounded-lg shadow-lg overflow-hidden z-50">
                <div className="p-3 border-b border-[#333]">
                  <h3 className="text-white font-medium text-sm">AI Trading Tools</h3>
                </div>
                
                {/* General Chat Option */}
                <button
                  onClick={() => {
                    setSelectedTool(null);
                    setShowToolDropdown(false);
                  }}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-[#2A2A2A] text-left transition-colors ${
                    !selectedTool ? 'bg-[#2A2A2A]' : ''
                  }`}
                >
                  <Bot className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-white font-medium text-sm">General Chat</div>
                    <div className="text-gray-400 text-xs">Open-ended trading conversations</div>
                  </div>
                </button>
                
                {/* Tool Options */}
                {QUICK_ACTIONS.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setSelectedTool(tool);
                      setShowToolDropdown(false);
                    }}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-[#2A2A2A] text-left transition-colors ${
                      selectedTool?.id === tool.id ? 'bg-[#2A2A2A]' : ''
                    }`}
                  >
                    <tool.icon className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-white font-medium text-sm">{tool.label}</div>
                      <div className="text-gray-400 text-xs">{tool.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer Text */}
          <div className="text-center mt-3">
            <p className="text-gray-500 text-xs">
              AI Trading Assistant can make mistakes. Check important trading info and use proper risk management.
            </p>
          </div>
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
  const [selectedTool, setSelectedTool] = useState(null);

  // Handle chat send with enhanced API
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
      let data;
      
      // Use specific tool API if a tool is selected
      if (selectedTool) {
        const toolOptions = prepareToolOptions(selectedTool.id, userPrompt);
        data = await executeAITool(selectedTool.id, userPrompt, toolOptions);
      } else {
        // Use enhanced chat for general conversation
        data = await chatAPI.enhancedChat(userPrompt, {
          include_market_data: true,
          include_account_data: true,
          include_trading_history: true,
          analysis_type: "comprehensive"
        });
      }
      
      // Format and add AI response to chat
      let responseText = "";
      if (selectedTool) {
        responseText = formatAIResponse(selectedTool.id, data);
      } else {
        responseText = data.data?.message || data.message || "Sorry, I couldn't generate a response.";
      }
      
      setChatHistory(prev => [...prev, {
        sender: 'ai',
        content: responseText
      }]);
      
    } catch (err) {
      setError(err.message || "An error occurred while communicating with the AI service.");
      console.error("AI chat error:", err);
      
      // Add error message to chat
      setChatHistory(prev => [...prev, {
        sender: 'ai',
        content: `Sorry, I encountered an error: ${err.message}`
      }]);
    } finally {
      setLoading(false);
    }
  }

  // Handle quick action button clicks
  const handleQuickAction = async (actionId) => {
    // Find the selected tool
    const tool = QUICK_ACTIONS.find(a => a.id === actionId);
    if (!tool) return;
    
    // Set the selected tool
    setSelectedTool(tool);
    
    // Set a default prompt for the tool
    const defaultPrompt = getDefaultPromptForTool(actionId);
    setPrompt(defaultPrompt);
    
    // Optionally auto-send the default prompt
    // Uncomment the next line if you want to auto-send
    // setTimeout(() => handleSend(), 100);
  };

  // Helper function to prepare tool options based on tool type
  const prepareToolOptions = (toolId, message) => {
    switch(toolId) {
      case 'sentiment':
        return { symbols: null };
      case 'strategy':
        return { analysis_type: "comprehensive" };
      case 'risk':
        return { include_open_positions: true };
      case 'patterns':
        return { symbol: "EURUSD", timeframe: "H4" };
      case 'position':
        return { 
          tradeSetup: {
            symbol: "EURUSD",
            entry_price: 1.1000,
            stop_loss: 1.0950,
            risk_percentage: 2.0
          }
        };
      case 'trade-eval':
        return { timeframe_days: 30 };
      case 'stop-loss':
        return { 
          tradeSetup: {
            symbol: "EURUSD",
            entry_price: 1.1000,
            direction: "BUY",
            timeframe: "H4"
          }
        };
      case 'analyze-trade':
        return { trade_id: "latest" };
      case 'strategy-lab':
        return { include_performance: true, include_insights: true };
      default:
        return {};
    }
  };

  // Load conversation history on component mount
  useEffect(() => {
    async function fetchConversationHistory() {
      try {
        const data = await chatAPI.getConversationHistory(5);
        if (data.conversations && data.conversations.length > 0) {
          // Convert conversation history to chat format
          const recentChats = data.conversations.flatMap(conv => [
            { sender: 'user', content: conv.user_message },
            { sender: 'ai', content: conv.assistant_response }
          ]);
          setChatHistory(recentChats.slice(-6)); // Show last 6 messages (3 conversations)
        }
      } catch (error) {
        console.error("Error fetching conversation history:", error);
      }
    }
    
    fetchConversationHistory();
  }, []);

  return (
    <AI_Assistant
      prompt={prompt}
      setPrompt={setPrompt}
      loading={loading}
      error={error}
      setError={setError}
      chatHistory={chatHistory}
      handleSend={handleSend}
      handleQuickAction={handleQuickAction}
      selectedTool={selectedTool}
      setSelectedTool={setSelectedTool}
    />
  );
}

export default AI_AssistantWrapper;
