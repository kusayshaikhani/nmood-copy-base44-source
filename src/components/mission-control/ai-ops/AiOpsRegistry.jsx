import React from 'react';
import { BookOpen, Cpu } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { useLocalization } from '@/lib/i18n/useLocalization';

const MODEL_STATUS = { active: 'bg-success/15 text-success', evaluation: 'bg-info/15 text-info', deprecated: 'bg-muted text-muted-foreground', planned: 'bg-warning/15 text-warning' };
const MODEL_HEALTH = { healthy: 'bg-success/15 text-success', degraded: 'bg-warning/15 text-warning', down: 'bg-destructive/15 text-destructive' };

/** AI-003 — Prompt & Model management registries (read-only at this stage). */
export default function AiOpsRegistry({ data }) {
  const { t } = useLocalization();
  const d = data || {};
  const prompts = d.prompts || [];
  const models = d.models || [];
  return (
    <div className="space-y-4">
      <MCSection icon={BookOpen} title={`Prompt Registry (${prompts.length})`}>
        <p className="text-xs text-muted-foreground mb-3">Prompts are read-only at this stage; prepared for future version management.</p>
        <div className="overflow-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-muted/40"><tr className="text-left">
              <th className="px-3 py-2 font-medium">{t('mission.name')}</th><th className="px-3 py-2 font-medium">{t('mission.version')}</th>
              <th className="px-3 py-2 font-medium">{t('mission.purpose')}</th><th className="px-3 py-2 font-medium">{t('mission.ai_service')}</th>
              <th className="px-3 py-2 font-medium">{t('mission.languages')}</th><th className="px-3 py-2 font-medium">{t('admin.status')}</th><th className="px-3 py-2 font-medium">{t('mission.updated')}</th>
            </tr></thead>
            <tbody>
              {prompts.map((p) => (
                <tr key={p.id} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2 font-mono font-medium">{p.name}</td>
                  <td className="px-3 py-2">{p.version}</td>
                  <td className="px-3 py-2 text-muted-foreground">{p.purpose}</td>
                  <td className="px-3 py-2 font-mono">{p.ai_service}</td>
                  <td className="px-3 py-2">{(p.languages || []).join(', ')}</td>
                  <td className="px-3 py-2"><span className={`px-1.5 py-0.5 rounded-full ${p.status === 'active' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>{p.status}</span></td>
                  <td className="px-3 py-2 text-muted-foreground">{p.updated_date ? new Date(p.updated_date).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
              {!prompts.length && <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">{t('mission.no_prompts_yet_click_seed')}</td></tr>}
            </tbody>
          </table>
        </div>
      </MCSection>

      <MCSection icon={Cpu} title={`Model Registry (${models.length})`}>
        <p className="text-xs text-muted-foreground mb-3">{t('mission.providerindependent_model_management_future_switching')}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {models.map((m) => (
            <div key={m.id} className="rounded-lg border bg-card/60 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate">{m.name}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${MODEL_STATUS[m.status] || MODEL_STATUS.planned}`}>{m.status}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 capitalize">{m.provider} · v{m.version}</p>
              <div className="flex items-center justify-between mt-2 text-[11px]">
                <span className={`px-1.5 py-0.5 rounded-full ${MODEL_HEALTH[m.health] || MODEL_HEALTH.healthy}`}>{m.health}</span>
                <span className="text-muted-foreground">perf: {m.performance_score}</span>
              </div>
              {m.notes && <p className="text-[11px] text-muted-foreground/70 mt-1">{m.notes}</p>}
            </div>
          ))}
          {!models.length && <p className="text-xs text-muted-foreground">{t('mission.no_models_registered_yet_click')}</p>}
        </div>
      </MCSection>
    </div>
  );
}