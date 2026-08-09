import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, Sparkles, Calendar } from 'lucide-react';
import { areas } from '@/lib/live-pulse-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function AreaTrends({ onSelectArea }) {
  const { t } = useLocalization();
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4 text-primary" />
        <h2 className="font-semibold text-lg">{t('livepulse.area_trends')}</h2>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {areas.map((area, i) => (
          <motion.button
            key={area.name}
            type="button"
            onClick={() => onSelectArea?.(area.name)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            whileTap={{ scale: 0.98 }}
            className="text-left p-3.5 rounded-2xl bg-card border border-border/50 hover-lift"
          >
            <p className="font-semibold text-sm mb-2 truncate">{area.name}</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3 text-primary/60" />
                {t('livepulse.area.experiences', { count: area.experiences })}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="w-3 h-3 text-primary/60" />
                {t('livepulse.area.communities', { count: area.communities })}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="w-3 h-3 text-primary/60" />
                {t('livepulse.area.circles', { count: area.circles })}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}