import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4 font-body">
          <div className="p-4 bg-error-light text-error rounded-2xl border border-error/30">
            <AlertTriangle className="w-10 h-10 mx-auto" />
          </div>
          <h2 className="text-xl font-bold font-heading text-text-primary">Something went wrong</h2>
          <p className="text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
            {this.state.error?.message || 'An unexpected rendering error occurred. Please refresh the page to restore state.'}
          </p>
          <button
            onClick={this.handleReload}
            className="px-5 py-2.5 bg-primary text-white font-bold text-sm rounded-xl shadow-soft hover:bg-primary-hover transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Application</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
