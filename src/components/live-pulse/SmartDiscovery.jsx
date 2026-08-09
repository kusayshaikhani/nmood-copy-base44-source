import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Link2, Heart, Target, Users } from 'lucide-react';
import { smartDiscoveryReasons } from '@/lib/live-pulse-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

const REASON_KEYS = {
  'Similar interests': 'livepulse.reason.similar_interests',
  'Same Community': 'livepulse.reason.same_community',
  'Same Circle': 'livepulse.reason.same_circle',
  'Your Pals joined': 'livepulse.reason.pals_joined',
  'Matches your goals': 'livepulse.reason.matches_goals',
};

const reasonIcons = {
  'Similar interests': Sparkles,
  'Same Community': Users,
  'Same Circle': Link2,
  'Your Pals joined': Heart,
  'Matches your goals': Target,
};

export default function SmartDiscovery({ experiences = [], member }) {
  const { t } = useLocalization();
  const reasons = useMemo(() => {
    const r = [];
    if (member?.interests?.length) r.push('Similar interests');
    r.push('Same Community', 'Same Circle', 'Your Pals joined');
    if (member?.interests?.length) r.push('Matches your goals');
    return r.length > 0 ? r : smartDiscoveryReasons;
  }, [member]);

  const featured = experiences[0];
  if (!featured) return null;

  return (
    <div className="rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/5 to-accent/5 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <h2 className="font-semibold text-lg">{t('livepulse.smart.title')}</h2>
      </div>

      <div className="flex gap-4 mb-4">
        <img
          src={featured.image}
          alt={featured.title}
          className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm line-clamp-2">{featured.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{featured.category} · {featured.budget}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{featured.distance} · {featured.time}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {reasons.slice(0, 4).map((reason, i) => {
          const Icon = reasonIcons[reason] || Sparkles;
          return (
            <motion.span
              key={reason}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-1 text-[10px] font-medium bg-primary/10 text-primary px-2 py-1 rounded-full"
            >
              <Icon className="w-2.5 h-2.5" />
              {t(REASON_KEYS[reason] || reason)}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}