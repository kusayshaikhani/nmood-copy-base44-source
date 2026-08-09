import React from 'react';

/**
 * Shimmer skeleton card matching the NmoodCard layout to prevent
 * layout shifts during feed loading.
 */
export default function NmoodCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl p-5 shadow-card">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-full shimmer" />
        <div className="w-16 h-3 rounded-full shimmer" />
      </div>
      <div className="w-20 h-3 rounded-full shimmer mb-2" />
      <div className="w-full h-5 rounded-full shimmer mb-1.5" />
      <div className="w-3/4 h-5 rounded-full shimmer mb-3" />
      <div className="flex gap-3 mb-3">
        <div className="w-12 h-3 rounded-full shimmer" />
        <div className="w-10 h-3 rounded-full shimmer" />
        <div className="w-20 h-3 rounded-full shimmer" />
      </div>
      <div className="border-t border-border/40 mb-3" />
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-full shimmer" />
        <div className="flex-1">
          <div className="w-20 h-3 rounded-full shimmer mb-1" />
          <div className="w-12 h-2.5 rounded-full shimmer" />
        </div>
      </div>
      <div className="flex gap-1.5 mb-4">
        <div className="w-14 h-6 rounded-full shimmer" />
        <div className="w-14 h-6 rounded-full shimmer" />
        <div className="w-14 h-6 rounded-full shimmer" />
      </div>
      <div className="flex gap-2">
        <div className="flex-1 h-9 rounded-button shimmer" />
        <div className="flex-1 h-9 rounded-button shimmer" />
      </div>
    </div>
  );
}