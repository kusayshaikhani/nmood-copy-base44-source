import React from 'react';
import { Compass } from 'lucide-react';

/**
 * HM-UX-001 — Warm, actionable empty state used across Home widgets.
 * Replaces technical "No X Found" messages with encouraging copy + a clear
 * next action, so Home never feels empty (Never Empty Rule).
 */
export default function HomeEmptyState({ icon: Icon = Compass, title, message, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 rounded-2xl border border-dashed border-border bg-muted/20 text-center">
      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      {title && <p className="text-sm font-medium mb-1">{title}</p>}
      {message && <p className="text-sm text-muted-foreground mb-3 max-w-xs">{message}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction} type="button" className="text-sm text-primary font-medium hover:underline">
          {actionLabel}
        </button>
      )}
    </div>
  );
}