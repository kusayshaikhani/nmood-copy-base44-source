import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, MessageCircle } from 'lucide-react';
import ChatHeader from '@/components/messaging/ChatHeader';
import MessageBubble from '@/components/messaging/MessageBubble';
import ChatComposer from '@/components/messaging/ChatComposer';
import MessageOptionsSheet from '@/components/messaging/MessageOptionsSheet';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { feedback } from '@/lib/feedback';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function Chat() {
  const { t, lang } = useLocalization();
  const { palId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pal, setPal] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const lastTypingRef = useRef(0);
  const pairKey = user?.id && palId ? [String(user.id), String(palId)].sort().join(':') : '';

  const fmtTime = useCallback((iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }, []);

  const toBubble = useCallback((m, meId) => {
    const isMe = m.sender_id === meId;
    let type = m.type || 'text';
    let content = m.content || '';
    if (type === 'shared_experience') type = 'activity_share';
    else if (type === 'shared_circle') type = 'circle_share';
    else if (type === 'shared_profile') type = 'profile_share';
    if (type === 'voice') content = { duration: m.content || '0s', url: m.file_url || '' };
    else if (type === 'location') content = { name: m.location_name || m.content || 'Location' };
    else if (type === 'photo') content = m.file_url || m.content || '';
    else if (type === 'gif') content = m.file_url || m.content || '';
    else if (type === 'document') content = { name: m.file_name || 'Document', size: m.content || '', url: m.file_url || '' };
    else if (type === 'activity_share') content = { title: m.shared_title || '', image: m.shared_image || '', time: '', distance: m.shared_meta || '' };
    else if (type === 'circle_share') content = { name: m.shared_title || '', image: m.shared_image || '', members: m.shared_meta || '' };
    else if (type === 'profile_share') content = { name: m.shared_title || '', avatar: m.shared_image || '', bio: m.shared_meta || '' };
    return {
      id: m.id,
      sender: isMe ? 'me' : 'them',
      type,
      content,
      time: fmtTime(m.created_date),
      status: m.delivery_status === 'read' ? 'read' : 'sent',
    };
  }, [fmtTime]);

  const loadMessages = useCallback(async () => {
    if (!pairKey) return;
    try {
      const recs = await base44.entities.PrivateMessage.filter({ pair_key: pairKey }, 'created_date', 500);
      setMessages((recs || []).map((m) => toBubble(m, user.id)));
    } catch {
      setMessages([]);
    }
  }, [pairKey, user?.id, toBubble]);

  const loadConversation = useCallback(async () => {
    if (!pairKey) return;
    try {
      const rows = await base44.entities.PrivateConversation.filter({ pair_key: pairKey });
      if (rows && rows[0]) setConversation(rows[0]);
    } catch { /* may not exist yet */ }
  }, [pairKey]);

  const markRead = useCallback(async () => {
    if (!pairKey) return;
    try { await base44.functions.invoke('authorizationGate', { action: 'markConversationRead', pairKey }); } catch { /* non-critical */ }
  }, [pairKey]);

  useEffect(() => {
    if (!user?.id || !palId) return;
    let active = true;
    (async () => {
      try {
        const rows = await base44.entities.PalConnection.filter({ user_id: user.id, pal_user_id: palId, is_active: true });
        if (active && rows && rows[0]) setPal(rows[0]);
      } catch { /* not a pal */ }
      if (active) setLoading(false);
      await loadMessages();
      await loadConversation();
      await markRead();
    })();
    let unsub = null, unsubConv = null;
    try { unsub = base44.entities.PrivateMessage.subscribe((ev) => { if (ev?.data?.pair_key === pairKey) { loadMessages(); markRead(); } }); } catch { /* realtime optional */ }
    try { unsubConv = base44.entities.PrivateConversation.subscribe((ev) => { if (ev?.data?.pair_key === pairKey) setConversation(ev.data); }); } catch { /* realtime optional */ }
    return () => { active = false; if (typeof unsub === 'function') unsub(); if (typeof unsubConv === 'function') unsubConv(); };
  }, [user?.id, palId, pairKey, loadMessages, loadConversation, markRead]);

  useEffect(() => {
    messagesEndRef.current && messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!conversation?.typing_user_id || conversation.typing_user_id === user?.id) { setTyping(false); return; }
    const t = conversation.typing_at ? new Date(conversation.typing_at).getTime() : 0;
    setTyping(Date.now() - t < 5000);
  }, [conversation?.typing_user_id, conversation?.typing_at, user?.id]);

  const gateSend = async (payload) => {
    if (sending) return;
    setSending(true);
    try {
      const resp = await base44.functions.invoke('authorizationGate', {
        action: 'sendMessage', scope: 'private', targetUserId: palId,
        senderName: user.full_name, receiverName: pal?.pal_name || '',
        payload,
      });
      const res = resp?.data || resp;
      if (res && res.ok) {
        try { await base44.functions.invoke('authorizationGate', { action: 'setTyping', pairKey, typing: false }); } catch { /* ignore */ }
        loadMessages();
        loadConversation();
      } else if (res && res.message) {
        feedback.message(t('messaging.chat.send_failed'), res.message);
      } else {
        feedback.error(new Error(t('messaging.chat.send_failed')));
      }
    } catch (e) {
      feedback.error(e);
    }
    setSending(false);
  };

  const handleSend = (payload) => {
    if (!payload.reply_to_id) {
      payload.reply_to_id = replyTo?.id || '';
      payload.reply_to_text = typeof replyTo?.content === 'string' ? replyTo.content : '';
    }
    setReplyTo(null);
    gateSend(payload);
  };

  const handleTyping = (isTyping) => {
    const now = Date.now();
    if (isTyping && now - lastTypingRef.current < 3000) return;
    lastTypingRef.current = now;
    try { base44.functions.invoke('authorizationGate', { action: 'setTyping', pairKey, typing: isTyping }); } catch { /* ignore */ }
  };

  const handleReply = (msg) => { setReplyTo(msg); setSelectedMessage(null); };
  const handleCopy = (msg) => {
    if (typeof msg.content === 'string') { try { navigator.clipboard && navigator.clipboard.writeText(msg.content); } catch { /* clipboard unavailable */ } }
    setSelectedMessage(null);
  };
  const handleDelete = async (msg) => {
    try { await base44.entities.PrivateMessage.delete(msg.id); setMessages((prev) => prev.filter((m) => m.id !== msg.id)); } catch { /* ignore */ }
    setSelectedMessage(null);
  };
  const handleReport = () => { setSelectedMessage(null); navigate('/safety-center'); };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pal) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold mb-1">{t('messaging.chat.gate_title')}</p>
        <p className="text-sm text-muted-foreground mb-4">{t('messaging.chat.gate_desc')}</p>
        <button onClick={() => navigate('/messages')} className="text-primary text-sm font-medium">{t('messaging.chat.back')}</button>
      </div>
    );
  }

  const headerConversation = { name: pal.pal_name, avatar: pal.pal_avatar, online: false };

  return (
    <div className="flex flex-col h-[calc(100dvh-7.5rem)] lg:h-[calc(100dvh-4.5rem)] max-w-2xl mx-auto">
      <ChatHeader conversation={headerConversation} />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5">
        {messages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-8">{t('messaging.chat.empty', { name: pal.pal_name?.split(' ')[0] || '' })}</p>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} onTap={setSelectedMessage} />
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
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        onTyping={handleTyping}
      />

      <MessageOptionsSheet
        message={selectedMessage}
        onClose={() => setSelectedMessage(null)}
        onReply={handleReply}
        onCopy={handleCopy}
        onDelete={handleDelete}
        onReport={handleReport}
      />
    </div>
  );
}