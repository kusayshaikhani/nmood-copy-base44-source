import React from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { resolveMemberName } from '@/lib/member-display';

function calcAge(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 86400000));
}

/**
 * UI-017 — Name, age, nationality, city, online status. Large centered
 * typography with comfortable spacing. Respects member privacy toggles.
 */
export default function ProfileNameSection({ member, user, isPremium }) {
  const { t } = useLocalization();
  // The user always sees their own real name on their own profile. The neutral
  // "Member" placeholder is a last-resort fallback only when no name is set.
  const realName = resolveMemberName(member, user);
  const name = realName || t('profile.member_name');
  const age = calcAge(member?.date_of_birth);
  const showAge = member?.show_age === true && age != null;
  const city = member?.city;
  const country = member?.country;
  const showOnline = member?.show_online_status !== false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      className="text-center px-6 mt-3"
    >
      <h1 className="text-2xl font-bold tracking-tight text-balance">{name}</h1>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-2 text-sm text-muted-foreground">
        {showAge && <span className="font-medium">{t('profile.premium.name.yrs', { age })}</span>}
        {country && <span>{country}</span>}
        {city && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> {city}
          </span>
        )}
        {showOnline && (
          <span className="flex items-center gap-1 text-success font-medium">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" /> {t('profile.premium.name.online')}
          </span>
        )}
      </div>
    </motion.div>
  );
}