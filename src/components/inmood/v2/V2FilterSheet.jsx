import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, Check } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { INMOOD_CATEGORIES } from '@/lib/inmood-categories';

const WHEN_OPTIONS = ['today', 'tonight', 'tomorrow', 'weekend', 'this_week', 'morning', 'afternoon', 'evening'];
const TOGGLE_OPTIONS = ['nearby', 'trending', 'newest', 'friends', 'verified', 'indoor', 'outdoor', 'free', 'paid', 'accessibility'];

export default function V2FilterSheet({ open, onOpenChange, filters, onApply }) {
  const { t } = useLocalization();
  const [local, setLocal] = useState(filters || {});

  useEffect(() => { if (open) setLocal(filters || {}); }, [open, filters]);

  const update = (k, v) => setLocal((p) => ({ ...p, [k]: v }));
  const toggle = (k) => setLocal((p) => ({ ...p, [k]: !p[k] }));
  const toggleCat = (c) => setLocal((p) => {
    const cats = p.categories || [];
    return { ...p, categories: cats.includes(c) ? cats.filter((x) => x !== c) : [...cats, c] };
  });

  const Chip = ({ active, onClick, children }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 h-9 rounded-full text-[13px] font-medium flex-shrink-0 border transition-default ${
        active ? 'bg-nmood-cta text-white border-transparent' : 'bg-muted text-muted-foreground border-border/40 hover:bg-muted/70'
      }`}
    >
      {children}
    </button>
  );

  const ToggleRow = ({ k, label }) => (
    <button
      type="button"
      onClick={() => toggle(k)}
      className="w-full flex items-center justify-between py-3 border-b border-border/40 last:border-0"
    >
      <span className="text-[13px] font-medium text-foreground">{label}</span>
      <span className={`w-10 h-6 rounded-full transition-colors duration-200 relative ${local[k] ? 'bg-primary' : 'bg-muted'}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${local[k] ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-card rounded-t-dialog border-t border-border max-h-[88vh] flex flex-col"
          >
            <div className="relative flex items-center justify-center px-5 pt-4 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted absolute left-1/2 -translate-x-1/2 top-2" />
              <h2 className="text-base font-semibold text-foreground">{t('inmood.filter.title')}</h2>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 pb-4 space-y-6 flex-1">
              <section>
                <h3 className="text-[13px] font-medium text-foreground mb-2.5">{t('inmood.filter.when')}</h3>
                <div className="flex flex-wrap gap-2">
                  {WHEN_OPTIONS.map((w) => (
                    <Chip key={w} active={local.when === w} onClick={() => update('when', local.when === w ? null : w)}>
                      {t(`inmood.filter.${w}`)}
                    </Chip>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-[13px] font-medium text-foreground mb-2.5">{t('inmood.filter.distance')}</h3>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[local.distance || 50]}
                    onValueChange={(v) => update('distance', v[0])}
                    min={1} max={50} step={1}
                    className="flex-1"
                  />
                  <span className="text-[13px] font-medium w-20 text-end text-foreground">
                    {local.distance && local.distance < 50 ? `${local.distance} ${t('inmood.filter.km')}` : t('inmood.filter.any_distance')}
                  </span>
                </div>
              </section>

              <section>
                <h3 className="text-[13px] font-medium text-foreground mb-1">{t('inmood.filter.more')}</h3>
                <div>
                  {TOGGLE_OPTIONS.map((k) => (
                    <ToggleRow key={k} k={k} label={t(`inmood.filter.${k}`)} />
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-[13px] font-medium text-foreground mb-2.5">{t('inmood.filter.categories')}</h3>
                <div className="flex flex-wrap gap-2">
                  {INMOOD_CATEGORIES.filter((c) => c.key !== 'All' && c.key !== 'More').map((c) => (
                    <Chip key={c.key} active={(local.categories || []).includes(c.key)} onClick={() => toggleCat(c.key)}>
                      <span className="me-1">{c.icon}</span>{t(`inmood.redesign.categories.${c.key}`)}
                    </Chip>
                  ))}
                </div>
              </section>
            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-border/40 bg-card">
              <button
                type="button"
                onClick={() => setLocal({})}
                className="h-12 px-5 rounded-button border border-border bg-card text-foreground font-medium text-[13px] flex items-center gap-2 hover:bg-muted/50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> {t('inmood.filter.reset')}
              </button>
              <button
                type="button"
                onClick={() => { onApply(local); onOpenChange(false); }}
                className="flex-1 h-12 rounded-button bg-nmood-cta text-primary-foreground font-semibold text-[14px] flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Check className="w-4 h-4" /> {t('inmood.filter.apply')}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}