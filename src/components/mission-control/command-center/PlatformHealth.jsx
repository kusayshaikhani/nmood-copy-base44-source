import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertCircle } from 'lucide-react';
import CommandSection from './CommandSection';
import { useLocalization } from '@/lib/i18n/useLocalization';

const DOT = { success: 'bg-success', warning: 'bg-warning', destructive: 'bg-destructive', unknown: 'bg-muted-foreground/40' };
const LABEL = { success: 'Healthy', warning: 'Warning', destructive: 'Down', unknown: 'Not monitored' };

/**
 * MC-R1 — Platform Health (Platform group). Shows live indicators when
 * monitoring data exists; otherwise a single "Monitoring service not yet
 * initialized" empty state. Unknown subsystems are labelled "Not monitored".
 */
export default function PlatformHealth({ health, loading }) {
  const { t } = useLocalization();
  const { hasMonitoring, indicators } = health || {};
  return (
    <CommandSection icon={Activity} title={t('mission.platform_health')} action={<Link to="/mission-control/system-health" className="text-xs text-primary hover:underline">{t('mission.open')}</Link>}>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 shimmer rounded" />)}</div>
      ) : !hasMonitoring ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="w-8 h-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">{t('mission.monitoring_service_not_yet_initialized')}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">{t('mission.subsystem_health_will_appear_once')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {indicators.map((h) => (
            <Link key={h.name} to={h.to} className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 hover:bg-muted/70 transition-default">
              <span className={'w-2.5 h-2.5 rounded-full flex-shrink-0 ' + (DOT[h.status] || DOT.unknown)} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{h.name}</p>
                <p className="text-[10px] text-muted-foreground">{LABEL[h.status] || 'Not monitored'} · {h.detail}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </CommandSection>
  );
}