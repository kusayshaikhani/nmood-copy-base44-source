import React from 'react';
import { Rocket } from 'lucide-react';
import { MCKpiCard, MCKpiGrid, MCSection } from '@/components/mission-control/ui';
import { APP_VERSION, BUILD_NUMBER, ENVIRONMENT, BUILD_DATE, COMMIT_ID } from '@/lib/system-config';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function OpsDeployment() {
  const { t } = useLocalization();
  const cards = [
    { icon: Rocket, label: 'Current Version', value: APP_VERSION, color: 'primary' },
    { icon: Rocket, label: 'Build Number', value: BUILD_NUMBER, color: 'info' },
    { icon: Rocket, label: 'Environment', value: ENVIRONMENT, color: 'info' },
    { icon: Rocket, label: 'Build Date', value: (BUILD_DATE || '').slice(0, 10), color: 'info' },
    { icon: Rocket, label: 'Previous Version', value: '—', color: 'info', sublabel: 'History coming' },
    { icon: Rocket, label: 'Commit', value: COMMIT_ID ? String(COMMIT_ID).slice(0, 7) : '—', color: 'info' },
  ];
  return (
    <div className="space-y-4">
      <MCKpiGrid>{cards.map((c) => <MCKpiCard key={c.label} {...c} />)}</MCKpiGrid>
      <MCSection icon={Rocket} title={t('mission.deployment_status')}>
        <p className="text-sm text-muted-foreground">{t('mission.status')} <span className="text-success font-semibold">{t('mission.stable')}</span> {t('mission.all_systems_deployed')}</p>
        <p className="text-sm text-muted-foreground mt-2">{t('mission.release_notes_and_build_health')}</p>
      </MCSection>
    </div>
  );
}