import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, CalendarCheck, CheckCircle2, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * Modern vertical timeline derived from existing circle data:
 * member joins (membership.joined_date) and past experiences (completed/hosted).
 * No new API calls — presentation only.
 */
export default function CircleActivityTimeline({ circle, members }) {
  const { t } = useLocalization();

  const events = [];
  (members || []).slice(0, 5).forEach((m) => {
    if (m.joined_date) {
      events.push({
        id: `join-${m.id || m.member_name}`,
        icon: UserPlus,
        accent: 'primary',
        name: m.member_name || m.name || 'Someone',
        action: t('circles.detail.activity_joined'),
        date: m.joined_date,
        avatar: m.member_avatar || m.avatar,
      });
    }
  });
  (circle.past_experiences || []).slice(0, 4).forEach((e) => {
    events.push({
      id: `past-${e.id}`,
      icon: CheckCircle2,
      accent: 'success',
      name: e.host || circle.host?.name || 'Host',
      action: `${t('circles.detail.activity_completed')} · ${e.title}`,
      date: e.date,
      avatar: '',
    });
  });
  (circle.upcoming_experiences || []).slice(0, 3).forEach((e) => {
    events.push({
      id: `upcoming-${e.id}`,
      icon: CalendarCheck,
      accent: 'accent',
      name: e.host || circle.host?.name || 'Host',
      action: `${t('circles.detail.activity_hosted')} · ${e.title}`,
      date: e.date,
      avatar: '',
    });
  });

  // Sort by date desc (best effort), keep stable if no date.
  events.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  if (events.length === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-section-title font-semibold">{t('circles.detail.recent_activity')}</h2>
        <div className="p-6 rounded-card border border-dashed border-border text-center">
          <p className="text-sm font-medium text-muted-foreground">{t('circles.detail.no_activity')}</p>
        </div>
      </div>
    );
  }

  const accentMap = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    accent: 'bg-accent/30 text-accent-foreground',
  };

  return (
    <div className="space-y-3">
      <h2 className="text-section-title font-semibold">{t('circles.detail.recent_activity')}</h2>
      <div className="relative ps-2">
        {/* timeline line */}
        <div className="absolute start-[18px] top-2 bottom-2 w-px bg-border" />
        <div className="space-y-4">
          {events.slice(0, 8).map((ev, i) => {
            const Icon = ev.icon;
            return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="relative flex items-start gap-3"
              >
                <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ring-4 ring-card ${accentMap[ev.accent]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-sm leading-snug">
                    <span className="font-semibold">{ev.name}</span>{' '}
                    <span className="text-muted-foreground">{ev.action}</span>
                  </p>
                  {ev.date && <p className="text-caption text-muted-foreground mt-0.5">{ev.date}</p>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}