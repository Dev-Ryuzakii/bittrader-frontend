# Bittrader Frontend

A comprehensive trading platform frontend built with React, Vite, and TradingView integration.

## Features

- Real-time market data visualization with TradingView charts
- Advanced trading interface with order placement capabilities
- Account management and position tracking
- Technical analysis tools and indicators
- Community and social trading features
- AI-powered trading assistant
- Responsive design for desktop and mobile

## TradingView Chart Integration

This project features a fully integrated TradingView chart component that provides:

- Candlestick charts for all major asset classes (forex, crypto, stocks, indices)
- Multiple timeframe options from 1-minute to monthly charts
- Technical indicators and drawing tools
- Volume profile analysis
- Custom themes and chart settings

For more details, see the [TradingView Integration Guide](/docs/TradingViewIntegration.md).

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/bittrader-frontend.git
cd bittrader-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Project Structure

- `/src/components/UI` - UI components including TradingView chart
- `/src/utils` - Utility functions and helpers
- `/src/api` - API integration for market data and trading
- `/src/contexts` - React context providers
- `/docs` - Documentation

## Using the TradingView Chart Component

```jsx
import AdvancedTradingViewChart from './components/UI/AdvancedTradingViewChart';

function TradingPage() {
  return (
    <div className="chart-container">
      <AdvancedTradingViewChart 
        symbol="EURUSD"
        theme="dark"
        height={600}
        interval="D"
        showToolbar={true}
        showVolumeProfile={true}
      />
    </div>
  );
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
