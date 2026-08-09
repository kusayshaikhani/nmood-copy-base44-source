import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCheck, MoreVertical, Pencil, Trash2, Reply, Smile, Pin } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ChatMessageBubble({ message, isMe, isHost = false, onReply, onEdit, onDelete, onPin, onReact }) {
  const { t } = useLocalization();
  const [menuOpen, setMenuOpen] = useState(false);
  const isQuickAction = message.type === 'quick_action';

  if (isQuickAction) {
    return (
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} px-4 my-1.5`}>
        <div className="max-w-[78%]">
          {!isMe && (
            <div className="flex items-center gap-1.5 mb-0.5">
              <Avatar className="w-4 h-4">
                <AvatarImage src={message.sender_avatar} alt={message.sender_name} />
                <AvatarFallback className="text-[6px] bg-primary/10 text-primary">{message.sender_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{message.sender_name}</span>
            </div>
          )}
          <div className="px-3.5 py-2 rounded-2xl bg-accent/20 border border-accent/30 text-sm font-medium">
            {message.content}
          </div>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">{formatTime(message.created_date)}</span>
        </div>
      </div>
    );
  }

  const bubbleClass = isMe
    ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md'
    : 'bg-muted text-foreground rounded-2xl rounded-bl-md';

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} px-4 my-1 group`}>
      <div className="max-w-[78%]">
        {!isMe && (
          <div className="flex items-center gap-1.5 mb-0.5">
            <Avatar className="w-4 h-4">
              <AvatarImage src={message.sender_avatar} alt={message.sender_name} />
              <AvatarFallback className="text-[6px] bg-primary/10 text-primary">{message.sender_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground font-medium">{message.sender_name}</span>
          </div>
        )}
        {message.reply_to_text && (
          <div className="px-3 py-1.5 rounded-xl bg-muted/60 border-s-2 border-primary mb-1 text-xs text-muted-foreground">
            {message.reply_to_text}
          </div>
        )}
        <div className={bubbleClass + ' px-3.5 py-2.5'}>
          {message.type === 'photo' ? (
            <img src={message.content} alt={t('circles.inmood_actions.photo')} className="rounded-xl w-48 h-48 object-cover" loading="lazy" />
          ) : message.type === 'voice' && message.file_url ? (
            <audio src={message.file_url} controls className="w-48 h-9" />
          ) : (
            <p className="text-sm leading-relaxed break-words">{message.content}</p>
          )}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex gap-0.5 mt-1.5">
              {message.reactions.map((r, i) => (
                <button key={i} type="button" onClick={() => onReact?.(message, r)} className="text-xs bg-card/80 rounded-full px-1.5 py-0.5 border border-border hover:border-primary/40">{r}</button>
              ))}
            </div>
          )}
        </div>
        <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-muted-foreground">{formatTime(message.created_date)}</span>
          {isMe && <CheckCheck className="w-3 h-3 text-primary" />}
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full flex items-center justify-center hover:bg-muted transition-opacity" type="button">
              <MoreVertical className="w-3 h-3 text-muted-foreground" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className={`absolute ${isMe ? 'end-0' : 'start-0'} top-6 z-50 w-32 bg-card border border-border rounded-xl shadow-lg py-1`}>
                  <button onClick={() => { onReply?.(message); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted" type="button">
                    <Reply className="w-3 h-3" /> {t('circles.actions.reply')}
                  </button>
                  <button onClick={() => { onReact?.(message, '👍'); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted" type="button">
                    <Smile className="w-3 h-3" /> {t('experience_chat.react')}
                  </button>
                  {isHost && (
                    <button onClick={() => { onPin?.(message); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted" type="button">
                      <Pin className="w-3 h-3" /> {message.is_pinned ? 'Unpin' : 'Pin'}
                    </button>
                  )}
                  {isMe && (
                    <>
                      <button onClick={() => { onEdit?.(message); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted" type="button">
                        <Pencil className="w-3 h-3" /> {t('hosting.activity.edit')}
                      </button>
                      <button onClick={() => { onDelete?.(message); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-muted" type="button">
                        <Trash2 className="w-3 h-3" /> {t('circles.actions.delete')}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}