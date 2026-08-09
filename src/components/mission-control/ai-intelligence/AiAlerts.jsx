import React from 'react';
import { Bell } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { useLocalization } from '@/lib/i18n/useLocalization';

const COLOR = { critical: 'text-destructive', warning: 'text-warning' };

export default function AiAlerts({ alerts }) {
  const { t } = useLocalization();
  return (
    <MCSection icon={Bell} title={t('mission.ai_alerts')}>
      {alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">{t('mission.no_active_ai_alerts')}</p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((a, i) => (
            <li key={i} className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
              <span className={'w-2 h-2 rounded-full ' + (COLOR[a.level] || 'text-muted-foreground').replace('text-', 'bg-')} />
              <span className="text-sm flex-1">{a.title}</span>
            </li>
          ))}
        </ul>
      )}
    </MCSection>
  );
}