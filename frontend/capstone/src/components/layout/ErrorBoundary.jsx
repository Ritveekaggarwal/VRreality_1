import { Component } from "react";

/** Shows a way back instead of a blank page if a component crashes. */
class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error("Page crashed:", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-ink p-6 text-center">
        <h1 className="text-3xl font-semibold">Something went wrong</h1>
        <p className="max-w-sm text-muted">Reloading usually fixes this.</p>
        <button
          type="button"
          onClick={() => window.location.assign("/")}
          className="rounded-xl bg-helix px-5 py-3 font-semibold text-ink"
        >
          Back to home
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
