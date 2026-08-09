import React, { useState, useEffect } from 'react';
import { Rocket, RefreshCw, LayoutDashboard, CheckCircle2, Store, Scale, Languages, Accessibility, Lock, Brain, ListChecks, Activity, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLaunchCenter } from '@/hooks/useLaunchCenter';
import { MCModuleHeader, MCErrorState, MCLoadingState } from '@/components/mission-control/ui';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import LaunchOverview from './LaunchOverview';
import ReleaseCertification from './ReleaseCertification';
import StoreReadiness from './StoreReadiness';
import LegalCertification from './LegalCertification';
import LocalizationCertification from './LocalizationCertification';
import AccessibilityCertification from './AccessibilityCertification';
import SecurityCertification from './SecurityCertification';
import AiCertification from './AiCertification';
import LaunchChecklist from './LaunchChecklist';
import LaunchDayChecklist from './LaunchDayChecklist';
import FounderLaunchDashboard from './FounderLaunchDashboard';
import LaunchMonitoringChecklist from './LaunchMonitoringChecklist';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { IS_DEV } from '@/lib/runtime-env';

const TABS = [
  { id: 'overview', label: 'Launch Center', icon: LayoutDashboard, sections: '8, 9, 11' },
  { id: 'release', label: 'Release Certification', icon: CheckCircle2, sections: '1' },
  { id: 'store', label: 'App Store Readiness', icon: Store, sections: '2' },
  { id: 'legal', label: 'Legal', icon: Scale, sections: '3' },
  { id: 'localization', label: 'Localization', icon: Languages, sections: '4' },
  { id: 'accessibility', label: 'Accessibility', icon: Accessibility, sections: '5' },
  { id: 'security', label: 'Security', icon: Lock, sections: '6' },
  { id: 'ai', label: 'AI Certification', icon: Brain, sections: '7' },
  { id: 'checklist', label: 'Launch Checklist', icon: ListChecks, sections: '10' },
  { id: 'launchday', label: 'Launch Day', icon: ClipboardCheck, sections: '12' },
  { id: 'monitoring', label: 'Launch Monitoring', icon: Activity, sections: '12' },
];

// LM-001 — load live observability payload for the monitoring checklist.
function useMonitoringSnapshot() {
  const [snap, setSnap] = useState(null);
  useEffect(() => {
    base44.functions.invoke('monitoringOps', { mode: 'dashboard' }).then(setSnap).catch(() => setSnap(null));
  }, []);
  return snap;
}

/** RRPH-002 — Release Certification, Launch Readiness & Founder Launch Center. */
export default function LaunchCenter() {
  const { t } = useLocalization();
  const { data, loading, error, refresh } = useLaunchCenter();
  const [tab, setTab] = useState('overview');
  const [seeding, setSeeding] = useState(false);
  const monitoringSnap = useMonitoringSnapshot();

  const seed = async () => {
    setSeeding(true);
    try { await base44.functions.invoke('launchCenter', { mode: 'seed' }); await refresh(); } catch (_e) {}
    setSeeding(false);
  };

  if (loading) return <div className="max-w-[1400px] mx-auto pb-10"><MCLoadingState rows={8} /></div>;
  if (error) return <MCErrorState title={t('mission.launch_center_unavailable')} description="Could not load release certification data." onRetry={refresh} />;
  if (!data) return <MCErrorState title={t('mission.no_data')} description="Launch center data is unavailable. Try seeding." />;

  return (
    <div className="max-w-[1400px] mx-auto pb-10">
      <MCModuleHeader icon={Rocket} title={t('mission.founder_launch_center')} description="Release 1.0 certification, launch readiness, go/no-go & operational launch status." breadcrumb={[{ label: 'Founder Launch Center' }]} />
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
          <button onClick={refresh} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted/40" aria-label={t('mission.refresh_launch_center')}><RefreshCw className="w-4 h-4" /> {t('admin.refresh')}</button>
        </div>
      </div>
      <div className="mt-4">
        {tab === 'overview' && <LaunchOverview data={data} onUpdated={refresh} />}
        {tab === 'release' && <ReleaseCertification data={data} onUpdated={refresh} />}
        {tab === 'store' && <StoreReadiness data={data} onUpdated={refresh} />}
        {tab === 'legal' && <LegalCertification data={data} onUpdated={refresh} />}
        {tab === 'localization' && <LocalizationCertification data={data} onUpdated={refresh} />}
        {tab === 'accessibility' && <AccessibilityCertification data={data} onUpdated={refresh} />}
        {tab === 'security' && <SecurityCertification data={data} onUpdated={refresh} />}
        {tab === 'ai' && <AiCertification data={data} onUpdated={refresh} />}
        {tab === 'checklist' && <LaunchChecklist data={data} onUpdated={refresh} />}
        {tab === 'launchday' && <LaunchDayChecklist />}
        {tab === 'monitoring' && (
          <div className="space-y-8">
            <FounderLaunchDashboard />
            <LaunchMonitoringChecklist observability={monitoringSnap} />
          </div>
        )}
      </div>
    </div>
  );
}