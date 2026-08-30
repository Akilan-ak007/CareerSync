import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-darker flex items-center justify-center p-6 text-center">
          <div className="glass-panel p-8 max-w-md w-full border border-red-900/40 shadow-2xl">
            <div className="w-14 h-14 bg-red-950/60 border border-red-800/50 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide">Something went wrong</h2>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              An unexpected application error occurred. Click below to refresh your session.
            </p>
            {this.state.error && (
              <div className="mt-4 p-3 bg-brand-dark rounded-lg text-left overflow-x-auto text-[11px] font-mono text-red-300 border border-brand-cocoa/40">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="mt-6 w-full flex items-center justify-center space-x-2 bg-brand-cocoa text-white py-2.5 px-4 rounded-lg text-xs font-bold hover:bg-brand-rosy hover:text-brand-black transition-all duration-200 shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
