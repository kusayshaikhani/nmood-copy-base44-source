import React, { useState } from 'react';
import { Pin, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function AnnouncementCard({ message, isOrganizer, onPin, onEdit, onDelete }) {
  const { t } = useLocalization();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex justify-center my-3 px-4">
      <div className="max-w-[85%] w-full rounded-2xl bg-primary/5 border border-primary/20 p-3.5 relative">
        {message.is_pinned && (
          <div className="absolute -top-2 -end-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md">
            <Pin className="w-3 h-3 text-primary-foreground" fill="currentColor" />
          </div>
        )}
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="w-6 h-6">
            <AvatarImage src={message.sender_avatar} alt={message.sender_name} />
            <AvatarFallback className="text-[8px] bg-primary/10 text-primary">{message.sender_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="text-xs font-semibold text-primary">{message.sender_name}</span>
          <span className="text-[10px] text-muted-foreground">{t('experience_chat.announcement')}</span>
          {isOrganizer && (
            <div className="relative ml-auto">
              <button onClick={() => setMenuOpen(!menuOpen)} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-muted" type="button">
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute end-0 top-7 z-50 w-36 bg-card border border-border rounded-xl shadow-lg py-1">
                    <button onClick={() => { onPin?.(message); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted" type="button">
                      <Pin className="w-3 h-3" /> {message.is_pinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button onClick={() => { onEdit?.(message); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted" type="button">
                      <Pencil className="w-3 h-3" /> {t('hosting.activity.edit')}
                    </button>
                    <button onClick={() => { onDelete?.(message); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-muted" type="button">
                      <Trash2 className="w-3 h-3" /> {t('circles.actions.delete')}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <p className="text-sm leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}