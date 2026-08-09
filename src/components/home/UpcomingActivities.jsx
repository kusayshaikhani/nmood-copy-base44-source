import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, Mail } from 'lucide-react';
import HomeWidget from './HomeWidget';
import HomeEmptyState from './HomeEmptyState';
import ExperienceCard from './ExperienceCard';
import { usePendingInvitationCount } from '@/lib/home-invitations';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * HM-UX-001 Widget 10 — Your Upcoming Activities.
 * Brings together upcoming joined Experiences and pending invitations into one
 * surface. Hides entirely when there is nothing to show (hide when empty).
 * RC-005A: Pending invitations now come from real CircleInvitation + PalRequest.
 */
export default function UpcomingActivities({ experiences, joinedIds }) {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const { count: pendingCount } = usePendingInvitationCount();

  const joined = useMemo(
    () => (experiences || []).filter((e) => joinedIds.has(e.id)).slice(0, 3),
    [experiences, joinedIds]
  );

  const hasPending = pendingCount > 0;

  if (joined.length === 0 && !hasPending) return null;

  return (
    <HomeWidget icon={CalendarClock} title={t('home.upcoming_activities')} onSeeAll={() => navigate('/calendar')}>
      {joined.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {joined.map((e) => (
            <ExperienceCard key={e.id} {...e} />
          ))}
        </div>
      ) : (
        <HomeEmptyState
          icon={CalendarClock}
          message={t('home.upcoming.empty')}
          actionLabel={t('home.upcoming.explore')}
          onAction={() => navigate('/explore')}
        />
      )}

      {hasPending && (
        <button
          onClick={() => navigate('/pals')}
          type="button"
          className="mt-3 w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover-lift text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">{t('home.upcoming.pending_invitations', { count: pendingCount })}</p>
            <p className="text-xs text-muted-foreground">{t('home.upcoming.pending_subtitle')}</p>
          </div>
        </button>
      )}
    </HomeWidget>
  );
}