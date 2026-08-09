import React from 'react';
import {
  Radio, UserPlus, Crown, Calendar, UsersRound, Flag, CheckCircle2, Gavel,
} from 'lucide-react';
import PremiumGlassCard from './PremiumGlassCard';
import { formatRelative } from '@/lib/command-center-metrics';
import { useLocalization } from '@/lib/i18n/useLocalization';

const ICONS = {
  member: UserPlus, premium: Crown, experience: Calendar, circle: UsersRound,
  report_submitted: Flag, report_resolved: CheckCircle2, appeal: Gavel,
};
const TONES = {
  member: 'text-success', premium: 'text-warning', experience: 'text-info',
  circle: 'text-accent-foreground', report_submitted: 'text-destructive',
  report_resolved: 'text-success', appeal: 'text-primary',
};

export default function LiveActivityFeed({ items, loading }) {
  const { t } = useLocalization();
  return (
    <PremiumGlassCard
      icon={Radio}
      title={t('mission.live_activity')}
      action={
        <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
          </span>
          {t('mission.newest_first')}
        </span>
      }
    >
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 shimmer rounded-xl" />)}</div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">{t('mission.no_platform_activity_recorded_yet')}</p>
      ) : (
        <ol className="space-y-0 max-h-[460px] overflow-y-auto no-scrollbar -mx-1 px-1">
          {items.map((it, idx) => {
            const Icon = ICONS[it.kind] || Radio;
            const tone = TONES[it.kind] || 'text-primary';
            const last = idx === items.length - 1;
            return (
              <li key={it.id} className="flex gap-3 animate-fade-in-up" style={{ animationDelay: `${Math.min(idx, 12) * 40}ms` }}>
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-9 h-9 rounded-full bg-muted/60 flex items-center justify-center ${tone}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {!last && <div className="w-px flex-1 bg-border my-1" />}
                </div>
                <div className="min-w-0 pb-3 pt-1.5">
                  <p className="text-sm font-medium">{it.title}</p>
                  {it.subtitle && <p className="text-xs text-muted-foreground truncate">{it.subtitle}</p>}
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">{formatRelative(it.time)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </PremiumGlassCard>
  );
}