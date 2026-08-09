import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const TONES = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  accent: 'bg-accent/25 text-accent-foreground',
  destructive: 'bg-destructive/10 text-destructive',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/15 text-warning',
};

/**
 * UI-022 — Premium settings row. Soft tinted icon container, title + subtitle,
 * optional trailing control, and a chevron for navigation rows. Taps animate
 * with a gentle 98% scale. Carries `searchKeys` for the settings search.
 */
export default function PremiumSettingsRow({
  icon: Icon,
  title,
  subtitle,
  trailing,
  to,
  onClick,
  disabled,
  tone = 'default',
  searchKeys = [],
  chevron,
  className,
}) {
  const showChevron = chevron !== false && !disabled && !trailing && (to || onClick);
  const content = (
    <div
      className={cn(
        'flex items-center gap-3.5 px-4 py-3.5 transition-default',
        disabled && 'opacity-55',
        !disabled && (to || onClick) && 'hover:bg-muted/40 cursor-pointer',
        className,
      )}
      onClick={disabled ? undefined : onClick}
    >
      <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0', TONES[tone] || TONES.default)}>
        {Icon && <Icon className="w-[18px] h-[18px]" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14.5px] font-medium leading-tight truncate">{title}</p>
        {subtitle && <p className="text-[12.5px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {trailing}
        {showChevron && <ChevronRight className="w-4 h-4 text-muted-foreground/60" />}
      </div>
    </div>
  );

  if (to && !disabled) {
    return (
      <Link to={to} className="block">
        {content}
      </Link>
    );
  }
  return <div>{content}</div>;
}