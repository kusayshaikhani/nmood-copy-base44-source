import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { getCountdown, formatCountdown } from '@/lib/nmood-lifecycle';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { cn } from '@/lib/utils';

export default function NmoodCountdown({ post, variant = 'compact' }) {
  const { t } = useLocalization();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const countdown = getCountdown(post, new Date(now));
  if (!countdown) return null;

  const { days, hours, minutes, seconds } = formatCountdown(countdown.ms);
  const isStartsIn = countdown.type === 'starts_in';

  let timeStr;
  if (days > 0) timeStr = `${days}d ${hours}h`;
  else if (hours > 0) timeStr = `${hours}h ${minutes}m`;
  else timeStr = `${minutes}m ${String(seconds).padStart(2, '0')}s`;

  const label = isStartsIn ? t('nmoods.countdown.starts_in') : t('nmoods.countdown.ends_in');
  const colorClass = isStartsIn ? 'text-warning' : 'text-destructive';

  if (variant === 'prominent') {
    return (
      <div className={cn('flex items-center gap-3 rounded-xl px-4 py-3', isStartsIn ? 'bg-warning/10' : 'bg-destructive/10')}>
        <Clock className={cn('w-5 h-5', colorClass)} />
        <div>
          <p className={cn('text-[11px] font-medium', colorClass, 'opacity-80')}>{label}</p>
          <p className={cn('text-lg font-bold tabular-nums', colorClass)}>{timeStr}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mb-3">
      <span className={cn('inline-flex items-center gap-1 text-xs font-semibold', colorClass)}>
        <Clock className="w-3.5 h-3.5" />
        {label} {timeStr}
      </span>
    </div>
  );
}