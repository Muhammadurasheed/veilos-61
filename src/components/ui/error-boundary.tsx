import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback = ({ error }: { error: Error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-pink-50">
    <div className="text-center p-8 max-w-md">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Oops! Something went wrong
      </h2>
      <p className="text-gray-600 mb-6 leading-relaxed">
        {error.message || 'An unexpected error occurred. Please try refreshing the page.'}
      </p>
      <div className="space-y-3">
        <button 
          onClick={() => window.location.reload()}
          className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          Reload Page
        </button>
        <button 
          onClick={() => window.location.href = '/'}
          className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Go Home
        </button>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-6 text-left">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            Technical Details
          </summary>
          <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto text-red-600">
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  </div>
);

export { ErrorBoundary, DefaultErrorFallback };