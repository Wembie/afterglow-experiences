import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  fallback: (error: Error, reset: () => void) => ReactNode;
  children: ReactNode;
  /** Changing this value clears a previous error (e.g. a new scene id). */
  resetKey?: unknown;
}

interface State {
  error: Error | null;
  resetKey: unknown;
}

/** Keeps one broken scene or effect from taking the whole experience down. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey !== state.resetKey) return { error: null, resetKey: props.resetKey };
    return null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('[afterglow] scene failed', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    return this.state.error
      ? this.props.fallback(this.state.error, this.reset)
      : this.props.children;
  }
}
