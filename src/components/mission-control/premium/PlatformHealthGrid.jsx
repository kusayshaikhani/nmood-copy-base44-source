import React from 'react';
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import PremiumGlassCard from './PremiumGlassCard';
import { useLocalization } from '@/lib/i18n/useLocalization';

const DOT = { success: 'bg-success', warning: 'bg-warning', destructive: 'bg-destructive', unknown: 'bg-muted-foreground/40' };
const LABEL = { success: 'Healthy', warning: 'Warning', destructive: 'Down', unknown: 'Not monitored' };

export default function PlatformHealthGrid({ health, loading }) {
  const { t } = useLocalization();
  const { hasMonitoring, indicators } = health || {};
  return (
    <PremiumGlassCard
      icon={Activity}
      title={t('mission.platform_health')}
      action={<Link to="/mission-control/system-health" className="text-xs text-primary hover:underline">{t('mission.open')}</Link>}
    >
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-20 shimmer rounded-xl" />)}
        </div>
      ) : !hasMonitoring ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Activity className="w-8 h-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">{t('mission.monitoring_service_not_yet_initialized')}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">{t('mission.subsystem_health_will_appear_once')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {indicators.map((h) => (
            <Link
              key={h.name}
              to={h.to}
              className="pressable rounded-xl border border-border/50 bg-card/60 p-3.5 hover:border-primary/30 transition-default"
            >
              <div className="flex items-center justify-between">
                <span className={`w-2.5 h-2.5 rounded-full ${DOT[h.status] || DOT.unknown} ${h.status === 'success' ? 'animate-pulse' : ''}`} />
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{LABEL[h.status] || 'Not monitored'}</span>
              </div>
              <p className="text-sm font-semibold mt-2">{h.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{h.detail}</p>
            </Link>
          ))}
        </div>
      )}
    </PremiumGlassCard>
  );
}