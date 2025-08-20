# BitTrader Frontend

BitTrader is a comprehensive trading platform frontend built with React and Vite.

## API Configuration

The application supports both local development and production API servers:

### Environment Variables

Create `.env` files to configure the API URL for different environments:

- `.env` - Default environment variables
- `.env.production` - Production environment variables 

Example:
```
# Local development (in .env)
VITE_API_URL=http://api.tradexas.com

# Production (in .env.production)
VITE_API_URL=http://api.tradexas.com
```

### Runtime API Server Selection

Users can switch between API servers at runtime through the Settings page:

1. Navigate to Settings
2. Select the "API Server" tab
3. Choose between:
   - Production Server (api.tradexas.com)
   - Local Development Server (127.0.0.1:8000)
   - Default Server (from environment variables)

### Programmatic API Server Selection

You can also switch API servers programmatically:

```javascript
import { api } from './api/client';

// Get current API URL
const currentUrl = api.getCurrentApiUrl();

// Switch to production server
api.setApiServer('production');

// Switch to local server
api.setApiServer('local');

// Switch to default server (from .env)
api.setApiServer('default');
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- React
- Vite
- Tailwind CSS
- React Router
- Lucide React (icons)
