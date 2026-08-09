import React, { useState } from 'react';
import { Search, Languages, Database } from 'lucide-react';
import { MCSection } from '@/components/mission-control/ui';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { IS_DEV } from '@/lib/runtime-env';

const LANG_FLAGS = { en: '🇬🇧', ar: '🇸🇦', es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪', it: '🇮🇹' };

/** AI-002 — Semantic concept registry + cross-language semantic search demo. */
export default function PiSemantic({ data, onSeed }) {
  const { t } = useLocalization();
  const d = data || {};
  const concepts = d.concepts || [];
  const [query, setQuery] = useState('قهوة');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSearch = async () => {
    setLoading(true);
    setResults(null);
    try {
      const r = await base44.functions.invoke('aiMemory', { mode: 'semanticSearch', query });
      setResults(r?.data || { matches: [] });
    } catch (_e) {
      setResults({ matches: [], error: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <MCSection icon={Search} title={t('mission.semantic_search_crosslanguage')}>
        <p className="text-xs text-muted-foreground mb-3">
          {t('mission.try_any_language_or_a')}
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && runSearch()} placeholder={t('mission.search_a_concept_in_any')} className="bg-card border rounded-lg text-sm px-3 py-2 flex-1" />
          <Button size="sm" onClick={runSearch} disabled={loading} className="gap-2"><Search className="w-4 h-4" /> {loading ? 'Searching…' : 'Resolve'}</Button>
          {IS_DEV && <Button size="sm" variant="outline" onClick={onSeed} className="gap-2"><Database className="w-4 h-4" /> {t('mission.seed_concepts')}</Button>}
        </div>
        {results && (
          <div className="mt-3 space-y-2">
            {results.error ? <p className="text-xs text-destructive">{t('mission.search_failed')}</p> : null}
            {(results.matches || []).length === 0 && !results.error && <p className="text-xs text-muted-foreground">{t('mission.no_concepts_matched')}</p>}
            {(results.matches || []).map((m) => (
              <div key={m.concept_id} className="rounded-lg border bg-card/60 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{m.label_en}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">score {m.score}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t('mission.resolved_to_concept')} <span className="font-mono">{m.concept_id}</span>
                  {m.matchedTerm && <span> {t('mission.via')} <span className="font-medium">{m.matchedTerm}</span> ({m.matchedLang})</span>}
                </p>
                {m.related?.length > 0 && <p className="text-[11px] text-muted-foreground/70 mt-1">related: {m.related.join(', ')}</p>}
              </div>
            ))}
          </div>
        )}
      </MCSection>

      <MCSection icon={Languages} title={`Semantic Concept Registry (${concepts.length})`}>
        <div className="overflow-auto max-h-[28rem] rounded-lg border">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 sticky top-0">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">{t('mission.concept')}</th>
                <th className="px-3 py-2 font-medium">{t('mission.category')}</th>
                <th className="px-3 py-2 font-medium">{t('mission.labels_multilingual')}</th>
                <th className="px-3 py-2 font-medium">{t('mission.synonyms')}</th>
              </tr>
            </thead>
            <tbody>
              {concepts.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2 font-mono font-medium">{c.concept_id}</td>
                  <td className="px-3 py-2 capitalize">{c.category}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(c.labels || {}).map(([lang, val]) => (
                        <span key={lang} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/60">
                          <span>{LANG_FLAGS[lang] || lang}</span>{val}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{(c.synonyms || []).join(', ')}</td>
                </tr>
              ))}
              {!concepts.length && <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">{t('mission.no_concepts_yet_click_seed')}</td></tr>}
            </tbody>
          </table>
        </div>
      </MCSection>
    </div>
  );
}