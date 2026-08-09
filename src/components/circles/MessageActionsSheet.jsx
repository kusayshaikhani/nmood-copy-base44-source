import React from 'react';
import BottomSheet from '@/components/shared/BottomSheet';
import { Reply, Copy, Pin, PinOff, Trash2, Pencil } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const REACT_EMOJIS = ['❤️', '😂', '👍', '🔥', '🎉', '💜'];

export default function MessageActionsSheet({ msg, open, onOpenChange, onReply, onEdit, onCopy, onPin, onReact, onDelete, canEdit }) {
  const { t } = useLocalization();
  const Row = ({ icon: Icon, label, onClick, danger }) => (
    <button type="button" onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-default text-start ${danger ? 'text-destructive' : ''}`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('circles.actions.title')}>
      <div className="space-y-3">
        <div className="flex gap-2 justify-around">
          {REACT_EMOJIS.map((e) => (
            <button key={e} type="button" onClick={() => onReact?.(e)}
              className="w-10 h-10 rounded-full bg-muted hover:bg-primary/10 hover:scale-110 transition-default text-xl flex items-center justify-center">
              {e}
            </button>
          ))}
        </div>
        <div className="pt-2 border-t border-border space-y-1">
          <Row icon={Reply} label={t('circles.actions.reply')} onClick={() => onReply?.()} />
          {canEdit && <Row icon={Pencil} label={t('circles.actions.edit')} onClick={() => onEdit?.()} />}
          <Row icon={Copy} label={t('circles.actions.copy')} onClick={() => onCopy?.()} />
          <Row icon={msg?.is_pinned ? PinOff : Pin} label={msg?.is_pinned ? t('circles.actions.unpin') : t('circles.actions.pin')} onClick={() => onPin?.()} />
          <Row icon={Trash2} label={t('circles.actions.delete')} onClick={() => onDelete?.()} danger />
        </div>
      </div>
    </BottomSheet>
  );
}