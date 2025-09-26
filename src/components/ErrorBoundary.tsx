import React, { Component, ErrorInfo, ReactNode } from 'react';
import { WifiOff } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.state.errorMessage.includes('Failed to fetch')) {
        return (
          <div className="fixed inset-0 z-[100] bg-red-600 text-white p-4 flex items-center justify-center">
            <div className="max-w-2xl text-center">
              <WifiOff className="h-16 w-16 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Database Connection Failed</h1>
              <p className="mb-4">
                The application could not connect to the Supabase database. This is usually caused by one of the following:
              </p>
              <ul className="list-disc list-inside text-left bg-red-700 p-4 rounded-lg">
                <li className="mb-2">The <strong>Supabase URL</strong> or <strong>Anon Key</strong> in your <code>.env</code> file is incorrect.</li>
                <li className="mb-2">Your Supabase project is paused or not running.</li>
                <li>There might be a network issue preventing the connection.</li>
              </ul>
              <p className="mt-4">
                Please verify your credentials in the <code>.env</code> file and ensure your Supabase project is active, then refresh the page.
              </p>
            </div>
          </div>
        );
      }

      // Fallback for other errors
      return (
        <div className="fixed inset-0 z-[100] bg-gray-800 text-white p-4 flex items-center justify-center">
          <div className="max-w-2xl text-center">
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p>An unexpected error occurred. Please try refreshing the page.</p>
            <pre className="mt-4 text-left bg-gray-900 p-4 rounded-lg text-sm overflow-auto">
              {this.state.errorMessage}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
