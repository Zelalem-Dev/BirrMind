import React, { Component, ErrorInfo, ReactNode } from 'react';

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
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full bg-stone-800 border border-stone-700 rounded-2xl p-6 shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-amber-600/20 text-amber-500 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 font-serif font-bold text-xl">
              M
            </div>
            <h1 className="text-xl font-bold font-serif mb-2">Something went wrong</h1>
            <p className="text-sm text-stone-400 mb-4">
              An unexpected error occurred while rendering the application.
            </p>
            {this.state.error && (
              <pre className="text-left text-xs bg-stone-950 p-3 rounded-lg border border-stone-800 text-rose-400 overflow-x-auto mb-4 font-mono">
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <button
              onClick={() => {
                localStorage.removeItem('birrmind_demo_mode');
                window.location.href = '/';
              }}
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-bold transition-colors shadow-md"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
