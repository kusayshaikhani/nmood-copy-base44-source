import React from 'react';
import { Gauge, Activity, ShieldAlert, ThumbsUp, AlertTriangle, Cpu } from 'lucide-react';
import { MCSection, MCKpiCard, MCKpiGrid } from '@/components/mission-control/ui';
import { BiBarChart, BiPieChart } from '../bi/BiChart';
import BiTable from '../bi/BiTable';
import { useLocalization } from '@/lib/i18n/useLocalization';

/** AI-003 — AI audit trail, quality management & observability. */
export default function AiOpsAuditQuality({ metrics, recentAudits }) {
  const { t } = useLocalization();
  const m = metrics || {};
  const obs = m.observability || {};
  const quality = m.quality || {};
  const review = m.humanReview || {};
  const registry = m.registry || {};
  const conf = obs.confidenceDistribution || { low: 0, medium: 0, high: 0 };
  const kpis = [
    { icon: Activity, label: 'Total Requests', value: obs.totalRequests ?? 0, color: 'primary' },
    { icon: Gauge, label: 'Success Rate', value: (obs.successRate ?? 0) + '%', color: 'success' },
    { icon: Gauge, label: 'Error Rate', value: (obs.errorRate ?? 0) + '%', color: (obs.errorRate || 0) > 5 ? 'destructive' : 'success' },
    { icon: Activity, label: 'Avg Latency', value: (obs.avgLatency ?? 0) + 'ms', color: 'info' },
    { icon: ThumbsUp, label: 'Rec. Acceptance', value: (quality.recommendationAcceptance ?? 0) + '%', color: 'info' },
    { icon: AlertTriangle, label: 'AI Errors', value: quality.aiErrors ?? 0, color: quality.aiErrors ? 'warning' : 'success' },
    { icon: ShieldAlert, label: 'Safety Events', value: quality.safetyEvents ?? 0, color: quality.safetyEvents ? 'warning' : 'success' },
    { icon: ShieldAlert, label: 'Pending Reviews', value: review.pending ?? 0, color: review.pending ? 'warning' : 'success' },
  ];
  const confChart = [
    { label: 'Low', value: conf.low || 0 }, { label: 'Medium', value: conf.medium || 0 }, { label: 'High', value: conf.high || 0 },
  ];
  const assistantUsage = (obs.assistantUsage || []).map((a) => ({ label: String(a.name).replace('_assistant', '').slice(0, 14), value: a.count }));
  return (
    <div className="space-y-4">
      <MCKpiGrid>{kpis.map((k) => <MCKpiCard key={k.label} {...k} />)}</MCKpiGrid>

      <div className="grid lg:grid-cols-2 gap-4">
        <MCSection icon={Activity} title={t('mission.assistant_usage')}>
          {assistantUsage.length ? <BiBarChart data={assistantUsage} bars={[{ key: 'value', name: 'Invocations', color: 'hsl(var(--chart-1))' }]} /> : <p className="text-xs text-muted-foreground">{t('mission.no_assistant_invocations_recorded_yet')}</p>}
        </MCSection>
        <MCSection icon={Gauge} title={t('mission.confidence_distribution')}>
          <BiPieChart data={confChart} />
        </MCSection>
      </div>

      <MCSection icon={Cpu} title={t('mission.ai_audit_trail_immutable')}>
        <p className="text-xs text-muted-foreground mb-2">{t('mission.immutable_records_of_ai_operations')}</p>
        <BiTable
          columns={[{ key: 'assistant_id', label: 'Assistant' }, { key: 'ai_service', label: 'Service' }, { key: 'confidence', label: 'Confidence' }, { key: 'processing_time_ms', label: 'Time (ms)' }, { key: 'human_review_required', label: 'Human Review' }, { key: 'final_outcome', label: 'Outcome' }]}
          rows={(recentAudits || []).map((a) => ({ assistant_id: a.assistant_id || '—', ai_service: a.ai_service, confidence: a.confidence, processing_time_ms: a.processing_time_ms, human_review_required: a.human_review_required ? 'Yes' : 'No', final_outcome: a.final_outcome }))}
          emptyLabel="No audit records yet."
        />
      </MCSection>
    </div>
  );
}