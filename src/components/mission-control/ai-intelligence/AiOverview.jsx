import React from 'react';
import { Brain } from 'lucide-react';
import { MCSection, MCKpiCard, MCKpiGrid } from '@/components/mission-control/ui';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function AiOverview({ overview, loading }) {
  const { t } = useLocalization();
  const val = (v) => (v === null || v === undefined ? '—' : v);
  const sub = (v) => (v === null || v === undefined ? 'Awaiting telemetry' : undefined);
  return (
    <MCSection icon={Brain} title={t('mission.ai_overview')}>
      <MCKpiGrid>
        <MCKpiCard icon={Brain} label="AI Status" value={val(overview.aiStatus)} sublabel={sub(overview.aiStatus)} loading={loading} color="primary" />
        <MCKpiCard icon={Brain} label="AI Availability" value={val(overview.availability)} sublabel={sub(overview.availability)} loading={loading} color="success" />
        <MCKpiCard icon={Brain} label="Requests Today" value={val(overview.requestsToday)} sublabel={sub(overview.requestsToday)} loading={loading} color="info" />
        <MCKpiCard icon={Brain} label="Active Sessions" value={val(overview.activeSessions)} sublabel={sub(overview.activeSessions)} loading={loading} color="info" />
        <MCKpiCard icon={Brain} label="Recommendations Generated" value={val(overview.recommendationsGenerated)} sublabel={sub(overview.recommendationsGenerated)} loading={loading} color="primary" />
        <MCKpiCard icon={Brain} label="Recommendations Accepted" value={val(overview.recommendationsAccepted)} sublabel={sub(overview.recommendationsAccepted)} loading={loading} color="success" />
        <MCKpiCard icon={Brain} label="Avg Response Time" value={val(overview.avgResponseTime)} sublabel={sub(overview.avgResponseTime)} loading={loading} color="warning" />
        <MCKpiCard icon={Brain} label="Avg Confidence Score" value={val(overview.avgConfidence)} sublabel={sub(overview.avgConfidence)} loading={loading} color="primary" />
      </MCKpiGrid>
    </MCSection>
  );
}