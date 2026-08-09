import React from 'react';
import { Calendar, Users, Camera } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function PalTimeline({ pal }) {
  const { t } = useLocalization();
  const events = [
    { icon: Calendar, label: t('connections.timeline.first_experience'), value: pal.firstExperienceTogether, date: pal.connectedDate },
    { icon: Users, label: t('connections.timeline.experiences_together'), value: t('connections.timeline.experiences_count', { count: pal.mutualExperiences }), items: pal.experiencesTogether },
    { icon: Camera, label: t('connections.timeline.photos_together'), value: t('connections.timeline.photos_count', { count: pal.photosTogether?.length || 0 }), photos: pal.photosTogether },
  ];

  return (
    <div className="space-y-0">
      {events.map((event, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <event.icon className="w-4 h-4 text-primary" />
            </div>
            {i < events.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1 min-h-[20px]" />}
          </div>
          <div className="flex-1 pb-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{event.label}</p>
            <p className="text-sm font-medium">{event.value}</p>
            {event.date && <p className="text-xs text-muted-foreground mt-0.5">{event.date}</p>}
            {event.items && (
              <div className="mt-1.5 space-y-0.5">
                {event.items.map((item, j) => (
                  <p key={j} className="text-xs text-muted-foreground">· {item}</p>
                ))}
              </div>
            )}
            {event.photos && event.photos.length > 0 && (
              <div className="flex gap-1.5 mt-2">
                {event.photos.map((photo, j) => (
                  <div key={j} className="w-12 h-12 rounded-lg overflow-hidden">
                    <img src={photo} alt={event.label} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}