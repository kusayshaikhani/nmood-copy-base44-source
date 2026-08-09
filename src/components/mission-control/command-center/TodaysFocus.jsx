import React from 'react';
import { Link } from 'react-router-dom';
import { Target, ChevronRight, CheckCircle2 } from 'lucide-react';
import CommandSection from './CommandSection';
import { useLocalization } from '@/lib/i18n/useLocalization';

const SEV = { high: 'text-destructive', medium: 'text-warning' };

export default function TodaysFocus({ items }) {
  const { t } = useLocalization();
  return (
    <CommandSection icon={Target} title={t('mission.todays_focus')}>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">{t('mission.no_urgent_operational_priorities')}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i}>
              <Link to={it.to} className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 hover:bg-muted/70 transition-default">
                <span className={'w-2 h-2 rounded-full ' + (SEV[it.severity] || 'bg-muted-foreground').replace('text-', 'bg-')} />
                <span className="text-sm flex-1">{it.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </CommandSection>
  );
}