import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConversationCard from '@/components/messaging/ConversationCard';
import MessagesEmpty from '@/components/messaging/MessagesEmpty';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { relativeTime } from '@/lib/i18n/format';
import { resolveMemberNames } from '@/lib/member-names';

const TAB_KEYS = [
  { id: 'all', labelKey: 'messaging.tab.all' },
  { id: 'unread', labelKey: 'messaging.tab.unread' },
];

export default function Messages() {
  const { t, lang } = useLocalization();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [asA, asB] = await Promise.all([
        base44.entities.PrivateConversation.filter({ participant_a_id: user.id }, '-last_message_at', 200).catch(() => []),
        base44.entities.PrivateConversation.filter({ participant_b_id: user.id }, '-last_message_at', 200).catch(() => []),
      ]);
      const seen = new Set();
      const mapped = [...(asA || []), ...(asB || [])]
        .filter((c) => { if (seen.has(c.id)) return false; seen.add(c.id); return true; })
        .map((c) => {
          const isA = c.participant_a_id === user.id;
          return {
            id: c.id,
            palId: isA ? c.participant_b_id : c.participant_a_id,
            name: (isA ? c.participant_b_name : c.participant_a_name) || 'Pal',
            avatar: isA ? c.participant_b_avatar : c.participant_a_avatar,
            lastMessage: c.last_message || '',
            timestamp: relativeTime(c.last_message_at || c.updated_date, lang, t),
            unread: isA ? (c.unread_a || 0) : (c.unread_b || 0),
            type: 'pal',
            online: false,
            muted: false,
            pinned: false,
          };
        });
      const userIds = mapped.map((c) => c.palId).filter(Boolean);
      const names = await resolveMemberNames({ userIds });
      setConversations(mapped.map((c) => ({ ...c, name: names[c.palId] || 'Member' })));
    } catch {
      setConversations([]);
    }
    setLoading(false);
  }, [user?.id, lang, t]);

  useEffect(() => {
    load();
    let unsub = null;
    try { unsub = base44.entities.PrivateConversation.subscribe(() => load()); } catch { /* realtime optional */ }
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [load]);

  const filtered = conversations
    .filter((c) => (activeTab === 'unread' ? c.unread > 0 : true))
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (c.name || '').toLowerCase().includes(q) || (c.lastMessage || '').toLowerCase().includes(q);
    });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto w-full">
        {/* Gradient hero — title, frosted search, glassy tabs.
            Rounded top corners give the header a finished card edge that
            transitions cleanly into the rounded white shell below. */}
        <div className="relative bg-nmood-gradient px-4 pt-[calc(3.5rem+env(safe-area-inset-top))] pb-8 rounded-t-[28px] overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="nmood-glow -top-16 -right-12 w-48 h-48 bg-white/20" />
            <div className="nmood-glow top-12 -left-16 w-44 h-44 bg-indigo-300/30" />
          </div>
          <div className="relative">
            <h1 className="text-2xl font-bold text-white">{t('messaging.title')}</h1>
            <div className="relative mt-5">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('messaging.search_placeholder')}
                className="w-full h-14 ps-12 pe-10 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/30 text-sm font-medium text-white placeholder:text-white/70 focus:outline-none focus:border-white/60 focus:ring-2 focus:ring-white/25 transition-[border-color,box-shadow] duration-200"
              />
              {search && (
                <button onClick={() => setSearch('')} aria-label={t('messaging.aria.clear_search')} className="absolute end-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                  <X className="w-4 h-4 text-white/80" />
                </button>
              )}
            </div>
            <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar -mx-4 px-4 momentum-scroll">
              {TAB_KEYS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 h-9 px-4 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95 ${
                      isActive
                        ? 'bg-white text-primary shadow-sm shadow-primary/20'
                        : 'bg-white/15 backdrop-blur-md border border-white/25 text-white/85'
                    }`}
                  >
                    {t(tab.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* White content shell */}
        <div className="relative -mt-6 nmood-shell px-4 pt-5 pb-28">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-16">
              <Loader2 className="w-4 h-4 animate-spin" /> {t('messaging.loading')}
            </div>
          ) : filtered.length === 0 ? (
            <MessagesEmpty />
          ) : (
            <div className="space-y-1">
              {filtered.map((conv) => (
                <ConversationCard key={conv.id} conversation={conv} onClick={() => navigate('/messages/' + conv.palId)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}