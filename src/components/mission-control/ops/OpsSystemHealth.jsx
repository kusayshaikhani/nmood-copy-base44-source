import React from 'react';
import { Activity } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import OpsStatusBadge from './OpsStatusBadge';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function OpsSystemHealth({ services }) {
  const { t } = useLocalization();
  const list = services || [];
  return (
    <MCSection icon={Activity} title={t('mission.live_service_monitoring')}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map((s) => (
          <div key={s.id} className="rounded-xl border bg-card/60 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{s.name}</span>
              <OpsStatusBadge status={s.status} />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Uptime: {s.uptime}</span>
              <span>{s.alerts} alerts · {s.errors} errors</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground/70 mt-3">
        {t('mission.historical_uptime_is_estimated_from')}
      </p>
    </MCSection>
  );
}