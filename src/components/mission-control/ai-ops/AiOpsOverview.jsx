import React from 'react';
import { Cpu, ShieldCheck, GitBranch, BookOpen, Sparkles, Activity } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { useLocalization } from '@/lib/i18n/useLocalization';

/** AI-003 — Architecture overview: principles, assistants, governance, review, quality, learning, future. */
export default function AiOpsOverview({ data }) {
  const { t } = useLocalization();
  const d = data || {};
  return (
    <div className="space-y-4">
      <MCSection icon={Cpu} title={t('mission.design_principles')}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {(d.pillars || []).map((p) => (
            <div key={p} className="rounded-lg border bg-card/60 px-3 py-2 text-center"><p className="text-xs font-medium">{p}</p></div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground/70 mt-2">{t('mission.ai_assists_humans_ai_never')}</p>
      </MCSection>

      <MCSection icon={Sparkles} title={`AI Assistant Platform (${(d.assistants || []).length} assistants)`}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {(d.assistants || []).map((a) => (
            <div key={a.id} className="rounded-lg border bg-card/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium truncate">{a.name}</p>
                {a.human_review_required && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning/15 text-warning font-medium">{t('mission.human_review')}</span>}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{(a.capabilities || []).join(' · ')}</p>
              {a.note && <p className="text-[11px] text-warning/80 mt-1">{a.note}</p>}
            </div>
          ))}
        </div>
      </MCSection>

      <div className="grid lg:grid-cols-2 gap-4">
        <MCSection icon={ShieldCheck} title={t('mission.ai_governance')}>
          <div className="flex flex-wrap gap-1.5">
            {(d.governance || []).map((g) => <span key={g} className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">{g}</span>)}
          </div>
        </MCSection>
        <MCSection icon={ShieldCheck} title={t('mission.human_review_workflows')}>
          <div className="flex flex-wrap gap-1.5">
            {(d.humanReviewTypes || []).map((h) => <span key={h} className="text-xs px-2 py-1 rounded-md bg-warning/10 text-warning font-medium">{h}</span>)}
          </div>
          <p className="text-xs text-muted-foreground/70 mt-2">{t('mission.ai_may_assist_humans_make_2')}</p>
        </MCSection>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <MCSection icon={Activity} title={t('mission.ai_quality_management')}>
          <div className="flex flex-wrap gap-1.5">
            {(d.qualityMetrics || []).map((q) => <span key={q} className="text-xs px-2 py-1 rounded-md bg-success/10 text-success font-medium">{q}</span>)}
          </div>
        </MCSection>
        <MCSection icon={GitBranch} title={t('mission.continuous_learning_signals')}>
          <div className="flex flex-wrap gap-1.5">
            {(d.learningSignals || []).map((s) => <span key={s} className="text-xs px-2 py-1 rounded-md bg-info/10 text-info font-medium">{s}</span>)}
          </div>
          <p className="text-xs text-muted-foreground/70 mt-2">{t('mission.learning_improves_future_recommendations_without')}</p>
        </MCSection>
      </div>

      <MCSection icon={BookOpen} title={t('mission.future_ai_capabilities_inactive')}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {(d.future || []).map((f) => (
            <div key={f} className="rounded-lg border bg-card/40 p-2.5 flex items-center justify-between">
              <p className="text-xs font-medium">{f}</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{t('mission.future')}</span>
            </div>
          ))}
        </div>
      </MCSection>
    </div>
  );
}