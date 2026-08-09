import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Send, Plus, ArrowLeft, Loader2, AlertCircle, Lock, Trash2, ShieldAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { useLocalization } from '@/lib/i18n/useLocalization';
import SuggestedPrompts from '@/components/concierge/SuggestedPrompts';
import ConciergeMessage from '@/components/concierge/ConciergeMessage';
import ConciergeConversationList from '@/components/concierge/ConciergeConversationList';

export default function Concierge() {
  const { user, member } = useAuth();
  const { isPremium, showUpgrade } = useMembershipAccess();
  const { t } = useLocalization();

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSlow, setLoadingSlow] = useState(false);
  const [error, setError] = useState(null);
  const [errorKind, setErrorKind] = useState(null);
  const [limitReached, setLimitReached] = useState(false);
  const [view, setView] = useState('landing'); // 'landing' | 'chat'
  const scrollRef = useRef(null);
  const slowTimerRef = useRef(null);

  const firstName = member?.first_name || member?.display_name?.split(' ')[0] || user?.full_name?.split(' ')[0] || '';

  // Load conversations on mount
  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    (async () => {
      try {
        const rows = await base44.entities.ConciergeConversation.filter(
          { user_id: String(user.id) }, '-updated_date', 20
        );
        if (active) setConversations(rows || []);
      } catch { /* ignore */ }
    })();
    return () => { active = false; };
  }, [user?.id]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConv?.id) { setMessages([]); return; }
    let active = true;
    (async () => {
      try {
        const rows = await base44.entities.ConciergeMessage.filter(
          { conversation_id: String(activeConv.id) }, 'created_date', 50
        );
        if (active) setMessages(rows || []);
      } catch { if (active) setMessages([]); }
    })();
    return () => { active = false; };
  }, [activeConv?.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }, [messages.length, loading]);

  const sendMessage = useCallback(async (text, isRetry = false) => {
    const trimmed = text.trim();
    if (!trimmed || loading || !user?.id) return;

    // Guard: don't create a conversation for a user without a Member profile
    // (nonexistent member). The backend independently enforces 18+ eligibility.
    if (!member?.id) {
      setError(t('concierge.error_eligibility'));
      setErrorKind('eligibility');
      return;
    }

    setError(null);
    setErrorKind(null);
    setLimitReached(false);

    // On retry, don't clear input or create a new user message
    if (!isRetry) setInput('');

    let convId = activeConv?.id;
    let conv = activeConv;

    // Create conversation if none active (only on first send, not retry)
    if (!convId && !isRetry) {
      try {
        conv = await base44.entities.ConciergeConversation.create({
          user_id: String(user.id),
          title: trimmed.slice(0, 60),
          last_message: trimmed,
          message_count: 1,
        });
        convId = conv.id;
        setActiveConv(conv);
        setView('chat');
        setConversations(prev => [conv, ...prev]);
      } catch {
        setError(t('concierge.error'));
        return;
      }
    }

    // Save user message only on first send (not retry)
    if (!isRetry) {
      try {
        const userMsg = await base44.entities.ConciergeMessage.create({
          conversation_id: convId,
          user_id: String(user.id),
          role: 'user',
          content: trimmed,
        });
        setMessages(prev => [...prev, userMsg]);
      } catch {
        setError(t('concierge.error'));
        return;
      }
    }

    // Call backend with client-side timeout
    setLoading(true);
    setLoadingSlow(false);
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    slowTimerRef.current = setTimeout(() => setLoadingSlow(true), 15000);

    try {
      const resp = await Promise.race([
        base44.functions.invoke('conciergeChat', {
          message: trimmed,
          conversation_id: convId,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('CLIENT_TIMEOUT')), 45000)
        ),
      ]);

      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      setLoadingSlow(false);

      // SDK returns raw Axios response — actual data is on .data
      const res = resp?.data || resp;

      if (res.error === 'limit_reached') {
        setLimitReached(true);
        setLoading(false);
        return;
      }

      if (res.code === 'eligibility_required') {
        setError(t('concierge.error_eligibility'));
        setErrorKind('eligibility');
        setLoading(false);
        return;
      }

      if (res.error || !res.ok) {
        setError(t('concierge.error_backend'));
        setErrorKind('backend');
        setLoading(false);
        return;
      }

      const response = res.response || {};
      const content = String(response.message || response.clarifying_question || '').trim();

      // CRITICAL: don't save empty assistant messages
      if (!content) {
        console.error('conciergeChat: empty response from backend', res);
        setError(t('concierge.error_backend'));
        setErrorKind('backend');
        setLoading(false);
        return;
      }

      const recData = JSON.stringify({
        recommendations: response.recommendations || [],
        experiences: response.experiences || [],
        circles: response.circles || [],
        people: response.people || [],
        inspirational: response.inspirational || [],
        itinerary: response.itinerary || null,
        clarifying_question: response.clarifying_question || null,
        category_availability: response.category_availability || null,
        inspirational_notice: response.inspirational_notice || null,
      });

      const assistantMsg = await base44.entities.ConciergeMessage.create({
        conversation_id: convId,
        user_id: String(user.id),
        role: 'assistant',
        content,
        recommendations: recData,
        is_itinerary: !!response.itinerary,
        is_clarifying: !!response.clarifying_question && !(response.circles?.length || response.experiences?.length || response.people?.length || response.inspirational?.length || response.itinerary),
      });

      setMessages(prev => [...prev, assistantMsg]);

      await base44.entities.ConciergeConversation.update(convId, {
        last_message: content.slice(0, 100),
        message_count: (messages.length + 2),
      }).catch(() => {});
    } catch (err) {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      setLoadingSlow(false);
      // SDK throws on non-2xx — extract the error body from err.response.data
      const errData = err?.response?.data || err;
      if (errData?.error === 'limit_reached') {
        setLimitReached(true);
      } else if (errData?.code === 'eligibility_required') {
        setError(t('concierge.error_eligibility'));
        setErrorKind('eligibility');
      } else if (err?.message === 'CLIENT_TIMEOUT') {
        setError(t('concierge.error_timeout'));
        setErrorKind('timeout');
      } else if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setError(t('concierge.error_offline'));
        setErrorKind('offline');
      } else {
        console.error('conciergeChat client error:', err);
        setError(t('concierge.error_backend'));
        setErrorKind('backend');
      }
    } finally {
      setLoading(false);
    }
  }, [activeConv, loading, user?.id, member?.id, messages.length, t]);

  const handleNewConversation = () => {
    setActiveConv(null);
    setMessages([]);
    setView('landing');
    setError(null);
    setLimitReached(false);
    setInput('');
  };

  const handleSelectConversation = (conv) => {
    setActiveConv(conv);
    setView('chat');
    setError(null);
    setLimitReached(false);
  };

  const handleDeleteConversation = async (conv) => {
    try {
      await base44.entities.ConciergeMessage.deleteMany({ conversation_id: conv.id });
      await base44.entities.ConciergeConversation.delete(conv.id);
      setConversations(prev => prev.filter(c => c.id !== conv.id));
      if (activeConv?.id === conv.id) handleNewConversation();
    } catch { /* ignore */ }
  };

  const handleRenameConversation = async (conv, newTitle) => {
    try {
      const updated = await base44.entities.ConciergeConversation.update(conv.id, { title: newTitle });
      setConversations(prev => prev.map(c => c.id === conv.id ? updated : c));
      if (activeConv?.id === conv.id) setActiveConv(updated);
    } catch { /* ignore */ }
  };

  const handleClearHistory = async () => {
    if (!confirm(t('concierge.clear_confirm'))) return;
    try {
      for (const conv of conversations) {
        await base44.entities.ConciergeMessage.deleteMany({ conversation_id: conv.id });
        await base44.entities.ConciergeConversation.delete(conv.id);
      }
      setConversations([]);
      handleNewConversation();
    } catch { /* ignore */ }
  };

  const greeting = firstName
    ? t('concierge.greeting', { name: firstName })
    : t('concierge.greeting_default');

  return (
    <div className="max-w-2xl mx-auto px-4 pt-[calc(1.25rem+max(env(safe-area-inset-top,0px),28px))] min-h-full flex flex-col">
      {/* Header */}
      {view === 'landing' ? (
        <div className="relative overflow-hidden rounded-[24px] bg-nmood-gradient p-6 shadow-elevated mb-6">
          <div className="pointer-events-none absolute -top-16 -right-10 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-12 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-md flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="font-heading text-lg font-bold text-white">{t('concierge.heading')}</h1>
            </div>
            <p className="text-sm text-white/85 font-light leading-relaxed mb-1">{greeting}</p>
            <p className="text-xs text-white/60 font-light">{t('concierge.placeholder')}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-4">
          <button onClick={handleNewConversation} className="p-2 rounded-xl hover:bg-muted transition-default">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="text-base font-semibold flex-1 truncate">{activeConv?.title || t('concierge.new_conversation')}</h1>
          <button onClick={handleNewConversation} className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-default">
            <Plus className="w-3.5 h-3.5" /> {t('concierge.new_conversation')}
          </button>
        </div>
      )}

      {/* Content area */}
      <div ref={scrollRef} className="flex-1 space-y-4 mb-4">
        {/* Landing: suggested prompts + recent conversations */}
        {view === 'landing' && !loading && (
          <>
            <SuggestedPrompts onSelect={sendMessage} />
            <ConciergeConversationList
              conversations={conversations}
              onSelect={handleSelectConversation}
              onDelete={handleDeleteConversation}
              onRename={handleRenameConversation}
            />
            {conversations.length > 0 && (
              <button onClick={handleClearHistory} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-default mt-4 mx-auto">
                <Trash2 className="w-3.5 h-3.5" /> {t('concierge.clear_history')}
              </button>
            )}
          </>
        )}

        {/* Chat messages */}
        {view === 'chat' && messages.map((msg) => (
          <ConciergeMessage key={msg.id} message={msg} conversationId={activeConv?.id} />
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-start gap-2.5 animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-nmood-gradient flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                {loadingSlow ? t('concierge.taking_longer') : t('concierge.generating')}
              </span>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.04] p-4 text-center">
            <AlertCircle className="w-5 h-5 text-destructive mx-auto mb-2" />
            <p className="text-sm text-foreground/80 mb-3">{error}</p>
            {errorKind && errorKind !== 'eligibility' && (
              <button
                onClick={() => {
                  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || input;
                  sendMessage(lastUserMsg, true);
                }}
                className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-default"
              >
                {t('concierge.retry')}
              </button>
            )}
          </div>
        )}

        {/* Limit reached state */}
        {limitReached && !loading && (
          <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-5 text-center">
            <Lock className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground mb-1">{t('concierge.limit_reached')}</p>
            <p className="text-xs text-muted-foreground mb-4">{t('concierge.limit_upgrade')}</p>
            <button onClick={() => showUpgrade('concierge')}
              className="rounded-full bg-nmood-cta text-primary-foreground px-5 py-2.5 text-sm font-semibold shadow-soft hover:shadow-elevated transition-default">
              {t('concierge.upgrade')}
            </button>
          </div>
        )}
      </div>

      {/* Input bar — always visible */}
      <div className="sticky bottom-0 bg-background/85 backdrop-blur-xl border-t border-border/50 pt-3 -mx-4 px-4 pb-3 z-30">
        <div className="flex items-center gap-2 max-[320px]:flex-col max-[320px]:items-stretch">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            placeholder="Tell me what you feel like doing…"
            rows={3}
            disabled={loading}
            className="flex-1 w-full min-h-[96px] max-h-[200px] resize-none rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed shadow-soft transition-default placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 disabled:opacity-50 no-scrollbar"
          />
          <button
            type="button"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-2xl bg-nmood-cta text-primary-foreground flex items-center justify-center shadow-soft hover:shadow-elevated transition-default disabled:opacity-40 disabled:pointer-events-none flex-shrink-0 max-[320px]:w-full max-[320px]:h-12"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}