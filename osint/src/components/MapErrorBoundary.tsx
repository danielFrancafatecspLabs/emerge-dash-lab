import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Map as MapIcon } from 'lucide-react';

interface Props {
  children: ReactNode;
  onFallbackTo2D?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MapErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Tactical Viewport Error caught:', error, errorInfo);
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-6 text-center select-none">
          <div className="max-w-md p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-800/80 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider font-mono">
                Geospatial Viewport Notice
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                {this.state.error?.message || 'An unexpected rendering issue occurred in the viewport.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleRetry}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono rounded-md flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Viewport</span>
              </button>

              {this.props.onFallbackTo2D && (
                <button
                  onClick={() => {
                    this.setState({ hasError: false, error: null });
                    this.props.onFallbackTo2D?.();
                  }}
                  className="px-3.5 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-mono rounded-md flex items-center gap-1.5 transition-colors"
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>Switch to 2D Map</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
