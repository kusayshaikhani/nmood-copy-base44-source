import React from 'react';
import { BadgeCheck } from 'lucide-react';

// RC1-001 — single source of truth for the "verified member" badge.
// Every surface that intends to show verification renders this so the visual
// stays consistent (green = trust/verified) across Discovery, Search, etc.
// Do NOT add this to surfaces where verification was never intended
// (e.g. organizer crowns, group chat experience headers).
export default function VerifiedBadge({ variant = 'inline', className = '' }) {
  if (variant === 'overlay') {
    return (
      <div
        className={'absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-success border-2 border-card flex items-center justify-center ' + className}
        aria-label="Verified member"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    );
  }
  return <BadgeCheck className={'w-4 h-4 text-success flex-shrink-0 ' + className} aria-label="Verified member" />;
}