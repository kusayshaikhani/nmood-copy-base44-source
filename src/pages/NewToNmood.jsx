import React from 'react';
import { Link } from 'react-router-dom';
import { DiscoveryGate } from '@/components/membership/ExplorerPolicyGate';
import NewPalsSection from '@/components/home/premium/NewPalsSection';

// Reuse Home's exact component, RPC, viewer-scoped cache and 72-hour filtering.
// The gate mounts before any member content; profile links retain the existing gate.
export default function NewToNmood() {
  return <div className="mx-auto w-full max-w-5xl px-6 pb-28 pt-4 space-y-4">
    <Link to="/" className="inline-flex min-h-11 items-center text-primary font-semibold">Home</Link>
    <DiscoveryGate><NewPalsSection fullList /></DiscoveryGate>
  </div>;
}
