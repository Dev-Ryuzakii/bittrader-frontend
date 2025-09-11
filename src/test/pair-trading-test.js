/**
 * Pair Trading Implementation Test
 * 
 * This file contains a test case for validating the pair trading implementation.
 * The test simulates a pair trade request and response.
 */

import { placeEAPairTrade } from '../api/ea';

// Mock API client
jest.mock('../api/client', () => ({
  api: {
    post: jest.fn()
  }
}));

// Import the mocked API
import { api } from '../api/client';

describe('Pair Trading Implementation', () => {
  const accountId = '12345';
  
  beforeEach(() => {
    // Clear mock calls between tests
    api.post.mockClear();
  });
  
  test('Should format BUY pair trade request correctly', async () => {
    // Mock successful response
    const mockResponse = {
      success: true,
      message: 'Pair trade executed successfully',
      spread_symbol: 'EURUSD-GBPUSD',
      current_spread: 0.23145,
      symbol1_result: {
        success: true,
        order_id: '123456',
        position_id: '123456',
        message: 'Buy position opened',
        details: {
          symbol: 'EURUSD',
          volume: 0.1,
          open_price: 1.12345,
          spread: 0.00012,
          commission: 0.21,
          swap: 0
        }
      },
      symbol2_result: {
        success: true,
        order_id: '123457',
        position_id: '123457',
        message: 'Sell position opened',
        details: {
          symbol: 'GBPUSD',
          volume: 0.08,
          open_price: 1.38456,
          spread: 0.00014,
          commission: 0.17,
          swap: 0
        }
      },
      spread_analysis: {
        current_spread: 0.23145,
        correlation_coefficient: -0.85,
        cointegration_p_value: 0.031,
        z_score: -1.98,
        hedge_ratio: 0.8,
        mean_spread: 0.24782,
        spread_std: 0.00827,
        signal_strength: 'STRONG_BUY',
        statistical_confidence: 0.92,
        trade_direction: 'BUY',
        individual_trades: {
          symbol1: { action: 'BUY', volume: 0.1 },
          symbol2: { action: 'SELL', volume: 0.08 }
        }
      }
    };
    
    api.post.mockResolvedValue(mockResponse);
    
    // Test request
    const pairRequest = {
      symbol1: 'EURUSD',
      symbol2: 'GBPUSD',
      volume: 0.1,
      action: 'BUY', // This should align with the FastAPI backend parameter
      correlation_type: 'STATISTICAL',
      order_type: 'MARKET',
      spread_stop_loss: -0.01,
      spread_take_profit: 0.03,
      comment: 'Test pair trade'
    };
    
    // Execute the function
    const result = await placeEAPairTrade(accountId, pairRequest);
    
    // Validate API call
    expect(api.post).toHaveBeenCalledWith(`/api/v1/ea/accounts/${accountId}/pair-trade`, pairRequest);
    
    // Validate response structure
    expect(result.success).toBe(true);
    expect(result.spread_symbol).toBe('EURUSD-GBPUSD');
    expect(result.current_spread).toBe(0.23145);
    
    // Validate individual trade details
    expect(result.symbol1_result.success).toBe(true);
    expect(result.symbol1_result.details.symbol).toBe('EURUSD');
    expect(result.symbol1_result.details.volume).toBe(0.1);
    
    expect(result.symbol2_result.success).toBe(true);
    expect(result.symbol2_result.details.symbol).toBe('GBPUSD');
    expect(result.symbol2_result.details.volume).toBe(0.08);
    
    // Validate spread analysis
    expect(result.spread_analysis.correlation_coefficient).toBe(-0.85);
    expect(result.spread_analysis.z_score).toBe(-1.98);
    expect(result.spread_analysis.hedge_ratio).toBe(0.8);
    expect(result.spread_analysis.signal_strength).toBe('STRONG_BUY');
    
    // Validate individual trade actions
    expect(result.spread_analysis.individual_trades.symbol1.action).toBe('BUY');
    expect(result.spread_analysis.individual_trades.symbol2.action).toBe('SELL');
  });
  
  test('Should handle error cases properly', async () => {
    // Mock error response
    api.post.mockRejectedValue({
      response: {
        status: 422,
        data: {
          detail: [
            {
              loc: ['body', 'symbol1'],
              msg: 'Symbol EURUSD1 not found in broker',
              type: 'value_error'
            }
          ]
        }
      }
    });
    
    // Test request with invalid symbol
    const pairRequest = {
      symbol1: 'EURUSD1', // Invalid symbol
      symbol2: 'GBPUSD',
      volume: 0.1,
      action: 'BUY',
      correlation_type: 'STATISTICAL',
      order_type: 'MARKET'
    };
    
    // Execute the function
    const result = await placeEAPairTrade(accountId, pairRequest);
    
    // Validate error handling
    expect(result.success).toBe(false);
    expect(result.error_type).toBe('validation_error');
    expect(result.error).toContain('symbol1: Symbol EURUSD1 not found');
    expect(Array.isArray(result.suggestions)).toBe(true);
  });
  
  test('Should format pending order request correctly', async () => {
    // Mock successful response for pending order
    const mockPendingResponse = {
      success: true,
      message: 'Pending pair trade order placed',
      spread_symbol: 'EURUSD-GBPUSD',
      current_spread: 0.23145,
      entry_spread: 0.25000,
      spread_direction: 'NARROW',
      pending_order_id: '123458'
    };
    
    api.post.mockResolvedValue(mockPendingResponse);
    
    // Test request for pending order
    const pendingRequest = {
      symbol1: 'EURUSD',
      symbol2: 'GBPUSD',
      volume: 0.1,
      action: 'BUY',
      correlation_type: 'STATISTICAL',
      order_type: 'PENDING',
      entry_spread: 0.25000,
      spread_direction: 'NARROW',
      spread_stop_loss: -0.01,
      spread_take_profit: 0.03,
      expiration: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
      comment: 'Test pending pair trade'
    };
    
    // Execute the function
    const result = await placeEAPairTrade(accountId, pendingRequest);
    
    // Validate API call
    expect(api.post).toHaveBeenCalledWith(`/api/v1/ea/accounts/${accountId}/pair-trade`, pendingRequest);
    
    // Validate response structure
    expect(result.success).toBe(true);
    expect(result.spread_symbol).toBe('EURUSD-GBPUSD');
    expect(result.entry_spread).toBe(0.25000);
    expect(result.spread_direction).toBe('NARROW');
  });
});
