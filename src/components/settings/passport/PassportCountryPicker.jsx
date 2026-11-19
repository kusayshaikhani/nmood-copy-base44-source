import React, { useState } from 'react';
import { Check, ChevronRight, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { COUNTRIES } from '@/lib/master-data';

export default function PassportCountryPicker({ country, disabled, descriptionId, busy, error, onSelect }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = COUNTRIES.find(c => c.iso2 === country);
  const needle = query.trim().toLocaleLowerCase();
  const choices = COUNTRIES.filter(c => [c.name, c.native, c.iso2].some(value => value?.toLocaleLowerCase().includes(needle)));
  return <Dialog open={open && (!disabled || busy)} onOpenChange={value => { setOpen(value); setQuery(''); }}>
    <DialogTrigger asChild>
      <button type="button" disabled={disabled} aria-label="Destination country" aria-describedby={descriptionId}
        className="flex min-h-20 w-full items-center gap-3 rounded-2xl border border-border bg-background p-4 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:border-border/50 disabled:bg-muted/40 disabled:text-muted-foreground disabled:hover:border-border/50">
        {selected?.flag && <span aria-hidden="true" className={`text-2xl ${disabled ? 'opacity-50 grayscale' : ''}`}>{selected.flag}</span>}
        <span className="min-w-0 flex-1"><span className="block text-sm font-medium">Destination country</span><span className={`mt-1 block break-words text-sm leading-relaxed ${disabled ? '' : 'text-primary'}`}>{selected?.name || 'Choose a country'}</span></span>
        <ChevronRight aria-hidden="true" className={`h-5 w-5 shrink-0 ${disabled ? 'opacity-30' : 'text-primary'}`}/>
      </button>
    </DialogTrigger>
    <DialogContent className="bottom-0 top-auto flex max-h-[85dvh] translate-y-0 flex-col gap-4 rounded-t-3xl px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-3xl [&>button]:h-11 [&>button]:w-11">
      <DialogTitle className="pr-12 text-lg">Choose a destination</DialogTitle>
      <DialogDescription className="pr-8 text-sm leading-relaxed">Explore one country at a time. Your home country stays unchanged.</DialogDescription>
      <label className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 focus-within:ring-2 focus-within:ring-ring">
        <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground"/>
        <input type="search" aria-label="Search countries" autoComplete="off" value={query} onChange={e => setQuery(e.target.value)} className="min-h-12 w-full min-w-0 bg-transparent text-base outline-none" placeholder="Search countries"/>
      </label>
      {busy && <p role="status" className="text-sm text-muted-foreground">Saving destination…</p>}
      {error && <p role="alert" className="text-sm leading-relaxed text-destructive">{error}</p>}
      <p role="status" className="sr-only">{choices.length} countries found</p>
      <div className="min-h-0 overflow-y-auto overscroll-contain">
        <ul aria-label="Countries" className="space-y-1">
          {choices.map(c => <li key={c.iso2}><button type="button" disabled={disabled} aria-pressed={country === c.iso2} onClick={async () => { if (await onSelect(c.iso2)) setOpen(false); }}
            className="flex min-h-14 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring aria-pressed:bg-primary/10 aria-pressed:text-primary">
            <span aria-hidden="true" className="shrink-0 text-xl">{c.flag}</span><span className="min-w-0 flex-1 break-words">{c.name}</span>{country === c.iso2 && <Check aria-hidden="true" className="h-5 w-5 shrink-0"/>}
          </button></li>)}
        </ul>
        {!choices.length && <p className="px-3 py-8 text-center text-sm leading-relaxed text-muted-foreground">No countries found. Try another name or country code.</p>}
      </div>
    </DialogContent>
  </Dialog>;
}
