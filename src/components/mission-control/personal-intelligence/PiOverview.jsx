import React from 'react';
import { Sparkles, Boxes, GitBranch, Search, Clock } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { useLocalization } from '@/lib/i18n/useLocalization';

/** AI-002 — Architecture overview: principles, memory domains, governance, semantic & search, personalization. */
export default function PiOverview({ data }) {
  const { t } = useLocalization();
  const d = data || {};
  return (
    <div className="space-y-4">
      <MCSection icon={Sparkles} title={t('mission.design_principles')}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(d.pillars || []).map((p) => (
            <div key={p} className="rounded-lg border bg-card/60 px-3 py-2 text-center">
              <p className="text-xs font-medium">{p}</p>
            </div>
          ))}
        </div>
      </MCSection>

      <MCSection icon={Boxes} title={t('mission.member_memory_domains')}>
        <div className="space-y-3">
          {(d.memoryDomains || []).map((dom) => (
            <div key={dom.id}>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium">{dom.name}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{dom.id}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {dom.fields.map((f) => (
                  <span key={f} className="text-[11px] px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground">{f}</span>
                ))}
              </div>
              {dom.note && <p className="text-[11px] text-muted-foreground/70 mt-1">{dom.note}</p>}
            </div>
          ))}
        </div>
      </MCSection>

      <div className="grid lg:grid-cols-2 gap-4">
        <MCSection icon={Sparkles} title={t('mission.memory_governance')}>
          <div className="flex flex-wrap gap-1.5">
            {(d.governance || []).map((g) => (
              <span key={g} className="text-xs px-2 py-1 rounded-md bg-success/10 text-success font-medium">{g}</span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground/70 mt-2">{t('mission.members_remain_in_full_control')}</p>
        </MCSection>
        <MCSection icon={GitBranch} title={t('mission.semantic_intelligence')}>
          <div className="flex flex-wrap gap-1.5">
            {(d.semantic || []).map((s) => (
              <span key={s} className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">{s}</span>
            ))}
          </div>
        </MCSection>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <MCSection icon={Search} title={t('mission.search_intelligence')}>
          <div className="flex flex-wrap gap-1.5">
            {(d.search || []).map((s) => (
              <span key={s} className="text-xs px-2 py-1 rounded-md bg-info/10 text-info font-medium">{s}</span>
            ))}
          </div>
        </MCSection>
        <MCSection icon={Clock} title={t('mission.personalization_inputs')}>
          <div className="flex flex-wrap gap-1.5">
            {(d.personalizationInputs || []).map((p) => (
              <span key={p} className="text-xs px-2 py-1 rounded-md bg-accent/30 text-accent-foreground font-medium">{p}</span>
            ))}
          </div>
        </MCSection>
      </div>

      <MCSection icon={Sparkles} title={t('mission.future_capabilities_optin_only')}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {(d.future || []).map((f) => (
            <div key={f} className="rounded-lg border bg-card/40 p-2.5">
              <p className="text-xs font-medium">{f}</p>
            </div>
          ))}
        </div>
      </MCSection>
    </div>
  );
}