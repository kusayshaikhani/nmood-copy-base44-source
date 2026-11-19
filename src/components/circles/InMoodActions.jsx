import React from 'react';
import BottomSheet from '@/components/shared/BottomSheet';
import { Camera, Image as ImageIcon, Video, Mic, FileText, MapPin, Sparkles, Sticker, Smile, Coffee, PartyPopper, Users, Handshake, Settings2 } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const ACTIONS = [
  { key: 'camera', icon: Camera, color: 'bg-rose-500' },
  { key: 'photo', icon: ImageIcon, color: 'bg-violet-500' },
  { key: 'video', icon: Video, color: 'bg-sky-500' },
  { key: 'voice', icon: Mic, color: 'bg-amber-500' },
  { key: 'document', icon: FileText, color: 'bg-indigo-500' },
  { key: 'location', icon: MapPin, color: 'bg-emerald-500' },
  { key: 'gif', icon: Sparkles, color: 'bg-pink-500' },
  { key: 'sticker', icon: Sticker, color: 'bg-fuchsia-500' },
  { key: 'emoji', icon: Smile, color: 'bg-yellow-500' },
];

const SOCIAL = [
  { key: 'coffee', icon: Coffee, color: 'bg-amber-600' },
  { key: 'experience', icon: PartyPopper, color: 'bg-primary' },
  { key: 'circle', icon: Users, color: 'bg-accent' },
  { key: 'pal', icon: Handshake, color: 'bg-success' },
];

export default function InMoodActions({ open, onOpenChange, onAction, onSocial, onManage, manageLabel, manageTestId = 'chat-manage-action' }) {
  const { t } = useLocalization();
  const Tile = ({ a, social }) => {
    const Icon = a.icon;
    const labelKey = social
      ? `circles.inmood_actions.${a.key === 'coffee' ? 'invite_coffee' : a.key === 'experience' ? 'invite_experience' : a.key === 'circle' ? 'invite_circle' : 'add_pal'}`
      : `circles.inmood_actions.${a.key}`;
    return (
      <button
        type="button"
        onClick={() => { if (social) onSocial?.(a.key); else onAction?.(a.key); onOpenChange?.(false); }}
        className="flex flex-col items-center gap-1.5 group"
      >
        <span className={`w-12 h-12 rounded-2xl ${a.color} flex items-center justify-center text-white group-hover:scale-105 group-active:scale-95 transition-default`}>
          <Icon className="w-5 h-5" />
        </span>
        <span className="text-[10px] font-medium text-center leading-tight">{t(labelKey)}</span>
      </button>
    );
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('circles.inmood_actions.title')}>
      <div className="space-y-4 pb-[calc(18px+env(safe-area-inset-bottom,0px))]" data-testid="chat-action-menu">
        <div className="grid grid-cols-4 gap-3" data-testid="chat-action-icon-grid">
          {ACTIONS.map((a) => <Tile key={a.key} a={a} />)}
        </div>
        <div className="pt-2 border-t border-border" data-testid="chat-connect-section">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('circles.inmood_actions.connect')}</p>
          <div className="grid grid-cols-4 gap-3">
            {SOCIAL.map((a) => <Tile key={a.key} a={a} social />)}
          </div>
        </div>
        {onManage && (
          <button
            type="button"
            onClick={() => { onManage(); onOpenChange?.(false); }}
            data-testid={manageTestId}
            className="pressable w-full min-h-[48px] rounded-button bg-nmood-gradient text-primary-foreground font-semibold shadow-card flex items-center justify-center gap-2 min-w-0 overflow-hidden"
          >
            <Settings2 className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">{manageLabel}</span>
          </button>
        )}
      </div>
    </BottomSheet>
  );
}