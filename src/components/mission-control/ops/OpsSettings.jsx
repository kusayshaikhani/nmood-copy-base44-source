import React from 'react';
import { Settings } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import BiTable from '../bi/BiTable';
import { BRAND } from '@/lib/system-config';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function OpsSettings({ data }) {
  const { t } = useLocalization();
  const cfg = data?.systemConfig || [];
  const branding = cfg.filter((c) => c.category === 'branding');
  const general = cfg.filter((c) => c.category === 'ops' || c.category === 'build' || !c.category);
  return (
    <div className="space-y-4">
      <MCSection icon={Settings} title={t('mission.general_settings')}>
        <BiTable columns={[{ key: 'key', label: 'Setting' }, { key: 'value', label: 'Value' }]} rows={general.map((c) => ({ key: c.key, value: c.value }))} emptyLabel="No general config" />
      </MCSection>
      <MCSection title={t('mission.branding')}>
        <BiTable columns={[{ key: 'key', label: 'Asset' }, { key: 'value', label: 'Value' }]} rows={[...Object.entries(BRAND).map(([k, v]) => ({ key: k, value: v })), ...branding.map((c) => ({ key: c.key, value: c.value }))]} />
      </MCSection>
      <MCSection title={t('mission.localization_regional_defaults')}>
        <BiTable columns={[{ key: 'key', label: 'Setting' }, { key: 'value', label: 'Value' }]} rows={[
          { key: 'Default Language', value: 'English' },
          { key: 'Default Country', value: 'United Arab Emirates' },
          { key: 'Timezone', value: 'Asia/Dubai' },
          { key: 'Date Format', value: 'day-first' },
          { key: 'Time Format', value: '12h' },
        ]} />
      </MCSection>
      <MCSection title={t('mission.maintenance_message_defaults')}>
        <p className="text-sm text-muted-foreground">{t('mission.privacy_safety_ai_and_notification')}</p>
      </MCSection>
    </div>
  );
}