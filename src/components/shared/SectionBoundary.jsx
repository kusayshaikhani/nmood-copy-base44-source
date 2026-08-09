import React from 'react';

export default class SectionBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Section failed to render:', error);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-center">
          <p className="text-sm text-muted-foreground">This section is temporarily unavailable.</p>
        </div>
      );
    }
    return this.props.children;
  }
}