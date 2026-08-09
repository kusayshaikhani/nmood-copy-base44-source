import React, { useState } from 'react';
import { Image, Milestone, Heart, Check } from 'lucide-react';
import BottomSheet from '@/components/shared/BottomSheet';
import { Button } from '@/components/ui/button';

const shareOptions = [
  { id: 'memory', icon: Image, title: 'Share a Memory', description: 'Share a specific photo or moment from your journey.' },
  { id: 'milestone', icon: Milestone, title: 'Share a Milestone', description: 'Celebrate an achievement with your pals.' },
  { id: 'summary', icon: Heart, title: 'Share Journey Summary', description: 'A beautiful overview of your Nmood story.' },
];

export default function ShareJourneySheet({ open, onOpenChange }) {
  const [shared, setShared] = useState(null);

  const handleShare = (id) => {
    setShared(id);
    setTimeout(() => {
      setShared(null);
      onOpenChange(false);
    }, 1500);
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Share Your Journey" description="Choose what to share. Your private data stays private.">
      <div className="space-y-2">
        {shareOptions.map((opt) => {
          const Icon = opt.icon;
          const isShared = shared === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => handleShare(opt.id)}
              disabled={shared !== null}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-default text-left disabled:opacity-50"
              type="button"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                {isShared ? <Check className="w-5 h-5 text-success" /> : <Icon className="w-5 h-5 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{isShared ? 'Link copied!' : opt.title}</p>
                <p className="text-xs text-muted-foreground">{isShared ? 'Share it with anyone.' : opt.description}</p>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground text-center mt-4 px-4">
        We never expose your personal data, attendance history, or pal details.
      </p>
    </BottomSheet>
  );
}