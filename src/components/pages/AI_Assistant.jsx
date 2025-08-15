import React, { useState, useEffect, useRef } from 'react';
import { 
  chatAPI, 
  aiToolsAPI, 
  strategyLabAI,
  marketDataAPI,
  memoryAPI,
  executeAITool, 
  formatAIResponse, 
  getDefaultPromptForTool 
} from '../../api/chat';
import { useToast } from '../../contexts/ToastContext';
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
  Bot,
  MessageSquare,
  Clock,
  Globe,
  Activity,
  PieChart,
  Lightbulb,
  Settings
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

// Enhanced quick action buttons with comprehensive AI features
const QUICK_ACTIONS = [
  { 
    id: 'sentiment',
    icon: BarChart3, 
    label: 'Market Sentiment',
    description: 'Analyze current market sentiment with news integration',
    category: 'analysis'
  },
  { 
    id: 'strategy',
    icon: Target, 
    label: 'Strategy Suggestions',
    description: 'Comprehensive strategy analysis based on market conditions',
    category: 'strategy'
  },
  { 
    id: 'risk',
    icon: Scale,
    label: 'Risk Analysis',
    description: 'Portfolio risk analysis with optimization recommendations',
    category: 'analysis'
  },
  { 
    id: 'portfolio',
    icon: PieChart,
    label: 'Portfolio Analysis',
    description: 'Comprehensive portfolio insights and diversification analysis',
    category: 'analysis'
  },
  { 
    id: 'patterns',
    icon: TrendingUp,
    label: 'Chart Patterns',
    description: 'Detect patterns with trading signals and technical analysis',
    category: 'analysis'
  },
  { 
    id: 'opportunity',
    icon: Lightbulb,
    label: 'Trading Opportunities',
    description: 'Multi-timeframe opportunity analysis with confidence scoring',
    category: 'strategy'
  },
  { 
    id: 'position',
    icon: Calculator,
    label: 'Position Size',
    description: 'Calculate optimal position size with volatility adjustment',
    category: 'tools'
  },
  { 
    id: 'trade-eval',
    icon: Search,
    label: 'Trade Evaluation',
    description: 'Performance evaluation with improvement suggestions',
    category: 'analysis'
  },
  { 
    id: 'stop-loss',
    icon: Shield,
    label: 'Stop Loss Suggestions',
    description: 'Intelligent stop loss based on market structure',
    category: 'tools'
  },
  { 
    id: 'analyze-trade',
    icon: Microscope,
    label: 'Analyze Trade',
    description: 'Individual trade analysis for learning insights',
    category: 'analysis'
  },
  { 
    id: 'strategy-lab',
    icon: FlaskConical,
    label: 'Strategy Lab Analysis',
    description: 'Analyze Strategy Lab strategies with backtesting results',
    category: 'strategy'
  },
  { 
    id: 'market-data',
    icon: Activity,
    label: 'Real-Time Data',
    description: 'Get real-time market data with volatility analysis',
    category: 'data'
  },
  { 
    id: 'technical-indicators',
    icon: TrendingUp,
    label: 'Technical Indicators',
    description: 'RSI, MACD, Bollinger Bands with trading signals',
    category: 'data'
  },
  { 
    id: 'economic-events',
    icon: Globe,
    label: 'Economic Events',
    description: 'Upcoming events and their potential market impact',
    category: 'data'
  }
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
  chatSessions,
  currentSessionId,
  handleCreateSession,
  handleSwitchSession,
  contextSummary,
}) {
  // State for tool dropdown and session management
  const [showToolDropdown, setShowToolDropdown] = useState(false);
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const dropdownRef = useRef(null);
  const sessionDropdownRef = useRef(null);
  
  // Categories for tool organization
  const categories = [
    { id: 'all', label: 'All Tools' },
    { id: 'analysis', label: 'Analysis' },
    { id: 'strategy', label: 'Strategy' },
    { id: 'tools', label: 'Tools' },
    { id: 'data', label: 'Market Data' }
  ];
  
  // Filter tools by category
  const filteredTools = selectedCategory === 'all' 
    ? QUICK_ACTIONS 
    : QUICK_ACTIONS.filter(tool => tool.category === selectedCategory);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowToolDropdown(false);
      }
      if (sessionDropdownRef.current && !sessionDropdownRef.current.contains(event.target)) {
        setShowSessionDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef, sessionDropdownRef]);
  
  return (
    <div className="min-h-screen flex flex-col bg-[#111]">
      {/* Header with Session Management */}
      <div className="border-b border-[#333] bg-[#111] p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">AI Trading Assistant</h1>
            {contextSummary && (
              <div className="text-sm text-gray-400">
                Context: {contextSummary.key_topics?.slice(0, 2).join(', ') || 'General trading'}
              </div>
            )}
          </div>
          
          {/* Session Management */}
          <div className="flex items-center gap-2">
            <div className="relative" ref={sessionDropdownRef}>
              <button
                onClick={() => setShowSessionDropdown(!showSessionDropdown)}
                className="flex items-center gap-2 px-3 py-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] rounded-lg border border-[#333] text-white text-sm transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Session {currentSessionId || '1'}</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showSessionDropdown && (
                <div className="absolute top-full right-0 mt-1 w-64 bg-[#1A1A1A] border border-[#333] rounded-lg shadow-lg z-50">
                  <div className="p-3 border-b border-[#333]">
                    <button
                      onClick={handleCreateSession}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-[#2F00FF] hover:bg-[#1C0099] rounded text-white text-sm transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      New Chat Session
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {chatSessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => handleSwitchSession(session.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2A2A2A] text-left transition-colors ${
                          session.id === currentSessionId ? 'bg-[#2A2A2A]' : ''
                        }`}
                      >
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div className="flex-grow min-w-0">
                          <div className="text-white text-sm font-medium truncate">
                            {session.name || `Session ${session.id}`}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {new Date(session.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
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
              
              {/* Enhanced Sample Prompts */}
              <div className="space-y-2">
                <h3 className="text-white text-sm font-medium mb-3">Try asking:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <button 
                    className="bg-[#1A1A1A] hover:bg-[#2A2A2A] text-gray-300 text-sm p-3 rounded-lg text-left transition-colors"
                    onClick={() => setPrompt("Analyze market sentiment with news integration and suggest entry points")}
                  >
                    "Analyze market sentiment with news integration and suggest entry points"
                  </button>
                  <button 
                    className="bg-[#1A1A1A] hover:bg-[#2A2A2A] text-gray-300 text-sm p-3 rounded-lg text-left transition-colors"
                    onClick={() => setPrompt("Provide comprehensive portfolio analysis with diversification insights")}
                  >
                    "Provide comprehensive portfolio analysis with diversification insights"
                  </button>
                  <button 
                    className="bg-[#1A1A1A] hover:bg-[#2A2A2A] text-gray-300 text-sm p-3 rounded-lg text-left transition-colors"
                    onClick={() => setPrompt("Detect chart patterns with trading signals and technical analysis")}
                  >
                    "Detect chart patterns with trading signals and technical analysis"
                  </button>
                  <button 
                    className="bg-[#1A1A1A] hover:bg-[#2A2A2A] text-gray-300 text-sm p-3 rounded-lg text-left transition-colors"
                    onClick={() => setPrompt("Analyze my Strategy Lab strategies with backtesting insights")}
                  >
                    "Analyze my Strategy Lab strategies with backtesting insights"
                  </button>
                  <button 
                    className="bg-[#1A1A1A] hover:bg-[#2A2A2A] text-gray-300 text-sm p-3 rounded-lg text-left transition-colors"
                    onClick={() => setPrompt("Show real-time market data with volatility analysis")}
                  >
                    "Show real-time market data with volatility analysis"
                  </button>
                  <button 
                    className="bg-[#1A1A1A] hover:bg-[#2A2A2A] text-gray-300 text-sm p-3 rounded-lg text-left transition-colors"
                    onClick={() => setPrompt("Calculate technical indicators with trading signals")}
                  >
                    "Calculate technical indicators with trading signals"
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
            
            {/* Enhanced Tool Dropdown */}
            {showToolDropdown && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1A1A1A] border border-[#333] rounded-lg shadow-lg overflow-hidden z-50">
                <div className="p-3 border-b border-[#333]">
                  <h3 className="text-white font-medium text-sm mb-3">AI Trading Tools</h3>
                  
                  {/* Category Filter */}
                  <div className="flex gap-1 mb-3">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-2 py-1 rounded text-xs transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-[#2F00FF] text-white'
                            : 'bg-[#2A2A2A] text-gray-400 hover:text-white'
                        }`}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="max-h-80 overflow-y-auto">
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
                      <div className="text-white font-medium text-sm">Enhanced Chat</div>
                      <div className="text-gray-400 text-xs">Open-ended conversations with comprehensive analysis</div>
                    </div>
                  </button>
                  
                  {/* Filtered Tool Options */}
                  {filteredTools.map((tool) => (
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
              </div>
            )}
          </div>
          
          {/* Enhanced Footer Text */}
          <div className="text-center mt-3">
            <p className="text-gray-500 text-xs">
              Enhanced AI Trading Assistant with real-time data, technical analysis, and portfolio insights. Check important trading info and use proper risk management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced container component with state and logic
function AI_AssistantWrapper() {
  // Chat state
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedTool, setSelectedTool] = useState(null);
  
  // Session management state
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [contextSummary, setContextSummary] = useState(null);
  
  // Toast for notifications
  const { toast } = useToast();

  // Enhanced handle chat send with new API features
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
        // Use enhanced chat for general conversation with comprehensive analysis
        data = await chatAPI.enhancedChat(userPrompt, {
          include_market_data: true,
          include_technical_analysis: true,
          include_news: true,
          include_account_data: true,
          include_trading_history: true,
          analysis_type: "comprehensive",
          chat_session_id: currentSessionId
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
      
      // Update context summary after conversation
      await updateContextSummary();
      
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

  // Session management functions with fallback handling
  const handleCreateSession = async () => {
    try {
      const response = await chatAPI.createChatSession(`Trading Session ${new Date().toLocaleDateString()}`);
      
      if (response.success && response.data) {
        const newSession = response.data;
        setChatSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
        setChatHistory([]); // Clear chat for new session
        await updateContextSummary();
        toast.success("New chat session created!");
      } else {
        // Feature not implemented yet, create local session
        const localSession = {
          id: Date.now().toString(),
          name: `Local Session ${new Date().toLocaleDateString()}`,
          created_at: new Date().toISOString()
        };
        setChatSessions(prev => [localSession, ...prev]);
        setCurrentSessionId(localSession.id);
        setChatHistory([]);
        toast.info("Session management not yet available - using local session");
      }
    } catch (error) {
      // Fallback to local session management
      const localSession = {
        id: Date.now().toString(),
        name: `Local Session ${new Date().toLocaleDateString()}`,
        created_at: new Date().toISOString()
      };
      setChatSessions(prev => [localSession, ...prev]);
      setCurrentSessionId(localSession.id);
      setChatHistory([]);
      toast.info("Using local session management");
      console.log("Session management not yet implemented, using local fallback");
    }
  };

  const handleSwitchSession = async (sessionId) => {
    try {
      const response = await chatAPI.switchChatSession(sessionId);
      
      if (response.success) {
        setCurrentSessionId(sessionId);
        
        // Load conversation history for this session
        const historyResponse = await chatAPI.getConversationHistory(20, sessionId);
        if (historyResponse.conversations) {
          const sessionChats = historyResponse.conversations.flatMap(conv => [
            { sender: 'user', content: conv.user_message },
            { sender: 'ai', content: conv.assistant_response }
          ]);
          setChatHistory(sessionChats);
        }
        
        await updateContextSummary();
        toast.success("Switched to session successfully!");
      } else {
        // Feature not implemented, switch locally
        setCurrentSessionId(sessionId);
        setChatHistory([]); // Clear for local session switch
        toast.info("Session switching not yet available - cleared chat locally");
      }
    } catch (error) {
      // Fallback to local session switching
      setCurrentSessionId(sessionId);
      setChatHistory([]);
      toast.info("Using local session switching");
      console.log("Session switching not yet implemented, using local fallback");
    }
  };

  // Update context summary with fallback
  const updateContextSummary = async () => {
    try {
      const summary = await memoryAPI.getContextSummary(currentSessionId);
      if (summary.success && summary.data) {
        setContextSummary(summary.data);
      } else {
        // Feature not implemented, create local context
        setContextSummary({
          key_topics: chatHistory.length > 0 ? ['Trading Analysis', 'Market Research'] : ['General Trading'],
          last_updated: new Date().toISOString()
        });
      }
    } catch (error) {
      // Fallback to local context summary
      setContextSummary({
        key_topics: chatHistory.length > 0 ? ['Trading Analysis', 'Market Research'] : ['General Trading'],
        last_updated: new Date().toISOString()
      });
      console.log("Context summary not yet implemented, using local fallback");
    }
  };
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

  // Enhanced helper function to prepare tool options
  const prepareToolOptions = (toolId, message) => {
    switch(toolId) {
      case 'sentiment':
        return { symbols: null };
      case 'strategy':
        return { analysis_type: "comprehensive" };
      case 'risk':
        return { include_open_positions: true };
      case 'portfolio':
        return {};
      case 'patterns':
        return { symbol: "", timeframe: "H4" };
      case 'opportunity':
        return { symbol: "EURUSD" };
      case 'position':
        return { 
          tradeSetup: {
            symbol: "",
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
            symbol: "",
            entry_price: 1.1000,
            direction: "BUY",
            timeframe: "H4"
          }
        };
      case 'analyze-trade':
        return { trade_id: "latest" };
      case 'strategy-lab':
        return { include_performance: true, include_insights: true };
      case 'market-data':
        return { symbols: ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD"] };
      case 'technical-indicators':
        return { symbol: "EURUSD", timeframe: "H4" };
      case 'economic-events':
        return {};
      default:
        return {};
    }
  };

  // Enhanced initialization with fallback handling
  useEffect(() => {
    async function initializeAssistant() {
      try {
        // Try to load conversation sessions
        const sessionResponse = await chatAPI.getConversationHistory(50);
        if (sessionResponse.success && sessionResponse.conversations) {
          // Group conversations by session
          const sessions = sessionResponse.conversations.reduce((acc, conv) => {
            const sessionId = conv.session_id || 'default';
            if (!acc[sessionId]) {
              acc[sessionId] = {
                id: sessionId,
                name: conv.session_name || `Session ${sessionId}`,
                created_at: conv.created_at || new Date().toISOString(),
                conversations: []
              };
            }
            acc[sessionId].conversations.push(conv);
            return acc;
          }, {});
          
          const sessionList = Object.values(sessions).sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          );
          
          setChatSessions(sessionList);
          
          // Set current session to most recent or create new one
          if (sessionList.length > 0) {
            const latestSession = sessionList[0];
            setCurrentSessionId(latestSession.id);
            
            // Load recent chats from latest session
            const recentChats = latestSession.conversations
              .slice(-3)
              .flatMap(conv => [
                { sender: 'user', content: conv.user_message },
                { sender: 'ai', content: conv.assistant_response }
              ]);
            setChatHistory(recentChats);
          }
        } else {
          // No conversation history available or feature not implemented
          console.log("Conversation history not available, starting fresh");
          
          // Create a default local session
          const defaultSession = {
            id: 'default',
            name: 'Default Session',
            created_at: new Date().toISOString()
          };
          setChatSessions([defaultSession]);
          setCurrentSessionId('default');
        }
        
        // Try to load context summary
        await updateContextSummary();
        
      } catch (error) {
        console.log("Error initializing AI assistant, using fallback:", error);
        
        // Create a default session if initialization fails
        const defaultSession = {
          id: 'fallback',
          name: 'Local Session',
          created_at: new Date().toISOString()
        };
        setChatSessions([defaultSession]);
        setCurrentSessionId('fallback');
        
        // Set basic context
        setContextSummary({
          key_topics: ['General Trading'],
          last_updated: new Date().toISOString()
        });
      }
    }
    
    initializeAssistant();
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
      chatSessions={chatSessions}
      currentSessionId={currentSessionId}
      handleCreateSession={handleCreateSession}
      handleSwitchSession={handleSwitchSession}
      contextSummary={contextSummary}
    />
  );
}

export default AI_AssistantWrapper;
