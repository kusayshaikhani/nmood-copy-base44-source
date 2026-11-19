import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';
import { LOOKING_FOR_TAGS, lookingForTagLabel, normalizeLookingForTags } from '@/lib/looking-for-tags';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * Compact multi-select combobox for "What are you looking for?" tags.
 * Shows selected items as small removable chips; opens a dropdown panel
 * with searchable checkbox list. Not a permanent chip wall — collapsed
 * by default, expands on tap.
 */
export default function LookingForTagsSelect({ value = [], onChange, maxSelection = 5 }) {
  const { t } = useLocalization();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const popupId = useId();
  const selected = normalizeLookingForTags(value);

  const toggle = (tag) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((s) => s !== tag));
    } else if (selected.length < maxSelection) {
      onChange([...selected, tag]);
    }
  };

  const remove = (tag) => {
    onChange(selected.filter((s) => s !== tag));
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [open]);

  const filtered = LOOKING_FOR_TAGS.filter((tag) => {
    if (!query) return true;
    return lookingForTagLabel(t, tag).toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div ref={containerRef} className="relative" onKeyDown={event=>{if(event.key==='Escape'){setOpen(false);setQuery('');containerRef.current?.querySelector('[aria-expanded]')?.focus();}}}>
      <div role="group" aria-label={t('profile.public.looking_for_title')} className="w-full min-h-12 flex flex-wrap items-center gap-2 px-3 py-2 rounded-input border border-border bg-card"
        onClick={event=>{if(event.target===event.currentTarget)setOpen(o=>!o);}}>
        {selected.map(tag=><button key={tag} type="button" aria-label={`Remove ${lookingForTagLabel(t, tag)}`} onClick={()=>remove(tag)}
          className="min-h-11 max-w-full flex items-center gap-2 px-3 rounded-full bg-primary/10 text-primary text-sm">
          <span className="break-words text-left">{lookingForTagLabel(t, tag)}</span><X className="w-3 h-3 shrink-0"/>
        </button>)}
        <button type="button" onClick={()=>setOpen(o=>!o)} aria-expanded={open} aria-controls={popupId} aria-haspopup="dialog" aria-label={t('profile.edit.looking_for_placeholder')}
          className="flex-1 min-h-11 min-w-11 flex items-center justify-between gap-2 text-sm text-muted-foreground rounded focus-visible:ring-2 focus-visible:ring-ring">
          {!selected.length && <span>{t('profile.edit.looking_for_placeholder')}</span>}
          <ChevronDown className={`ml-auto w-4 h-4 shrink-0 ${open?'rotate-180':''}`}/>
        </button>
      </div>

      {/* Dropdown panel */}
      {open && (
        <div id={popupId} role="dialog" aria-label={t('profile.edit.looking_for_placeholder')} className="absolute z-50 mt-1.5 w-full rounded-xl border border-border bg-popover shadow-elevated max-h-72 flex flex-col">
          {/* Search input */}
          <div className="p-2 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('common.search')}
                className="w-full h-9 pl-8 pr-3 rounded-lg bg-muted/50 text-sm outline-none border border-transparent focus:border-primary/30 focus:bg-card transition-default"
              />
            </div>
          </div>
          {/* Options list */}
          <div className="overflow-y-auto no-scrollbar flex-1 py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground text-center">{t('common.no_results')}</p>
            ) : (
              filtered.map((tag) => {
                const isSelected = selected.includes(tag);
                const disabled = !isSelected && selected.length >= maxSelection;
                return (
                  <button
                    key={tag}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggle(tag)}
                    className="flex items-center justify-between w-full px-3 py-2.5 text-sm transition-default hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed text-left min-h-[44px]"
                  >
                    <span className={isSelected ? 'font-semibold text-primary' : 'font-medium'}>
                      {lookingForTagLabel(t, tag)}
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
          {selected.length >= maxSelection && (
            <div className="px-3 py-2 border-t border-border/50 text-xs text-muted-foreground text-center">
              {t('profile.edit.looking_for_max', { max: maxSelection })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}