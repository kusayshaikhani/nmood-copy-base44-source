import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { popularNow } from '@/lib/live-pulse-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function PopularNow({ onSelect }) {
  const { t } = useLocalization();
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-warning" />
        <h2 className="font-semibold text-lg">{t('livepulse.popular_now')}</h2>
      </div>

      <div className="space-y-2.5">
        {popularNow.map((item, i) => (
          <motion.button
            key={item.label}
            type="button"
            onClick={() => onSelect?.(item)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border/50 hover-lift text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{t('livepulse.popular.' + item.key)}</p>
              <p className="font-semibold text-sm truncate">{item.value}</p>
              <p className="text-xs text-success font-medium">{item.subCount != null ? t('livepulse.popular.sub.' + item.subKey, { count: item.subCount }) : t('livepulse.popular.sub.' + item.subKey)}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}