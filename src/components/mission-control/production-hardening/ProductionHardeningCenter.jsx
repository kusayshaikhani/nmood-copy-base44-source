import React, { useState } from 'react';
import { ShieldCheck, RefreshCw, LayoutDashboard, Lock, Gauge, ShieldAlert, Activity, Bell, Rocket, LifeBuoy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProductionHardening } from '@/hooks/useProductionHardening';
import { MCModuleHeader, MCErrorState, MCLoadingState } from '@/components/mission-control/ui';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import PHOverview from './PHOverview';
import PHSecurity from './PHSecurity';
import PHPerformance from './PHPerformance';
import PHReliability from './PHReliability';
import PHMonitoring from './PHMonitoring';
import PHAlerting from './PHAlerting';
import PHDeployments from './PHDeployments';
import PHContinuity from './PHContinuity';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { IS_DEV } from '@/lib/runtime-env';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, sections: '1, 15' },
  { id: 'security', label: 'Security', icon: Lock, sections: '1, 13' },
  { id: 'performance', label: 'Performance & Scale', icon: Gauge, sections: '2, 3, 14' },
  { id: 'reliability', label: 'Reliability & Backups', icon: ShieldAlert, sections: '4, 5' },
  { id: 'monitoring', label: 'Monitoring & Logs', icon: Activity, sections: '6, 7' },
  { id: 'alerting', label: 'Alerting & Incidents', icon: Bell, sections: '8, 11' },
  { id: 'deployments', label: 'Deployments & Health', icon: Rocket, sections: '9, 10' },
  { id: 'continuity', label: 'Business Continuity', icon: LifeBuoy, sections: '12' },
];

/** RRPH-001 — Enterprise Production Hardening & Operations Platform (Mission Control module). */
export default function ProductionHardeningCenter() {
  const { t } = useLocalization();
  const { data, loading, error, refresh } = useProductionHardening();
  const [tab, setTab] = useState('overview');
  const [seeding, setSeeding] = useState(false);

  const seed = async () => {
    setSeeding(true);
    try { await base44.functions.invoke('productionHardening', { mode: 'seed' }); await refresh(); } catch (_e) {}
    setSeeding(false);
  };

  if (loading) return <div className="max-w-[1400px] mx-auto pb-10"><MCLoadingState rows={8} /></div>;
  if (error) return <MCErrorState title={t('mission.production_hardening_unavailable')} description="Could not load the platform." onRetry={refresh} />;
  if (!data) return <MCErrorState title={t('mission.no_data')} description="Production hardening data is unavailable." />;

  return (
    <div className="max-w-[1400px] mx-auto pb-10">
      <MCModuleHeader icon={ShieldCheck} title={t('mission.production_hardening')} description="Enterprise production readiness: security, performance, reliability, monitoring, deployments & disaster recovery." breadcrumb={[{ label: 'Production Hardening' }]} />
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={cn('flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-default', tab === t.id ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground')}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          {IS_DEV && <Button size="sm" variant="outline" onClick={seed} disabled={seeding} className="h-8">{t('mission.seed_data')}</Button>}
          <button onClick={refresh} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted/40" aria-label={t('mission.refresh_production_hardening')}><RefreshCw className="w-4 h-4" /> {t('admin.refresh')}</button>
        </div>
      </div>
      <div className="mt-4">
        {tab === 'overview' && <PHOverview data={data} />}
        {tab === 'security' && <PHSecurity data={data} onRan={refresh} />}
        {tab === 'performance' && <PHPerformance data={data} />}
        {tab === 'reliability' && <PHReliability data={data} onRan={refresh} />}
        {tab === 'monitoring' && <PHMonitoring data={data} onRan={refresh} />}
        {tab === 'alerting' && <PHAlerting data={data} onRan={refresh} />}
        {tab === 'deployments' && <PHDeployments data={data} onRan={refresh} />}
        {tab === 'continuity' && <PHContinuity data={data} />}
      </div>
    </div>
  );
}