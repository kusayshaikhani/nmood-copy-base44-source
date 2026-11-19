import { MAIN_PASSPORT } from '@/lib/passport/enabled';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { notifyConversationRead } from '@/lib/unread-messages-store';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, MessageCircle } from 'lucide-react';
import { resolveReplyPreviews, openReferencedMessage } from '@/lib/message-replies';
import MessageEditDialog from '@/components/messaging/MessageEditDialog';
import ChatHeader from '@/components/messaging/ChatHeader';
import MessageBubble from '@/components/messaging/MessageBubble';
import ChatComposer from '@/components/messaging/ChatComposer';
import MessageOptionsSheet from '@/components/messaging/MessageOptionsSheet';
import { useAuth } from '@/lib/AuthContext';
import { feedback } from '@/lib/feedback';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { useSafety } from '@/lib/safety-store';
import ReportSheet from '@/components/safety/Phase1ReportSheet';
import { toast } from '@/components/ui/use-toast';
import { getMemberPresence } from '@/lib/member-presence';
import {
  deletePrivateChatAttachment,
  deletePrivateMessage,
  hidePrivateMessage,
  editPrivateMessage,
  getDirectMessageAccess,
  getOrCreatePrivateConversation,
  getPrivateChatPeer,
  getPrivateMessages,
  markPrivateConversationRead,
  sendPrivateMessage,
  setPrivateConversationTyping,
  uploadPrivateChatAttachment,
} from '@/api/supabaseClient';

