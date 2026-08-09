import React from 'react';
import { Settings2, MessageSquare, Share2, UserPlus, LogOut, Lock, ShieldAlert, Bookmark } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * Premium sticky bottom CTA. Reuses the exact same action handlers as the
 * legacy CircleActionBar (no business logic duplicated) — restyled only.
 */
export default function CircleStickyCta({
  role, privacy, registrationsOpen = true,
  onJoin, onRequestJoin, onManage, onChat, onInvite, onLeave, onShare, onSave, onReport,
}) {
  const { t } = useLocalization();

  const IconBtn = ({ onClick, label, children }) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="pressable h-14 w-14 flex-shrink-0 rounded-button border border-border bg-card text-foreground shadow-soft hover:bg-secondary flex items-center justify-center transition-default"
    >
      {children}
    </button>
  );

  if (role === 'organizer') {
    return (
      <div className="flex gap-2.5 items-center">
        <button type="button" onClick={onManage} className="pressable flex-1 h-14 rounded-button bg-nmood-gradient text-primary-foreground font-semibold shadow-card hover:shadow-elevated flex items-center justify-center gap-2 transition-default">
          <Settings2 className="w-5 h-5" /> {t('circles.manage.title')}
        </button>
        <IconBtn onClick={onChat} label={t('circles.actionbar.open_chat')}><MessageSquare className="w-5 h-5" /></IconBtn>
        <IconBtn onClick={onShare} label={t('hosting.success.share')}><Share2 className="w-5 h-5" /></IconBtn>
      </div>
    );
  }

  if (role === 'member') {
    return (
      <div className="flex gap-2.5 items-center">
        <button type="button" onClick={onChat} className="pressable flex-1 h-14 rounded-button bg-nmood-gradient text-primary-foreground font-semibold shadow-card hover:shadow-elevated flex items-center justify-center gap-2 transition-default">
          <MessageSquare className="w-5 h-5" /> {t('circles.actionbar.open_chat')}
        </button>
        <IconBtn onClick={onInvite} label={t('circles.actionbar.invite_pal')}><UserPlus className="w-5 h-5" /></IconBtn>
        <IconBtn onClick={onShare} label={t('hosting.success.share')}><Share2 className="w-5 h-5" /></IconBtn>
        <IconBtn onClick={onLeave} label={t('experiences.leave.leave')}><LogOut className="w-5 h-5" /></IconBtn>
      </div>
    );
  }

  if (role === 'banned') {
    return (
      <div className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-destructive">
        <ShieldAlert className="w-5 h-5" /> {t('circles.actionbar.banned')}
      </div>
    );
  }

  if (role === 'pending') {
    return (
      <div className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-muted-foreground">
        <Lock className="w-5 h-5" /> {t('circles.actionbar.pending')}
      </div>
    );
  }

  // visitor
  const disabled = !registrationsOpen || privacy === 'invite';
  return (
    <div className="flex gap-2.5 items-center">
      <button
        type="button"
        disabled={disabled}
        onClick={privacy === 'private' ? onRequestJoin : onJoin}
        className="pressable flex-1 h-14 rounded-button bg-nmood-gradient text-primary-foreground font-semibold shadow-card hover:shadow-elevated flex items-center justify-center gap-2 transition-default disabled:opacity-50 disabled:grayscale"
      >
        {disabled ? (<><Lock className="w-5 h-5" /> {privacy === 'invite' ? t('circles.actionbar.invitation_only') : t('circles.actionbar.registrations_closed')}</>)
          : privacy === 'private' ? (<><Lock className="w-5 h-5" /> {t('circles.actionbar.request_to_join')}</>)
          : t('circles.actionbar.join_circle')}
      </button>
      <IconBtn onClick={onShare} label={t('hosting.success.share')}><Share2 className="w-5 h-5" /></IconBtn>
      <IconBtn onClick={onSave} label={t('common.save')}><Bookmark className="w-5 h-5" /></IconBtn>
    </div>
  );
}