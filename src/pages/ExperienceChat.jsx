import {resolveReplyPreviews} from '@/lib/message-replies';
import NativePhotoInput from '@/components/media/NativePhotoInput';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Mic, Star, UserPlus, Image as ImageIcon, Pin, Square, MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hideGroupChatMessage, deleteGroupChatMessage, editGroupChatMessage, getGroupChatContext, listGroupChatMessages, reactToGroupChatMessage, sendGroupChatMessage, setGroupChatMessagePinned, uploadGroupChatAttachment } from '@/api/groupChat';
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
import InMoodActions from '@/components/circles/InMoodActions';
import EmojiPicker from '@/components/circles/EmojiPicker';
import GifPickerSheet from '@/components/messaging/pickers/GifPickerSheet';
import { useLocalization } from '@/lib/i18n/useLocalization';
import ReportSheet from '@/components/safety/Phase1ReportSheet';

const STICKERS = ['☕','🎉','🤝','🌟','💜','🔥','🙌','✨','🏆','🎯','🌈','🥳'];
const SOCIAL_TYPES = { coffee: 'invite_coffee', experience: 'invite_experience', circle: 'invite_circle', pal: 'add_pal' };
const SOCIAL_TEXT = {
  invite_coffee: "Let's grab a coffee ☕",
  invite_experience: 'Come join this experience!',
  invite_circle: 'Join my circle — we’d love to have you.',
  add_pal: "Let's connect as pals 🤝",
};

