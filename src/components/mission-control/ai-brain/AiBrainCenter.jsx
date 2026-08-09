import React, { useMemo, useState } from 'react';
import { BrainCircuit, RefreshCw, LayoutDashboard, Boxes, Server, Gauge, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAiBrain } from '@/hooks/useAiBrain';
import { MCModuleHeader, MCErrorState, MCLoadingState } from '@/components/mission-control/ui';
import AiBrainOverview from './AiBrainOverview';
import AiBrainRegistry from './AiBrainRegistry';
import AiBrainProviders from './AiBrainProviders';
import AiBrainObservability from './AiBrainObservability';
import AiBrainPlayground from './AiBrainPlayground';
import { useLocalization } from '@/lib/i18n/useLocalization';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'registry', label: 'Registry', icon: Boxes },
  { id: 'providers', label: 'Providers', icon: Server },
  { id: 'observability', label: 'Observability', icon: Gauge },
  { id: 'playground', label: 'Playground', icon: FlaskConical },
];

/** AI-001 — Nmood AI Brain: centralized AI orchestration platform (Mission Control module). */
export default function AiBrainCenter() {
  const { t } = useLocalization();
  const { data, loading, error, refresh } = useAiBrain();
  const [tab, setTab] = useState('overview');
  const metrics = useMemo(() => data?.metrics || null, [data]);

  if (loading) return <div className="max-w-[1400px] mx-auto pb-10"><MCLoadingState rows={8} /></div>;
  if (error) return <MCErrorState title={t('mission.ai_brain_unavailable')} description="Could not load the AI Brain." onRetry={refresh} />;
  if (!data) return <MCErrorState title={t('mission.no_data')} description="AI Brain data is unavailable." />;

  return (
    <div className="max-w-[1400px] mx-auto pb-10">
      <MCModuleHeader icon={BrainCircuit} title={t('mission.ai_brain')} description="Centralized AI orchestration, service registry & observability." breadcrumb={[{ label: 'AI Brain' }]} />
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
        <button onClick={refresh} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted/40" aria-label={t('mission.refresh_ai_brain')}>
          <RefreshCw className="w-4 h-4" /> {t('admin.refresh')}
        </button>
      </div>
      <div className="mt-4">
        {tab === 'overview' && <AiBrainOverview data={data} />}
        {tab === 'registry' && <AiBrainRegistry data={data} />}
        {tab === 'providers' && <AiBrainProviders data={data} />}
        {tab === 'observability' && <AiBrainObservability metrics={metrics} />}
        {tab === 'playground' && <AiBrainPlayground data={data} onRan={refresh} />}
      </div>
    </div>
  );
}