import React from 'react';
import { ListChecks } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import OpsStatusBadge from './OpsStatusBadge';
import { useLocalization } from '@/lib/i18n/useLocalization';

const JOBS = [
  { name: 'Queued Jobs', note: '0 pending' },
  { name: 'Running Jobs', note: 'No active workers' },
  { name: 'Completed Jobs', note: 'History coming' },
  { name: 'Failed Jobs', note: '0 failures' },
  { name: 'Retry Queue', note: 'Empty' },
  { name: 'Background Task Health', note: 'No telemetry' },
];

export default function OpsJobs() {
  const { t } = useLocalization();
  return (
    <MCSection icon={ListChecks} title={t('mission.job_monitor_coming_soon')}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {JOBS.map((j) => (
          <div key={j.name} className="rounded-xl border bg-card/60 p-3 flex items-center justify-between">
            <div><p className="text-sm font-medium">{j.name}</p><p className="text-xs text-muted-foreground">{j.note}</p></div>
            <OpsStatusBadge status="healthy" />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground/70 mt-3">{t('mission.job_telemetry_requires_a_backgroundworker')}</p>
    </MCSection>
  );
}