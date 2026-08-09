import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, Ban, BookOpen, Shield, X } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { useToast } from '@/components/ui/use-toast';

export default function NmoodReportSheet({ open, onClose }) {
  const { t } = useLocalization();
  const { toast } = useToast();

  if (!open) return null;

  const options = [
    { icon: Flag, key: 'report_nmood', color: 'text-destructive' },
    { icon: Flag, key: 'report_member', color: 'text-destructive' },
    { icon: Ban, key: 'block_member', color: 'text-destructive' },
    { icon: BookOpen, key: 'community_guidelines', color: 'text-foreground' },
    { icon: Shield, key: 'safety_center', color: 'text-primary' },
  ];

  const handleSelect = (key) => {
    toast({ description: t(`nmoods.detail.${key}_toast`) });
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full max-w-md bg-card rounded-t-[28px] px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-dialog"
        >
          <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold">{t('nmoods.detail.report_title')}</h3>
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-1">
            {options.map((opt) => (
              <button key={opt.key} type="button" onClick={() => handleSelect(opt.key)} className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-secondary transition-colors text-left">
                <opt.icon className={`w-5 h-5 ${opt.color}`} />
                <span className="text-sm font-medium">{t(`nmoods.detail.${opt.key}`)}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}