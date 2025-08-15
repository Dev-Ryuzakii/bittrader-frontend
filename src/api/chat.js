// src/api/chat.js
import api from './api.js';

/**
 * AI Trading Assistant API utilities
 * Comprehensive AI-powered trading assistant with sentiment analysis, strategy suggestions,
 * risk management, trade evaluation, and chart pattern detection
 */

// AI Chat API functions
export const chatAPI = {
  // Basic chat endpoint
  chat: async (message, options = {}) => {
    try {
      const payload = {
        message,
        include_market_data: options.include_market_data ?? true,
        include_account_data: options.include_account_data ?? true,
        include_trading_history: options.include_trading_history ?? true,
      };
      
      const response = await api.post('/chat', payload);
      return response.data;
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  },

  // Enhanced chat with comprehensive analysis
  enhancedChat: async (message, options = {}) => {
    try {
      const payload = {
        message,
        include_market_data: options.include_market_data ?? true,
        include_account_data: options.include_account_data ?? true,
        include_trading_history: options.include_trading_history ?? true,
        analysis_type: options.analysis_type ?? "comprehensive"
      };
      
      const response = await api.post('/chat/enhanced', payload);
      return response.data;
    } catch (error) {
      console.error('Enhanced chat error:', error);
      throw error;
    }
  },

  // Get conversation history
  getConversationHistory: async (limit = 20) => {
    try {
      const response = await api.get(`/conversations?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Get conversation history error:', error);
      throw error;
    }
  },

  // Get user profile
  getUserProfile: async () => {
    try {
      const response = await api.get('/profile');
      return response.data;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  },

  // Update user profile
  updateUserProfile: async (profileData) => {
    try {
      const response = await api.put('/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }
};

// AI Analysis Tools API functions
export const aiToolsAPI = {
  // Market sentiment analysis
  sentimentAnalysis: async (symbols = null, message = null) => {
    try {
      const payload = {};
      if (symbols) payload.symbols = symbols;
      
      const response = await api.post('/sentiment-analysis', payload);
      return response.data;
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      throw error;
    }
  },

  // Strategy suggestions
  strategyAnalysis: async (analysisType = "comprehensive", message = null) => {
    try {
      const payload = { analysis_type: analysisType };
      
      const response = await api.post('/strategy-suggestions', payload);
      return response.data;
    } catch (error) {
      console.error('Strategy analysis error:', error);
      throw error;
    }
  },

  // Risk analysis
  riskAnalysis: async (includeOpenPositions = true, message = null) => {
    try {
      const payload = { include_open_positions: includeOpenPositions };
      
      const response = await api.post('/risk-analysis', payload);
      return response.data;
    } catch (error) {
      console.error('Risk analysis error:', error);
      throw error;
    }
  },

  // Position size calculation
  calculatePositionSize: async (tradeSetup, message = null) => {
    try {
      const payload = {
        symbol: tradeSetup.symbol || "",
        entry_price: parseFloat(tradeSetup.entry_price) || 1.1000,
        stop_loss: parseFloat(tradeSetup.stop_loss) || 1.0950,
        risk_percentage: parseFloat(tradeSetup.risk_percentage) || 2.0
      };
      
      const response = await api.post('/calculate-position-size', payload);
      return response.data;
    } catch (error) {
      console.error('Position size calculation error:', error);
      throw error;
    }
  },

  // Trade evaluation
  tradeEvaluation: async (timeframeDays = 30, message = null) => {
    try {
      const payload = { timeframe_days: timeframeDays };
      
      const response = await api.post('/trade-evaluation', payload);
      return response.data;
    } catch (error) {
      console.error('Trade evaluation error:', error);
      throw error;
    }
  },

  // Individual trade analysis
  analyzeTrade: async (tradeId = "latest", message = null) => {
    try {
      const payload = { trade_id: tradeId };
      
      const response = await api.post('/analyze-trade', payload);
      return response.data;
    } catch (error) {
      console.error('Analyze trade error:', error);
      throw error;
    }
  },

  // Chart pattern detection
  detectPatterns: async (symbol = "", timeframe = "H4", message = null) => {
    try {
      const payload = { symbol, timeframe };
      
      const response = await api.post('/detect-patterns', payload);
      return response.data;
    } catch (error) {
      console.error('Pattern detection error:', error);
      throw error;
    }
  },

  // Stop loss suggestions
  stopLossSuggestions: async (tradeSetup, message = null) => {
    try {
      const payload = {
        symbol: tradeSetup.symbol || "",
        entry_price: parseFloat(tradeSetup.entry_price) || 1.1000,
        direction: tradeSetup.direction || "BUY",
        timeframe: tradeSetup.timeframe || "H4"
      };
      
      const response = await api.post('/stop-loss-suggestions', payload);
      return response.data;
    } catch (error) {
      console.error('Stop loss suggestions error:', error);
      throw error;
    }
  }
};

// Strategy Lab AI Integration API functions
export const strategyLabAI = {
  // Analyze Strategy Lab strategies
  analyzeStrategies: async (includePerformance = true, includeInsights = true) => {
    try {
      const payload = {
        include_performance: includePerformance,
        include_insights: includeInsights
      };
      
      const response = await api.post('/strategy-lab/analyze', payload);
      return response.data;
    } catch (error) {
      console.error('Strategy Lab analysis error:', error);
      throw error;
    }
  },

  // Analyze specific strategy performance
  analyzeStrategyPerformance: async (strategyId) => {
    try {
      const payload = { strategy_id: strategyId };
      
      const response = await api.post('/strategy-lab/performance', payload);
      return response.data;
    } catch (error) {
      console.error('Strategy performance analysis error:', error);
      throw error;
    }
  },

  // Get strategy improvements
  getStrategyImprovements: async (strategyId) => {
    try {
      const payload = { strategy_id: strategyId };
      
      const response = await api.post('/strategy-lab/improvements', payload);
      return response.data;
    } catch (error) {
      console.error('Strategy improvements error:', error);
      throw error;
    }
  },

  // AI learning from strategies
  learnFromStrategies: async (updateProfile = true) => {
    try {
      const payload = { update_profile: updateProfile };
      
      const response = await api.post('/strategy-lab/learn', payload);
      return response.data;
    } catch (error) {
      console.error('Strategy learning error:', error);
      throw error;
    }
  },

  // Get user strategies with AI analysis
  getUserStrategiesWithAnalysis: async () => {
    try {
      const response = await api.get('/strategy-lab/strategies');
      return response.data;
    } catch (error) {
      console.error('Get user strategies error:', error);
      throw error;
    }
  }
};

// Helper function to map tool IDs to API calls
export const executeAITool = async (toolId, userMessage, options = {}) => {
  try {
    switch (toolId) {
      case 'sentiment':
        return await aiToolsAPI.sentimentAnalysis(options.symbols, userMessage);
      
      case 'strategy':
        return await aiToolsAPI.strategyAnalysis(options.analysis_type, userMessage);
      
      case 'risk':
        return await aiToolsAPI.riskAnalysis(options.include_open_positions, userMessage);
      
      case 'patterns':
        return await aiToolsAPI.detectPatterns(options.symbol, options.timeframe, userMessage);
      
      case 'position':
        return await aiToolsAPI.calculatePositionSize(options.tradeSetup, userMessage);
      
      case 'trade-eval':
        return await aiToolsAPI.tradeEvaluation(options.timeframe_days, userMessage);
      
      case 'stop-loss':
        return await aiToolsAPI.stopLossSuggestions(options.tradeSetup, userMessage);
      
      case 'analyze-trade':
        return await aiToolsAPI.analyzeTrade(options.trade_id, userMessage);
      
      case 'strategy-lab':
        return await strategyLabAI.analyzeStrategies(options.include_performance, options.include_insights);
      
      default:
        // Fallback to enhanced chat
        return await chatAPI.enhancedChat(userMessage, options);
    }
  } catch (error) {
    console.error(`Error executing AI tool ${toolId}:`, error);
    throw error;
  }
};

// Response formatting helpers
export const formatAIResponse = (toolId, data) => {
  try {
    if (data.success && data.data) {
      const responseData = data.data;
      
      switch(toolId) {
        case 'sentiment':
          if (responseData.overall_sentiment) {
            return `Market Sentiment Analysis:\n\nOverall Sentiment: ${responseData.overall_sentiment}\n\n${responseData.analysis || JSON.stringify(responseData, null, 2)}`;
          }
          break;
          
        case 'strategy':
          if (responseData.strategies) {
            return `Trading Strategies:\n\n${responseData.strategies.map((s, i) => `${i + 1}. ${s.name}: ${s.description}`).join('\n\n')}`;
          }
          break;
          
        case 'risk':
          if (responseData.risk_score) {
            return `Risk Analysis:\n\nRisk Score: ${responseData.risk_score}/10\n\nRecommendations:\n${responseData.recommendations?.join('\n') || 'No specific recommendations available.'}`;
          }
          break;
          
        case 'patterns':
          if (responseData.patterns) {
            return `Chart Patterns Detected:\n\n${responseData.patterns.map(p => `• ${p.pattern}: ${p.confidence}% confidence - ${p.signal}`).join('\n')}`;
          }
          break;
          
        case 'position':
          if (responseData.position_size) {
            return `Position Size Calculation:\n\nRecommended Size: ${responseData.position_size}\nRisk Amount: ${responseData.risk_amount}\nRisk/Reward: ${responseData.risk_reward_ratio}`;
          }
          break;
          
        case 'trade-eval':
          if (responseData.performance_score) {
            return `Trading Performance:\n\nScore: ${responseData.performance_score}/10\n\nKey Insights:\n${responseData.insights?.join('\n') || 'Analysis completed successfully.'}`;
          }
          break;
          
        case 'stop-loss':
          if (responseData.suggestions) {
            return `Stop Loss Suggestions:\n\n${responseData.suggestions.map(s => `• ${s.method}: ${s.level} (${s.reasoning})`).join('\n')}`;
          }
          break;
          
        case 'analyze-trade':
          if (responseData.analysis) {
            return `Trade Analysis:\n\n${responseData.analysis}\n\nKey Learnings:\n${responseData.learnings?.join('\n') || 'Analysis completed.'}`;
          }
          break;
          
        case 'strategy-lab':
          if (responseData.analysis) {
            return `Strategy Lab Analysis:\n\n${responseData.analysis}\n\nRecommendations:\n${responseData.recommendations?.join('\n') || 'No specific recommendations.'}`;
          }
          break;
          
        default:
          if (responseData.message) return responseData.message;
          return JSON.stringify(responseData, null, 2);
      }
    }
    
    // Fallback
    return data.data?.message || data.message || "Analysis completed successfully.";
    
  } catch (error) {
    console.error('Error formatting response:', error);
    return data.data?.message || data.message || "Analysis completed successfully.";
  }
};

// Default prompts for each tool
export const getDefaultPromptForTool = (toolId) => {
  switch(toolId) {
    case 'sentiment':
      return "Analyze current market sentiment for major trading pairs";
    case 'strategy':
      return "Generate trading strategies based on current market conditions";
    case 'risk':
      return "Analyze my portfolio risk and provide recommendations";
    case 'patterns':
      return "Detect chart patterns on major currency pairs";
    case 'position':
      return "Calculate optimal position size with proper risk management";
    case 'trade-eval':
      return "Evaluate my recent trading performance";
    case 'stop-loss':
      return "Suggest intelligent stop loss levels for my trades";
    case 'analyze-trade':
      return "Analyze my recent trade for learning insights";
    case 'strategy-lab':
      return "Analyze my Strategy Lab strategies and suggest improvements";
    default:
      return "";
  }
};
