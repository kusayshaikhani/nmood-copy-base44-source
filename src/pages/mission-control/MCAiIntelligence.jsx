import React, { useMemo, useState } from 'react';
import { Download, FileText, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { useAiIntelligenceData } from '@/hooks/useAiIntelligenceData';
import { MODULES } from '@/lib/mission-control-modules';
import { MCModuleHeader, MCActionToolbar, ToolbarSearch, ToolbarButton } from '@/components/mission-control/ui';
import { toast } from '@/components/ui/use-toast';
import {
  computeOverview, computeHealth, computeRecommendationPerformance,
  computeMemberInsights, computeAiQuality, computeAiSafety, computeModelPerformance,
  computeAiKnowledge, computeAiAlerts, FUTURE_AI_FEATURES, AI_SERVICES, filterOptions,
  exportAiCsv, exportAiPdf,
} from '@/lib/ai-intelligence-metrics';

import AiOverview from '@/components/mission-control/ai-intelligence/AiOverview';
import AiHealth from '@/components/mission-control/ai-intelligence/AiHealth';
import RecommendationPerformance from '@/components/mission-control/ai-intelligence/RecommendationPerformance';
import MemberInsights from '@/components/mission-control/ai-intelligence/MemberInsights';
import AiQuality from '@/components/mission-control/ai-intelligence/AiQuality';
import AiSafety from '@/components/mission-control/ai-intelligence/AiSafety';
import ModelPerformance from '@/components/mission-control/ai-intelligence/ModelPerformance';
import PromptManagement from '@/components/mission-control/ai-intelligence/PromptManagement';
import AiKnowledge from '@/components/mission-control/ai-intelligence/AiKnowledge';
import AiAlerts from '@/components/mission-control/ai-intelligence/AiAlerts';
import FutureAiFeatures from '@/components/mission-control/ai-intelligence/FutureAiFeatures';
import AiFilters from '@/components/mission-control/ai-intelligence/AiFilters';
import { useLocalization } from '@/lib/i18n/useLocalization';

const STATUS_VALUES = ['healthy', 'warning', 'critical', 'offline', 'unknown'];

export default function MCAiIntelligence() {
  const { t } = useLocalization();
  const { members, experiences, circles, loading, error, refresh } = useAiIntelligenceData();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  const overview = useMemo(() => computeOverview(), []);
  const health = useMemo(() => {
    let svcs = computeHealth(error);
    if (filters.service) svcs = svcs.filter((s) => s.key === filters.service);
    if (filters.status) svcs = svcs.filter((s) => s.status === filters.status);
    return svcs;
  }, [error, filters.service, filters.status]);
  const recPerf = useMemo(() => computeRecommendationPerformance(), []);
  const insights = useMemo(() => computeMemberInsights(members, experiences, circles, filters), [members, experiences, circles, filters]);
  const quality = useMemo(() => computeAiQuality(), []);
  const safety = useMemo(() => computeAiSafety(), []);
  const modelPerf = useMemo(() => computeModelPerformance(), []);
  const knowledge = useMemo(() => computeAiKnowledge(members, experiences, circles), [members, experiences, circles]);
  const alerts = useMemo(() => {
    let a = computeAiAlerts(error);
    if (search) a = a.filter((x) => x.title.toLowerCase().includes(search.toLowerCase()));
    return a;
  }, [error, search]);
  const options = useMemo(() => filterOptions(members), [members]);
  const serviceOptions = useMemo(() => AI_SERVICES.map((s) => ({ value: s.key, label: s.name })), []);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const doExportCsv = () => { exportAiCsv(insights, knowledge); toast({ title: 'AI metrics exported (CSV)' }); };
  const doExportPdf = async () => { try { await exportAiPdf(insights, knowledge); toast({ title: 'AI report exported (PDF)' }); } catch { toast({ title: 'PDF export failed', variant: 'destructive' }); } };

  return (
    <div className="max-w-[1400px] mx-auto pb-10">
      <MCModuleHeader
        icon={MODULES['ai-intelligence'].icon}
        title={MODULES['ai-intelligence'].title}
        description={MODULES['ai-intelligence'].description}
        breadcrumb={[{ label: MODULES['ai-intelligence'].title }]}
      />

      <MCActionToolbar>
        <ToolbarSearch value={search} onChange={setSearch} placeholder={t('mission.search_prompts_services_alerts_knowledge')} />
        <ToolbarButton icon={SlidersHorizontal} label={`Filters${activeFilterCount ? ` ${activeFilterCount}` : ''}`} active={showFilters || activeFilterCount > 0} onClick={() => setShowFilters((s) => !s)} />
        <ToolbarButton icon={Download} label="CSV" onClick={doExportCsv} />
        <ToolbarButton icon={FileText} label="PDF" onClick={doExportPdf} />
        <ToolbarButton icon={RefreshCw} label="Refresh" onClick={refresh} />
      </MCActionToolbar>

      {showFilters && (
        <div className="mb-4">
          <AiFilters filters={filters} onChange={setFilters} onClear={() => setFilters({})} options={options} services={serviceOptions} />
        </div>
      )}

      <div className="space-y-4">
        <AiOverview overview={overview} loading={loading} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AiHealth services={health} />
          <AiAlerts alerts={alerts} />
        </div>

        <MemberInsights insights={insights} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RecommendationPerformance perf={recPerf} />
          <ModelPerformance perf={modelPerf} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AiQuality quality={quality} />
          <AiSafety safety={safety} />
        </div>

        <PromptManagement search={search} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AiKnowledge knowledge={knowledge} />
          <FutureAiFeatures features={FUTURE_AI_FEATURES} />
        </div>
      </div>
    </div>
  );
}