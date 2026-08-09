import React from 'react';
import { Brain } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import CommandSection from './CommandSection';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * MC-R1 — AI Intelligence (Platform group). Shows live values when AI audit
 * history exists; otherwise a single "No AI operational history available"
 * empty state. Individual unavailable sub-metrics show "—" (never "Awaiting data").
 */
function Row({ label, value }) {
  const na = value === null || value === undefined;
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={na ? 'text-sm text-muted-foreground/50' : 'text-sm font-semibold'}>{na ? '—' : value}</span>
    </div>
  );
}

export default function AiIntelligence({ ai }) {
  const { t } = useLocalization();
  if (ai?.noHistory) {
    return (
      <CommandSection icon={Brain} title={t('mission.ai_intelligence')} action={<RouterLink to="/mission-control/ai-intelligence" className="text-xs text-primary hover:underline">{t('mission.open')}</RouterLink>}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Brain className="w-8 h-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">{t('mission.no_ai_operational_history_available')}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">{t('mission.metrics_will_appear_as_ai')}</p>
        </div>
      </CommandSection>
    );
  }
  return (
    <CommandSection icon={Brain} title={t('mission.ai_intelligence')} action={<RouterLink to="/mission-control/ai-intelligence" className="text-xs text-primary hover:underline">{t('mission.open')}</RouterLink>}>
      <Row label="Recommendations Generated" value={ai.recommendationsGenerated} />
      <Row label="Acceptance Rate" value={ai.acceptanceRate} />
      <Row label="Avg Confidence Score" value={ai.avgConfidence} />
      <Row label="AI Availability" value={ai.availability} />
      <Row label="AI Safety Flags" value={ai.safetyFlags} />
      <Row label="Recommendation Accuracy" value={ai.accuracy} />
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-3 mb-1">{t('mission.reserved_future')}</p>
      <div className="flex flex-wrap gap-1.5">
        {ai.reserved.map((r) => (
          <span key={r} className="text-[10px] px-2 py-1 rounded-full bg-muted/50 text-muted-foreground border border-dashed border-border">{r}</span>
        ))}
      </div>
    </CommandSection>
  );
}