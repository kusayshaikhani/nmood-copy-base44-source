import React from 'react';
import { motion } from 'framer-motion';
import { Crown, ShieldCheck, Gauge } from 'lucide-react';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import VerifiedBadge from '@/components/shared/VerifiedBadge';
import { resolveMemberName, resolveMemberInitials } from '@/lib/member-display';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-017 — Large circular avatar with verification, premium, trust, and
 * completion badges. Overlaps the hero with a negative margin. Badges are
 * pill-shaped with icons — never plain text.
 */
export default function ProfileIdentity({ member, user, isPremium, trustScore, completenessPct, isVerified }) {
  const { t } = useLocalization();
  const initials = resolveMemberInitials(member, user) || 'U';
  const photo = member?.photo_url || user?.image_url;
  const name = resolveMemberName(member, user) || '';

  return (
    <div className="flex flex-col items-center -mt-20 relative z-10 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <ProfileAvatar
          src={photo}
          alt={name}
          initials={initials}
          className="w-32 h-32 border-4 border-card shadow-elevated"
          fallbackClassName="bg-nmood-gradient text-white text-4xl font-bold"
        />
        {isVerified && <VerifiedBadge variant="overlay" className="w-7 h-7 border-4" />}
      </motion.div>

      {/* Badge row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="flex flex-wrap items-center justify-center gap-2 mt-4"
      >
        {isPremium && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-nmood-cta text-white text-xs font-semibold shadow-card">
            <Crown className="w-3.5 h-3.5" /> {t('profile.premium.identity.premium')}
          </span>
        )}
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full glass border border-white/40 text-foreground text-xs font-semibold shadow-soft">
          <ShieldCheck className="w-3.5 h-3.5 text-success" /> {t('profile.premium.identity.trust', { score: trustScore })}
        </span>
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full glass border border-white/40 text-foreground text-xs font-semibold shadow-soft">
          <Gauge className="w-3.5 h-3.5 text-primary" /> {t('profile.premium.identity.complete', { pct: completenessPct })}
        </span>
      </motion.div>
    </div>
  );
}