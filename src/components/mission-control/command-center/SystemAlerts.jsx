import React from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon, ChevronRight } from 'lucide-react';
import CommandSection from './CommandSection';
import { useLocalization } from '@/lib/i18n/useLocalization';

const COLOR = { critical: 'text-destructive', warning: 'text-warning' };

export default function SystemAlerts({ alerts }) {
  const { t } = useLocalization();
  return (
    <CommandSection icon={AlertOctagon} title={t('mission.system_alerts')}>
      {alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">{t('mission.no_active_platform_alerts')}</p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((a, i) => (
            <li key={i}>
              <Link to={a.to} className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 hover:bg-muted/70 transition-default">
                <span className={'w-2 h-2 rounded-full ' + (COLOR[a.level] || '').replace('text-', 'bg-')} />
                <span className="text-sm flex-1">{a.title}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </CommandSection>
  );
}