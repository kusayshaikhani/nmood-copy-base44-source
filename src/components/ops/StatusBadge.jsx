import React from 'react';

const statusConfig = {
  not_started: { label: 'Not Started', dot: 'bg-muted-foreground', text: 'text-muted-foreground', bg: 'bg-muted/50' },
  in_progress: { label: 'In Progress', dot: 'bg-info', text: 'text-info', bg: 'bg-info/10' },
  ready: { label: 'Ready', dot: 'bg-success', text: 'text-success', bg: 'bg-success/10' },
  blocked: { label: 'Blocked', dot: 'bg-destructive', text: 'text-destructive', bg: 'bg-destructive/10' },
  completed: { label: 'Completed', dot: 'bg-success', text: 'text-success', bg: 'bg-success/10' },
  open: { label: 'Open', dot: 'bg-info', text: 'text-info', bg: 'bg-info/10' },
  resolved: { label: 'Resolved', dot: 'bg-success', text: 'text-success', bg: 'bg-success/10' },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const config = statusConfig[status] || statusConfig.not_started;
  const sizeClass = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span className={'inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap ' + sizeClass + ' ' + config.bg + ' ' + config.text}>
      <span className={'w-1.5 h-1.5 rounded-full ' + config.dot} />
      {config.label}
    </span>
  );
}