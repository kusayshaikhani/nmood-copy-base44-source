import React from 'react';
import { Bell, Clock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function RemindersSection({ enabled, onToggle }) {
  const { t } = useLocalization();
  return (
    <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">{t('experiences.reminders.title')}</p>
            <p className="text-xs text-muted-foreground">{t('experiences.reminders.notify_before')}</p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>
      {enabled && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
          {['24 hours before', '2 hours before', '30 minutes before'].map((t) => (
            <span key={t} className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              <Clock className="w-3 h-3" /> {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}