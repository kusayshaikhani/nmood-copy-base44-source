import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Coffee, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function FreeTimeCard({ slots, onHost, onDiscover }) {
  const { t } = useLocalization();
  if (!slots || slots.length === 0) return null;
  const slot = slots[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/5 to-accent/5 p-5 mb-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">{t('calendar.free.title')}</h3>
      </div>
      <p className="text-sm font-medium mb-1">{slot.label}</p>
      <p className="text-xs text-muted-foreground mb-3">{slot.suggestion}</p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={onDiscover}>
          <Coffee className="w-3.5 h-3.5" />
          {t('calendar.free.explore')}
        </Button>
        <Button size="sm" className="gap-1.5 text-xs h-8" onClick={onHost}>
          <Sparkles className="w-3.5 h-3.5" />{t('calendar.free.host_something')}</Button>
      </div>
    </motion.div>
  );
}