import { adminListSupportThreads, canReadAdminSupport } from '@/lib/support-conversation';
import { listCircleConversations } from '@/api/groupChat';
import SwipeConversationRow from '@/components/messaging/SwipeConversationRow';
import {getSystemInboxMessages,hideSystemConversation,systemConversation} from '@/lib/system-communications';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConversationCard from '@/components/messaging/ConversationCard';
import MessagesEmpty from '@/components/messaging/MessagesEmpty';
import UpgradeMembershipCTA from '@/components/membership/UpgradeMembershipCTA';
import { useAuth } from '@/lib/AuthContext';
import { MAIN_PASSPORT } from '@/lib/passport/enabled';
import { getMyPrivateConversations, hidePrivateConversation } from '@/api/supabaseClient';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { relativeTime } from '@/lib/i18n/format';
import { refreshUnreadMessageCount } from '@/lib/unread-messages-store';

const TAB_KEYS = [
  { id: 'all', labelKey: 'messaging.tab.all' },
  { id: 'unread', labelKey: 'messaging.tab.unread' },
];

export default function Messages() {
  const { t, lang } = useLocalization();
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentUser = useRef(user?.id);
  currentUser.current = user?.id;
  const loadSequence=useRef(0);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removalError,setRemovalError]=useState('');
  const [removing,setRemoving]=useState(null);
  const [inboxErrors,setInboxErrors]=useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const load = useCallback(async () => {
    const request=++loadSequence.current;
    if (!user?.id) {setConversations([]);setLoading(false);return;}
    try {
      const results = await Promise.allSettled([getMyPrivateConversations(),listCircleConversations(),MAIN_PASSPORT?getSystemInboxMessages(user.id):Promise.resolve([]),canReadAdminSupport().then(allowed=>allowed?adminListSupportThreads():[])]);
      if (currentUser.current !== user.id || request !== loadSequence.current) return;
      const labels=['Private conversations','Circle conversations','Nmood updates','Support conversations'];
      setInboxErrors(results.flatMap((r,i)=>r.status==='rejected'?[labels[i]]:[]));
      const rows = results[0].status==='fulfilled'?results[0].value:[];
      if (currentUser.current !== user.id || request !== loadSequence.current) return;
      const seen = new Set();
      const mapped = (Array.isArray(rows) ? rows : [])
        .filter((c) => { if (seen.has(c.id)) return false; seen.add(c.id); return true; })
        .map((c) => {
          return {
            id: c.id, throughAt: c.last_message_at || c.updated_at || c.created_at,
            palId: c.peer_id,
            name: c.peer_deleted ? 'Deleted account' : (c.peer_name || 'Name unavailable'),
            avatar: c.peer_deleted ? '' : (c.peer_avatar || ''),
            lastMessage: c.last_message || '',
            timestamp: relativeTime(c.last_message_at || c.updated_at || c.created_at, lang, t),
            unread: Number(c.unread_count || 0),
            type: 'pal',
            online: false,
            muted: c.muted === true,
            pinned: false,
          };
        });
      const circles = results[1].status==='fulfilled'?results[1].value:[];
      for (const c of circles || []) mapped.push({id:`circle:${c.id}`,circleId:c.id,name:c.name||'Circle',avatar:c.avatar||'',lastMessage:c.last_message||'',throughAt:c.last_message_at,timestamp:relativeTime(c.last_message_at,lang,t),type:'circle',unread:0});
      const support=results[3].status==='fulfilled'?results[3].value:[];
      for(const thread of support || []) mapped.push({id:`support:${thread.id}`,threadId:thread.id,name:thread.member_name?.trim()||'Nmood member',avatar:thread.member_avatar||'',lastMessage:thread.last_message||thread.subject||'',throughAt:thread.updated_at,timestamp:relativeTime(thread.updated_at,lang,t),type:'support',unread:Number(thread.unread_count)||0});
      if(MAIN_PASSPORT){
        const system=systemConversation(results[2].status==='fulfilled'?results[2].value:[]);
        if(system.last)mapped.unshift({id:'nmood-admin',throughAt:system.last.created_at,palId:'nmood-admin',name:'Nmood Admin',avatar:'',lastMessage:system.last.body,timestamp:relativeTime(system.last.created_at,lang,t),unread:system.unread,messageIds:system.messages.map(m=>m.id),type:'system',online:false,muted:false,pinned:false});
      }
      if (currentUser.current !== user.id || request !== loadSequence.current) return;
      setConversations(mapped.sort((a,b)=>(Date.parse(b.throughAt)||0)-(Date.parse(a.throughAt)||0)));
      refreshUnreadMessageCount();
    } catch {
      if (currentUser.current !== user.id || request !== loadSequence.current) return;
      setConversations([]);setInboxErrors(['Conversations']);
    }
    setLoading(false);
  }, [user?.id, lang, t]);

  useEffect(() => {
    setConversations([]);setLoading(true);
    load();
    window.addEventListener('nmood:group-chat-changed',load);
    window.addEventListener('focus',load);
    window.addEventListener('nmood:support-changed',load);
    const poll=window.setInterval(()=>{if(!document.hidden)void load();},45000);
    window.addEventListener('nmood:feed-changed',load);
    return ()=>{window.clearInterval(poll);window.removeEventListener('nmood:support-changed',load);window.removeEventListener('nmood:group-chat-changed',load);window.removeEventListener('focus',load);window.removeEventListener('nmood:feed-changed',load);};
  }, [load]);

  const filtered = conversations
    .filter((c) => (activeTab === 'unread' ? c.unread > 0 : true))
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (c.name || '').toLowerCase().includes(q) || (c.lastMessage || '').toLowerCase().includes(q);
    });

  const removeFromInbox=async conv=>{
    if(removing)return;
    if(!window.confirm('Remove this conversation from your inbox only? Other members keep their messages. A new incoming message can bring it back.'))return;
    setRemoving(conv.id);setRemovalError('');
    try { if(conv.type==='system') await hideSystemConversation(user.id,conv.messageIds); else await hidePrivateConversation(conv.id,conv.throughAt);await load(); }
    catch { setRemovalError('Could not delete the conversation. Reconnect and try again.'); }
    finally {setRemoving(null);}
  };
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
                    aria-pressed={isActive}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 h-9 px-4 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95 ${
                      isActive
                        ? 'bg-white text-primary shadow-sm shadow-primary/20 dark:bg-nmood-gradient dark:text-white dark:ring-1 dark:ring-white/40'
                        : 'bg-white/15 backdrop-blur-md border border-white/25 text-white/85 dark:text-white'
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
        <div className="relative -mt-6 nmood-shell px-4 pt-5 pb-28 dark:bg-nmood-gradient dark:text-white dark:[&_.text-muted-foreground]:text-white dark:[&_.text-primary]:text-white dark:[&_svg]:text-white">
          {removalError&&<p role="alert">{removalError}</p>}
          {inboxErrors.length>0&&<p role="alert">{inboxErrors.join(', ')} could not be loaded. Your other conversations are still available. <button className="min-h-11 underline" onClick={()=>void load()}>Retry</button></p>}
          <UpgradeMembershipCTA source="messages" className="mb-4" />
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-16">
              <Loader2 className="w-4 h-4 animate-spin" /> {t('messaging.loading')}
            </div>
          ) : filtered.length === 0 ? (
            <MessagesEmpty />
          ) : (
            <div className="space-y-1">
              {filtered.map((conv) => (
                <SwipeConversationRow key={conv.id} name={conv.name} eligible={MAIN_PASSPORT && !['circle','support'].includes(conv.type)} removeLabel={conv.type==='system'?'Remove':'Delete'} disabled={!!removing} onRemove={()=>void removeFromInbox(conv)}><ConversationCard conversation={conv} onClick={() => navigate(conv.type==='support'?`/messages/support/${encodeURIComponent(conv.threadId)}`:conv.type==='circle'?`/circle/${encodeURIComponent(conv.circleId)}?tab=chat`:'/messages/' + conv.palId)} />
                </SwipeConversationRow>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
