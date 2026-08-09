import React from 'react';
import { DatabaseBackup } from 'lucide-react';
import { MCKpiCard, MCKpiGrid, MCSection } from '@/components/mission-control/ui';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function OpsBackup() {
  const { t } = useLocalization();
  const cards = [
    { icon: DatabaseBackup, label: 'Latest Backup', value: '—', color: 'info', sublabel: 'Schedule coming' },
    { icon: DatabaseBackup, label: 'Backup Status', value: 'Pending', color: 'warning' },
    { icon: DatabaseBackup, label: 'Recovery Status', value: 'Not configured', color: 'info' },
    { icon: DatabaseBackup, label: 'Storage Health', value: 'Healthy', color: 'success' },
  ];
  return (
    <div className="space-y-4">
      <MCKpiGrid>{cards.map((c) => <MCKpiCard key={c.label} {...c} />)}</MCKpiGrid>
      <MCSection icon={DatabaseBackup} title={t('mission.backup_recovery_readonly')}>
        <p className="text-sm text-muted-foreground">{t('mission.backup_scheduling_recovery_point_objectives')}</p>
      </MCSection>
    </div>
  );
}