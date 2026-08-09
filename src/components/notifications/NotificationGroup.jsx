import React from 'react';
import NotificationCard from './NotificationCard';

/**
 * UI-007 — Premium date group header + rounded card list.
 */
export default function NotificationGroup({ label, items, onAction, selectMode, selectedIds, onToggleSelect }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 px-1">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</h3>
        <span className="text-[11px] font-medium text-muted-foreground/60 bg-muted/60 rounded-full px-2 py-0.5">{items.length}</span>
      </div>
      <div className="space-y-3">
        {items.map((n) => (
          <NotificationCard
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