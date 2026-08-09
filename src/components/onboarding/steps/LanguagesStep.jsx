import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { languages, LANGUAGE_NATIVE_NAMES } from '@/lib/onboarding-data';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { detectLocaleSettings, validLanguageKeys } from '@/lib/master-data/detect-locale-settings';

// UI-024 — Premium language selection. Toggle / search logic unchanged.
export default function LanguagesStep({ data, update, onNext }) {
  const { t } = useLocalization();
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const selected = data.languages || [];

  // Smart Onboarding — pre-fill detected device languages; user can review/edit before continuing.
  useEffect(() => {
    if (!data.languages || data.languages.length === 0) {
      const detected = validLanguageKeys(detectLocaleSettings().languages);
      if (detected.length) update({ languages: detected.slice(0, 3) });
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayName = (lang) => LANGUAGE_NATIVE_NAMES[lang] || lang;
  const q = query.toLowerCase();
  const filtered = languages.filter((l) =>
    l.toLowerCase().includes(q) || displayName(l).toLowerCase().includes(q)
  );

  const toggle = (lang) => {
    if (selected.includes(lang)) {
      update({ languages: selected.filter((l) => l !== lang) });
    } else {
      update({ languages: [...selected, lang] });
    }
    setError('');
  };

  const handleNext = () => {
    if (selected.length < 1) {
      setError(t('onboarding.languages.min_error'));
      return;
    }
    onNext();
  };

  return (
    <div>
      {/* selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selected.map((lang) => (
            <motion.button
              key={lang}
              layout
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              onClick={() => toggle(lang)}
              type="button"
              className="flex items-center gap-1.5 ps-3 pe-2.5 py-1.5 rounded-full bg-nmood-gradient text-primary-foreground text-[13px] font-semibold shadow-soft"
            >
              {displayName(lang)}
              <X className="w-3.5 h-3.5" />
            </motion.button>
          ))}
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('onboarding.placeholder.search_languages')}
          className="ps-10 h-12 rounded-input"
        />
      </div>

      <div className="space-y-1.5 max-h-[42vh] overflow-y-auto no-scrollbar momentum-scroll">
        {filtered.map((lang, i) => {
          const isSelected = selected.includes(lang);
          return (
            <motion.button
              key={lang}
              onClick={() => toggle(lang)}
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.3) }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center justify-between w-full px-4 py-3 rounded-card transition-colors ${
                isSelected ? 'bg-primary/5 border border-primary/30' : 'hover:bg-muted border border-transparent'
              }`}
            >
              <span className={`text-[14px] ${isSelected ? 'font-semibold text-primary' : 'font-medium'}`}>{displayName(lang)}</span>
              {isSelected ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                </motion.div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-border" />
              )}
            </motion.button>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">{t('onboarding.languages.no_results')}</p>
        )}
      </div>

      {error && <p className="text-[13px] text-destructive mt-4 text-center font-medium">{error}</p>}

      <div className="sticky bottom-4 mt-6">
        <Button className="w-full h-12 shadow-elevated" onClick={handleNext}>
          {selected.length > 0 ? t('onboarding.languages.continue_count', { count: selected.length }) : t('common.continue')}
        </Button>
      </div>
    </div>
  );
}