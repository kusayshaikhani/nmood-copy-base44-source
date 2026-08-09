import React from 'react';
import { Cog } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import BiTable from '../bi/BiTable';
import { computeConfig } from '@/lib/ops-metrics';
import { useLocalization } from '@/lib/i18n/useLocalization';

const LABELS = { branding: 'Branding', contact: 'Contact', legal: 'Legal', build: 'Build', ops: 'Operations', other: 'Other' };

export default function OpsConfiguration({ data }) {
  const { t } = useLocalization();
  const byCat = computeConfig(data);
  return (
    <div className="space-y-4">
      <MCSection icon={Cog} title={t('mission.configuration_management_readonly')}>
        <p className="text-sm text-muted-foreground">{t('mission.centralized_viewer_for_application_regional')}</p>
      </MCSection>
      {Object.keys(byCat).map((cat) => (
        <MCSection key={cat} title={LABELS[cat] || cat}>
          <BiTable columns={[{ key: 'key', label: 'Key' }, { key: 'value', label: 'Value' }]} rows={byCat[cat].map((c) => ({ key: c.key, value: String(c.value).slice(0, 80) }))} />
        </MCSection>
      ))}
      {!Object.keys(byCat).length && <MCSection title={t('mission.configuration')}><p className="text-sm text-muted-foreground text-center py-6">{t('mission.no_systemconfig_rows')}</p></MCSection>}
    </div>
  );
}