import React from 'react';
import { Loader2 } from 'lucide-react';

export default function AIAnswerState({ loading, answer, error, searchedWeb }) {
  if (loading) return <div role="status" aria-live="polite" className="mb-6 rounded-[20px] border border-border/40 bg-card p-4 shadow-card"><div className="flex items-center gap-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-primary" />Nmood AI is preparing an answer…</div></div>;
  if (error) return <div role="alert" className="mb-6 rounded-[20px] border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"><p className="font-semibold">No AI answer was generated</p><p className="mt-1 leading-relaxed">{error}</p></div>;
  if (!answer) return null;
  return <div aria-live="polite" className="mb-6 rounded-[20px] border border-primary/20 bg-card p-4 shadow-card"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Nmood AI answer</p><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{answer}</p><p className="mt-3 text-[11px] text-muted-foreground">{searchedWeb ? 'Live web search was used for this answer.' : 'This answer did not use live web search.'}</p></div>;
}
