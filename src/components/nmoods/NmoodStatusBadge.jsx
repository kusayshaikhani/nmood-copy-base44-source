import React from 'react';
import { cn } from '@/lib/utils';
import { useLocalization } from '@/lib/i18n/useLocalization';

const STATUS_STYLES = {
  draft: 'bg-muted text-muted-foreground',
  published: 'bg-info/15 text-info',
  trending: 'bg-warning/15 text-warning',
  starting_soon: 'bg-warning/15 text-warning',
  live_now: 'bg-destructive/15 text-destructive',
  completed: 'bg-success/15 text-success',
  expired: 'bg-muted text-muted-foreground',
  archived: 'bg-muted text-muted-foreground',
};

const STATUS_ICONS = {
  draft: '📝',
  published: '📢',
  trending: '🔥',
  starting_soon: '⚡',
  live_now: '🔴',
  completed: '✅',
  expired: '⏰',
  archived: '📦',
};

export default function NmoodStatusBadge({ status, size = 'sm' }) {
  const { t } = useLocalization();
  const style = STATUS_STYLES[status] || STATUS_STYLES.published;
  const icon = STATUS_ICONS[status] || '📢';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-semibold rounded-full whitespace-nowrap',
        style,
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1'
      )}
    >
      {status === 'live_now' ? (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      ) : (
        <span className="leading-none">{icon}</span>
      )}
      <span>{t(`nmoods.status.${status}`)}</span>
    </span>
  );
}