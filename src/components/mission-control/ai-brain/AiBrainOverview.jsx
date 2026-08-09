import React from 'react';
import { BrainCircuit, Boxes, ArrowRight } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { useLocalization } from '@/lib/i18n/useLocalization';

/** AI-001 — Architecture overview: pillars, request/response standard, pipeline. */
export default function AiBrainOverview({ data }) {
  const { t } = useLocalization();
  const d = data || {};
  return (
    <div className="space-y-4">
      <MCSection icon={BrainCircuit} title={t('mission.design_principles')}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(d.pillars || []).map((p) => (
            <div key={p} className="rounded-lg border bg-card/60 px-3 py-2 text-center">
              <p className="text-xs font-medium">{p}</p>
            </div>
          ))}
        </div>
      </MCSection>

      <div className="grid lg:grid-cols-2 gap-4">
        <MCSection icon={Boxes} title={t('mission.ai_request_standard')}>
          <p className="text-xs text-muted-foreground mb-2">{t('mission.every_ai_request_carries_this')}</p>
          <div className="flex flex-wrap gap-1.5">
            {(d.requestStandard || []).map((f) => (
              <span key={f} className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">{f}</span>
            ))}
          </div>
        </MCSection>
        <MCSection icon={Boxes} title={t('mission.ai_response_standard')}>
          <p className="text-xs text-muted-foreground mb-2">{t('mission.every_ai_response_follows_this')}</p>
          <div className="flex flex-wrap gap-1.5">
            {(d.responseStandard || []).map((f) => (
              <span key={f} className="text-xs px-2 py-1 rounded-md bg-success/10 text-success font-medium">{f}</span>
            ))}
          </div>
        </MCSection>
      </div>

      <MCSection icon={ArrowRight} title={t('mission.orchestration_pipeline')}>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {['Receive Request', 'Identify Service', 'Select Provider', 'Execute', 'Standardize Response', 'Record Metadata', 'Return'].map((step, i, arr) => (
            <React.Fragment key={step}>
              <span className="px-2.5 py-1.5 rounded-md bg-card border font-medium">{step}</span>
              {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
            </React.Fragment>
          ))}
        </div>
        <p className="text-xs text-muted-foreground/70 mt-3">
          {t('mission.the_orchestrator_handles_failures_gracefully')}
        </p>
      </MCSection>
    </div>
  );
}