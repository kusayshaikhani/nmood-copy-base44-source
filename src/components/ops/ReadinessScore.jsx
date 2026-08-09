import React from 'react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ReadinessScore({ score }) {
  const { t } = useLocalization();
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 85 ? 'hsl(var(--success))' : score >= 70 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))';

  return (
    <div className="relative w-36 h-36 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={radius} stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tracking-tight">{score}%</span>
        <span className="text-xs text-muted-foreground">{t('mission.ready')}</span>
      </div>
    </div>
  );
}