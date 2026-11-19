import React from 'react';
import {canUnsend, canHideMessage} from '@/lib/chat-removal';
import { Reply, Pencil, Copy, Trash2, Flag, X } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function MessageOptionsSheet({ message, onClose, onReply, onCopy, onDelete, onDeleteForMe, onEdit, onReport }) {
  const { t } = useLocalization();
  if (!message) return null;
  const isMe = message.sender === 'me';

  const btnClass = 'w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-default text-start text-sm font-medium';

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-card rounded-t-2xl p-4 pb-[calc(2rem+env(safe-area-inset-bottom))]" style={{ animation: 'slideUp 0.2s ease-out' }}>
        <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />

        <div className="mb-3 px-2">
          <p className="text-xs text-muted-foreground">
            {typeof message.content === 'string' ? message.content.slice(0, 80) : t('messaging.options.title')}
          </p>
        </div>

        <button onClick={() => onReply(message)} className={btnClass}>
          <Reply className="w-4 h-4 text-primary" />
          {t('messaging.options.reply')}
        </button>
        <button onClick={() => onCopy(message)} className={btnClass}>
          <Copy className="w-4 h-4 text-primary" />
          {t('messaging.options.copy')}
        </button>
        {isMe && !message.unsent_at && !message.protected && message.type === 'text' && onEdit && <button onClick={() => onEdit(message)} className={btnClass}><Pencil className="w-4 h-4" />Edit</button>}
        {onDeleteForMe && canHideMessage(message) && <button onClick={() => onDeleteForMe(message)} className={btnClass + ' text-destructive'}><Trash2 className="w-4 h-4" />Delete for me</button>}
        {onDelete && canUnsend(message) && (
          <button onClick={() => onDelete(message)} className={btnClass + ' text-destructive'}>
            <Trash2 className="w-4 h-4" />
            Unsend for everyone
          </button>
        )}
        <button onClick={() => onReport(message)} className={btnClass + ' text-destructive'}>
          <Flag className="w-4 h-4" />
          {t('messaging.options.report')}
        </button>

        <button onClick={onClose} className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-2 rounded-xl border border-border text-sm font-medium">
          <X className="w-4 h-4" />
          {t('messaging.options.cancel')}
        </button>
      </div>
    </div>
  );
}