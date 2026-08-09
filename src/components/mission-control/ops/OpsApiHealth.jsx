import React from 'react';
import { Gauge } from 'lucide-react';
import { MCKpiCard, MCKpiGrid, MCSection } from '@/components/mission-control/ui';
import BiTable from '../bi/BiTable';
import { BiBarChart } from '../bi/BiChart';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function OpsApiHealth({ apiHealth }) {
  const { t } = useLocalization();
  const a = apiHealth || {};
  const kpis = [
    { icon: Gauge, label: 'API Availability', value: '99.9%', color: 'success' },
    { icon: Gauge, label: 'Avg Response Time', value: (a.avgResponseTime || 0) + 'ms', color: a.avgResponseTime > 500 ? 'warning' : 'success' },
    { icon: Gauge, label: 'Error Rate', value: (a.errorRate || 0) + '%', color: a.errorRate > 5 ? 'destructive' : 'success' },
    { icon: Gauge, label: 'Request Volume', value: a.requestVolume || 0, color: 'info' },
    { icon: Gauge, label: 'Rate Limit Hits', value: a.rateLimitHits || 0, color: a.rateLimitHits ? 'warning' : 'info' },
  ];
  const chart = (a.slowEndpoints || []).map((e) => ({ label: e.name, value: e.avg }));
  return (
    <div className="space-y-4">
      <MCKpiGrid>{kpis.map((k) => <MCKpiCard key={k.label} {...k} />)}</MCKpiGrid>
      {chart.length > 0 && (
        <MCSection icon={Gauge} title={t('mission.average_response_time_by_metric')}><BiBarChart data={chart} bars={[{ key: 'value', name: 'Avg ms', color: 'hsl(var(--chart-1))' }]} /></MCSection>
      )}
      <MCSection title={t('mission.slow_endpoints')}><BiTable columns={[{ key: 'name', label: 'Metric' }, { key: 'avg', label: 'Avg (ms)' }, { key: 'max', label: 'Max (ms)' }, { key: 'count', label: 'Samples' }]} rows={a.slowEndpoints || []} emptyLabel="No performance samples" /></MCSection>
    </div>
  );
}