import React from 'react';
import { Radio } from 'lucide-react';
import CommandSection from './CommandSection';
import { formatRelative } from '@/lib/command-center-metrics';
import { useLocalization } from '@/lib/i18n/useLocalization';
import {
  UserPlus, Crown, Calendar, UsersRound, Flag, CheckCircle2, Gavel,
} from 'lucide-react';

const ICONS = {
  member: UserPlus, premium: Crown, experience: Calendar, circle: UsersRound,
  report_submitted: Flag, report_resolved: CheckCircle2, appeal: Gavel,
};

export default function LiveActivity({ items, loading }) {
  const { t } = useLocalization();
  return (
    <CommandSection icon={Radio} title={t('mission.live_activity')} action={<span className="text-[10px] text-muted-foreground">{t('mission.newest_first')}</span>}>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-6 shimmer rounded" />)}</div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">{t('mission.no_platform_activity_recorded_yet')}</p>
      ) : (
        <ol className="space-y-0 max-h-[320px] overflow-y-auto no-scrollbar">
          {items.map((it, idx) => {
            const Icon = ICONS[it.kind] || Radio;
            const last = idx === items.length - 1;
            return (
              <li key={it.id} className="flex gap-3">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center"><Icon className="w-3.5 h-3.5" /></div>
                  {!last && <div className="w-px flex-1 bg-border my-1" />}
                </div>
                <div className="min-w-0 pb-3">
                  <p className="text-sm">{it.title}</p>
                  {it.subtitle && <p className="text-xs text-muted-foreground truncate">{it.subtitle}</p>}
                  <p className="text-[10px] text-muted-foreground/70">{formatRelative(it.time)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </CommandSection>
  );
}