import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Users } from 'lucide-react';
import BottomSheet from '@/components/shared/BottomSheet';
import { useLocalization } from '@/lib/i18n/useLocalization';

const options = [
  { id: 'experience', icon: Sparkles, color: 'primary' },
  { id: 'circle', icon: Users, color: 'accent' },
];

export default function HostTypeSheet({ open, onOpenChange, onSelect }) {
  const { t } = useLocalization();
  const handleSelect = (id) => {
    onOpenChange?.(false);
    onSelect?.(id);
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('home.host_sheet.title')}>
      <div className="grid grid-cols-2 gap-3 pb-2">
        {options.map((opt, i) => {
          const Icon = opt.icon;
          return (
            <motion.button
              key={opt.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => handleSelect(opt.id)}
              className="flex flex-col items-center gap-2 p-5 rounded-2xl border border-border bg-card hover:border-primary/40 transition-default text-center"
            >
              <div className={'w-12 h-12 rounded-2xl flex items-center justify-center ' + (opt.color === 'primary' ? 'bg-primary/10 text-primary' : 'bg-accent/20 text-accent-foreground')}>
                <Icon className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold">{t('home.host_sheet.' + opt.id)}</p>
              <p className="text-xs text-muted-foreground leading-snug">{t('home.host_sheet.' + opt.id + '_desc')}</p>
            </motion.button>
          );
        })}
      </div>
    </BottomSheet>
  );
}