import React from 'react';

const filters = [
  { id: 'all', label: 'All' },
  { id: 'hosting', label: 'Hosting' },
  { id: 'joined', label: 'Joined' },
  { id: 'pending', label: 'Invitations' },
  { id: 'community', label: 'Community' },
  { id: 'circle', label: 'Circle' },
  { id: 'suggested', label: 'Suggested' },
  { id: 'completed', label: 'Completed' },
];

export default function CalendarFilters({ filter, onFilterChange }) {
  return (
    <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
      {filters.map((f) => {
        const isActive = filter === f.id;
        const tabClass = isActive
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/70';
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onFilterChange(f.id)}
            className={tabClass + ' px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-default'}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}