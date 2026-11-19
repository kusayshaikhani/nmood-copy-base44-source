import React from 'react';
import { ArrowLeft, Share2, MoreHorizontal } from 'lucide-react';

/**
 * UI-017 — 280px purple gradient hero with glass overlay controls.
 * Rounded bottom corners, decorative blur orbs. Purely presentational.
 */
export default function ProfileHero({ onBack, onShare, onMore, children }) {
  return (
    <div className="relative h-[280px] bg-nmood-gradient rounded-b-[32px] overflow-hidden">
      {children}
      {/* Decorative blur orbs */}
      <div className="absolute -top-16 -right-10 w-60 h-60 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -left-10 w-48 h-48 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

      {/* Overlay controls */}
      <div className="absolute top-0 inset-x-0 z-20 pointer-events-none flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="pointer-events-auto w-11 h-11 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onShare}
            aria-label="Share profile"
            className="pointer-events-auto w-11 h-11 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center active:scale-95 transition-transform"
          >
            <Share2 className="w-5 h-5 text-white" />
          </button>
          <button
            type="button"
            onClick={onMore}
            aria-label="More options"
            className="pointer-events-auto w-11 h-11 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center active:scale-95 transition-transform"
          >
            <MoreHorizontal className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}