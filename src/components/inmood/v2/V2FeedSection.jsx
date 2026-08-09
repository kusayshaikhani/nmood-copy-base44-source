import React from 'react';
import { Sparkles, Clock, MapPin, CalendarPlus, Wand2 } from 'lucide-react';

const SECTIONS = {
  best: { label: 'Best Match', Icon: Sparkles },
  soon: { label: 'Trending Today', Icon: Clock },
  nearby: { label: 'Nearby', Icon: MapPin },
  today: { label: 'Recently Active', Icon: CalendarPlus },
  ai: { label: 'AI Recommendation', Icon: Wand2 },
};

export default function V2FeedSection({ id, children }) {
  const s = SECTIONS[id];
  if (!s) return <div className="space-y-4">{children}</div>;
  const { Icon } = s;
  return (
    <section>
      <div className="flex items-center gap-2 mb-3.5">
        <Icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {s.label}
        </span>
        <div className="w-6 h-px bg-border/60" />
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}