import React from 'react';
import { MapPin, Calendar, BadgeCheck, Pencil } from 'lucide-react';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { useLocalization } from '@/lib/i18n/useLocalization';

const MOOD_EMOJI = {
  connect: '🤝', explore: '🌍', learn: '📚', relax: '🧘', adventure: '🏔️',
  coffee: '☕', sports: '⚽', networking: '👥',
};

/**
 * UI-008 — Large gradient profile hero with a beautiful avatar.
 * Props/logic unchanged.
 */
export default function MyInMoodHeader({ member, user, onEdit }) {
  const { t } = useLocalization();
  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';
  const name = member?.display_name || user?.full_name || t('profile.header.new_member');
  const memberSince = user?.created_date
    ? new Date(user.created_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : t('profile.header.recently');
  const city = member?.city || t('profile.header.default_city');
  const isTrusted = member?.phone_verified && member?.photo_url;
  const moodKey = typeof window !== 'undefined' ? localStorage.getItem('inmood_intention') : null;
  const mood = moodKey ? MOOD_EMOJI[moodKey] : null;
  const moodLabel = moodKey ? t('profile.header.mood.' + moodKey) : null;

  return (
    <div className="relative bg-nmood-gradient px-6 pt-[calc(3.5rem+env(safe-area-inset-top))] pb-20">
      <div className="flex items-start gap-4">
        <ProfileAvatar
          src={member?.photo_url || user?.image_url}
          alt={name}
          initials={initials}
          className="w-24 h-24 border-4 border-white/25 shadow-2xl flex-shrink-0"
          fallbackClassName="bg-white/20 text-white text-3xl font-bold"
        />
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white truncate leading-tight">{name}</h1>
            {isTrusted && <BadgeCheck className="w-6 h-6 text-white flex-shrink-0" />}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            <span className="text-xs text-white/80 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {memberSince}
            </span>
            <span className="text-xs text-white/80 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {city}
            </span>
          </div>
          {mood && moodLabel && (
            <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-medium text-white">
              <span>{mood}</span> {t('profile.header.nmood_for', { mood: moodLabel })}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit profile"
          className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-md active:scale-95 transition-transform duration-200"
        >
          <Pencil className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}