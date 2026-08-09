import React, { useMemo, useState } from 'react';
import { Sparkles, RefreshCw, LayoutDashboard, Brain, Search, GitBranch, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePersonalIntelligence } from '@/hooks/usePersonalIntelligence';
import { MCModuleHeader, MCErrorState, MCLoadingState } from '@/components/mission-control/ui';
import { base44 } from '@/api/base44Client';
import PiOverview from './PiOverview';
import PiMemory from './PiMemory';
import PiSemantic from './PiSemantic';
import PiKnowledgeGraph from './PiKnowledgeGraph';
import PiObservability from './PiObservability';
import { useLocalization } from '@/lib/i18n/useLocalization';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'memory', label: 'Memory', icon: Brain },
  { id: 'semantic', label: 'Semantic', icon: Search },
  { id: 'graph', label: 'Knowledge Graph', icon: GitBranch },
  { id: 'observability', label: 'Observability', icon: Gauge },
];

/** AI-002 — Personal Intelligence Platform (Mission Control module). */
export default function PersonalIntelligenceCenter() {
  const { t } = useLocalization();
  const { data, loading, error, refresh } = usePersonalIntelligence();
  const [tab, setTab] = useState('overview');
  const [seeding, setSeeding] = useState(false);
  const metrics = useMemo(() => data?.metrics || null, [data]);

  const seedConcepts = async () => {
    setSeeding(true);
    try { await base44.functions.invoke('aiMemory', { mode: 'seedConcepts' }); await refresh(); } catch (_e) {}
    setSeeding(false);
  };

  if (loading) return <div className="max-w-[1400px] mx-auto pb-10"><MCLoadingState rows={8} /></div>;
  if (error) return <MCErrorState title={t('mission.personal_intelligence_unavailable')} description="Could not load the platform." onRetry={refresh} />;
  if (!data) return <MCErrorState title={t('mission.no_data')} description="Personal Intelligence data is unavailable." />;

  return (
    <div className="max-w-[1400px] mx-auto pb-10">
      <MCModuleHeader icon={Sparkles} title={t('mission.personal_intelligence')} description="Privacy-aware AI memory, semantic intelligence & personalization architecture." breadcrumb={[{ label: 'Personal Intelligence' }]} />
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
        <button onClick={refresh} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted/40" aria-label={t('mission.refresh_personal_intelligence')}>
          <RefreshCw className="w-4 h-4" /> {t('admin.refresh')}
        </button>
      </div>
      <div className="mt-4">
        {tab === 'overview' && <PiOverview data={data} />}
        {tab === 'memory' && <PiMemory metrics={metrics} />}
        {tab === 'semantic' && <PiSemantic data={data} onSeed={seedConcepts} />}
        {tab === 'graph' && <PiKnowledgeGraph metrics={metrics} />}
        {tab === 'observability' && <PiObservability metrics={metrics} />}
      </div>
      {seeding && <p className="text-xs text-muted-foreground mt-3">{t('mission.seeding_concept_registry')}</p>}
    </div>
  );
}