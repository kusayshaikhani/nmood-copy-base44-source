import React, { useState } from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';

const suggestions = [
  'Help me find people with shared interests',
  'Suggest something social to do today',
  'How can I get more from Nmood?',
];

export default function IndependentNmood() {
  const [text, setText] = useState('');
  const [sent, setSent] = useState('');

  const send = (value) => {
    const message = value.trim();
    if (!message) return;
    setSent(message);
    setText('');
  };

  return (
    <div className="min-h-full bg-background px-4 pt-8 pb-28">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-[28px] bg-nmood-gradient p-6 text-white shadow-elevated">
          <div className="flex items-center gap-3"><Sparkles className="h-6 w-6" /><h1 className="text-2xl font-bold">Nmood</h1></div>
          <p className="mt-3 text-sm leading-relaxed text-white/80">Your private guide for meeting people, joining circles, and making plans.</p>
          {sent && <div className="mt-5 rounded-2xl bg-white/15 p-4 text-sm">Thanks — Nmood received: “{sent}”</div>}
          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            {suggestions.map((item) => <button key={item} onClick={() => send(item)} className="rounded-2xl border border-white/20 bg-white/10 px-3 py-3 text-left text-xs font-medium transition hover:bg-white/20">{item}</button>)}
          </div>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); send(text); }} className="mt-5 flex gap-2">
          <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Ask Nmood anything…" className="h-12 flex-1 rounded-2xl border border-border bg-card px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          <button aria-label="Send" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><MessageCircle className="h-5 w-5" /></button>
        </form>
      </div>
    </div>
  );
}
