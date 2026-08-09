import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Eye, EyeOff, Clock } from 'lucide-react';
import SettingsRow from '@/components/settings/SettingsRow';
import { useHiddenPals } from '@/lib/real-pals';
import { isReconnectDisabled, setReconnectDisabled, unhidePal, getSnoozedSuggestions, clearSnoozed } from '@/lib/reconnect-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ReconnectSettings() {
  const { t } = useLocalization();
  const [disabled, setDisabled] = useState(isReconnectDisabled());
  const [hiddenPalIds, setHiddenPalIds] = useState(getHiddenPalsIds());
  const [snoozedCount, setSnoozedCount] = useState(getSnoozedSuggestions().length);

  const hiddenPals = useHiddenPals();

  function getHiddenPalsIds() {
    try { return JSON.parse(localStorage.getItem('inmood_reconnect_hidden_pals') || '[]'); } catch { return []; }
  }

  const handleToggle = (v) => {
    setDisabled(!v);
    setReconnectDisabled(!v);
  };

  const handleUnhide = (palId) => {
    unhidePal(palId);
    setHiddenPalIds(getHiddenPalsIds());
  };

  const handleRestoreSnoozed = () => {
    clearSnoozed();
    setSnoozedCount(0);
  };

  return (
    <div>
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2.5 px-2">Reconnect</h2>
      <Card className="divide-y divide-border/60 rounded-card overflow-hidden">
        <SettingsRow
          icon={Heart}
          iconClassName="text-primary"
          title={t('reconnect.reminders.title')}
          subtitle={t('reconnect.suggestions.subtitle')}
          trailing={<Switch checked={!disabled} onCheckedChange={handleToggle} />}
        />

        {snoozedCount > 0 && (
          <SettingsRow
            icon={Clock}
            title={t('reconnect.suggestions.snoozed')}
            subtitle={`${snoozedCount} snoozed`}
            trailing={<Button variant="outline" size="sm" onClick={handleRestoreSnoozed}>Restore</Button>}
          />
        )}

        {hiddenPals.length > 0 && (
          <div className="py-3 px-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <EyeOff className="w-3 h-3" /> HIDDEN PALS
            </p>
            <div className="space-y-2">
              {hiddenPals.map((pal) => (
                <div key={pal.id} className="flex items-center gap-2">
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={pal.avatar} alt={pal.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">{(pal.name || '?').charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm flex-1 truncate">{pal.name}</span>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => handleUnhide(pal.id)}>
                    <Eye className="w-3 h-3" /> Unhide
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}