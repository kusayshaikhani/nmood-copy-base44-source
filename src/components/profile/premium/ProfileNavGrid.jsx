import React from 'react';
import { motion } from 'framer-motion';
import { Route, Target, Calendar, Users, Heart, Mail, Sparkles, Clock, Camera, Settings, Shield, Eye } from 'lucide-react';
import SectionReveal from '@/components/experience/SectionReveal';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-017 — Premium "My Nmood" navigation grid. Reuses the same paths as the
 * original SectionGrid (all functional entry points preserved), restyled
 * with the Nmood Premium Design System and localized labels.
 */
export default function ProfileNavGrid({ navigate, showProfileViews }) {
  const { t } = useLocalization();
  const items = [
    { label: t('profile.premium.nav.journey'), icon: Route, path: '/journey' },
    { label: t('profile.premium.nav.goals'), icon: Target, path: '/goals' },
    { label: t('profile.premium.nav.experiences'), icon: Calendar, path: '/my-experiences' },
    { label: t('profile.premium.nav.pals'), icon: Users, path: '/pals' },
    { label: t('profile.premium.nav.wishlist'), icon: Heart, path: '/saved' },
    { label: t('profile.premium.nav.invitations'), icon: Mail, path: '/notifications' },
    { label: t('profile.premium.nav.hosting'), icon: Sparkles, path: '/host' },
    { label: t('profile.premium.nav.calendar'), icon: Clock, path: '/calendar' },
    { label: t('profile.premium.nav.memories'), icon: Camera, path: '/journey' },
    { label: t('profile.premium.nav.settings'), icon: Settings, path: '/settings' },
    { label: t('profile.premium.nav.safety'), icon: Shield, path: '/safety-center' },
  ];
  if (showProfileViews) {
    items.splice(2, 0, { label: t('profile.premium.nav.profile_views'), icon: Eye, path: '/profile-views' });
  }

  return (
    <SectionReveal>
      <div className="px-6">
        <h2 className="text-section-title font-semibold mb-3">{t('profile.premium.nav.title')}</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {items.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.button
                key={s.label + s.path}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(s.path)}
                type="button"
                className="flex flex-col items-center gap-2 p-3.5 rounded-card border border-border/50 bg-card shadow-soft pressable"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-semibold text-center leading-tight">{s.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </SectionReveal>
  );
}