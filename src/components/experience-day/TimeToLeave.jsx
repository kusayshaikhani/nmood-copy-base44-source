import React from 'react';
import { Navigation, Car, MapPin, CheckCircle } from 'lucide-react';
import { openInMaps } from '@/lib/experience-day-engine';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function TimeToLeave({ experience, arrived, onArrive }) {
  const { t } = useLocalization();
  return (
    <div className="space-y-3">
      <div className="text-center py-2">
        <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-2">
          <Navigation className="w-6 h-6 text-warning" />
        </div>
        <h2 className="font-semibold text-lg">{t('experiences.day.time_to_leave')}</h2>
        <p className="text-sm text-muted-foreground">{t('experience_day.head_to_venue')}</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
            <Car className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('experiences.day.estimated_travel')}</p>
            <p className="text-sm font-semibold">{t('experience_day.eta_drive')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{t('common.destination')}</p>
            <p className="text-sm font-semibold truncate">{experience.venue?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{experience.venue?.address}</p>
          </div>
        </div>
        <button onClick={() => openInMaps(experience)} type="button" className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-default">
          {t('experience_day.open_navigation')}
        </button>
      </div>

      <button
        onClick={onArrive}
        disabled={arrived}
        type="button"
        className={`w-full py-3 rounded-2xl text-sm font-semibold transition-default flex items-center justify-center gap-2 ${
          arrived ? 'bg-success/10 text-success' : 'bg-card border border-border hover:bg-muted'
        }`}
      >
        {arrived ? <><CheckCircle className="w-5 h-5" /> {t('experience_day.you_are_here')}</> : "📍 I'm Here"}
      </button>
    </div>
  );
}