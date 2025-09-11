# Pair Trading API Integration

This document outlines the changes made to integrate with the FastAPI backend for pair trading functionality.

## Overview

The pair trading system has been updated to align with the latest FastAPI backend specification. The implementation supports:

1. Statistical analysis-based pair trading
2. Market and pending order types
3. Spread-based risk management
4. Real-time monitoring via WebSockets

## API Endpoints

### Main Pair Trading Endpoint

```
POST /api/v1/ea/accounts/{account_id}/pair-trade
```

### Request Format

```javascript
{
  "symbol1": "EURUSD",           // First symbol
  "symbol2": "GBPUSD",           // Second symbol
  "volume": 0.1,                 // Trade volume (unified, applies to both)
  "action": "BUY",               // "BUY" or "SELL" (spread direction)
  "correlation_type": "STATISTICAL", // "STATISTICAL", "SIMPLE", "MEAN_REVERSION"
  "order_type": "MARKET",        // "MARKET" or "PENDING"
  "spread_stop_loss": -0.01,     // Spread-based stop loss (negative number)
  "spread_take_profit": 0.03,    // Spread-based take profit (positive number)
  "comment": "Test pair trade",  // Optional comment
  
  // Fields for PENDING orders only
  "entry_spread": 0.25,          // Entry level for pending orders
  "spread_direction": "NARROW",  // "NARROW" or "WIDEN"
  "expiration": "2023-12-01T12:00:00Z" // Optional expiration time
}
```

### Response Format

```javascript
{
  "success": true,
  "message": "Pair trade executed successfully",
  "spread_symbol": "EURUSD-GBPUSD",
  "current_spread": 0.23145,
  "symbol1_result": {
    "success": true,
    "order_id": "123456",
    "position_id": "123456",
    "message": "Buy position opened",
    "details": {
      "symbol": "EURUSD",
      "volume": 0.1,
      "open_price": 1.12345,
      "spread": 0.00012,
      "commission": 0.21,
      "swap": 0
    }
  },
  "symbol2_result": {
    "success": true,
    "order_id": "123457",
    "position_id": "123457",
    "message": "Sell position opened",
    "details": {
      "symbol": "GBPUSD",
      "volume": 0.08,
      "open_price": 1.38456,
      "spread": 0.00014,
      "commission": 0.17,
      "swap": 0
    }
  },
  "spread_analysis": {
    "current_spread": 0.23145,
    "correlation_coefficient": -0.85,
    "cointegration_p_value": 0.031,
    "z_score": -1.98,
    "hedge_ratio": 0.8,
    "mean_spread": 0.24782,
    "spread_std": 0.00827,
    "signal_strength": "STRONG_BUY",
    "statistical_confidence": 0.92,
    "trade_direction": "BUY",
    "individual_trades": {
      "symbol1": { "action": "BUY", "volume": 0.1 },
      "symbol2": { "action": "SELL", "volume": 0.08 }
    }
  }
}
```

## Key Changes Made

### 1. Parameter Naming and Structure

- `trade_type` → `action` (to align with FastAPI)
- `volume1`/`volume2` → unified `volume` field
- Added explicit support for `spread_stop_loss` and `spread_take_profit`
- Enhanced error handling for FastAPI validation errors

### 2. Response Processing

- Support for `spread_analysis` data including correlation, z-score, etc.
- Support for individual trade results through `symbol1_result` and `symbol2_result`
- Enhanced UI notifications showing statistical analysis and position details

### 3. UI Enhancements

- Added real-time monitoring indicator
- Added trade direction hints showing which symbol is bought/sold
- Improved pending order interface with entry spread and direction

## Testing

A test suite has been added (`src/test/pair-trading-test.js`) to validate:

1. Correct formatting of requests to the FastAPI backend
2. Proper handling of response data from the backend
3. Error handling for validation failures

## Usage Example

```javascript
// Import the API function
import { placeEAPairTrade } from './api/ea';

// Create a pair trade request
const pairRequest = {
  symbol1: 'EURUSD',
  symbol2: 'GBPUSD',
  volume: 0.1,
  action: 'BUY',
  correlation_type: 'STATISTICAL',
  order_type: 'MARKET',
  spread_stop_loss: -0.01,
  spread_take_profit: 0.03,
  comment: 'Test pair trade'
};

// Execute the pair trade
const response = await placeEAPairTrade(accountId, pairRequest);

// Check result
if (response.success) {
  console.log('Pair trade executed!');
  console.log('Symbol1 result:', response.symbol1_result);
  console.log('Symbol2 result:', response.symbol2_result);
  console.log('Statistical analysis:', response.spread_analysis);
} else {
  console.error('Failed:', response.error);
}
```

## Implementation Files

The following files were modified:

1. `/src/components/modals/TradeModal.jsx` - Updated `handlePairTrade` function
2. `/src/api/ea.js` - Enhanced `placeEAPairTrade` function
3. `/src/components/modals/PairTradingPanel.jsx` - Updated UI and button handling

## Next Steps

1. Add real-time WebSocket monitoring for pair trade status updates
2. Create a dedicated pair trade history and analytics view
3. Implement automatic pair suggestion based on correlation analysis
