import React from 'react';
import { Gauge } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { useLocalization } from '@/lib/i18n/useLocalization';

function Row({ label, value }) {
  const placeholder = value === null || value === undefined;
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={placeholder ? 'text-sm text-muted-foreground/60 font-medium' : 'text-sm font-semibold'}>{placeholder ? 'Awaiting telemetry' : value}</span>
    </div>
  );
}

export default function AiQuality({ quality }) {
  const { t } = useLocalization();
  return (
    <MCSection icon={Gauge} title={t('mission.ai_quality')}>
      <Row label="Confidence Distribution" value={quality.confidenceDistribution} />
      <Row label="Low Confidence Results" value={quality.lowConfidenceResults} />
      <Row label="Recommendation Accuracy" value={quality.accuracy} />
      <Row label="Recommendation Diversity" value={quality.diversity} />
      <Row label="Recommendation Freshness" value={quality.freshness} />
      <Row label="Duplicate Detection" value={quality.duplicateDetection} />
      <p className="text-[10px] text-muted-foreground/70 mt-2">{t('mission.additional_evaluation_metrics_reserved_for')}</p>
    </MCSection>
  );
}