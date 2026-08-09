import React from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, Crown, Sparkles, Award, Compass, Coffee, Lock } from 'lucide-react';
import SectionReveal from '@/components/experience/SectionReveal';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-017 — Modern achievement badges derived from real data: verified
 * status, premium tier, early membership, hosting volume, exploration,
 * and interests. Earned badges are full-color; unearned are greyed.
 */
export default function ProfileAchievements({ member, user, isPremium, stats }) {
  const { t } = useLocalization();
  const isVerified = !!member?.phone_verified;
  const sixMonthsAgo = Date.now() - 180 * 86400000;
  const isEarlyMember = user?.created_date ? new Date(user.created_date).getTime() < sixMonthsAgo : false;
  const interests = member?.interests || [];

  const achievements = [
    { id: 'verified', icon: BadgeCheck, label: t('profile.premium.achievements.verified'), earned: isVerified, tint: 'from-success/20 to-success/5 text-success' },
    { id: 'premium', icon: Crown, label: t('profile.premium.achievements.premium'), earned: isPremium, tint: 'from-primary/20 to-accent/10 text-primary' },
    { id: 'early', icon: Sparkles, label: t('profile.premium.achievements.early_member'), earned: isEarlyMember, tint: 'from-chart-3/20 to-chart-3/5 text-chart-3' },
    { id: 'tophost', icon: Award, label: t('profile.premium.achievements.top_host'), earned: stats.hosted >= 3, tint: 'from-chart-1/20 to-chart-1/5 text-chart-1' },
    { id: 'explorer', icon: Compass, label: t('profile.premium.achievements.explorer'), earned: stats.joined >= 5, tint: 'from-chart-2/20 to-chart-2/5 text-chart-2' },
    { id: 'coffee', icon: Coffee, label: t('profile.premium.achievements.coffee_lover'), earned: interests.includes('coffee'), tint: 'from-warning/20 to-warning/5 text-warning' },
  ];

  return (
    <SectionReveal>
      <div className="px-6">
        <h2 className="text-section-title font-semibold mb-3">{t('profile.premium.achievements.title')}</h2>
        <div className="grid grid-cols-3 gap-3">
          {achievements.map((a, i) => {
            const Icon = a.earned ? a.icon : Lock;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className={`flex flex-col items-center gap-2 p-3.5 rounded-card border bg-gradient-to-br ${a.earned ? a.tint + ' border-transparent' : 'from-muted/20 to-muted/5 text-muted-foreground/40 border-border/40'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${a.earned ? 'bg-white/50 dark:bg-white/10' : 'bg-muted'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[11px] font-semibold text-center leading-tight ${a.earned ? '' : 'text-muted-foreground/50'}`}>
                  {a.earned ? a.label : t('profile.premium.achievements.locked')}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </SectionReveal>
  );
}