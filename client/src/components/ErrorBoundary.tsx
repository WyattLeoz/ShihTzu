import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-paper">
          <div className="text-center max-w-md">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-light flex items-center justify-center">
                <AlertTriangle className="text-red" size={32} />
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-ink mb-2">
              Something went wrong
            </h1>
            <p className="text-ink-muted mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}