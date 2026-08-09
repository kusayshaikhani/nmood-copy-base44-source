import React from 'react';
import { Server } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { useLocalization } from '@/lib/i18n/useLocalization';

const STATUS = { active: 'success', ready: 'success', planned: 'warning' };

/** AI-001 — Provider abstraction adapters. Switching providers requires no app changes. */
export default function AiBrainProviders({ data }) {
  const { t } = useLocalization();
  const providers = (data || {}).providers || [];
  return (
    <MCSection icon={Server} title={t('mission.provider_abstraction')}>
      <p className="text-xs text-muted-foreground mb-3">
        {t('mission.the_ai_brain_is_providerindependent')}
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {providers.map((p) => (
          <div key={p.id} className="rounded-xl border bg-card/60 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{p.name}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS[p.status] === 'success' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>{p.status}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{p.note}</p>
            <p className="text-[11px] text-muted-foreground/70 mt-2 font-mono">model: {p.model}</p>
          </div>
        ))}
      </div>
    </MCSection>
  );
}