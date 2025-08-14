import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log the error for debugging
    console.error('Component Error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <AlertTriangle size={24} className="text-red-400" />
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Something went wrong</h3>
              <p className="text-sm text-gray-400 mb-4">
                {this.props.fallbackMessage || 'An error occurred while rendering this component.'}
              </p>
              {this.props.showErrorDetails && this.state.error && (
                <details className="text-xs text-gray-500 bg-[#0D1117] border border-[#21262D] rounded p-2 mb-4">
                  <summary className="cursor-pointer">Error Details</summary>
                  <pre className="mt-2 overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
            <button
              onClick={this.handleReset}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw size={16} />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ComponentErrorBoundary;