export default function Chat() {
  const { t } = useLocalization();
  const { palId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { block, setConversationMuted, isConversationMuted } = useSafety();
  const [pal, setPal] = useState(null);
  const [palPresence, setPalPresence] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [messageAccess, setMessageAccess] = useState(null);
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [editing, setEditing] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [sending, setSending] = useState(false);
  const [muted, setMuted] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const icebreaker = new URLSearchParams(location.search).get('icebreaker') || '';
  const messagesEndRef = useRef(null);
  const lastTypingRef = useRef(0);

  const fmtTime = useCallback((iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }, []);

  const toBubble = useCallback((m, meId) => {
    const isMe = m.sender_id === meId;
    const payload = m.payload || {};
    let type = m.message_type || 'text';
    let content = m.body || '';
    if (type === 'shared_experience') type = 'activity_share';
    else if (type === 'shared_circle') type = 'circle_share';
    else if (type === 'shared_profile') type = 'profile_share';
    else if (type === 'shared_nmood') type = 'nmood_share';
    if (type === 'voice') content = { duration: m.body || '0s', url: payload.file_url || '' };
    else if (type === 'location') content = { name: payload.location_name || m.body || 'Location' };
    else if (type === 'photo' || type === 'gif') content = payload.file_url || m.body || '';
    else if (type === 'document') content = { name: payload.file_name || 'Document', size: m.body || '', url: payload.file_url || '' };
    else if (type === 'activity_share') content = { title: payload.shared_title || '', image: payload.shared_image || '', time: '', distance: payload.shared_meta || '' };
    else if (type === 'circle_share') content = { name: payload.shared_title || '', image: payload.shared_image || '', members: payload.shared_meta || '' };
    else if (type === 'profile_share') content = { name: payload.shared_title || '', avatar: payload.shared_image || '', bio: payload.shared_meta || '' };
    else if (type === 'nmood_share') content = { title: payload.shared_title || '', image: payload.shared_image || '', detail: payload.shared_meta || '' };
    return { id: m.id, created_at: m.created_at, unsent_at: m.unsent_at, protected: m.message_type === 'system' || m.payload?.system === true || !!m.payload?.system_event, reply_to_id: m.reply_to_id, reply_to_text: m.reply_to_text, reply_available: m.reply_available, edited_at: m.edited_at, sender: isMe ? 'me' : 'them', type, content, time: fmtTime(m.created_at), status: m.read_at ? 'read' : 'sent' };
  }, [fmtTime]);

  const loadMessages = useCallback(async () => {
    if (!conversation?.id) return;
    try {
      const recs = await getPrivateMessages(conversation.id);
      setMessages(resolveReplyPreviews(recs || [], 'body').map((m) => toBubble(m, user.id)));
    } catch { setMessages([]); }
  }, [conversation?.id, user?.id, toBubble]);

  const loadConversation = useCallback(async () => {
    if (!palId) return null;
    try {
      const row = await getOrCreatePrivateConversation(palId);
      if (row?.id) setConversation(row);
      return row;
    } catch { return null; }
  }, [palId]);

  const markRead = useCallback(async () => {
    if (!conversation?.id) return;
    try { await markPrivateConversationRead(conversation.id); await notifyConversationRead(); } catch { /* non-critical */ }
  }, [conversation?.id]);

  useEffect(() => {
    if (!user?.id || !palId) return;
    let active = true;
    (async () => {
      try {
        const access = await getDirectMessageAccess(palId);
        if (!active) return;
        setMessageAccess(access);
        // Do not attempt to open or create a conversation once either member
        // has blocked the other. The block direction controls the exact gate.
        if (access?.blocked) return;
        const member = await getPrivateChatPeer(palId);
        if (active) { setPal(member); setPalPresence(getMemberPresence(member)); }
        await loadConversation();
      } catch { if (active) setPal(null); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [user?.id, palId, loadConversation]);

  useEffect(() => {
    if (!conversation?.id) return undefined;
    const refresh = () => { loadMessages(); markRead(); loadConversation(); };
    refresh();
    // Automatic checks are deliberately gentle. Sending a message still calls
    // loadMessages immediately, but background polling never runs more often
    // than once every 45 seconds.
    const timer = window.setInterval(refresh, 45000);
    return () => window.clearInterval(timer);
  }, [conversation?.id, loadMessages, loadConversation, markRead]);

  useEffect(() => { if (conversation?.id) isConversationMuted('private', conversation.id).then(setMuted).catch(() => {}); }, [conversation?.id, isConversationMuted]);

  useEffect(() => {
    messagesEndRef.current && messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    if (!conversation?.typing_user_id || conversation.typing_user_id === user?.id) { setTyping(false); return; }
    const t = conversation.typing_at ? new Date(conversation.typing_at).getTime() : 0;
    setTyping(Date.now() - t < 5000);
  }, [conversation?.typing_user_id, conversation?.typing_at, user?.id]);

  const gateSend = async (payload) => {
    if (sending) return;
    setSending(true);
    try {
      await sendPrivateMessage(palId, payload);
      if (conversation?.id) await setPrivateConversationTyping(conversation.id, false).catch(() => {});
      await loadMessages();
      await loadConversation();
    } catch (error) {
      if (payload?.file_url?.startsWith('private/')) await deletePrivateChatAttachment(payload.file_url);
      feedback.error(error instanceof Error ? error : new Error(t('messaging.chat.send_failed')));
    } finally { setSending(false); }
  };

  const handleSend = (payload) => {
    if (!payload.reply_to_id) {
      payload.reply_to_id = replyTo?.id || '';
    }
    setReplyTo(null);
    gateSend(payload);
  };

  const handleTyping = (isTyping) => {
    const now = Date.now();
    if (isTyping && now - lastTypingRef.current < 3000) return;
    lastTypingRef.current = now;
    if (conversation?.id) setPrivateConversationTyping(conversation.id, isTyping).catch(() => {});
  };

  const handleReply = (msg) => { setReplyTo(msg); setSelectedMessage(null); };
  const handleCopy = (msg) => {
    if (typeof msg.content === 'string') { try { navigator.clipboard && navigator.clipboard.writeText(msg.content); } catch { /* clipboard unavailable */ } }
    setSelectedMessage(null);
  };
  const handleDelete = async (msg) => {
    if (!window.confirm('Unsend this message for everyone? A deleted placeholder will remain.')) return;
    try { await deletePrivateMessage(msg.id); await loadMessages(); } catch (error) { feedback.error(error); }
    setSelectedMessage(null);
  };
  const handleReport = (message) => { setSelectedMessage(null); setReportTarget({ type: 'message', id: message.id, name: 'Reported message', reportedMemberId: palId, evidence: { scope: 'private', container_id: conversation?.id } }); };
  const handleMute = async () => { try { const next = !muted; await setConversationMuted('private', conversation.id, next); setMuted(next); toast({ title: next ? 'Conversation muted' : 'Conversation unmuted', description: next ? 'Messages stay here, but notifications are suppressed.' : 'Notifications are enabled again.' }); } catch (error) { feedback.error(error); } };
  const handleBlock = async () => { try { await block({ id: palId }); toast({ title: 'Member blocked', description: 'New direct contact and discovery interactions are now blocked in both directions.' }); navigate('/messages'); } catch (error) { feedback.error(error); } };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pal) {
    const viewerBlockedMember = messageAccess?.viewer_blocked_member === true;
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold mb-1">{viewerBlockedMember ? 'You have blocked this member' : t('messaging.chat.gate_title')}</p>
        <p className="text-sm text-muted-foreground mb-4">{viewerBlockedMember ? 'Unblock this member in Safety Center before you can send a message.' : t('messaging.chat.gate_desc')}</p>
        <button onClick={() => navigate(viewerBlockedMember ? '/safety-center' : '/messages')} className="text-primary text-sm font-medium">{viewerBlockedMember ? 'Go to Safety Center' : t('messaging.chat.back')}</button>
      </div>
    );
  }

  const headerConversation = { name: pal.display_name, avatar: pal.photo_url, online: palPresence === 'Online', presence: palPresence, memberId: palId };

  return (
    <div className="flex flex-1 min-h-0 w-full flex-col max-w-2xl mx-auto">
      <ChatHeader conversation={headerConversation} muted={muted} onMute={handleMute} onBlock={handleBlock} />

      <div className="flex-1 min-h-0 overscroll-contain overflow-y-auto px-4 py-4 space-y-1.5">
        {messages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-8">{t('messaging.chat.empty', { name: pal.display_name?.split(' ')[0] || '' })}</p>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} onTap={setSelectedMessage} onOpenReply={openReferencedMessage} onAdminDeleted={loadMessages} />
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-3.5 py-2.5">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0.15s' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatComposer
        onSend={handleSend}
        initialText={icebreaker}
        uploadAttachment={(file) => uploadPrivateChatAttachment(conversation?.id, file)}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onTyping={handleTyping}
      />

      <MessageEditDialog message={editing} onClose={() => setEditing(null)} onSave={async (content) => { await editPrivateMessage(editing.id, content); await loadMessages(); }} />
      <ReportSheet open={!!reportTarget} onOpenChange={(open) => !open && setReportTarget(null)} target={reportTarget} />

      <MessageOptionsSheet
        message={selectedMessage}
        onClose={() => setSelectedMessage(null)}
        onReply={handleReply}
        onCopy={handleCopy}
        onDelete={handleDelete}
        onDeleteForMe={MAIN_PASSPORT ? async message => {
          setSelectedMessage(null);
          try { await hidePrivateMessage(message.id); await loadMessages(); }
          catch (error) { feedback.error(error); }
        } : undefined}
        onEdit={(message) => { setSelectedMessage(null); setEditing(message); }}
        onReport={handleReport}
      />
    </div>
  );
}
