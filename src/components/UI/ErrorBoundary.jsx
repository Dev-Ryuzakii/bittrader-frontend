import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    //console.error("Error caught by boundary:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback ? 
        this.props.fallback :
        <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <h2 className="text-lg font-medium text-white mb-2">Something went wrong</h2>
          <p className="text-red-300 mb-2">
            {this.state.error?.toString()}
          </p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try again
          </button>
        </div>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
