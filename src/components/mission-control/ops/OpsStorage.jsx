import React from 'react';
import { HardDrive } from 'lucide-react';
import { MCKpiCard, MCKpiGrid, MCSection } from '@/components/mission-control/ui';
import { useMediaLibrary } from '@/hooks/useMediaLibrary';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function OpsStorage() {
  const { t } = useLocalization();
  const { data } = useMediaLibrary();
  const mediaCount = data?.total || 0;
  const cards = [
    { icon: HardDrive, label: 'Media Assets', value: mediaCount, color: 'info' },
    { icon: HardDrive, label: 'Storage Used', value: '—', color: 'info', sublabel: 'Telemetry coming' },
    { icon: HardDrive, label: 'Storage Available', value: '—', color: 'info', sublabel: 'Telemetry coming' },
    { icon: HardDrive, label: 'Database Size', value: '—', color: 'info', sublabel: 'Telemetry coming' },
  ];
  return (
    <div className="space-y-4">
      <MCKpiGrid>{cards.map((c) => <MCKpiCard key={c.label} {...c} />)}</MCKpiGrid>
      <MCSection icon={HardDrive} title={t('mission.storage_readonly')}>
        <p className="text-sm text-muted-foreground">{t('mission.media_asset_count_is_derived')}</p>
      </MCSection>
    </div>
  );
}