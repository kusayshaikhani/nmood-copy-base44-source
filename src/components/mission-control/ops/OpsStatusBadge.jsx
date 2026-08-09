import React from 'react';
import { cn } from '@/lib/utils';
import { statusMeta } from '@/lib/ops-metrics';

/** FM-011 — Service health badge (Healthy / Warning / Critical / Offline). */
export default function OpsStatusBadge({ status }) {
  const m = statusMeta(status);
  const colors = {
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    destructive: 'bg-destructive/15 text-destructive',
    muted: 'bg-muted text-muted-foreground',
  };
  const dot = {
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
    muted: 'bg-muted-foreground',
  };
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium', colors[m.color])}>
      <span className={cn('w-1.5 h-1.5 rounded-full', dot[m.color])} />
      {m.label}
    </span>
  );
}