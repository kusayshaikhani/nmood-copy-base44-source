import React, { useState } from 'react';
import { ChevronLeft, Bookmark, Share2, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NmoodDetailHeader({ onBack, onReport }) {
  const [saved, setSaved] = useState(false);
  const btn = 'w-10 h-10 rounded-full flex items-center justify-center transition-colors text-foreground';

  return (
    <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/30 px-3 pt-[calc(env(safe-area-inset-top)+12px)] pb-3 flex items-center justify-between">
      <button type="button" onClick={onBack} className={`${btn} hover:bg-secondary`} aria-label="Back">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => setSaved((s) => !s)} className={`${btn} hover:bg-secondary`} aria-label="Bookmark">
          <Bookmark className={cn('w-5 h-5', saved && 'fill-primary text-primary')} />
        </button>
        <button type="button" className={`${btn} hover:bg-secondary`} aria-label="Share">
          <Share2 className="w-5 h-5" />
        </button>
        <button type="button" onClick={onReport} className={`${btn} hover:bg-secondary`} aria-label="More">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}