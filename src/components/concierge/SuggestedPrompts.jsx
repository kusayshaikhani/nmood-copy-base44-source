import React from 'react';
import { Sparkles, CalendarHeart, MapPin, Users, Plane, Coffee, Moon, Zap } from 'lucide-react';

const PROMPTS = [
  { text: 'Plan my evening', icon: CalendarHeart },
  { text: 'Find something fun nearby', icon: MapPin },
  { text: 'Date-night ideas', icon: Sparkles },
  { text: 'I want to meet new people', icon: Users },
  { text: 'Plan a weekend escape', icon: Plane },
  { text: 'Find a quiet coffee place', icon: Coffee },
  { text: 'Show me nightlife options', icon: Moon },
  { text: 'Surprise me', icon: Zap },
];

export default function SuggestedPrompts({ onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {PROMPTS.map((p) => {
        const Icon = p.icon;
        return (
          <button
            key={p.text}
            type="button"
            onClick={() => onSelect(p.text)}
            className="pressable flex items-center gap-2.5 rounded-2xl border border-border/50 bg-card p-3.5 text-left shadow-soft hover:border-primary/20 hover:shadow-card transition-default"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[13px] font-medium text-foreground leading-tight">{p.text}</span>
          </button>
        );
      })}
    </div>
  );
}