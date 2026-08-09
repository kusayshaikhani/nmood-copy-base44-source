import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  STATUS_LABELS, STATUS_BADGE, PRIORITY_LABELS,
  REPORT_TYPE_LABELS, APPEAL_STATUS_LABELS,
} from '@/lib/trust-safety-directory';

export function ReportStatusBadge({ status }) {
  const s = status || 'submitted';
  return (
    <Badge variant={STATUS_BADGE[s] || 'secondary'} className={s === 'reviewing' ? 'text-warning' : s === 'dismissed' ? 'opacity-70' : ''}>
      {STATUS_LABELS[s] || s}
    </Badge>
  );
}

export function PriorityBadge({ priority }) {
  const p = priority || 'medium';
  return (
    <Badge variant={p === 'high' ? 'destructive' : 'secondary'} className={p === 'medium' ? 'text-warning' : ''}>
      {PRIORITY_LABELS[p] || p}
    </Badge>
  );
}

export function ReportTypeBadge({ type }) {
  return <Badge variant="outline" className="text-muted-foreground">{REPORT_TYPE_LABELS[type] || type || '—'}</Badge>;
}

export function AppealStatusBadge({ status }) {
  return (
    <Badge variant={status === 'open' ? 'default' : 'secondary'} className={status === 'waiting' ? 'text-warning' : ''}>
      {APPEAL_STATUS_LABELS[status] || status || '—'}
    </Badge>
  );
}