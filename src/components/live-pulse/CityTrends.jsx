import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame } from 'lucide-react';
import { cityTrendTabs, cityTrendData } from '@/lib/live-pulse-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function CityTrends() {
  const { t } = useLocalization();
  const [active, setActive] = useState('tonight');
  const items = cityTrendData[active] || [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Flame className="w-4 h-4 text-primary" />
        <h2 className="font-semibold text-lg">{t('livepulse.city_trends')}</h2>
      </div>

      <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
        {cityTrendTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-default ${
              active === tab.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/70'
            }`}
          >
            {t('livepulse.tab.' + tab.key)}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-2"
          >
            {items.map((item, i) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                  {item.count}
                  <span className="text-muted-foreground font-normal">{t('livepulse.active')}</span>
                </span>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}