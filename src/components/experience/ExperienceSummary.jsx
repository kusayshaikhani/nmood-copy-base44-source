import React from 'react';
import { Calendar, Clock, MapPin, Navigation, Users } from 'lucide-react';

/**
 * Nmood Premium experience information block — large title, category badge,
 * and a clean info grid (date, time, location, distance, members).
 */
export default function ExperienceSummary({ experience }) {
  const { title, category, mood, date, time, duration, distance, venue, spotsTotal, spotsFilled } = experience;
  const members = spotsTotal || 0;
  const going = spotsFilled || 0;

  const rows = [
    { icon: Calendar, label: date },
    { icon: Clock, label: time ? `${time}${duration ? ` · ${duration}` : ''}` : duration },
    venue?.name && { icon: MapPin, label: venue.name },
    distance && { icon: Navigation, label: distance },
    { icon: Users, label: `${going}/${members} ${members === 1 ? 'spot' : 'spots'} filled` },
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Category badge */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wider bg-nmood-cta text-primary-foreground px-3 py-1.5 rounded-full shadow-soft">
          {category}
        </span>
        {mood && (
          <span className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wider bg-accent/30 text-accent-foreground px-3 py-1.5 rounded-full">
            {mood}
          </span>
        )}
      </div>

      {/* Large title */}
      <h1 className="text-display text-foreground text-balance leading-tight">{title}</h1>

      {/* Info rows */}
      <div className="flex flex-wrap gap-x-6 gap-y-3 pt-1">
        {rows.map(({ icon: Icon, label }, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-primary" strokeWidth={2.2} />
            </span>
            <span className="text-sm font-medium text-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}