import React from 'react';
import { Calendar, Smartphone, Mail } from 'lucide-react';
import BottomSheet from '@/components/shared/BottomSheet';
import { generateGoogleCalendarUrl, downloadICS } from '@/lib/calendar-utils';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function AddToCalendarSheet({ experience, open, onOpenChange }) {
  const { t } = useLocalization();
  if (!experience) return null;

  const options = [
    {
      icon: Calendar,
      label: 'Google Calendar',
      color: 'bg-primary/10 text-primary',
      onClick: () => {
        window.open(generateGoogleCalendarUrl(experience), '_blank');
        onOpenChange(false);
      },
    },
    {
      icon: Smartphone,
      label: 'Apple Calendar',
      color: 'bg-muted text-muted-foreground',
      onClick: () => {
        downloadICS(experience);
        onOpenChange(false);
      },
    },
    {
      icon: Mail,
      label: 'Outlook (ICS)',
      color: 'bg-info/10 text-info',
      onClick: () => {
        downloadICS(experience);
        onOpenChange(false);
      },
    },
  ];

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('experiences.calendar.add_title')} description={experience.title}>
      <div className="space-y-2 pb-4 pt-2">
        {options.map(({ icon: Icon, label, color, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            type="button"
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border hover:bg-muted/30 transition-default"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}