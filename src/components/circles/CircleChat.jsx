import {canUnsend} from '@/lib/chat-removal';
import {resolveReplyPreviews} from '@/lib/message-replies';
import NativePhotoInput from '@/components/media/NativePhotoInput';
import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, X, Square, Loader2, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hideGroupChatMessage, deleteGroupChatAttachment, deleteGroupChatMessage, editGroupChatMessage, listGroupChatMessages, reactToGroupChatMessage, sendGroupChatMessage, setGroupChatMessagePinned, uploadGroupChatAttachment } from '@/api/groupChat';
import { useAuth } from '@/lib/AuthContext';
import MessageBubble from '@/components/circles/MessageBubble';
import InMoodActions from '@/components/circles/InMoodActions';
import MessageActionsSheet from '@/components/circles/MessageActionsSheet';
import EmojiPicker from '@/components/circles/EmojiPicker';
import GifPickerSheet from '@/components/messaging/pickers/GifPickerSheet';
import { feedback } from '@/lib/feedback';
import { useLocalization } from '@/lib/i18n/useLocalization';
import ReportSheet from '@/components/safety/Phase1ReportSheet';

const STICKERS = ['☕','🎉','🤝','🌟','💜','🔥','🙌','✨','🏆','🎯','🌈','🥳'];
const SOCIAL_TYPES = { coffee: 'invite_coffee', experience: 'invite_experience', circle: 'invite_circle', pal: 'add_pal' };
const SOCIAL_TEXT = {
  invite_coffee: "Let's grab a coffee ☕",
  invite_experience: 'Come join my next experience!',
  invite_circle: 'Join my circle — we’d love to have you.',
  add_pal: "Let's connect as pals 🤝",
};

