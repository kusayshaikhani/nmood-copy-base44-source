import React, { useState, useRef } from 'react';
import { Plus, Smile, Send, Mic, X, Reply, Image as ImageIcon, FileText, User, Compass, Users, Sparkles, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import EmojiPicker from '@/components/circles/EmojiPicker';
import BottomSheet from '@/components/shared/BottomSheet';
import { feedback } from '@/lib/feedback';
import { useLocalization } from '@/lib/i18n/useLocalization';
import ContactPickerSheet from './pickers/ContactPickerSheet';
import ExperiencePickerSheet from './pickers/ExperiencePickerSheet';
import CirclePickerSheet from './pickers/CirclePickerSheet';
import GifPickerSheet from './pickers/GifPickerSheet';

const MAX_PHOTO = 10 * 1024 * 1024;
const MAX_DOC = 25 * 1024 * 1024;
const DOC_ACCEPT = '.pdf,.docx,.xlsx,.pptx,.txt,.csv,.zip,.md,.rtf';

export default function ChatComposer({ onSend, onTyping, replyTo, onCancelReply, disabled, placeholder }) {
  const { t } = useLocalization();
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showExperience, setShowExperience] = useState(false);
  const [showCircle, setShowCircle] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recElapsed, setRecElapsed] = useState(0);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const photoInput = useRef(null);
  const docInput = useRef(null);
  const mediaRec = useRef(null);
  const chunks = useRef([]);
  const recStart = useRef(0);
  const recTimer = useRef(null);

  const hasText = text.trim().length > 0;

  const sendText = () => {
    if (!hasText || disabled) return;
    onSend({ type: 'text', content: text.trim(), reply_to_id: replyTo?.id || '', reply_to_text: typeof replyTo?.content === 'string' ? replyTo.content : '' });
    setText('');
    if (onTyping) onTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  };

  const insertAtCursor = (str) => {
    const el = inputRef.current;
    if (!el) {
      setText((p) => p + str);
      return;
    }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const next = text.slice(0, start) + str + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      try {
        el.focus();
        el.setSelectionRange(start + str.length, start + str.length);
      } catch { /* ignore */ }
    });
    if (onTyping) onTyping(next.trim().length > 0);
  };

  const upload = async (file) => {
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      return res?.file_url || '';
    } catch {
      feedback.error(new Error(t('messaging.composer.upload_failed')));
      return '';
    } finally {
      setUploading(false);
    }
  };

  const onPickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      feedback.message(t('messaging.composer.unsupported_image'));
      return;
    }
    if (file.size > MAX_PHOTO) {
      feedback.message(t('messaging.composer.image_too_large'));
      return;
    }
    const file_url = await upload(file);
    if (file_url) {
      onSend({
        type: 'photo', content: file_url, file_url,
        file_name: file.name, file_size: file.size, file_type: file.type,
        reply_to_id: replyTo?.id || '', reply_to_text: typeof replyTo?.content === 'string' ? replyTo.content : '',
      });
    }
  };

  const onPickDoc = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_DOC) {
      feedback.message(t('messaging.composer.doc_too_large'));
      return;
    }
    const file_url = await upload(file);
    if (file_url) {
      onSend({
        type: 'document', content: `${(file.size / 1024).toFixed(0)} KB`, file_url,
        file_name: file.name, file_size: file.size, file_type: file.type,
        reply_to_id: replyTo?.id || '', reply_to_text: typeof replyTo?.content === 'string' ? replyTo.content : '',
      });
    }
  };

  const stopTimer = () => {
    if (recTimer.current) {
      clearInterval(recTimer.current);
      recTimer.current = null;
    }
  };

  const startRec = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      feedback.message(t('messaging.composer.voice_unsupported'));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (ev) => { if (ev.data.size) chunks.current.push(ev.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((tk) => tk.stop());
        setRecording(false);
        stopTimer();
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        if (blob.size < 1000) return;
        const dur = Math.round((Date.now() - recStart.current) / 1000);
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        const file_url = await upload(file);
        if (file_url) {
          onSend({
            type: 'voice', content: `${dur}s`, file_url,
            reply_to_id: replyTo?.id || '', reply_to_text: typeof replyTo?.content === 'string' ? replyTo.content : '',
          });
        }
      };
      mediaRec.current = mr;
      recStart.current = Date.now();
      setRecElapsed(0);
      recTimer.current = setInterval(() => setRecElapsed(Math.round((Date.now() - recStart.current) / 1000)), 500);
      mr.start();
      setRecording(true);
    } catch {
      feedback.message(t('messaging.composer.mic_blocked'));
    }
  };

  const stopRec = () => {
    if (mediaRec.current && mediaRec.current.state !== 'inactive') mediaRec.current.stop();
  };

  const cancelRec = () => {
    if (mediaRec.current && mediaRec.current.state !== 'inactive') {
      mediaRec.current.onstop = null;
      mediaRec.current.stop();
    }
    setRecording(false);
    stopTimer();
  };

  const ATTACH_ITEMS = [
    { key: 'photo', icon: ImageIcon, label: t('messaging.composer.attach_photo'), color: 'bg-violet-500', onClick: () => photoInput.current?.click() },
    { key: 'document', icon: FileText, label: t('messaging.composer.attach_document'), color: 'bg-indigo-500', onClick: () => docInput.current?.click() },
    { key: 'contact', icon: User, label: t('messaging.composer.attach_contact'), color: 'bg-sky-500', onClick: () => setShowContact(true) },
    { key: 'experience', icon: Compass, label: t('messaging.composer.attach_experience'), color: 'bg-primary', onClick: () => setShowExperience(true) },
    { key: 'circle', icon: Users, label: t('messaging.composer.attach_circle'), color: 'bg-accent', onClick: () => setShowCircle(true) },
  ];

  const iconBtn = 'w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-default flex-shrink-0';

  return (
    <div className="border-t border-border bg-card px-3 pt-2 pb-3">
      <input ref={photoInput} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
      <input ref={docInput} type="file" accept={DOC_ACCEPT} className="hidden" onChange={onPickDoc} />

      {replyTo && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl bg-muted/60 border-s-2 border-primary">
          <Reply className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-primary">{t('messaging.composer.replying')}</p>
            <p className="text-xs text-muted-foreground truncate">
              {typeof replyTo.content === 'string' ? replyTo.content : t('messaging.composer.shared_content')}
            </p>
          </div>
          <button onClick={onCancelReply} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-muted flex-shrink-0" type="button">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {showEmoji && (
        <div className="mb-2 rounded-xl bg-muted/50 border border-border">
          <EmojiPicker onPick={(e) => insertAtCursor(e)} />
        </div>
      )}

      {recording ? (
        <div className="flex items-center gap-2 h-11 px-3 rounded-xl bg-destructive/10">
          <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse flex-shrink-0" />
          <span className="text-xs text-destructive font-medium flex-1">{t('messaging.composer.recording')} {recElapsed}s</span>
          <button onClick={cancelRec} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-destructive/20 flex-shrink-0" type="button" aria-label={t('messaging.composer.cancel')}>
            <X className="w-4 h-4 text-destructive" />
          </button>
          <button onClick={stopRec} className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0" type="button" aria-label={t('messaging.composer.send')}>
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
      ) : (
        <div className="flex items-end gap-1.5">
          <button className={iconBtn} onClick={() => setShowAttach(true)} type="button" aria-label={t('messaging.composer.attach')} disabled={disabled}>
            <Plus className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className={iconBtn} onClick={() => setShowEmoji((v) => !v)} type="button" aria-label={t('messaging.composer.emoji')} disabled={disabled}>
            <Smile className={`w-5 h-5 ${showEmoji ? 'text-primary' : 'text-muted-foreground'}`} />
          </button>
          <button className={iconBtn} onClick={() => setShowGif(true)} type="button" aria-label={t('messaging.composer.gif')} disabled={disabled}>
            <Sparkles className="w-5 h-5 text-muted-foreground" />
          </button>

          <div className="flex-1 bg-muted/60 rounded-2xl px-3.5 py-2 min-h-[40px] flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => { setText(e.target.value); if (onTyping) onTyping(e.target.value.trim().length > 0); }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || t('messaging.composer.placeholder')}
              disabled={disabled}
              className="w-full bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
            />
          </div>

          {hasText ? (
            <button
              onClick={sendText}
              className="w-9 h-9 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-default flex-shrink-0"
              type="button"
              aria-label={t('messaging.composer.send')}
              disabled={disabled}
            >
              <Send className="w-4 h-4 text-primary-foreground" />
            </button>
          ) : (
            <button
              onClick={startRec}
              className={iconBtn}
              type="button"
              aria-label={t('messaging.composer.voice')}
              disabled={disabled}
            >
              <Mic className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('messaging.composer.uploading')}
        </div>
      )}

      <BottomSheet open={showAttach} onOpenChange={setShowAttach} title={t('messaging.composer.attach_title')}>
        <div className="grid grid-cols-3 gap-3 pb-2">
          {ATTACH_ITEMS.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.key}
                type="button"
                onClick={() => { setShowAttach(false); a.onClick(); }}
                className="flex flex-col items-center gap-1.5 group"
              >
                <span className={`w-12 h-12 rounded-2xl ${a.color} flex items-center justify-center text-white group-active:scale-95 transition-default`}>
                  <Icon className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-medium text-center leading-tight">{a.label}</span>
              </button>
            );
          })}
        </div>
      </BottomSheet>

      <ContactPickerSheet
        open={showContact}
        onOpenChange={setShowContact}
        onPick={(p) => {
          setShowContact(false);
          onSend({ type: 'shared_profile', content: '', shared_id: p.id, shared_title: p.name, shared_image: p.avatar, shared_meta: p.bio || '', reply_to_id: replyTo?.id || '', reply_to_text: typeof replyTo?.content === 'string' ? replyTo.content : '' });
        }}
      />
      <ExperiencePickerSheet
        open={showExperience}
        onOpenChange={setShowExperience}
        onPick={(x) => {
          setShowExperience(false);
          onSend({ type: 'shared_experience', content: '', shared_id: x.id, shared_title: x.title, shared_image: x.cover_image, shared_meta: x.when, reply_to_id: replyTo?.id || '', reply_to_text: typeof replyTo?.content === 'string' ? replyTo.content : '' });
        }}
      />
      <CirclePickerSheet
        open={showCircle}
        onOpenChange={setShowCircle}
        onPick={(c) => {
          setShowCircle(false);
          onSend({ type: 'shared_circle', content: '', shared_id: c.id, shared_title: c.name, shared_image: c.cover_photo, shared_meta: String(c.member_count || 0), reply_to_id: replyTo?.id || '', reply_to_text: typeof replyTo?.content === 'string' ? replyTo.content : '' });
        }}
      />
      <GifPickerSheet
        open={showGif}
        onOpenChange={setShowGif}
        onPick={(url) => {
          setShowGif(false);
          onSend({ type: 'gif', content: 'GIF', file_url: url, reply_to_id: replyTo?.id || '', reply_to_text: typeof replyTo?.content === 'string' ? replyTo.content : '' });
        }}
      />
    </div>
  );
}