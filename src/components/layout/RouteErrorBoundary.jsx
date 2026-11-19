import React from 'react';
import { Link } from 'react-router-dom';

export default class RouteErrorBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <section role="alert" className="p-6 space-y-4">
        <h1 className="text-xl font-semibold">This page couldn’t load</h1>
        <p>Please try again, or return Home to continue.</p>
        <button type="button" className="rounded-full bg-primary px-4 py-2 text-primary-foreground" onClick={() => this.setState({ failed: false })}>Try again</button>
        <Link to="/" className="block text-primary">Return Home</Link>
      </section>
    );
  }
}
