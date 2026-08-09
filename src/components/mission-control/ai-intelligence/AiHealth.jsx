import React from 'react';
import { Cpu } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { Sparkles, ScanSearch, Users, Search, Languages, Bell, ShieldAlert } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const ICONS = { Sparkles, ScanSearch, Users, Search, Languages, Bell, ShieldAlert };
const DOT = { healthy: 'bg-success', warning: 'bg-warning', critical: 'bg-destructive', offline: 'bg-destructive', unknown: 'bg-muted-foreground/40' };
const LABEL = { healthy: 'Healthy', warning: 'Warning', critical: 'Critical', offline: 'Offline', unknown: 'Awaiting telemetry' };

export default function AiHealth({ services }) {
  const { t } = useLocalization();
  return (
    <MCSection icon={Cpu} title={t('mission.ai_health')}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {services.map((s) => {
          const Icon = ICONS[s.icon] || Cpu;
          return (
            <div key={s.key} className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{s.name}</p>
                <p className="text-[10px] text-muted-foreground">{LABEL[s.status] || 'Unknown'} · {s.detail}</p>
              </div>
              <span className={'w-2.5 h-2.5 rounded-full ' + (DOT[s.status] || DOT.unknown)} />
            </div>
          );
        })}
      </div>
    </MCSection>
  );
}