import React from 'react';
export default function DiscoveryStatus({ label, error, loading, onRetry, message }) {
  return <section role="status" aria-live="polite" className="rounded-xl border border-border p-4 space-y-3">
    <p>{loading ? `Loading ${label}…` : error ? (navigator.onLine === false ? `You're offline. Reconnect to refresh ${label}.` : message || `${label} could not be loaded.`) : label}</p>
    {error && <button type="button" className="min-h-11 rounded-full border px-4 py-2" onClick={onRetry}>Retry {label}</button>}
  </section>;
}
