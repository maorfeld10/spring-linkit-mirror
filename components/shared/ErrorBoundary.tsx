'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const title = this.props.fallbackTitle ?? 'Something went wrong';
      const message =
        this.props.fallbackMessage ??
        this.state.error?.message ??
        'An unexpected error occurred.';

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <h2 className="mb-2 text-2xl font-bold text-slate-800">{title}</h2>
          <p className="mb-6 max-w-md text-base text-slate-600">{message}</p>
          <button
            onClick={this.handleReset}
            className="rounded-lg bg-slate-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
