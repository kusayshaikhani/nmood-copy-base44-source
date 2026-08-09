import React, { useState } from 'react';
import { Flag } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { Switch } from '@/components/ui/switch';
import { base44 } from '@/api/base44Client';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function OpsFeatureFlags({ data, onToggle }) {
  const { t } = useLocalization();
  const flags = data?.featureFlags || [];
  const [busy, setBusy] = useState(null);
  const byCat = {};
  for (const f of flags) { const k = f.category || 'core'; if (!byCat[k]) byCat[k] = []; byCat[k].push(f); }

  const toggle = async (f) => {
    setBusy(f.id);
    try {
      await base44.functions.invoke('adminConsole', { mode: 'toggleFeatureFlag', id: f.id, enabled: !f.enabled });
      await onToggle?.();
    } finally {
      setBusy(null);
    }
  };

  return (
    <MCSection icon={Flag} title={t('mission.feature_flag_management')}>
      {!Object.keys(byCat).length && <p className="text-sm text-muted-foreground py-4 text-center">{t('mission.no_feature_flags_configured')}</p>}
      <div className="space-y-4">
        {Object.entries(byCat).map(([cat, list]) => (
          <div key={cat}>
            <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{cat}</h4>
            <div className="grid sm:grid-cols-2 gap-2">
              {list.map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded-lg border bg-card/60 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{f.name || f.key}</p>
                    <p className="text-xs text-muted-foreground truncate">{f.description || f.key}</p>
                  </div>
                  <Switch checked={!!f.enabled} disabled={busy === f.id} onCheckedChange={() => toggle(f)} aria-label={`Toggle ${f.name}`} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground/70 mt-3">{t('mission.toggles_are_auditlogged_staged_rollout')}</p>
    </MCSection>
  );
}