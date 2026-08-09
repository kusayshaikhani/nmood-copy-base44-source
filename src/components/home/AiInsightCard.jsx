import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function AiInsightCard() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary via-primary to-accent p-5 text-primary-foreground relative overflow-hidden">
      <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
      <div className="absolute -right-10 -bottom-10 w-36 h-36 rounded-full bg-white/5" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold">AI Daily Insight</span>
        </div>
        <p className="text-sm leading-relaxed text-primary-foreground/90 mb-4">
          You've been feeling more reflective this week. A short walk in nature today could help you process your thoughts and find clarity.
        </p>
        <button className="flex items-center gap-1.5 text-sm font-semibold text-white hover:gap-2.5 transition-all" type="button">
          Reflect now <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}