import React, { useState } from 'react';
import { Smile, Paperclip, Mic, Send, X, Reply } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function MessageComposer({ onSend, replyTo, onCancelReply, onTyping }) {
  const { t } = useLocalization();
  const [text, setText] = useState('');
  const hasText = text.trim().length > 0;

  const handleSend = () => {
    if (!hasText) return;
    onSend(text.trim());
    setText('');
    if (onTyping) onTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-card px-3 pt-2 pb-3">
      {replyTo && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl bg-muted/60 border-s-2 border-primary">
          <Reply className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-primary">{t('messaging.composer.replying')}</p>
            <p className="text-xs text-muted-foreground truncate">
              {typeof replyTo.content === 'string' ? replyTo.content : t('messaging.composer.shared_content')}
            </p>
          </div>
          <button onClick={onCancelReply} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-muted flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-default flex-shrink-0">
          <Smile className="w-5 h-5 text-muted-foreground" />
        </button>
        <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-default flex-shrink-0">
          <Paperclip className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="flex-1 bg-muted/60 rounded-2xl px-3.5 py-2 min-h-[40px] flex items-center">
          <input
            type="text"
            value={text}
            onChange={(e) => { setText(e.target.value); if (onTyping) onTyping(e.target.value.trim().length > 0); }}
            onKeyDown={handleKeyDown}
            placeholder={t('messaging.composer.placeholder')}
            className="w-full bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
          />
        </div>

        {hasText ? (
          <button
            onClick={handleSend}
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-default flex-shrink-0"
          >
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        ) : (
          <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-default flex-shrink-0">
            <Mic className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}