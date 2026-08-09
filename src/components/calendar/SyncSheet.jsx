import React, { useState, useEffect } from 'react';
import { RefreshCw, Check, ExternalLink } from 'lucide-react';
import BottomSheet from '@/components/shared/BottomSheet';
import { Switch } from '@/components/ui/switch';
import { syncProviders } from '@/lib/calendar-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function SyncSheet({ open, onOpenChange }) {
  const { t } = useLocalization();
  const [syncState, setSyncState] = useState({});

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('inmood_calendar_sync') || '{}');
    setSyncState(saved);
  }, [open]);

  const toggle = (providerId) => {
    const next = { ...syncState, [providerId]: !syncState[providerId] };
    setSyncState(next);
    localStorage.setItem('inmood_calendar_sync', JSON.stringify(next));
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('calendar.sync.title')}
      description="Sync your Nmood calendar with external calendars. You control what syncs."
    >
      <div className="space-y-3 py-2">
        {syncProviders.map((p) => {
          const enabled = !!syncState[p.id];
          return (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-2xl border border-border/50 bg-card">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl flex-shrink-0">
                {p.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{p.label}</p>
                <p className="text-xs text-muted-foreground">{enabled ? 'Syncing' : 'Not connected'}</p>
              </div>
              <Switch checked={enabled} onCheckedChange={() => toggle(p.id)} />
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground text-center pt-2">
          {t('calendar.sync.privacy')}
        </p>
      </div>
    </BottomSheet>
  );
}