import React from 'react';
import { getExperiencePhase, PHASES } from '@/lib/experience-day-engine';

const phases = [
  { key: PHASES.TOMORROW, label: 'Tomorrow', icon: '📅' },
  { key: PHASES.GETTING_READY, label: 'Ready', icon: '⏰' },
  { key: PHASES.TIME_TO_LEAVE, label: 'Leave', icon: '🚗' },
  { key: PHASES.LIVE, label: 'Live', icon: '🔴' },
  { key: PHASES.COMPLETED, label: 'Done', icon: '✓' },
];

export default function PhaseTimeline({ experience, now }) {
  const currentPhase = getExperiencePhase(experience, now);
  const currentIndex = phases.findIndex(p => p.key === currentPhase);
  const farIndex = currentPhase === PHASES.FAR ? -1 : currentIndex;

  return (
    <div className="flex items-center justify-between px-3 py-3 rounded-2xl bg-card border border-border">
      {phases.map((phase, i) => {
        const isPast = farIndex > i;
        const isCurrent = farIndex === i;
        return (
          <React.Fragment key={phase.key}>
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-default ${
                isCurrent ? 'bg-primary text-primary-foreground scale-110 shadow-md' :
                isPast ? 'bg-success/20 text-success' :
                'bg-muted text-muted-foreground'
              }`}>
                {isPast ? '✓' : phase.icon}
              </div>
              <span className={`text-[9px] ${isCurrent ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>{phase.label}</span>
            </div>
            {i < phases.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 ${isPast ? 'bg-success' : 'bg-border'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}