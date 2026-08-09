import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import HealthDot from '@/components/ops/HealthDot';
import { base44 } from '@/api/base44Client';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function OpsReleases() {
  const { t } = useLocalization();
  const [info, setInfo] = useState(null);
  const [backup, setBackup] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, b] = await Promise.all([
        base44.functions.invoke('systemOps', { mode: 'releaseInfo' }).catch(() => null),
        base44.functions.invoke('systemOps', { mode: 'backupStatus' }).catch(() => null),
      ]);
      setInfo(r);
      setBackup(b);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Card className="p-8 text-center text-sm text-muted-foreground">{t('mission.loading_release_information')}</Card>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">{t('mission.release_information')}</h1>
        <p className="text-sm text-muted-foreground">{t('mission.current_build_environment_and_database')}</p>
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Version" value={info?.version} mono />
          <Field label="Build Number" value={info?.build_number} mono />
          <Field label="Environment" value={info?.environment} mono />
          <Field label="Release Date" value={info?.release_date} />
          <Field label="Database Version" value={info?.database_version} mono />
          <Field label="Schema Verified" value={info?.schema ? 'Connected' : '—'} />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold mb-3">{t('mission.backup_recovery')}</h2>
        {backup ? (
          <div className="space-y-2 text-sm">
            <Row label="Status" value={<HealthDot status={backup.status} withLabel />} />
            <Row label="Provider" value={backup.provider} />
            <Row label="Frequency" value={backup.frequency} />
            <Row label="Last Backup" value={new Date(backup.last_backup).toLocaleString()} />
            <Row label="Retention" value={backup.retention} />
            <Row label="Encryption" value={backup.encryption} />
            <p className="text-xs text-muted-foreground pt-3 border-t border-border mt-3">{backup.recovery}</p>
          </div>
        ) : <p className="text-sm text-muted-foreground">{t('mission.unavailable')}</p>}
      </Card>
    </div>
  );
}

function Field({ label, value, mono }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className={'text-sm font-semibold ' + (mono ? 'font-mono' : '')}>{value || '—'}</p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}