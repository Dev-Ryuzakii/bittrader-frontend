// src/api/chat.js
import api from './api.js';

/**
 * AI Trading Assistant API utilities
 * Comprehensive AI-powered trading assistant with sentiment analysis, strategy suggestions,
 * risk management, trade evaluation, and chart pattern detection
 * 
 * Updated to support enhanced backend features:
 * - Real-time market data integration
 * - Advanced technical analysis (RSI, MACD, Bollinger Bands)
 * - Comprehensive portfolio analysis
 * - Pattern detection with trading signals
 * - News sentiment integration
 * - Memory management and context awareness
 * - Strategy backtesting and optimization
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
      //console.error('Chat error:', error);
      throw error;
    }
  },

  // Enhanced chat with comprehensive analysis
  enhancedChat: async (message, options = {}) => {
    try {
      const payload = {
        message,
        include_market_data: options.include_market_data ?? true,
        include_technical_analysis: options.include_technical_analysis ?? true,
        include_news: options.include_news ?? true,
        include_account_data: options.include_account_data ?? true,
        include_trading_history: options.include_trading_history ?? true,
        analysis_type: options.analysis_type ?? "comprehensive",
        chat_session_id: options.chat_session_id || null
      };
      
      const response = await api.post('/chat/enhanced', payload);
      return response.data;
    } catch (error) {
      //console.error('Enhanced chat error:', error);
      throw error;
    }
  },

  // Note: Chat session management endpoints are not yet implemented in the backend
  // These functions are placeholders for future implementation
  createChatSession: async (sessionName = null) => {
    //console.warn('Chat session creation not yet implemented in backend');
    return { success: false, message: 'Feature not yet implemented' };
  },

  switchChatSession: async (sessionId) => {
    //console.warn('Chat session switching not yet implemented in backend');
    return { success: false, message: 'Feature not yet implemented' };
  },

  // Get conversation history
  getConversationHistory: async (limit = 20, sessionId = null) => {
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (sessionId) params.append('session_id', sessionId);
      
      const response = await api.get(`/conversations?${params.toString()}`);
      return response.data;
    } catch (error) {
      //console.error('Get conversation history error:', error);
      throw error;
    }
  },

  // Search conversations
  searchConversations: async (query, limit = 10) => {
    try {
      const payload = { query, limit };
      const response = await api.post('/conversations/search', payload);
      return response.data;
    } catch (error) {
      //console.error('Search conversations error:', error);
      throw error;
    }
  },

  // Get user profile
  getUserProfile: async () => {
    try {
      const response = await api.get('/profile');
      return response.data;
    } catch (error) {
      //console.error('Get user profile error:', error);
      throw error;
    }
  },

  // Update user profile
  updateUserProfile: async (profileData) => {
    try {
      const response = await api.put('/profile', profileData);
      return response.data;
    } catch (error) {
      //console.error('Update user profile error:', error);
      throw error;
    }
  }
};

// AI Analysis Tools API functions
export const aiToolsAPI = {
  // Market sentiment analysis with enhanced features
  sentimentAnalysis: async (symbols = null, message = null) => {
    try {
      const payload = {};
      if (symbols) payload.symbols = symbols;
      
      const response = await api.post('/sentiment-analysis', payload);
      return response.data;
    } catch (error) {
      //console.error('Sentiment analysis error:', error);
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
      //console.error('Strategy analysis error:', error);
      throw error;
    }
  },

  // Enhanced risk analysis with portfolio insights
  riskAnalysis: async (includeOpenPositions = true, message = null) => {
    try {
      const payload = { include_open_positions: includeOpenPositions };
      
      const response = await api.post('/risk-analysis', payload);
      return response.data;
    } catch (error) {
      //console.error('Risk analysis error:', error);
      throw error;
    }
  },

  // Get comprehensive portfolio analysis
  // Note: This endpoint may not be implemented yet
  getPortfolioAnalysis: async () => {
    try {
      // Try the risk analysis endpoint instead which provides portfolio data
      const response = await api.post('/risk-analysis', { include_open_positions: true });
      return response.data;
    } catch (error) {
      //console.error('Portfolio analysis error:', error);
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
      //console.error('Position size calculation error:', error);
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
      //console.error('Trade evaluation error:', error);
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
      //console.error('Analyze trade error:', error);
      throw error;
    }
  },

  // Enhanced chart pattern detection with trading signals
  detectPatterns: async (symbol = "", timeframe = "H4", message = null) => {
    try {
      const payload = { symbol, timeframe };
      
      const response = await api.post('/detect-patterns', payload);
      return response.data;
    } catch (error) {
      //console.error('Pattern detection error:', error);
      throw error;
    }
  },

  // Trading opportunity analysis
  // Note: This endpoint may not be implemented yet, using pattern detection as fallback
  analyzeOpportunity: async (symbol = "EURUSD") => {
    try {
      // Use pattern detection as the opportunity analysis endpoint
      const response = await api.post('/detect-patterns', { symbol, timeframe: 'H4' });
      return response.data;
    } catch (error) {
      //console.error('Opportunity analysis error:', error);
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
      //console.error('Stop loss suggestions error:', error);
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
      //console.error('Strategy Lab analysis error:', error);
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
      //console.error('Strategy performance analysis error:', error);
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
      //console.error('Strategy improvements error:', error);
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
      //console.error('Strategy learning error:', error);
      throw error;
    }
  },

  // Integrate strategy with AI analysis
  // Note: This endpoint may not be implemented yet
  integrateStrategy: async (strategyData) => {
    try {
      const payload = { strategy_data: strategyData };
      const response = await api.post('/strategy-lab/analyze', payload);
      return response.data;
    } catch (error) {
      //console.error('Strategy integration error:', error);
      throw error;
    }
  },

  // Get user strategies with AI analysis
  getUserStrategiesWithAnalysis: async () => {
    try {
      const response = await api.get('/strategy-lab/strategies');
      return response.data;
    } catch (error) {
      //console.error('Get user strategies error:', error);
      throw error;
    }
  }
};

// Real-time market data API functions
// Note: These endpoints may not be implemented yet in the backend
export const marketDataAPI = {
  // Get real-time market data for symbols
  // Using enhanced chat as fallback for market data
  getRealTimeData: async (symbols = ["EURUSD", "GBPUSD", "USDJPY"]) => {
    try {
      // Use enhanced chat to get market data instead
      const response = await api.post('/chat/enhanced', {
        message: `Get current market data for ${symbols.join(', ')}`,
        include_market_data: true,
        include_technical_analysis: true
      });
      return response.data;
    } catch (error) {
      //console.error('Real-time market data error:', error);
      throw error;
    }
  },

  // Get technical indicators
  // Using pattern detection as fallback
  getTechnicalIndicators: async (symbol = "EURUSD", timeframe = "H4") => {
    try {
      const response = await api.post('/detect-patterns', { symbol, timeframe });
      return response.data;
    } catch (error) {
      //console.error('Technical indicators error:', error);
      throw error;
    }
  },

  // Get economic events
  // Using enhanced chat as fallback
  getEconomicEvents: async () => {
    try {
      const response = await api.post('/chat/enhanced', {
        message: 'Get upcoming economic events and market calendar',
        include_news: true
      });
      return response.data;
    } catch (error) {
      //console.error('Economic events error:', error);
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

      case 'portfolio':
        return await aiToolsAPI.getPortfolioAnalysis();
      
      case 'patterns':
        return await aiToolsAPI.detectPatterns(options.symbol, options.timeframe, userMessage);

      case 'opportunity':
        return await aiToolsAPI.analyzeOpportunity(options.symbol);
      
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

      case 'market-data':
        return await marketDataAPI.getRealTimeData(options.symbols);

      case 'technical-indicators':
        return await marketDataAPI.getTechnicalIndicators(options.symbol, options.timeframe);

      case 'economic-events':
        return await marketDataAPI.getEconomicEvents();
      
      default:
        // Fallback to enhanced chat
        return await chatAPI.enhancedChat(userMessage, options);
    }
  } catch (error) {
    //console.error(`Error executing AI tool ${toolId}:`, error);
    throw error;
  }
};

// Enhanced response formatting helpers
export const formatAIResponse = (toolId, data) => {
  try {
    if (data.success && data.data) {
      const responseData = data.data;
      
      switch(toolId) {
        case 'sentiment':
          if (responseData.overall_sentiment) {
            const sentiment = responseData.overall_sentiment;
            let response = `📊 **Market Sentiment Analysis**\n\n`;
            response += `**Overall Sentiment:** ${sentiment.label} (${(sentiment.score * 100).toFixed(1)}%)\n`;
            response += `**Confidence:** ${(sentiment.confidence * 100).toFixed(1)}%\n\n`;
            
            if (responseData.news_sentiment) {
              response += `📰 **News Sentiment:** ${responseData.news_sentiment.label}\n`;
              response += `📊 **Articles Analyzed:** ${responseData.news_sentiment.articles_analyzed}\n\n`;
            }
            
            response += `💡 **Recommendation:** ${responseData.recommendation}`;
            return response;
          }
          break;
          
        case 'strategy':
          if (responseData.strategies) {
            return `🎯 **Trading Strategies:**\n\n${responseData.strategies.map((s, i) => `${i + 1}. **${s.name}:** ${s.description}`).join('\n\n')}`;
          }
          break;
          
        case 'risk':
          if (responseData.overall_risk_score) {
            const risk = responseData.overall_risk_score;
            let response = `⚠️ **Risk Analysis**\n\n`;
            response += `**Risk Score:** ${risk.score}/100 (${risk.level})\n`;
            response += `**Portfolio Balance:** $${responseData.portfolio_summary?.total_balance || 'N/A'}\n`;
            response += `**Equity:** $${responseData.portfolio_summary?.total_equity || 'N/A'}\n\n`;
            
            if (responseData.recommendations) {
              response += `📋 **Recommendations:**\n${responseData.recommendations.map(r => `• ${r}`).join('\n')}`;
            }
            return response;
          }
          break;

        case 'portfolio':
          if (responseData.portfolio_summary) {
            const portfolio = responseData.portfolio_summary;
            let response = `💼 **Portfolio Analysis**\n\n`;
            response += `**Total Equity:** $${portfolio.total_equity}\n`;
            response += `**Open Positions:** ${portfolio.open_positions}\n`;
            response += `**Unrealized P&L:** $${portfolio.unrealized_pnl}\n\n`;
            
            if (responseData.diversification_analysis) {
              const div = responseData.diversification_analysis;
              response += `📊 **Diversification Score:** ${div.diversification_score}/100\n`;
              response += `⚠️ **Concentration Risk:** ${div.concentration_risk}\n\n`;
            }
            
            if (responseData.optimization_suggestions) {
              response += `💡 **Optimization Suggestions:**\n${responseData.optimization_suggestions.map(s => `• ${s}`).join('\n')}`;
            }
            return response;
          }
          break;
          
        case 'patterns':
          if (responseData.detected_patterns) {
            let response = `📈 **Chart Patterns Detected (${responseData.symbol})**\n\n`;
            response += `**Patterns Found:** ${responseData.patterns_detected}\n`;
            response += `**Market Trend:** ${responseData.market_structure?.short_term_trend || 'N/A'}\n\n`;
            
            const patterns = responseData.detected_patterns.slice(0, 5); // Show top 5
            response += `🔍 **Top Patterns:**\n`;
            patterns.forEach((p, i) => {
              response += `${i + 1}. **${p.type.toUpperCase()}** - ${(p.confidence * 100).toFixed(0)}% confidence (${p.signal})\n`;
            });
            
            if (responseData.trading_signals && responseData.trading_signals.length > 0) {
              const signal = responseData.trading_signals[0];
              response += `\n🎯 **Top Signal:**\n`;
              response += `• **Direction:** ${signal.signal_direction.toUpperCase()}\n`;
              response += `• **Entry:** ${signal.entry_price}\n`;
              response += `• **Stop Loss:** ${signal.stop_loss}\n`;
              response += `• **Take Profit:** ${signal.take_profit}\n`;
              response += `• **Risk/Reward:** ${signal.risk_reward_ratio.toFixed(2)}`;
            }
            return response;
          }
          break;

        case 'opportunity':
          // Handle both opportunity analysis and pattern detection responses
          if (responseData.trade_recommendations) {
            let response = `🎯 **Trading Opportunity (${responseData.symbol})**\n\n`;
            response += `**Confidence Score:** ${(responseData.confidence_score * 100).toFixed(1)}%\n\n`;
            
            if (responseData.technical_analysis) {
              response += `📊 **Technical Analysis:**\n`;
              Object.entries(responseData.technical_analysis).forEach(([tf, analysis]) => {
                response += `• **${tf}:** RSI ${analysis.rsi?.toFixed(1) || 'N/A'}, ${analysis.trend || 'N/A'} trend\n`;
              });
              response += '\n';
            }
            
            response += `💡 **Recommendations:**\n${responseData.trade_recommendations.map(r => `• ${r}`).join('\n')}`;
            return response;
          } else if (responseData.detected_patterns) {
            // Fallback to pattern detection format
            return formatAIResponse('patterns', data);
          }
          break;
          
        case 'position':
          if (responseData.position_size) {
            return `💰 **Position Size Calculation:**\n\n**Recommended Size:** ${responseData.position_size}\n**Risk Amount:** ${responseData.risk_amount}\n**Risk/Reward:** ${responseData.risk_reward_ratio}`;
          }
          break;
          
        case 'trade-eval':
          if (responseData.performance_score) {
            return `📊 **Trading Performance:**\n\n**Score:** ${responseData.performance_score}/10\n\n**Key Insights:**\n${responseData.insights?.join('\n') || 'Analysis completed successfully.'}`;
          }
          break;
          
        case 'stop-loss':
          if (responseData.suggestions) {
            return `🛡️ **Stop Loss Suggestions:**\n\n${responseData.suggestions.map(s => `• **${s.method}:** ${s.level} (${s.reasoning})`).join('\n')}`;
          }
          break;
          
        case 'analyze-trade':
          if (responseData.analysis) {
            return `🔍 **Trade Analysis:**\n\n${responseData.analysis}\n\n**Key Learnings:**\n${responseData.learnings?.join('\n') || 'Analysis completed.'}`;
          }
          break;
          
        case 'strategy-lab':
          if (responseData.analysis) {
            return `🧪 **Strategy Lab Analysis:**\n\n${responseData.analysis}\n\n**Recommendations:**\n${responseData.recommendations?.join('\n') || 'No specific recommendations.'}`;
          }
          break;

        case 'market-data':
          if (responseData.market_data) {
            let response = `📊 **Real-Time Market Data**\n\n`;
            Object.entries(responseData.market_data).forEach(([symbol, data]) => {
              response += `**${symbol}:** ${data.price} (${data.change > 0 ? '+' : ''}${data.change}%)\n`;
            });
            return response;
          }
          break;

        case 'technical-indicators':
          if (responseData.indicators) {
            const ind = responseData.indicators;
            return `📈 **Technical Indicators (${responseData.symbol})**\n\n**RSI:** ${ind.rsi}\n**MACD:** ${ind.macd}\n**Bollinger:** ${ind.bollinger_position}\n**Trend:** ${ind.trend}`;
          }
          break;
          
        default:
          // Handle enhanced chat responses
          if (responseData.message && responseData.market_analysis) {
            let response = `🤖 **AI Assistant Response**\n\n${responseData.message}\n\n`;
            
            if (responseData.market_analysis.market_sentiment) {
              response += `📊 **Market Sentiment:** ${responseData.market_analysis.market_sentiment}\n\n`;
            }
            
            if (responseData.ai_analysis?.quick_overview) {
              const overview = responseData.ai_analysis.quick_overview;
              response += `💼 **Portfolio Overview:**\n`;
              response += `• **Balance:** $${overview.account_summary?.total_balance || 'N/A'}\n`;
              response += `• **Equity:** $${overview.account_summary?.total_equity || 'N/A'}\n`;
              response += `• **Market Sentiment:** ${overview.market_sentiment?.label || 'N/A'}\n`;
            }
            
            return response;
          }
          
          if (responseData.message) return responseData.message;
          return JSON.stringify(responseData, null, 2);
      }
    }
    
    // Fallback
    return data.data?.message || data.message || "Analysis completed successfully.";
    
  } catch (error) {
    //console.error('Error formatting response:', error);
    return data.data?.message || data.message || "Analysis completed successfully.";
  }
};

// Enhanced default prompts for each tool
export const getDefaultPromptForTool = (toolId) => {
  switch(toolId) {
    case 'sentiment':
      return "Analyze current market sentiment across major trading pairs with news integration";
    case 'strategy':
      return "Generate comprehensive trading strategies based on current market conditions and technical analysis";
    case 'risk':
      return "Perform detailed portfolio risk analysis with optimization recommendations";
    case 'portfolio':
      return "Provide comprehensive portfolio analysis including diversification, performance metrics, and optimization suggestions";
    case 'patterns':
      return "Detect chart patterns with trading signals and technical analysis";
    case 'opportunity':
      return "Analyze trading opportunities with multi-timeframe technical analysis and confidence scoring";
    case 'position':
      return "Calculate optimal position size with proper risk management and volatility adjustment";
    case 'trade-eval':
      return "Evaluate trading performance with detailed metrics and improvement suggestions";
    case 'stop-loss':
      return "Generate intelligent stop loss recommendations based on market structure and volatility";
    case 'analyze-trade':
      return "Analyze specific trades for learning insights and performance improvement";
    case 'strategy-lab':
      return "Analyze Strategy Lab strategies with backtesting results and optimization suggestions";
    case 'market-data':
      return "Get real-time market data with price movements and volatility analysis";
    case 'technical-indicators':
      return "Calculate technical indicators (RSI, MACD, Bollinger Bands) with trading signals";
    case 'economic-events':
      return "Get upcoming economic events and their potential market impact";
    default:
      return "";
  }
};

// Advanced streaming support for real-time responses
// Note: Streaming endpoint may not be implemented yet
export const streamingAPI = {
  // Create streaming connection for real-time AI responses
  createStreamingChat: async (message, options = {}) => {
    //console.warn('Streaming chat not yet implemented in backend');
    // Fallback to regular enhanced chat
    try {
      const payload = {
        message,
        include_market_data: options.include_market_data ?? true,
        include_technical_analysis: options.include_technical_analysis ?? true,
        include_news: options.include_news ?? true
      };
      
      const response = await api.post('/chat/enhanced', payload);
      return response.data;
    } catch (error) {
      //console.error('Streaming chat error:', error);
      throw error;
    }
  }
};

// Memory management for conversation context
// Note: These endpoints may not be implemented yet
export const memoryAPI = {
  // Get conversation context summary
  getContextSummary: async (sessionId = null) => {
    //console.warn('Context summary not yet implemented in backend');
    return { success: false, message: 'Feature not yet implemented' };
  },

  // Update user preferences for personalized responses
  updatePreferences: async (preferences) => {
    try {
      // Use the existing profile endpoint
      const response = await api.put('/profile', preferences);
      return response.data;
    } catch (error) {
      //console.error('Update preferences error:', error);
      throw error;
    }
  }
};

export default {
  chatAPI,
  aiToolsAPI,
  strategyLabAI,
  marketDataAPI,
  streamingAPI,
  memoryAPI,
  executeAITool,
  formatAIResponse,
  getDefaultPromptForTool
};
