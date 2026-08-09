import React from 'react';

const MAP = {
  healthy: { dot: 'bg-success', label: 'Healthy', emoji: '🟢' },
  warning: { dot: 'bg-warning', label: 'Warning', emoji: '🟡' },
  critical: { dot: 'bg-destructive', label: 'Critical', emoji: '🔴' },
};

export default function HealthDot({ status, showEmoji = false, withLabel = false, className = '' }) {
  const m = MAP[status] || MAP.healthy;
  return (
    <span className={'inline-flex items-center gap-1.5 ' + className}>
      <span className={'w-2 h-2 rounded-full ' + m.dot} />
      {showEmoji && <span aria-hidden>{m.emoji}</span>}
      {withLabel && <span className="text-xs font-medium">{m.label}</span>}
    </span>
  );
}