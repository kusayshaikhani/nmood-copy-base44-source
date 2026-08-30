import React, { useState } from 'react';
import { MessageCircle, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { askNmoodAssistant, NmoodAssistantUnavailableError } from '@/lib/nmood-assistant';

const suggestions = [
  'Help me find people with shared interests',
  'Suggest something social to do today',
  'How can I get more from Nmood?',
];

export default function IndependentNmood() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error | unavailable
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [lastMessage, setLastMessage] = useState('');

  const send = async (value) => {
    const message = value.trim();
    if (!message || status === 'loading') return;
    setLastMessage(message);
    setText('');
    setStatus('loading');
    setError('');
    try {
      const answer = await askNmoodAssistant(message);
      setReply(answer);
      setStatus('success');
    } catch (err) {
      if (err instanceof NmoodAssistantUnavailableError) {
        setStatus('unavailable');
      } else {
        setError(err?.message || 'Nmood assistant could not respond. Please try again.');
        setStatus('error');
      }
    }
  };

  const retry = () => { if (lastMessage) send(lastMessage); };

  return (
    <div className="min-h-full bg-background px-4 pt-8 pb-28">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-[28px] bg-nmood-gradient p-6 text-white shadow-elevated">
          <div className="flex items-center gap-3"><Sparkles className="h-6 w-6" /><h1 className="text-2xl font-bold">Nmood</h1></div>
          <p className="mt-3 text-sm leading-relaxed text-white/80">Your private guide for meeting people, joining circles, and making plans.</p>

          {status === 'loading' && (
            <div className="mt-5 flex items-center gap-2 rounded-2xl bg-white/15 p-4 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
            </div>
          )}

          {status === 'success' && (
            <div className="mt-5 rounded-2xl bg-white/15 p-4 text-sm">{reply}</div>
          )}

          {status === 'unavailable' && (
            <div className="mt-5 rounded-2xl bg-white/15 p-4 text-sm flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>Nmood assistant is not available yet. We&rsquo;re working on it — check back soon.</span>
            </div>
          )}

          {status === 'error' && (
            <div className="mt-5 rounded-2xl bg-white/15 p-4 text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              <button type="button" onClick={retry} className="mt-3 rounded-full border border-white/30 px-3 py-1.5 text-xs font-medium hover:bg-white/10">
                Retry
              </button>
            </div>
          )}

          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            {suggestions.map((item) => <button key={item} onClick={() => send(item)} disabled={status === 'loading'} className="rounded-2xl border border-white/20 bg-white/10 px-3 py-3 text-left text-xs font-medium transition hover:bg-white/20 disabled:opacity-50">{item}</button>)}
          </div>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); send(text); }} className="mt-5 flex gap-2">
          <input value={text} onChange={(event) => setText(event.target.value)} disabled={status === 'loading'} placeholder="Ask Nmood anything…" className="h-12 flex-1 rounded-2xl border border-border bg-card px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50" />
          <button type="submit" aria-label="Send" disabled={status === 'loading'} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground disabled:opacity-50">
            {status === 'loading' ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageCircle className="h-5 w-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
