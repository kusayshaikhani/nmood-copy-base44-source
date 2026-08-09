import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { interests } from '@/lib/onboarding-data';
import { useLocalization } from '@/lib/i18n/useLocalization';

const MIN_INTERESTS = 3;
const MAX_INTERESTS = 5;

const TONES = [
  'from-rose-500/15 to-rose-500/5 text-rose-600 dark:text-rose-400',
  'from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-400',
  'from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-400',
  'from-sky-500/15 to-sky-500/5 text-sky-600 dark:text-sky-400',
  'from-violet-500/15 to-violet-500/5 text-violet-600 dark:text-violet-400',
  'from-fuchsia-500/15 to-fuchsia-500/5 text-fuchsia-600 dark:text-fuchsia-400',
  'from-indigo-500/15 to-indigo-500/5 text-indigo-600 dark:text-indigo-400',
  'from-teal-500/15 to-teal-500/5 text-teal-600 dark:text-teal-400',
];

// UI-024 — Premium interest selection as large illustrated mood cards.
// Selection logic (min 3 / max 5) and data unchanged.
export default function InterestsStep({ data, update, onNext }) {
  const { t } = useLocalization();
  const [error, setError] = useState('');
  const selected = data.interests || [];
  const available = interests.filter((i) => !selected.includes(i.id));

  const toggle = (id) => {
    if (selected.includes(id)) {
      update({ interests: selected.filter((i) => i !== id) });
      setError('');
    } else if (selected.length < MAX_INTERESTS) {
      update({ interests: [...selected, id] });
      setError('');
    } else {
      setError(t('onboarding.interests.max_error', { max: MAX_INTERESTS }));
    }
  };

  const handleNext = () => {
    if (selected.length < MIN_INTERESTS) {
      setError(t('onboarding.interests.min_error', { min: MIN_INTERESTS }));
      return;
    }
    onNext();
  };

  const getLabel = (id) => t('onboarding.interest.' + id);
  const isSelected = (id) => selected.includes(id);

  return (
    <div>
      {/* selected chips at top */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {selected.map((id) => (
            <motion.button
              key={id}
              layout
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              onClick={() => toggle(id)}
              type="button"
              className="flex items-center gap-1.5 ps-3 pe-2.5 py-1.5 rounded-full bg-nmood-gradient text-primary-foreground text-[13px] font-semibold shadow-soft"
            >
              {getLabel(id)}
              <X className="w-3.5 h-3.5" />
            </motion.button>
          ))}
        </div>
      )}

      {/* illustrated cards */}
      <div className="grid grid-cols-2 gap-3">
        {interests.map((interest, i) => {
          const Icon = interest.icon;
          const sel = isSelected(interest.id);
          const tone = TONES[i % TONES.length];
          return (
            <motion.button
              key={interest.id}
              onClick={() => toggle(interest.id)}
              type="button"
              whileTap={{ scale: 0.96 }}
              animate={{ scale: sel ? 1.02 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className={`relative flex flex-col items-center justify-center gap-2.5 p-5 rounded-card border-2 transition-colors text-center ${
                sel
                  ? 'border-primary bg-primary/5 shadow-elevated'
                  : 'border-border/50 bg-card shadow-soft hover:border-muted-foreground/30'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${tone}`}>
                <Icon className="w-6 h-6" strokeWidth={1.75} />
              </div>
              <span className="text-[14px] font-semibold leading-tight">{getLabel(interest.id)}</span>
              {sel && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="absolute top-2.5 end-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[13px] text-destructive mt-4 text-center font-medium"
        >
          {error}
        </motion.p>
      )}

      <div className="sticky bottom-4 mt-6">
        <Button className="w-full h-12 shadow-elevated gap-1.5" onClick={handleNext}>
          {selected.length > 0
            ? t('onboarding.interests.continue_count', { count: selected.length, max: MAX_INTERESTS })
            : t('common.continue')}
        </Button>
      </div>
    </div>
  );
}