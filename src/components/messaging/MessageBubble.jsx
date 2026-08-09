import React, { useState, useRef } from 'react';
import { Check, CheckCheck, Clock, MapPin, Play, Pause, FileText, Download, X } from 'lucide-react';
import ShareMessage from './ShareMessage';
import { useLocalization } from '@/lib/i18n/useLocalization';

function VoicePlayer({ url, label }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    const a = ref.current;
    if (!a) return;
    if (a.paused) { a.play(); setPlaying(true); } else { a.pause(); setPlaying(false); }
  };
  return (
    <div className="flex items-center gap-2.5 py-0.5 min-w-[160px]">
      <button type="button" onClick={toggle} className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
      </button>
      <span className="text-xs font-medium flex-shrink-0">{label}</span>
      <audio ref={ref} src={url} preload="metadata" onEnded={() => setPlaying(false)} />
    </div>
  );
}

export default function MessageBubble({ message, onTap }) {
  const { t } = useLocalization();
  const [lightbox, setLightbox] = useState(false);
  const isMe = message.sender === 'me';
  const containerAlign = isMe ? 'justify-end' : 'justify-start';
  const bubbleClass = isMe
    ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md'
    : 'bg-muted text-foreground rounded-2xl rounded-bl-md';
  const metaAlign = isMe ? 'justify-end' : 'justify-start';
  const statusColor = 'text-muted-foreground';

  const renderContent = () => {
    switch (message.type) {
      case 'text':
        return <p className="text-sm leading-relaxed break-words">{message.content}</p>;
      case 'emoji':
        return <span className="text-4xl leading-none">{message.content}</span>;
      case 'photo':
        return (
          <button type="button" onClick={() => setLightbox(true)} className="block rounded-xl overflow-hidden w-48 h-48 -m-1">
            <img src={message.content} alt={t('messaging.share.profile')} className="w-full h-full object-cover" />
          </button>
        );
      case 'gif':
        return (
          <button type="button" onClick={() => setLightbox(true)} className="block rounded-xl overflow-hidden -m-1">
            <img src={message.content} alt="GIF" className="w-48 h-48 object-cover" />
          </button>
        );
      case 'voice':
        return <VoicePlayer url={message.content.url} label={message.content.duration} />;
      case 'document':
        return (
          <a href={message.content.url} target="_blank" rel="noreferrer" download={message.content.name} className="flex items-center gap-2.5 py-1 min-w-[180px]">
            <div className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{message.content.name}</p>
              <p className="text-[10px] opacity-70">{message.content.size}</p>
            </div>
            <Download className="w-4 h-4 flex-shrink-0" />
          </a>
        );
      case 'location':
        return (
          <div className="rounded-xl overflow-hidden w-52 -m-1">
            <div className="h-24 bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center">
              <MapPin className="w-7 h-7 text-primary" />
            </div>
            <p className="text-xs px-2.5 py-2 font-medium">{message.content.name}</p>
          </div>
        );
      case 'activity_share':
      case 'circle_share':
      case 'profile_share':
        return <ShareMessage type={message.type} content={message.content} isMe={isMe} />;
      default:
        return null;
    }
  };

  const renderStatus = () => {
    if (!isMe) return null;
    if (message.status === 'read') return <CheckCheck className="w-3.5 h-3.5 text-primary" />;
    if (message.status === 'delivered') return <CheckCheck className="w-3.5 h-3.5" />;
    if (message.status === 'sent') return <Clock className="w-3.5 h-3.5" />;
    return null;
  };

  const hasPadding = !['photo', 'gif', 'location'].includes(message.type);

  return (
    <>
      <div className={'flex ' + containerAlign}>
        <div className="max-w-[78%]" onClick={() => onTap && onTap(message)}>
          <div className={bubbleClass + (hasPadding ? ' px-3.5 py-2.5' : ' p-1')}>
            {renderContent()}
          </div>
          <div className={'flex items-center gap-1 mt-1 ' + metaAlign}>
            <span className={'text-[10px] ' + statusColor}>{message.time}</span>
            {renderStatus()}
          </div>
        </div>
      </div>
      {lightbox && (message.type === 'photo' || message.type === 'gif') && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center" onClick={() => setLightbox(false)}>
          <button type="button" className="absolute top-4 end-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center" aria-label="Close">
            <X className="w-5 h-5 text-white" />
          </button>
          <img src={message.content} alt="Preview" className="max-w-[92vw] max-h-[92vh] object-contain" />
        </div>
      )}
    </>
  );
}