import React, { useMemo } from 'react';
import { Boxes, Sparkles } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { useLocalization } from '@/lib/i18n/useLocalization';

const STATUS_BADGE = {
  registered: 'bg-success/15 text-success',
  future: 'bg-warning/15 text-warning',
};

/** AI-001 — AI Service Registry: all registered services grouped by category. */
export default function AiBrainRegistry({ data }) {
  const { t } = useLocalization();
  const d = data || {};
  const services = d.services || [];
  const grouped = useMemo(() => {
    const map = {};
    services.forEach((s) => { (map[s.category] = map[s.category] || []).push(s); });
    return map;
  }, [services]);

  return (
    <div className="space-y-4">
      <MCSection icon={Boxes} title={`AI Service Registry (${services.length} services)`}>
        <p className="text-xs text-muted-foreground mb-3">
          All AI services register through this registry. Existing AI features are unchanged; future services communicate through the orchestrator.
        </p>
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, list]) => (
            <div key={cat}>
              <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{cat}</h4>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {list.map((s) => (
                  <div key={s.id} className="rounded-lg border bg-card/60 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_BADGE[s.status] || STATUS_BADGE.registered}`}>{s.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </MCSection>

      <MCSection icon={Sparkles} title={t('mission.future_modules_registered_inactive')}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {(d.future || []).map((s) => (
            <div key={s.id} className="rounded-lg border bg-card/40 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium truncate">{s.name}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-warning/15 text-warning">{t('mission.future')}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
            </div>
          ))}
        </div>
      </MCSection>
    </div>
  );
}