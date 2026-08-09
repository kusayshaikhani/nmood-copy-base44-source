import React from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';
import { PHASE_LABELS } from '@/lib/experience-day-engine';

const phaseStyles = {
  far: 'bg-muted text-muted-foreground',
  tomorrow: 'bg-info/10 text-info',
  getting_ready: 'bg-primary/10 text-primary',
  time_to_leave: 'bg-warning/10 text-warning',
  live: 'bg-red-500/10 text-red-500',
  completed: 'bg-success/10 text-success',
  follow_up: 'bg-accent/20 text-accent-foreground',
};

export default function DayHeader({ experience, phase, countdown, onBack }) {
  const label = PHASE_LABELS[phase];
  const badgeClass = phaseStyles[phase] || phaseStyles.far;
  const showCountdown = countdown && !['live', 'completed', 'follow_up'].includes(phase);

  return (
    <div className="relative rounded-2xl overflow-hidden">
      <img src={experience.image} alt={experience.title} className="w-full h-40 object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <button onClick={onBack} type="button" className="absolute top-3 start-3 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div className="absolute bottom-0 start-0 end-0 p-4 text-white">
        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold mb-1.5 ${badgeClass}`}>
          {label}{showCountdown ? ` · ${countdown}` : ''}
        </span>
        <h1 className="font-semibold text-lg leading-tight">{experience.title}</h1>
        <p className="text-xs text-white/80 flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3" /> {experience.venue?.name}
        </p>
      </div>
    </div>
  );
}