import React from 'react';
import { CHANNELS, FUTURE_CHANNELS } from '@/lib/communication-metrics';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function CommunicationTabs({ active, onChange, counts = {} }) {
  const { t } = useLocalization();
  return (
    <div className="flex flex-wrap gap-2 my-4">
      {CHANNELS.map((ch) => (
        <button
          key={ch.id}
          onClick={() => onChange(ch.id)}
          className={'px-4 py-2 rounded-lg text-sm font-medium border transition-default ' +
            (active === ch.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:bg-muted/50')}
        >
          {ch.label}{counts[ch.id] ? ` (${counts[ch.id]})` : ''}
        </button>
      ))}
      {FUTURE_CHANNELS.map((ch) => (
        <button
          key={ch.id}
          disabled
          className="px-4 py-2 rounded-lg text-sm font-medium border bg-muted/30 border-border text-muted-foreground/50 cursor-not-allowed"
          title={t('mission.coming_soon_2')}
        >
          {ch.label} · Soon
        </button>
      ))}
    </div>
  );
}