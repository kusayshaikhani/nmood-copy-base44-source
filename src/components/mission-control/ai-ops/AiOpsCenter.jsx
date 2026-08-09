import React, { useMemo, useState } from 'react';
import { Cpu, RefreshCw, LayoutDashboard, Sparkles, ShieldCheck, BookOpen, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAiOps } from '@/hooks/useAiOps';
import { MCModuleHeader, MCErrorState, MCLoadingState } from '@/components/mission-control/ui';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import AiOpsOverview from './AiOpsOverview';
import AiOpsAssistants from './AiOpsAssistants';
import AiOpsGovernance from './AiOpsGovernance';
import AiOpsRegistry from './AiOpsRegistry';
import AiOpsAuditQuality from './AiOpsAuditQuality';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { IS_DEV } from '@/lib/runtime-env';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'assistants', label: 'Assistants', icon: Sparkles },
  { id: 'governance', label: 'Governance', icon: ShieldCheck },
  { id: 'registry', label: 'Prompts & Models', icon: BookOpen },
  { id: 'audit', label: 'Audit & Quality', icon: Gauge },
];

/** AI-003 — AI Operations, Governance & Assistant Platform (Mission Control module). */
export default function AiOpsCenter() {
  const { t } = useLocalization();
  const { data, loading, error, refresh } = useAiOps();
  const [tab, setTab] = useState('overview');
  const [seeding, setSeeding] = useState(false);
  const metrics = useMemo(() => data?.metrics || null, [data]);

  const seed = async () => {
    setSeeding(true);
    try { await base44.functions.invoke('aiOps', { mode: 'seed' }); await refresh(); } catch (_e) {}
    setSeeding(false);
  };

  if (loading) return <div className="max-w-[1400px] mx-auto pb-10"><MCLoadingState rows={8} /></div>;
  if (error) return <MCErrorState title={t('mission.ai_operations_unavailable')} description="Could not load the platform." onRetry={refresh} />;
  if (!data) return <MCErrorState title={t('mission.no_data')} description="AI Operations data is unavailable." />;

  return (
    <div className="max-w-[1400px] mx-auto pb-10">
      <MCModuleHeader icon={Cpu} title={t('mission.ai_operations')} description="AI assistants, governance, explainability, audit & continuous learning." breadcrumb={[{ label: 'AI Operations' }]} />
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
          {IS_DEV && <Button size="sm" variant="outline" onClick={seed} disabled={seeding} className="h-8">{t('mission.seed_registry')}</Button>}
          <button onClick={refresh} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted/40" aria-label={t('mission.refresh_ai_operations')}><RefreshCw className="w-4 h-4" /> {t('admin.refresh')}</button>
        </div>
      </div>
      <div className="mt-4">
        {tab === 'overview' && <AiOpsOverview data={data} />}
        {tab === 'assistants' && <AiOpsAssistants data={data} onRan={refresh} />}
        {tab === 'governance' && <AiOpsGovernance data={data} onRan={refresh} />}
        {tab === 'registry' && <AiOpsRegistry data={data} />}
        {tab === 'audit' && <AiOpsAuditQuality metrics={metrics} recentAudits={data?.metrics?.recentAudits} />}
      </div>
    </div>
  );
}