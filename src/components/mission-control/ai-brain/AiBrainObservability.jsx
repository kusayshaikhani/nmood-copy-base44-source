import React from 'react';
import { Gauge, Activity, ShieldAlert, Languages, ThumbsUp, Clock } from 'lucide-react';
import { MCKpiCard, MCKpiGrid, MCSection } from '@/components/mission-control/ui';
import BiTable from '../bi/BiTable';
import { BiBarChart, BiPieChart } from '../bi/BiChart';
import { useLocalization } from '@/lib/i18n/useLocalization';

/** AI-001 — AI observability metrics for Mission Control (prepared for FM-007). */
export default function AiBrainObservability({ metrics }) {
  const { t } = useLocalization();
  const m = metrics || {};
  const conf = m.confidenceDistribution || { low: 0, medium: 0, high: 0 };
  const confChart = [
    { label: 'Low (<0.5)', value: conf.low || 0 },
    { label: 'Medium', value: conf.medium || 0 },
    { label: 'High (>0.8)', value: conf.high || 0 },
  ];
  const kpis = [
    { icon: Activity, label: 'Total Requests', value: m.totalRequests ?? 0, color: 'primary' },
    { icon: Gauge, label: 'Success Rate', value: (m.successRate ?? 0) + '%', color: 'success' },
    { icon: Gauge, label: 'Error Rate', value: (m.errorRate ?? 0) + '%', color: (m.errorRate || 0) > 5 ? 'destructive' : 'success' },
    { icon: Clock, label: 'Avg Response Time', value: (m.avgResponseTime ?? 0) + 'ms', color: 'info' },
    { icon: Gauge, label: 'AI Availability', value: (m.aiAvailability ?? 0) + '%', color: 'success' },
    { icon: ShieldAlert, label: 'Safety Events', value: m.safetyEvents ?? 0, color: m.safetyEvents ? 'warning' : 'success' },
    { icon: ThumbsUp, label: 'Recommendation Acceptance', value: (m.recommendationAcceptance ?? 0) + '%', color: 'info' },
    { icon: Languages, label: 'Languages Seen', value: (m.languageDistribution || []).length, color: 'info' },
  ];
  return (
    <div className="space-y-4">
      <MCKpiGrid>{kpis.map((k) => <MCKpiCard key={k.label} {...k} />)}</MCKpiGrid>
      <div className="grid lg:grid-cols-2 gap-4">
        <MCSection icon={Activity} title={t('mission.requests_by_service')}>
          <BiBarChart data={(m.byService || []).map((s) => ({ label: s.name.replace('recommendation_', '').replace('discovery_', '').slice(0, 16), value: s.count }))} bars={[{ key: 'value', name: 'Requests', color: 'hsl(var(--chart-1))' }]} />
        </MCSection>
        <MCSection icon={Gauge} title={t('mission.confidence_distribution')}>
          <BiPieChart data={confChart} />
        </MCSection>
      </div>
      <MCSection icon={Activity} title={t('mission.recent_executions')}>
        <BiTable
          columns={[{ key: 'ai_service', label: 'Service' }, { key: 'status', label: 'Status' }, { key: 'confidence_score', label: 'Confidence' }, { key: 'processing_time_ms', label: 'Time (ms)' }, { key: 'language', label: 'Lang' }]}
          rows={(m.recent || []).map((e) => ({ ai_service: e.ai_service, status: e.status, confidence_score: e.confidence_score, processing_time_ms: e.processing_time_ms, language: e.language }))}
          emptyLabel="No AI executions yet. Try the Playground."
        />
      </MCSection>
    </div>
  );
}