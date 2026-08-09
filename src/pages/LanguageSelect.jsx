import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Search, Loader2 } from 'lucide-react';
import { LANGUAGES, detectDeviceLanguage, markLanguageChosen } from '@/lib/i18n/languages';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * LOC-001 — First-launch language selection. Shown once before onboarding for
 * new members (gated by the "has chosen" flag). Pre-selects the device language
 * when supported, allows search by native/English name or alias, and persists
 * the choice (device + cloud) on continue.
 */
export default function LanguageSelect() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { lang, setLang, t } = useLocalization();
  const [selected, setSelected] = useState(() => lang || detectDeviceLanguage() || 'en');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LANGUAGES;
    return LANGUAGES.filter((l) =>
      l.nativeName.toLowerCase().includes(q) ||
      l.englishName.toLowerCase().includes(q) ||
      l.code.includes(q) ||
      l.aliases.some((a) => a.includes(q))
    );
  }, [query]);

  const handleContinue = async () => {
    setLoading(true);
    try {
      await setLang(selected);
      markLanguageChosen();
      const next = params.get('from') || '/onboarding';
      navigate(next, { replace: true });
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col px-5 pt-12 pb-6 max-w-md mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{t('language_select.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('language_select.subtitle')}</p>
        </div>

        <div className="relative mb-4">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('language_select.search_placeholder')}
            className="w-full h-11 pl-9 pr-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex-1 overflow-y-auto -mx-1 px-1 space-y-1 pb-2">
          {filtered.map((l) => {
            const active = l.code === selected;
            return (
              <button
                key={l.code}
                onClick={() => setSelected(l.code)}
                type="button"
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-default text-left ${
                  active ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                }`}
              >
                <span className="text-2xl flex-shrink-0">{l.flag}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{l.nativeName}</p>
                  <p className="text-xs text-muted-foreground">{l.englishName}</p>
                </div>
                {active && <Check className="w-5 h-5 text-primary flex-shrink-0" />}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">{t('language_select.no_results')}</p>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center my-4">{t('language_select.helper')}</p>
        <button
          onClick={handleContinue}
          type="button"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-default disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {t('common.continue')}
        </button>
      </div>
    </div>
  );
}