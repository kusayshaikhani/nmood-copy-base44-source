import React from 'react';
import { Gauge } from 'lucide-react';
import CommandSection from './CommandSection';
import { scoreStatus, scoreColor } from '@/lib/command-center-metrics';
import { useLocalization } from '@/lib/i18n/useLocalization';

const RING = { success: 'text-success', warning: 'text-warning', destructive: 'text-destructive' };

export default function PlatformScore({ score, loading }) {
  const { t } = useLocalization();
  const color = scoreColor(score);
  const status = scoreStatus(score);
  return (
    <CommandSection icon={Gauge} title={t('mission.platform_score')}>
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"
              className={RING[color]} strokeDasharray={2 * Math.PI * 42} strokeDashoffset={2 * Math.PI * 42 * (1 - score / 100)} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={'text-2xl font-bold ' + RING[color]}>{loading ? '—' : score}</span>
            <span className="text-[10px] text-muted-foreground">/ 100</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold">{t('mission.status')} <span className={RING[color]}>{loading ? '—' : status}</span></p>
          <p className="text-xs text-muted-foreground mt-1">{t('mission.computed_from_health_trust_safety')}</p>
        </div>
      </div>
    </CommandSection>
  );
}