import React from 'react';
import { Heart } from 'lucide-react';

export default function DailyInspiration() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 p-6 text-center border border-primary/10">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Heart className="w-6 h-6 text-primary" />
      </div>
      <p className="text-lg font-semibold leading-relaxed mb-2 text-balance">
        "Life feels better together."
      </p>
      <p className="text-xs text-muted-foreground">— Nmood Daily Inspiration</p>
    </div>
  );
}