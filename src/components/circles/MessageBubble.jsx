import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, FileText, MapPin, Coffee, PartyPopper, Users, Handshake, Download, Play } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocalization } from '@/lib/i18n/useLocalization';

const SOCIAL = {
  invite_coffee: { icon: Coffee, color: 'bg-amber-500' },
  invite_experience: { icon: PartyPopper, color: 'bg-primary' },
  invite_circle: { icon: Users, color: 'bg-accent' },
  add_pal: { icon: Handshake, color: 'bg-success' },
};

function VoicePlayer({ url, label }) {
  const ref = useRef(null);
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const toggle = () => { const a = ref.current; if (!a) return; if (a.paused) { a.play(); setPlaying(true); } else { a.pause(); setPlaying(false); } };
  const changeSpeed = () => { const s = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1; setSpeed(s); if (ref.current) ref.current.playbackRate = s; };
  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-2xl bg-muted">
      <button type="button" onClick={toggle} className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
        {playing ? <span className="w-2.5 h-2.5 bg-primary-foreground rounded-sm" /> : <Play className="w-4 h-4" />}
      </button>
      <div className="flex items-center gap-0.5 flex-1 h-6">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} className="w-0.5 rounded-full bg-primary/40" style={{ height: `${[6,10,14,8,16,12,18,9,14,7,12,16,10,6,14,8,12,6][i]}px` }} />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground">{label || '0s'}</span>
      <button type="button" onClick={changeSpeed} className="text-[10px] font-medium text-primary px-1.5 py-0.5 rounded bg-primary/10">{speed}x</button>
      <audio ref={ref} src={url} preload="metadata" onEnded={() => setPlaying(false)} />
    </div>
  );
}

export default function MessageBubble({ msg, isMe, onAction }) {
  const { t } = useLocalization();
  const timer = useRef(null);
  const startPress = () => { timer.current = setTimeout(() => onAction?.(msg), 450); };
  const clearPress = () => { if (timer.current) clearTimeout(timer.current); };

  const social = SOCIAL[msg.type];

  const body = () => {
    switch (msg.type) {
      case 'photo':
        return <img src={msg.file_url} alt={msg.content} className="rounded-2xl max-w-[220px] max-h-[260px] object-cover" loading="lazy" />;
      case 'video':
        return <video src={msg.file_url} controls className="rounded-2xl max-w-[240px] max-h-[260px]" />;
      case 'voice':
        return <VoicePlayer url={msg.file_url} label={msg.content} />;
      case 'document':
        return (
          <a href={msg.file_url} target="_blank" rel="noreferrer" download={msg.file_name || msg.content} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted">
            <FileText className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium truncate max-w-[160px]">{msg.file_name || msg.content}</p>
              <p className="text-[10px] text-muted-foreground">{msg.content}</p>
            </div>
            <Download className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </a>
        );
      case 'location':
        return (
          <a href={`https://www.google.com/maps?q=${encodeURIComponent(msg.content)}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><MapPin className="w-5 h-5 text-primary" /></div>
            <div><p className="text-xs font-medium">{t('circles.bubble.location')}</p><p className="text-[10px] text-muted-foreground">{msg.content}</p></div>
          </a>
        );
      case 'sticker':
      case 'emoji':
        return <div className="text-4xl px-1">{msg.content}</div>;
      case 'gif':
        return <img src={msg.file_url} alt={msg.content} className="rounded-2xl max-w-[200px]" loading="lazy" />;
      default:
        if (social) {
          const Icon = social.icon;
          return (
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-card border border-border min-w-[210px]">
              <div className={`w-9 h-9 rounded-xl ${social.color} flex items-center justify-center text-white flex-shrink-0`}><Icon className="w-5 h-5" /></div>
              <div className="min-w-0">
                <p className="text-xs font-semibold">{t(`circles.chat.social_${msg.type}`)}</p>
                <p className="text-[11px] text-muted-foreground truncate">{msg.content}</p>
              </div>
            </div>
          );
        }
        return <div className="px-3 py-2 text-sm whitespace-pre-wrap break-words">{msg.content}</div>;
    }
  };

  const isMedia = ['photo', 'video', 'sticker', 'emoji', 'gif'].includes(msg.type) || !!social;
  const bubbleCls = isMe
    ? (isMedia ? '' : 'rounded-tr-md bg-primary text-primary-foreground')
    : (isMedia ? '' : 'rounded-tl-md bg-muted');

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      onPointerDown={startPress}
      onPointerUp={clearPress}
      onPointerLeave={clearPress}
      onContextMenu={(e) => { e.preventDefault(); onAction?.(msg); }}
      className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''} select-none`}
    >
      <Avatar className="w-7 h-7 flex-shrink-0">
        <AvatarImage src={msg.sender_avatar} alt={msg.sender_name} />
        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{(msg.sender_name || '?').charAt(0)}</AvatarFallback>
      </Avatar>
      <div className={`max-w-[78%] ${isMe ? 'text-end' : ''}`}>
        <div className="flex items-center gap-1.5 mb-0.5 justify-start">
          <span className="text-xs font-medium">{isMe ? t('circles.bubble.you') : msg.sender_name}</span>
          {msg.sender_role === 'organizer' && (
            <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
              <Crown className="w-2.5 h-2.5" /> {t('circles.bubble.organizer')}
            </span>
          )}
        </div>
        {msg.reply_to_text && (
          <div className={`mb-1 px-2 py-1 rounded-lg bg-background/60 border-s-2 border-primary text-[10px] text-muted-foreground truncate ${isMe ? 'text-end' : ''}`}>
            ↩ {msg.reply_to_text}
          </div>
        )}
        <div className={`inline-block ${bubbleCls} ${isMedia ? '' : 'rounded-2xl'}`}>{body()}</div>
        {(msg.reactions || []).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 justify-start">
            {Array.from(new Set(msg.reactions)).map((r) => (
              <span key={r} className="text-xs bg-muted rounded-full px-1.5 py-0.5">{r} {(msg.reactions.filter((x) => x === r)).length}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}