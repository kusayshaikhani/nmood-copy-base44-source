import {circleAction} from '@/lib/participation-actions';
import React from 'react';
import { Share2, UserPlus, LogOut, Lock, ShieldAlert, Bookmark } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * Premium sticky bottom CTA. Reuses the exact same action handlers as the
 * legacy CircleActionBar (no business logic duplicated) — restyled only.
 */
export default function CircleStickyCta({
  role, privacy, registrationsOpen = true, hasPendingInvite = false,
  joining = false, suppressJoin = false, loading = false, error = false, administrator = false, visibility, full = false,
  onJoin, onRequestJoin, onManage: _onManage, onChat: _onChat, onInvite, onLeave, onShare, onSave, onReport: _onReport,
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

  if (!loading && !error && role === 'organizer') {
    return null;
  }

  if (!loading && !error && role === 'member') {
    return (
      <div className="rounded-2xl border border-border bg-card p-3 shadow-soft">
        <p role="status" className="mb-3 text-center text-sm font-medium">{privacy === 'approval' ? 'Your request was approved' : 'You joined this Circle'}</p>
        <div className="grid grid-cols-3 gap-2">
          {[[onInvite, 'Invite Pals', UserPlus], [onShare, 'Share', Share2], [onLeave, 'Leave Circle', LogOut]].map(([handler, label, Icon]) => <button key={label} type="button" onClick={handler} className="flex min-h-12 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-2 py-2 text-xs font-semibold sm:text-sm"><Icon className="h-4 w-4 shrink-0" aria-hidden="true"/><span>{label}</span></button>)}
        </div>
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

  if (!loading && !error && role === 'pending') {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm font-medium text-muted-foreground">
        <Lock className="w-5 h-5 shrink-0" /> Join request sent — awaiting approval
      </div>
    );
  }

  const action = circleAction({role,privacy,visibility,loading,error,administrator,registrationsOpen,full,hasPendingInvite});
  const disabled = !action.enabled || suppressJoin;
  return (
    <div className="flex gap-2.5 items-center">
      <button
        type="button"
        disabled={disabled || joining}
        onClick={action.state === 'join' ? onJoin : onRequestJoin}
        className="pressable flex-1 h-14 rounded-button bg-nmood-gradient text-primary-foreground font-semibold shadow-card hover:shadow-elevated flex items-center justify-center gap-2 transition-default disabled:opacity-50 disabled:grayscale"
      >
        <Lock className="w-5 h-5" /> {action.label}
      </button>
      <IconBtn onClick={onShare} label={t('hosting.success.share')}><Share2 className="w-5 h-5" /></IconBtn>
      <IconBtn onClick={onSave} label={t('common.save')}><Bookmark className="w-5 h-5" /></IconBtn>
    </div>
  );
}