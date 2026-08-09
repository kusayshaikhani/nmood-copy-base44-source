import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * UI-SETTINGS-014 — Shared settings row with standardized spacing.
 *
 * Measurements (all sections identical):
 *   Card horizontal padding: 16px  (px-4)
 *   Icon container:           40×40 (w-10 h-10)
 *   Icon size:                20px  (w-5 h-5)
 *   Space icon → text:        16px  (gap-4)
 *   Vertical padding:         16px  (py-4)
 *   Card radius:              16px  (rounded-2xl on the Card wrapper)
 */
export default function SettingsRow({
  icon: Icon,
  title,
  subtitle,
  trailing,
  to,
  onClick,
  disabled,
  iconClassName,
}) {
  const content = (
    <div className="flex items-center gap-4 px-4 py-4">
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className={cn('w-5 h-5 text-muted-foreground', iconClassName)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {trailing}
    </div>
  );

  if (to && !disabled) {
    return (
      <Link to={to} className="block hover:bg-muted/50 transition-default">
        {content}
      </Link>
    );
  }

  return (
    <div
      className={cn(
        'transition-default',
        disabled && 'opacity-60',
        onClick && !disabled && 'hover:bg-muted/50 cursor-pointer',
      )}
      onClick={disabled ? undefined : onClick}
    >
      {content}
    </div>
  );
}