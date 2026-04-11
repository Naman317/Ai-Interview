import React from 'react';
import { Link } from 'react-router-dom';

/**
 * ErrorBoundary - Global React Error Boundary.
 * Catches unhandled rendering errors in child components and displays
 * a premium recovery UI instead of a blank white screen.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full text-center space-y-8">
            {/* Animated Icon */}
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 bg-red-100 rounded-3xl rotate-6 animate-pulse" />
              <div className="relative bg-white rounded-3xl shadow-card flex items-center justify-center w-full h-full border border-red-100">
                <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-primary mb-2">Something went wrong</h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                An unexpected error occurred while rendering this page.
                Our team has been notified. You can try refreshing or going back to the dashboard.
              </p>
            </div>

            {/* Error Details (dev only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left bg-white border border-gray-200 rounded-xl p-4 text-xs">
                <summary className="cursor-pointer text-red-600 font-semibold mb-2">
                  Error Details (dev only)
                </summary>
                <pre className="text-gray-600 whitespace-pre-wrap overflow-auto max-h-48 font-mono">
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                Refresh Page
              </button>
              <button
                onClick={() => { this.handleReset(); window.location.href = '/dashboard'; }}
                className="px-6 py-3 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all shadow-sm"
              >
                Go to Dashboard
              </button>
            </div>

            <p className="text-gray-400 text-xs">
              InterviewAI • Error Recovery
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
