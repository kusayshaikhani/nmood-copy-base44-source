import React from 'react';
import { PROFILE_VIEW_FILTERS } from '@/lib/profile-views';

export default function ProfileViewsFilters({ active, onChange, counts }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
      {PROFILE_VIEW_FILTERS.map((f) => {
        const isActive = active === f;
        const count = counts?.[f];
        return (
          <button
            key={f}
            type="button"
            onClick={() => onChange(f)}
            className={`flex-shrink-0 px-3.5 h-9 rounded-full text-sm font-medium transition-default flex items-center gap-1.5 ${
              isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'
            }`}
          >
            {f}
            {typeof count === 'number' && (
              <span className={`text-xs ${isActive ? 'opacity-80' : 'opacity-60'}`}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}