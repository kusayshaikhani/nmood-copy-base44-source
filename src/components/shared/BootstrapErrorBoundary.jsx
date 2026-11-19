import React from 'react';

// Explicit path IDs survive minification. Never derive diagnostics from React's
// component stack (which may contain URLs) or stringify thrown values/props.
export default class BootstrapErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) {
    window.NmoodRecovery?.renderFailure(error, this.props.path);
  }
  render() { return this.state.failed ? null : this.props.children; }
}
