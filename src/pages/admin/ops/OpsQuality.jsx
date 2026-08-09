import React from 'react';
import QualityMetricCard from '@/components/ops/QualityMetricCard';
import { qualityMetrics } from '@/lib/ops-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function OpsQuality() {
  const { t } = useLocalization();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{t('mission.quality_metrics')}</h1>
        <p className="text-sm text-muted-foreground">{t('mission.platform_quality_and_performance_indicators')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {qualityMetrics.map((metric) => (
          <QualityMetricCard key={metric.id} {...metric} />
        ))}
      </div>
    </div>
  );
}