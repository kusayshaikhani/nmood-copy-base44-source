import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Calendar, Users, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';

// UI-024 — Premium notifications permission step explaining WHY.
// update/onNext logic unchanged.
export default function NotificationsStep({ data, update, onNext }) {
  const { t } = useLocalization();
  const benefits = [
    { icon: Calendar, title: t('onboarding.notifications.benefit_event_title'), description: t('onboarding.notifications.benefit_event_desc'), tone: 'from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-400' },
    { icon: Users, title: t('onboarding.notifications.benefit_circle_title'), description: t('onboarding.notifications.benefit_circle_desc'), tone: 'from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-400' },
    { icon: MessageSquare, title: t('onboarding.notifications.benefit_messages_title'), description: t('onboarding.notifications.benefit_messages_desc'), tone: 'from-sky-500/15 to-sky-500/5 text-sky-600 dark:text-sky-400' },
    { icon: Sparkles, title: t('onboarding.notifications.benefit_reco_title'), description: t('onboarding.notifications.benefit_reco_desc'), tone: 'from-violet-500/15 to-violet-500/5 text-violet-600 dark:text-violet-400' },
  ];

  const handleEnable = () => {
    update({ notifications_enabled: true });
    onNext();
  };

  const handleSkip = () => {
    update({ notifications_enabled: false });
    onNext();
  };

  return (
    <div className="flex flex-col items-center text-center pt-2">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16 }}
        className="w-20 h-20 rounded-3xl bg-nmood-gradient flex items-center justify-center shadow-elevated mb-6"
      >
        <Bell className="w-10 h-10 text-white" strokeWidth={1.6} />
      </motion.div>

      <h2 className="font-heading text-xl font-bold mb-2">{t('onboarding.notifications.premium_title')}</h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-7 max-w-sm">
        {t('onboarding.notifications.description')}
      </p>

      <div className="w-full space-y-2.5 text-start mb-8">
        {benefits.map((benefit, i) => {
          const Icon = benefit.icon;
          return (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.3 }}
              className="flex items-start gap-3 p-4 rounded-card border border-border/50 bg-card shadow-soft"
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${benefit.tone}`}>
                <Icon className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold">{benefit.title}</p>
                <p className="text-[12.5px] text-muted-foreground mt-0.5 leading-snug">{benefit.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="w-full space-y-2.5">
        <Button className="w-full h-12 shadow-elevated" onClick={handleEnable}>
          {t('onboarding.notifications.enable')}
        </Button>
        <Button variant="ghost" className="w-full h-12 text-muted-foreground" onClick={handleSkip}>
          {t('onboarding.notifications.not_now')}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        {t('onboarding.notifications.change_hint')}
      </p>
    </div>
  );
}