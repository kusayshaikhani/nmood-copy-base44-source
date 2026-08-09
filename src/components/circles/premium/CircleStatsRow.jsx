import React from 'react';
import { Users, CalendarHeart, Activity, Sparkles } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * Premium statistics row — four rounded glass cards with icon, value, label.
 */
export default function CircleStatsRow({ circle, experienceCount }) {
  const { t, formatDate } = useLocalization();

  const activityLevel = (() => {
    const count = experienceCount + (circle.member_count || 0);
    if (count >= 20) return t('circles.detail.activity_high');
    if (count >= 8) return t('circles.detail.activity_medium');
    return t('circles.detail.activity_low');
  })();

  const founded = circle.created_date ? formatDate(circle.created_date, { month: 'short', year: 'numeric' }) : '—';

  const stats = [
    { icon: Users, value: circle.member_count || 0, label: t('circles.detail.stat_members') },
    { icon: CalendarHeart, value: experienceCount, label: t('circles.detail.stat_experiences') },
    { icon: Activity, value: activityLevel, label: t('circles.detail.stat_activity') },
    { icon: Sparkles, value: founded, label: t('circles.detail.stat_founded'), isText: true },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <div
            key={i}
            className="rounded-card bg-card border border-border/60 shadow-soft p-4 flex flex-col items-center justify-center text-center min-h-[96px]"
          >
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <p className={`font-bold text-foreground leading-tight ${s.isText ? 'text-sm' : 'text-lg'}`}>{s.value}</p>
            <p className="text-caption text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        );
      })}
    </div>
  );
}