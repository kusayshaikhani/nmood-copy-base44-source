import React from 'react';
import { LayoutGrid, Users, Calendar, Circle, Sparkles } from 'lucide-react';

const TABS = [
  { key: 'all', label: 'All', icon: LayoutGrid },
  { key: 'experience', label: 'Experiences', icon: Calendar },
  { key: 'circle', label: 'Circles', icon: Circle },
  { key: 'member', label: 'People', icon: Users },
  { key: 'inspirational', label: 'Ideas', icon: Sparkles },
];

export default function ConciergeFilterTabs({ active, onChange, counts = {} }) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
      {TABS.map(({ key, label, icon: Icon }) => {
        const count = counts[key] || 0;
        const isActive = active === key;
        // Hide tabs with zero count (except 'all')
        if (key !== 'all' && count === 0) return null;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-default ${
              isActive
                ? 'bg-nmood-cta text-primary-foreground shadow-soft'
                : 'bg-secondary/60 text-secondary-foreground hover:bg-secondary'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {count > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}