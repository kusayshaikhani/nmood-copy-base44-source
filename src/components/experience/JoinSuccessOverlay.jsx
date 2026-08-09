import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function JoinSuccessOverlay({ open, onAddToCalendar, onViewMyExperiences, onContinueDiscovering }) {
  const { t } = useLocalization();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-background flex flex-col items-center justify-center px-6"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="relative w-28 h-28 rounded-full bg-success flex items-center justify-center mb-8 shadow-xl shadow-success/30"
          >
            <Check className="w-14 h-14 text-success-foreground" strokeWidth={3} />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="absolute -top-1 -end-1 w-8 h-8 rounded-full bg-accent flex items-center justify-center shadow-md"
            >
              <Sparkles className="w-4 h-4 text-accent-foreground" />
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold mb-3"
          >
            See you there!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-muted-foreground text-center max-w-xs mb-10"
          >
            You're in — we'll remind you before it starts.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col gap-3 w-full max-w-sm"
          >
            <Button size="lg" className="w-full gap-2" onClick={onAddToCalendar}>
              <CalendarPlus className="w-5 h-5" />{t('experiences.calendar.add_title')}</Button>
            <Button variant="outline" size="lg" className="w-full" onClick={onViewMyExperiences}>{t('experiences.success.view_my_experiences')}</Button>
            <Button variant="ghost" size="lg" className="w-full" onClick={onContinueDiscovering}>
              {t('experiences.join.keep_exploring')}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}