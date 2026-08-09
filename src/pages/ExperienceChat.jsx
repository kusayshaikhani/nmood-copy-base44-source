import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Mic, Camera, Star, UserPlus, Image as ImageIcon, Pin, Square, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { trackMembershipEvent, MEMBERSHIP_EVENTS } from '@/lib/membership-analytics';
import { getCountdown } from '@/lib/discover-engine';
import { toExperienceView, isChatReadOnly } from '@/lib/experience-utils';
import ExperienceChatHeader from '@/components/experience-chat/ExperienceChatHeader';
import SystemCard from '@/components/experience-chat/SystemCard';
import AnnouncementCard from '@/components/experience-chat/AnnouncementCard';
import QuickActionsBar from '@/components/experience-chat/QuickActionsBar';
import SharedMomentsStrip from '@/components/experience-chat/SharedMomentsStrip';
import ChatInfoSheet from '@/components/experience-chat/ChatInfoSheet';
import TypingIndicator from '@/components/experience-chat/TypingIndicator';
import ChatMessageBubble from '@/components/experience-chat/ChatMessageBubble';
import { feedback } from '@/lib/feedback';
import InvitePalsSheet from '@/components/invite/InvitePalsSheet';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function ExperienceChat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium, showUpgrade } = useMembershipAccess();
  const { t } = useLocalization();
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [entity, setEntity] = useState(null);
  const [messages, setMessages] = useState([]);
  const [moments, setMoments] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [typing, setTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const experience = entity ? toExperienceView(entity) : null;
  const myName = user?.full_name || 'You';
  const isHost = entity ? (entity.host_user_id === user?.id) : false;

  // Load real entity (for host + status) + verify the user is Going (chat access).
  useEffect(() => {
    let active = true;
    (async () => {
      let rec = null;
      try {
        rec = await base44.entities.Experience.get(id);
        if (active && rec && rec.id) setEntity(rec);
      } catch { /* mock experience */ }
      try {
        const records = await base44.entities.Attendance.filter({ experience_id: id });
        if (!active) return;
        const mine = (records || []).find((r) => r.member_user_id === user?.id);
        if (!mine || mine.status !== 'going') {
          setAccessDenied(true);
          setLoading(false);
          return;
        }
        const going = (records || []).filter((r) => r.status === 'going');
        const hostName = rec?.host_name || 'Host';
        const hostAvatar = rec?.host_avatar || '';
        const parts = [{ name: hostName, avatar: hostAvatar, isOrganizer: true }];
        going.forEach((r) => {
          if (r.member_user_id !== user?.id && r.member_name) parts.push({ name: r.member_name, avatar: r.member_avatar, isOrganizer: false });
        });
        setParticipants(parts);
        const msgs = await base44.entities.ChatMessage.filter({ experience_id: id }, '-created_date', 50);
        if (!active) return;
        setMessages(msgs && msgs.length > 0 ? msgs.reverse() : []);
        setLoading(false);
      } catch {
        if (active) {
          setMessages([]);
          setParticipants([]);
          setLoading(false);
        }
      }
    })();
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    try { setMoments(JSON.parse(localStorage.getItem(`inmood_moments_${id}`) || '[]')); } catch { setMoments([]); }
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }
  if (accessDenied) {
    return <div className="flex flex-col items-center justify-center h-screen px-6 text-center"><p className="text-muted-foreground mb-4">{t('experiences.chat.access_denied')}</p><Button onClick={() => navigate(`/experience/${id}`)}>{t('experiences.chat.back')}</Button></div>;
  }
  if (!experience) {
    return <div className="flex flex-col items-center justify-center h-screen px-6 text-center"><p className="text-muted-foreground mb-4">{t('experiences.chat.not_found')}</p><Button onClick={() => navigate('/explore')}>{t('experiences.chat.discover')}</Button></div>;
  }

  const readOnly = isChatReadOnly(experience);
  const countdown = getCountdown(experience);
  const hasText = text.trim().length > 0;

  // RC1-001: every experience-chat send is authorized + persisted server-side
  // through authorizationGate (participant validation). No client-side authority.
  const gateSend = async (msgData) => {
    try {
      const resp = await base44.functions.invoke('authorizationGate', {
        action: 'sendMessage', scope: 'experience', experienceId: id, payload: msgData,
      });
      const res = resp?.data || resp;
      if (res && res.ok && res.message) { setMessages((prev) => [...prev, res.message]); return true; }
      if (res && res.message) feedback.message('Message not sent', res.message);
      else feedback.error(new Error('Message not sent'));
      return false;
    } catch (e) { feedback.error(e); return false; }
  };

  const handleSend = () => {
    if (!hasText || readOnly) return;
    if (editingMessage) { handleSaveEdit(); return; }
    const replyText = replyTo?.content || null;
    const content = text.trim();
    setText(''); setReplyTo(null);
    gateSend({ experience_id: id, sender_name: myName, type: 'text', content, reply_to_text: replyText });
  };

  const handleQuickAction = (action) => {
    if (readOnly) return;
    gateSend({ experience_id: id, sender_name: myName, type: 'quick_action', content: action });
  };

  const handleAddPhoto = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setMoments((prev) => { const updated = [...prev, file_url]; localStorage.setItem(`inmood_moments_${id}`, JSON.stringify(updated)); return updated; });
    } catch {}
  };

  const handleSendPhoto = async (e) => {
    if (readOnly) return;
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await gateSend({ experience_id: id, sender_name: myName, type: 'photo', content: file_url });
    } catch {}
  };

  const handleEdit = (message) => { setEditingMessage(message); setText(message.content); };

  const handleSaveEdit = async () => {
    if (!editingMessage || !hasText) return;
    const newContent = text.trim();
    setMessages((prev) => prev.map((m) => m.id === editingMessage.id ? { ...m, content: newContent } : m));
    if (editingMessage.id) {
      try {
        const resp = await base44.functions.invoke('authorizationGate', {
          action: 'editExperienceMessage', messageId: editingMessage.id, content: newContent,
        });
        const res = resp?.data || resp;
        if (res && res.ok && res.message) setMessages((prev) => prev.map((m) => m.id === editingMessage.id ? res.message : m));
        else { feedback.error(new Error(res?.message || 'Edit failed')); setMessages((prev) => prev.map((m) => m.id === editingMessage.id ? { ...m, content: editingMessage.content } : m)); }
      } catch (e) {
        feedback.error(e);
        setMessages((prev) => prev.map((m) => m.id === editingMessage.id ? { ...m, content: editingMessage.content } : m));
      }
    }
    setText(''); setEditingMessage(null);
  };

  const handleDelete = (message) => {
    setMessages((prev) => prev.filter((m) => m.id !== message.id));
    if (message.id) { try { base44.entities.ChatMessage.delete(message.id); } catch {} }
  };

  const handlePin = (message) => {
    setMessages((prev) => prev.map((m) => m.id === message.id ? { ...m, is_pinned: !m.is_pinned } : m));
    if (message.id) { try { base44.entities.ChatMessage.update(message.id, { is_pinned: !message.is_pinned }); } catch {} }
  };

  const handleReact = (message, emoji) => {
    const has = (message.reactions || []).includes(emoji);
    const nextReactions = has ? (message.reactions || []).filter((r) => r !== emoji) : [...(message.reactions || []), emoji];
    setMessages((prev) => prev.map((m) => m.id === message.id ? { ...m, reactions: nextReactions } : m));
    if (message.id) { try { base44.entities.ChatMessage.update(message.id, { reactions: nextReactions }); } catch {} }
  };

  // Voice messages via MediaRecorder.
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size < 1000) return;
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          await gateSend({ experience_id: id, sender_name: myName, type: 'voice', content: '', file_url });
        } catch {}
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch { setRecording(false); }
  };
  const stopRecording = () => { mediaRecorderRef.current?.stop(); };

  const pinnedAnnouncement = messages.find((m) => m.is_pinned && m.type === 'announcement');
  const phase = readOnly ? 'completed' : 'live';

  return (
    <div className="flex flex-col h-[calc(100dvh-6rem)] max-h-[calc(100dvh-6rem)]">
      <ExperienceChatHeader experience={experience} participantCount={participants.length} onInfo={() => setShowInfo(true)} />

      <div className="px-4 py-2.5 border-b border-border bg-card text-center flex-shrink-0">
        {!readOnly && countdown && (
          <div className="flex items-center justify-center gap-3 text-sm">
            <span className="font-semibold text-primary">{t('experiences.chat.getting_ready')}</span>
            <span className="text-xs text-muted-foreground">· {countdown}</span>
            <button onClick={() => setShowInvite(true)} type="button" className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
              <UserPlus className="w-3.5 h-3.5" /> {t('experiences.chat.invite')}
            </button>
          </div>
        )}
        {readOnly && (
          <div className="space-y-2">
            <p className="font-semibold text-primary">{t('experiences.chat.thanks')}</p>
            <div className="flex items-center justify-center gap-2">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => navigate(`/experience/${id}`)}>
                <Star className="w-3 h-3" /> {t('experiences.chat.rate')}
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => navigate('/pals')}>
                <UserPlus className="w-3 h-3" /> {t('experiences.chat.pals')}
              </Button>
              {isPremium && (
                <label className="cursor-pointer">
                  <span className="flex items-center gap-1.5 text-xs h-8 px-3 rounded-md border border-input hover:bg-accent">
                    <ImageIcon className="w-3 h-3" /> {t('experiences.chat.photos')}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAddPhoto} />
                </label>
              )}
            </div>
          </div>
        )}
      </div>

      {pinnedAnnouncement && (
        <div className="px-4 py-2 bg-primary/5 border-b border-primary/20 flex-shrink-0">
          <div className="flex items-start gap-2">
            <Pin className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">{t('experiences.chat.pinned_announcement')}</p>
              <p className="text-xs font-medium truncate">{pinnedAnnouncement.content}</p>
            </div>
          </div>
        </div>
      )}

      <SharedMomentsStrip moments={moments} onAddPhoto={isPremium ? handleAddPhoto : () => { trackMembershipEvent(MEMBERSHIP_EVENTS.LIMIT_REACHED, { feature: 'messaging_photos' }); showUpgrade('messaging_photos'); }} />

      <div className="flex-1 overflow-y-auto py-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <MessageSquare className="w-12 h-12 text-muted-foreground/40 mb-3" strokeWidth={1.5} />
            <p className="text-sm font-medium text-muted-foreground">{t('experiences.chat.no_messages')}</p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.type === 'system') return <SystemCard key={msg.id} message={msg} />;
            if (msg.type === 'announcement') return <AnnouncementCard key={msg.id} message={msg} isOrganizer={isHost} onPin={handlePin} onEdit={handleEdit} onDelete={handleDelete} />;
            return <ChatMessageBubble key={msg.id} message={msg} isMe={msg.sender_name === myName} isHost={isHost} onReply={(m) => setReplyTo(m)} onEdit={handleEdit} onDelete={handleDelete} onPin={handlePin} onReact={handleReact} />;
          })
        )}
        {typing && <TypingIndicator name="" />}
        <div ref={messagesEndRef} />
      </div>

      {!readOnly ? (
        <>
          {isPremium && <QuickActionsBar onAction={handleQuickAction} />}
          <div className="border-t border-border bg-card px-3 pt-2 pb-3 flex-shrink-0">
            {replyTo && (
              <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl bg-muted/60 border-s-2 border-primary">
                <span className="text-xs text-primary font-medium">Replying to {replyTo.sender_name}</span>
                <span className="text-xs text-muted-foreground truncate flex-1">{replyTo.content}</span>
                <button onClick={() => setReplyTo(null)} className="text-xs text-muted-foreground" type="button">✕</button>
              </div>
            )}
            {editingMessage && (
              <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl bg-warning/10 border-s-2 border-warning">
                <span className="text-xs text-warning font-medium">{t('experiences.chat.editing')}</span>
                <button onClick={() => { setEditingMessage(null); setText(''); }} className="text-xs text-muted-foreground ml-auto" type="button">✕</button>
              </div>
            )}
            {recording && (
              <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl bg-destructive/10">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-destructive font-medium">{t('experiences.chat.recording')}</span>
                <button onClick={stopRecording} className="ml-auto text-xs text-destructive font-medium" type="button">{t('experiences.chat.stop_send')}</button>
              </div>
            )}
            <div className="flex items-end gap-2">
              {isPremium && (
                <label className="cursor-pointer w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted flex-shrink-0">
                  <Camera className="w-5 h-5 text-muted-foreground" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleSendPhoto} />
                </label>
              )}
              <div className="flex-1 bg-muted/60 rounded-2xl px-3.5 py-2 min-h-[40px] flex items-center">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={editingMessage ? t('experiences.chat.placeholder_edit') : t('experiences.chat.placeholder')}
                  className="w-full bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
                />
              </div>
              {hasText ? (
                <button onClick={handleSend} className="w-9 h-9 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 flex-shrink-0" type="button">
                  <Send className="w-4 h-4 text-primary-foreground" />
                </button>
              ) : isPremium ? (
                <button onClick={recording ? stopRecording : startRecording} className={`w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted flex-shrink-0 ${recording ? 'bg-destructive/10' : ''}`} type="button">
                  {recording ? <Square className="w-4 h-4 text-destructive fill-current" /> : <Mic className="w-5 h-5 text-muted-foreground" />}
                </button>
              ) : (
                <div className="w-9 h-9 flex-shrink-0" />
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="border-t border-border bg-muted/30 px-4 py-3 text-center flex-shrink-0">
          <p className="text-xs text-muted-foreground">{t('experiences.chat.read_only')}</p>
        </div>
      )}

      <InvitePalsSheet experience={experience} open={showInvite} onOpenChange={setShowInvite} />

      <ChatInfoSheet
        open={showInfo}
        onOpenChange={setShowInfo}
        experience={experience}
        participants={participants}
        onLeave={() => { setShowInfo(false); navigate(`/experience/${id}`); }}
        onReport={() => { setShowInfo(false); navigate(`/experience/${id}`); }}
      />
    </div>
  );
}