export default function CircleChat({ circle, role, onManage }) {
  const { t } = useLocalization();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessError, setAccessError] = useState('');
  const [input, setInput] = useState('');
  const [actionsOpen, setActionsOpen] = useState(false);
  const [panel, setPanel] = useState(null); // 'emoji' | 'sticker' | null
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [recording, setRecording] = useState(false);
  const [sending, setSending] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const scrollRef = useRef(null);
  const photoInput = useRef(null);
  const cameraInput = useRef(null);
  const videoInput = useRef(null);
  const docInput = useRef(null);
  const mediaRec = useRef(null);
  const voiceChunks = useRef([]);
  const recStart = useRef(0);

  const circleId = String(circle.id);
  const myName = user?.full_name || 'You';
  const myRole = role === 'organizer' ? 'organizer' : 'member';

  const load = async () => {
    setAccessDenied(false);
    setAccessError('');
    try {
      const rows = await listGroupChatMessages('circle', circleId);
      if (Array.isArray(rows)) {
        setMessages(rows);
      } else {
        // Authorization failure — clear messages and show access-denied state.
        setMessages([]);
        setAccessDenied(true);
      }
      // else: transient server error — keep existing messages, retry on next poll.
    } catch (error) {
      setMessages([]);
      setAccessError(error?.message || 'Circle chat could not be loaded. (NMG-CHAT-READ)');
      setAccessDenied(true);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [circleId]);

  // SEC — Controlled polling through listCircleMessages. Each poll re-verifies
  // active CircleMembership server-side. On authorization failure (401/403),
  // messages are cleared immediately, polling stops, and an access-denied
  // state is shown. Transient network/server errors retry without falsely
  // claiming the user was removed.
  const accessDeniedRef = useRef(false);
  useEffect(() => { accessDeniedRef.current = accessDenied; }, [accessDenied]);

  useEffect(() => {
    let intervalId = null;
    let inFlight = false;
    let isMounted = true;

    const poll = async () => {
      if (inFlight || !isMounted || accessDeniedRef.current) return;
      inFlight = true;
      try {
          const res = await listGroupChatMessages('circle', circleId);
        if (!isMounted) return;
          if (Array.isArray(res)) {
            setMessages(res);
          setAccessDenied(false);
        } else if (res?.error === 'unauthorized' || res?.error === 'not_member') {
          setMessages([]);
          setAccessDenied(true);
          stopPolling();
        }
        // else: transient server error — keep existing messages, retry on next poll.
      } catch (e) {
        const err = e?.data || e;
        if (err?.error === 'unauthorized' || err?.error === 'not_member' || e?.status === 401 || e?.status === 403) {
          if (isMounted) { setMessages([]); setAccessDenied(true); stopPolling(); }
        }
        // else: transient network error — keep existing messages, retry on next poll.
      }
      finally { inFlight = false; }
    };

    const startPolling = () => { if (!intervalId) intervalId = setInterval(poll, 45000); };
    const stopPolling = () => { if (intervalId) { clearInterval(intervalId); intervalId = null; } };
    const onVisibilityChange = () => {
      if (document.hidden) stopPolling();
      else { poll(); startPolling(); }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    if (!document.hidden) startPolling();

    return () => {
      isMounted = false;
      stopPolling();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [circleId]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  // Every send is persisted by the Supabase RPC after active membership validation.
  const send = async (type, content, extra = {}) => {
    const payload = { circle_id: circleId, sender_name: myName, sender_avatar: '', sender_role: myRole, type, content: content || '', ...extra };
    if (replyTo) { payload.reply_to_id = replyTo.id; payload.reply_to_text = replyTo.content; }
    try {
      const [message] = await sendGroupChatMessage('circle', circleId, payload);
      if (!message) throw new Error('Message was not returned by the rehearsal chat service. (NMG-CHAT-SEND)');
      setMessages((current) => [...current, message]);
      setReplyTo(null);
      setInput('');
      return true;
    } catch (e) {
      feedback.error(e);
      return false;
    }
  };

  const sendText = async () => {
    if (!input.trim()) return;
    if (editing) {
      if (sending) return;
      setSending(true);
      try {
        await editGroupChatMessage(editing.id, input.trim());
        setEditing(null); setInput('');
      } catch (e) { feedback.error(e); }
      finally { setSending(false); }
      return;
    }
    if (sending) return;
    setSending(true);
    await send('text', input.trim());
    setSending(false);
  };

  const upload = async (file) => {
    setUploading(true);
    try { return await uploadGroupChatAttachment('circle', circleId, file); }
    catch (error) { feedback.error(error); return ''; }
    finally { setUploading(false); }
  };

  const onPickMedia = (e) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview({ url, file, type: file.type.startsWith('video') ? 'video' : 'photo' });
  };

  const confirmPreview = async () => {
    if (!preview) return;
    const file_url = await upload(preview.file);
    URL.revokeObjectURL(preview.url);
    const type = preview.type === 'video' ? 'video' : 'photo';
    const file = preview.file;
    setPreview(null);
    if (file_url && !(await send(type, file.name, { file_url, file_name: file.name }))) await deleteGroupChatAttachment(file_url);
  };

  const onPickDoc = async (e) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    const file_url = await upload(file);
    if (file_url && !(await send('document', `${(file.size / 1024).toFixed(0)} KB`, { file_url, file_name: file.name }))) await deleteGroupChatAttachment(file_url);
  };

  const sendLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        // Reverse-geocode to a place name — never send or log raw coordinates.
        try {
          const r = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`
          );
          const d = await r.json();
          const place = d.city || d.locality || d.district || d.principalSubdivision || 'Shared location';
          send('location', place);
        } catch {
          send('location', 'Shared location');
        }
      },
      () => {}
    );
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      voiceChunks.current = [];
      mr.ondataavailable = (ev) => voiceChunks.current.push(ev.data);
      mr.onstop = async () => {
        const blob = new Blob(voiceChunks.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());
        const file_url = await upload(file);
        const dur = ((Date.now() - recStart.current) / 1000).toFixed(0);
        if (file_url && !(await send('voice', `${dur}s`, { file_url }))) await deleteGroupChatAttachment(file_url);
      };
      mediaRec.current = mr;
      recStart.current = Date.now();
      mr.start();
      setRecording(true);
    } catch { /* ignore */ }
  };
  const stopRec = () => {
    if (mediaRec.current && mediaRec.current.state !== 'inactive') mediaRec.current.stop();
    setRecording(false);
  };

  const handleAction = (key) => {
    if (key === 'photo') photoInput.current?.click();
    else if (key === 'camera') cameraInput.current?.click();
    else if (key === 'video') videoInput.current?.click();
    else if (key === 'document') docInput.current?.click();
    else if (key === 'location') sendLocation();
    else if (key === 'voice') recording ? stopRec() : startRec();
    else if (key === 'gif') setPanel(panel === 'gif' ? null : 'gif');
    else if (key === 'emoji') setPanel(panel === 'emoji' ? null : 'emoji');
    else if (key === 'sticker') setPanel(panel === 'sticker' ? null : 'sticker');
  };
  const handleSocial = (k) => send(SOCIAL_TYPES[k], SOCIAL_TEXT[SOCIAL_TYPES[k]]);

  const canEdit = actionMsg && actionMsg.sender_id === user?.id && actionMsg.type === 'text';
  const doReply = () => { setReplyTo(actionMsg); setActionMsg(null); };
  const doEdit = () => { setEditing(actionMsg); setInput(actionMsg.content || ''); setActionMsg(null); };
  const doCopy = () => { navigator.clipboard?.writeText(actionMsg.content || ''); setActionMsg(null); };
  const doPin = async () => {
    if (actionBusy) return; setActionBusy(true);
    try {
      await setGroupChatMessagePinned(actionMsg.id, !actionMsg.is_pinned);
    } catch (e) { feedback.error(e); }
    finally { setActionBusy(false); setActionMsg(null); }
  };
  const doReact = async (emoji) => {
    if (actionBusy) return; setActionBusy(true);
    try {
      await reactToGroupChatMessage(actionMsg.id, emoji);
    } catch (e) { feedback.error(e); }
    finally { setActionBusy(false); setActionMsg(null); }
  };
  const doDelete = async () => {
    if(!window.confirm('Unsend this message for everyone?'))return;
    if (actionBusy) return; setActionBusy(true);
    try {
      await deleteGroupChatMessage(actionMsg.id);
      setMessages(await listGroupChatMessages('circle',circleId));
    } catch (e) { feedback.error(e); }
    finally { setActionBusy(false); setActionMsg(null); }
  };

  const pinned = messages.filter((m) => m.is_pinned);

  return (
    <div className="flex flex-col h-full">
      <NativePhotoInput ref={photoInput} type="file" accept="image/*" className="hidden" onChange={onPickMedia} />
      <NativePhotoInput ref={cameraInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPickMedia} />
      <input ref={videoInput} type="file" accept="video/*" capture="environment" className="hidden" onChange={onPickMedia} />
      <input ref={docInput} type="file" accept=".pdf,.docx,.xlsx,.pptx,.txt,.zip" className="hidden" onChange={onPickDoc} />

      {pinned.length > 0 && (
        <div className="p-2.5 rounded-2xl bg-primary/5 border border-primary/20 mb-2 flex items-start gap-2 flex-shrink-0">
          <Pin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-primary">{t('circles.chat.pinned')}</p>
            <p className="text-sm leading-relaxed truncate">{pinned[0].content}</p>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2.5 mb-2 min-h-0 pe-0.5">
        {accessDenied ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm font-medium mb-1">You no longer have access to this circle.</p>
            <p className="text-xs text-muted-foreground">{accessError || 'You may have been removed, banned, or the circle may have been deleted.'}</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-10"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm font-medium mb-1">{t('community.chat.no_messages')}</p>
            <p className="text-xs text-muted-foreground">Start the conversation with Nmood Actions.</p>
          </div>
        ) : resolveReplyPreviews(messages).map((m) => (
          <MessageBubble key={m.id} msg={m} isMe={m.sender_id === user?.id} onAction={setActionMsg} />
        ))}
      </div>

      {preview && (
        <div className="mb-2 p-2 rounded-2xl border border-border bg-muted flex items-center gap-3 flex-shrink-0">
          {preview.type === 'video' ? (
            <video src={preview.url} className="w-16 h-16 rounded-lg object-cover" />
          ) : (
            <img src={preview.url} alt={t('circles.chat.alt_preview')} className="w-16 h-16 rounded-lg object-cover" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{preview.file.name}</p>
            <p className="text-[10px] text-muted-foreground">{(preview.file.size / 1024).toFixed(0)} KB · tap Send to share</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => { URL.revokeObjectURL(preview.url); setPreview(null); }}><X className="w-4 h-4" /></Button>
          <Button size="sm" onClick={confirmPreview} disabled={uploading}>{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}</Button>
        </div>
      )}

      {replyTo && (
        <div className="mb-2 px-3 py-1.5 rounded-xl bg-muted flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-primary font-medium">{t('circles.chat.replying')}</span>
          <span className="text-xs text-muted-foreground truncate flex-1">{replyTo.content}</span>
          <button type="button" onClick={() => setReplyTo(null)}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
        </div>
      )}
      {editing && (
        <div className="mb-2 px-3 py-1.5 rounded-xl bg-muted flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] text-primary font-medium">{t('circles.chat.editing')}</span>
          <span className="text-xs text-muted-foreground truncate flex-1">{editing.content}</span>
          <button type="button" onClick={() => { setEditing(null); setInput(''); }}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
        </div>
      )}

      {panel === 'emoji' && <EmojiPicker onPick={(e) => setInput((p) => p + e)} />}
      {panel === 'sticker' && (
        <div className="grid grid-cols-6 gap-1 p-2 max-h-32 overflow-y-auto no-scrollbar">
          {STICKERS.map((s) => (
            <button key={s} type="button" onClick={() => send('sticker', s)} className="w-10 h-10 rounded-lg hover:bg-muted text-2xl flex items-center justify-center transition-default">{s}</button>
          ))}
        </div>
      )}
      <GifPickerSheet open={panel === 'gif'} onOpenChange={(open) => setPanel(open ? 'gif' : null)} onPick={(file_url) => send('gif', 'GIF', { file_url })} />

      <div className="flex items-center gap-2 pt-2 border-t border-border flex-shrink-0">
        {recording ? (
          <div className="flex-1 flex items-center gap-2 h-10 px-3 rounded-xl bg-destructive/10">
            <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
            <span className="text-xs text-destructive font-medium flex-1">{t('circles.chat.recording')}</span>
            <Button size="icon" variant="destructive" onClick={stopRec}><Square className="w-4 h-4" /></Button>
          </div>
        ) : (
          <>
            <Button size="icon" variant="outline" aria-label="Open chat actions" onClick={() => setActionsOpen(true)}><Plus className="w-4 h-4" /></Button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendText()}
              placeholder={editing ? 'Edit message…' : 'Message the circle…'}
              className="flex-1 h-10 px-3.5 rounded-xl bg-muted border border-transparent focus:border-primary focus:bg-card outline-none text-sm transition-default"
            />
            <Button size="icon" onClick={sendText} disabled={!input.trim() || sending}><Send className="w-4 h-4" /></Button>
          </>
        )}
      </div>

      <InMoodActions
        open={actionsOpen}
        onOpenChange={setActionsOpen}
        onAction={handleAction}
        onSocial={handleSocial}
        onManage={role === 'organizer' ? onManage : undefined}
        manageLabel={t('circles.manage.title')}
        manageTestId="circle-chat-manage-action"
      />
      <ReportSheet open={!!reportTarget} onOpenChange={(open) => !open && setReportTarget(null)} target={reportTarget} />
      <MessageActionsSheet
        msg={actionMsg}
        open={!!actionMsg}
        onOpenChange={(o) => !o && setActionMsg(null)}
        onReply={doReply}
        onEdit={doEdit}
        onCopy={doCopy}
        onPin={doPin}
        onReact={doReact}
        onDelete={doDelete}
        onDeleteForMe={async()=>{try{await hideGroupChatMessage(actionMsg.id);setMessages(prev=>prev.filter(m=>m.id!==actionMsg.id));setActionMsg(null);}catch(error){feedback.error(error);}}}
        onReport={() => { setReportTarget({ type: 'message', id: actionMsg.id, reportedMemberId: actionMsg.sender_id, evidence: { scope: 'circle', container_id: circleId, attachment_path: actionMsg.file_path || null } }); setActionMsg(null); }}
        canEdit={canEdit}
        canDelete={canUnsend({...actionMsg,sender:actionMsg?.sender_id===user?.id?'me':'them',created_at:actionMsg?.created_date,protected:['system','announcement'].includes(actionMsg?.type)})}
      />
    </div>
  );
}
