import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, ArrowLeft } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { useNavigate } from 'react-router-dom';

/**
 * UI-020 — Premium host type selection (pre-step).
 * Full-bleed gradient hero with two large premium cards.
 */
export default function PremiumStepHostType({ onSelect }) {
  const { t } = useLocalization();
  const navigate = useNavigate();

  const options = [
    { id: 'experience', label: t('hosting.step_type.experience'), description: t('hosting.step_type.experience_desc'), icon: Calendar, tint: 'from-chart-1/15 to-chart-4/20', iconBg: 'bg-chart-1/15 text-chart-1' },
    { id: 'circle', label: t('hosting.step_type.circle'), description: t('hosting.step_type.circle_desc'), icon: Users, tint: 'from-success/15 to-primary/15', iconBg: 'bg-success/15 text-success' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-nmood-gradient">
      <div className="px-6 pt-[calc(3.5rem+env(safe-area-inset-top))] pb-8">
        <button
          onClick={() => navigate('/host')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 active:scale-95 transition-transform"
          type="button"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 px-6 pb-12 flex flex-col justify-center">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-3xl font-bold text-white text-center mb-2"
        >
          {t('hosting.step_type.title')}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="text-white/75 text-center mb-10 max-w-sm mx-auto"
        >
          {t('hosting.step.host_type_desc')}
        </motion.p>

        <div className="grid gap-4 max-w-md w-full mx-auto">
          {options.map((opt, i) => {
            const Icon = opt.icon;
            return (
              <motion.button
                key={opt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 + i * 0.08 }}
                onClick={() => onSelect(opt.id)}
                type="button"
                className="flex items-center gap-4 p-5 rounded-card bg-white/95 backdrop-blur shadow-elevated text-start active:scale-[0.98] transition-transform"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${opt.tint} flex items-center justify-center flex-shrink-0`}>
                  <div className={`w-11 h-11 rounded-xl ${opt.iconBg} flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg">{opt.label}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{opt.description}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}