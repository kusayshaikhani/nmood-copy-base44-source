import React from 'react';
import { Activity, ThumbsUp, ThumbsDown, Languages, Gauge } from 'lucide-react';
import { MCSection, MCKpiCard, MCKpiGrid } from '@/components/mission-control/ui';
import { BiBarChart } from '../bi/BiChart';
import { useLocalization } from '@/lib/i18n/useLocalization';

/** AI-002 — Recommendation learning & personalization observability. */
export default function PiObservability({ metrics }) {
  const { t } = useLocalization();
  const m = metrics || {};
  const learn = m.recommendationLearning || {};
  const signalData = [
    { label: 'Generated', value: learn.generated || 0 },
    { label: 'Opened', value: learn.opened || 0 },
    { label: 'Saved', value: learn.saved || 0 },
    { label: 'Ignored', value: learn.ignored || 0 },
    { label: 'Accepted', value: learn.accepted || 0 },
    { label: 'Declined', value: learn.declined || 0 },
  ];
  const sem = m.semanticAccuracy || {};
  const langs = m.crossLanguageUsage || {};
  const kpis = [
    { icon: ThumbsUp, label: 'Acceptance Rate', value: (learn.acceptanceRate || 0) + '%', color: 'success' },
    { icon: ThumbsDown, label: 'Decline Rate', value: (learn.declineRate || 0) + '%', color: 'warning' },
    { icon: Gauge, label: 'Personalization Effectiveness', value: (m.personalizationEffectiveness || 0) + '%', color: 'info' },
    { icon: Activity, label: 'Recommendations Generated', value: learn.generated || 0, color: 'primary' },
    { icon: Activity, label: 'Concepts', value: sem.conceptCount || 0, color: 'success' },
    { icon: Languages, label: 'Languages (Cross-lang)', value: langs.count || 0, color: 'info' },
  ];
  return (
    <div className="space-y-4">
      <MCKpiGrid>{kpis.map((k) => <MCKpiCard key={k.label} {...k} />)}</MCKpiGrid>
      <MCSection icon={Activity} title={t('mission.recommendation_learning_signals')}>
        <BiBarChart data={signalData} bars={[{ key: 'value', name: 'Signals', color: 'hsl(var(--chart-2))' }]} />
        <p className="text-xs text-muted-foreground/70 mt-2">{t('mission.signals_generated_opened_saved_ignored')}</p>
      </MCSection>
      <MCSection icon={Languages} title={t('mission.crosslanguage_coverage')}>
        <div className="flex flex-wrap gap-1.5">
          {(langs.languages || []).map((l) => (
            <span key={l} className="text-xs px-2 py-1 rounded-md bg-info/10 text-info font-medium uppercase">{l}</span>
          ))}
          {!((langs.languages || []).length) && <span className="text-xs text-muted-foreground">{t('mission.no_languages_tracked_yet')}</span>}
        </div>
      </MCSection>
    </div>
  );
}