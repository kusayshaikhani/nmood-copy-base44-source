import React from 'react';
import PremiumNotificationCard from './PremiumNotificationCard';

/**
 * UI-019 — Premium date group with elegant section header.
 */
export default function NotificationGroupSection({ label, items, onAction, selectMode, selectedIds, onToggleSelect }) {
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-3">
        <h3 className="text-[13px] font-bold text-foreground/80 uppercase tracking-wider">
          {label}
        </h3>
        <span className="text-[11px] font-medium text-muted-foreground bg-muted/70 rounded-full px-2 py-0.5">
          {items.length}
        </span>
      </div>
      <div className="space-y-3">
        {items.map((n) => (
          <PremiumNotificationCard
            key={n.id}
            notification={n}
            onAction={onAction}
            selectMode={selectMode}
            selected={selectedIds?.has(n.id)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>
    </div>
  );
}