export default function ExperienceChat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium, showUpgrade } = useMembershipAccess();
  const { t } = useLocalization();
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessError, setAccessError] = useState('');
  const [entity, setEntity] = useState(null);
  const [messages, setMessages] = useState([]);
  const [moments, setMoments] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [panel, setPanel] = useState(null);
  const [typing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const photoInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const documentInputRef = useRef(null);

  const experience = entity ? toExperienceView(entity) : null;
  const myName = user?.full_name || 'You';
  const isHost = entity ? (entity.host_user_id === user?.id) : false;

  // The Supabase list RPC is the authority for active host/attendance access.
  // Do not pre-block the native screen with legacy Base44 entity reads.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rec = await getGroupChatContext('experience', id);
        if (!rec?.id) throw new Error('This experience is not available. (NMG-CHAT-CONTEXT)');
        const msgs = await listGroupChatMessages('experience', id);
        if (!active) return;
        setEntity(rec);
        setParticipants([{ name: rec.host_name || 'Host', avatar: rec.host_avatar || '', isOrganizer: true }]);
        setMessages(Array.isArray(msgs) ? msgs : []);
      } catch (error) {
        if (!active) return;
        setAccessError(error?.message || 'Experience chat could not be loaded. (NMG-CHAT-READ)');
        setAccessDenied(true);
        feedback.error(error);
      } finally {
        if (active) setLoading(false);
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
    return <div className="flex flex-col items-center justify-center h-screen px-6 text-center"><p className="text-muted-foreground mb-2">{t('experiences.chat.access_denied')}</p><p className="text-xs text-muted-foreground mb-4">{accessError}</p><Button onClick={() => navigate(`/experience/${id}`)}>{t('experiences.chat.back')}</Button></div>;
  }
  if (!experience) {
    return <div className="flex flex-col items-center justify-center h-screen px-6 text-center"><p className="text-muted-foreground mb-4">{t('experiences.chat.not_found')}</p><Button onClick={() => navigate('/explore')}>{t('experiences.chat.discover')}</Button></div>;
  }

  const readOnly = isChatReadOnly(experience);
  const countdown = getCountdown(experience);
  const hasText = text.trim().length > 0;

  // Every send is persisted by the Supabase RPC after active attendance validation.
  const gateSend = async (msgData) => {
    try {
      const [message] = await sendGroupChatMessage('experience', id, msgData);
      if (!message) throw new Error('Message was not returned by the rehearsal chat service. (NMG-CHAT-SEND)');
      setMessages((prev) => [...prev, message]);
      return true;
    } catch (e) { feedback.error(e); return false; }
  };

  const handleSend = () => {
    if (!hasText || readOnly) return;
    if (editingMessage) { handleSaveEdit(); return; }
    const replyId = replyTo?.id || null;
    const content = text.trim();
    setText(''); setReplyTo(null);
    gateSend({ experience_id: id, sender_name: myName, type: 'text', content, reply_to_id: replyId });
  };

  const handleQuickAction = (action) => {
    if (readOnly) return;
    gateSend({ experience_id: id, sender_name: myName, type: 'quick_action', content: action });
  };

  const handleAddPhoto = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const file_url = await uploadGroupChatAttachment('experience', id, file);
      setMoments((prev) => { const updated = [...prev, file_url]; localStorage.setItem(`inmood_moments_${id}`, JSON.stringify(updated)); return updated; });
    } catch (error) { feedback.error(error); }
  };

  const handleSendFile = async (e, type) => {
    if (readOnly) return;
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const file_url = await uploadGroupChatAttachment('experience', id, file);
      await gateSend({ experience_id: id, sender_name: myName, type, content: file.name, file_url, file_name: file.name });
    } catch (error) { feedback.error(error); }
  };

  const handleEdit = (message) => { setEditingMessage(message); setText(message.content); };

  const handleSaveEdit = async () => {
    if (!editingMessage || !hasText) return;
    const newContent = text.trim();
    setMessages((prev) => prev.map((m) => m.id === editingMessage.id ? { ...m, content: newContent } : m));
    if (editingMessage.id) {
      try {
        await editGroupChatMessage(editingMessage.id, newContent);
        await refreshMessages();
      } catch (e) {
        feedback.error(e);
        setMessages((prev) => prev.map((m) => m.id === editingMessage.id ? { ...m, content: editingMessage.content } : m));
      }
    }
    setText(''); setEditingMessage(null);
  };

  const refreshMessages = async () => {
    const rows = await listGroupChatMessages('experience', id);
    setMessages(Array.isArray(rows) ? rows : []);
  };

  const handleDelete = async (message) => {
    if (!message.id || !window.confirm('Unsend this message for everyone?')) return;
    try { await deleteGroupChatMessage(message.id); await refreshMessages(); }
    catch (error) { feedback.error(error); }
  };

  const handlePin = async (message) => {
    if (!message.id) return;
    try { await setGroupChatMessagePinned(message.id, !message.is_pinned); setMessages((prev) => prev.map((m) => m.id === message.id ? { ...m, is_pinned: !m.is_pinned } : m)); }
    catch (error) { feedback.error(error); }
  };

  const handleReact = async (message, emoji) => {
    if (!message.id) return;
    try { await reactToGroupChatMessage(message.id, emoji); await refreshMessages(); }
    catch (error) { feedback.error(error); }
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
          const file_url = await uploadGroupChatAttachment('experience', id, file);
          await gateSend({ experience_id: id, sender_name: myName, type: 'voice', content: '', file_url });
        } catch (error) { feedback.error(error); }
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch { setRecording(false); }
  };
  const stopRecording = () => { mediaRecorderRef.current?.stop(); };

  const sendLocation = () => {
    if (readOnly || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const r = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`
          );
          const d = await r.json();
          const place = d.city || d.locality || d.district || d.principalSubdivision || 'Shared location';
          gateSend({ experience_id: id, sender_name: myName, type: 'location', content: place });
        } catch {
          gateSend({ experience_id: id, sender_name: myName, type: 'location', content: 'Shared location' });
        }
      },
      () => {}
    );
  };

  const handleAction = (key) => {
    if (key === 'photo') photoInputRef.current?.click();
    else if (key === 'camera') cameraInputRef.current?.click();
    else if (key === 'video') videoInputRef.current?.click();
    else if (key === 'document') documentInputRef.current?.click();
    else if (key === 'location') sendLocation();
    else if (key === 'voice') recording ? stopRecording() : startRecording();
    else if (key === 'emoji') setPanel(panel === 'emoji' ? null : 'emoji');
    else if (key === 'sticker') setPanel(panel === 'sticker' ? null : 'sticker');
    else if (key === 'gif') setPanel(panel === 'gif' ? null : 'gif');
  };

  const handleSocial = (key) => {
    const type = SOCIAL_TYPES[key];
    if (!type) return;
    gateSend({ experience_id: id, sender_name: myName, type, content: SOCIAL_TEXT[type] });
  };

  const pinnedAnnouncement = messages.find((m) => m.is_pinned && m.type === 'announcement');
  return (
    <div className="flex flex-col h-[calc(100dvh-6rem)] max-h-[calc(100dvh-6rem)]">
      <NativePhotoInput ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleSendFile(e, 'photo')} />
      <NativePhotoInput ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleSendFile(e, 'photo')} />
      <input ref={videoInputRef} type="file" accept="video/*" capture="environment" className="hidden" onChange={(e) => handleSendFile(e, 'video')} />
      <input ref={documentInputRef} type="file" accept=".pdf,.docx,.xlsx,.pptx,.txt,.zip" className="hidden" onChange={(e) => handleSendFile(e, 'document')} />
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
                  <NativePhotoInput type="file" accept="image/*" className="hidden" onChange={handleAddPhoto} />
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
          resolveReplyPreviews(messages).map((msg) => {
            if (msg.type === 'system') return <SystemCard key={msg.id} message={msg} onAdminDeleted={refreshMessages} />;
            if (msg.type === 'announcement') return <AnnouncementCard key={msg.id} message={msg} isOrganizer={isHost} isMe={msg.sender_id === user?.id} onReply={setReplyTo} onAdminDeleted={refreshMessages} onPin={handlePin} onEdit={handleEdit} onDelete={handleDelete} />;
            return <ChatMessageBubble key={msg.id} message={msg} onAdminDeleted={refreshMessages} isMe={msg.sender_id === user?.id} isHost={isHost} onReply={(m) => setReplyTo(m)} onEdit={handleEdit} onDelete={handleDelete} onDeleteForMe={async message=>{try{await hideGroupChatMessage(message.id);await refreshMessages();}catch(error){feedback.error(error);}}} onPin={handlePin} onReact={handleReact} onReport={(message) => setReportTarget({ type: 'message', id: message.id, reportedMemberId: message.sender_id, evidence: { scope: 'experience', container_id: id, attachment_path: message.file_path || null } })} />;
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
              <button type="button" aria-label="Open chat actions" onClick={() => setActionsOpen(true)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted flex-shrink-0 border border-border">
                <Plus className="w-5 h-5 text-muted-foreground" />
              </button>
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
          {panel === 'emoji' && <EmojiPicker onPick={(emoji) => setText((prev) => prev + emoji)} />}
          {panel === 'sticker' && (
            <div className="grid grid-cols-6 gap-1 p-2 max-h-32 overflow-y-auto no-scrollbar">
              {STICKERS.map((sticker) => (
                <button key={sticker} type="button" onClick={() => gateSend({ experience_id: id, sender_name: myName, type: 'sticker', content: sticker })} className="w-10 h-10 rounded-lg hover:bg-muted text-2xl flex items-center justify-center transition-default">{sticker}</button>
              ))}
            </div>
          )}
          <GifPickerSheet open={panel === 'gif'} onOpenChange={(open) => setPanel(open ? 'gif' : null)} onPick={(file_url) => gateSend({ experience_id: id, sender_name: myName, type: 'gif', content: 'GIF', file_url })} />
        </>
      ) : (
        <div className="border-t border-border bg-muted/30 px-4 py-3 text-center flex-shrink-0">
          <p className="text-xs text-muted-foreground">{t('experiences.chat.read_only')}</p>
        </div>
      )}

      <ReportSheet open={!!reportTarget} onOpenChange={(open) => !open && setReportTarget(null)} target={reportTarget} />
      <InvitePalsSheet experience={experience} open={showInvite} onOpenChange={setShowInvite} />

      <InMoodActions
        open={actionsOpen}
        onOpenChange={setActionsOpen}
        onAction={handleAction}
        onSocial={handleSocial}
        onManage={isHost ? () => navigate(`/experience/${id}`) : undefined}
        manageLabel="Manage Experience"
        manageTestId="experience-chat-manage-action"
      />

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