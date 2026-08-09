import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import BottomSheet from '@/components/shared/BottomSheet';
import { reminderOptions } from '@/lib/calendar-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ReminderSheet({ open, onOpenChange, activity }) {
  const { t } = useLocalization();
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (activity) {
      const saved = localStorage.getItem(`inmood_reminder_${activity.id}`);
      setSelected(saved || activity.reminder || null);
    }
  }, [activity]);

  const handleSelect = (opt) => {
    setSelected(opt.id);
    if (activity) {
      localStorage.setItem(`inmood_reminder_${activity.id}`, opt.id);
    }
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('calendar.reminder.title')}
      description={activity ? activity.title : 'Get notified before your experience.'}
    >
      <div className="space-y-2 py-2">
        {reminderOptions.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => handleSelect(opt)}
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-default text-start ${
              selected === opt.id
                ? 'border-primary bg-primary/5'
                : 'border-border/50 bg-card'
            }`}
          >
            <Bell className={`w-4 h-4 ${selected === opt.id ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className="flex-1 text-sm font-medium">{opt.label}</span>
            {selected === opt.id && (
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">✓</span>
            )}
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}