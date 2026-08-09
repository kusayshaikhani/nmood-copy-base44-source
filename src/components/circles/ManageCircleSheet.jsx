import React from 'react';
import BottomSheet from '@/components/shared/BottomSheet';
import { Pencil, Users, UserPlus, MessageSquare, Settings2, Pause, Play, Archive, RotateCcw, Trash2, Inbox, Crown } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const Row = ({ icon: Icon, label, onClick, danger }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm active:scale-[0.99] transition-default text-start ${danger ? 'text-destructive' : ''}`}
  >
    <Icon className={`w-4 h-4 ${danger ? 'text-destructive' : 'text-primary'}`} />
    <span className="text-sm font-medium flex-1">{label}</span>
  </button>
);

export default function ManageCircleSheet({
  open, onOpenChange, status, memberCount, registrationsOpen,
  onEdit, onMembers, onInvite, onChat, onTransfer, onCloseRegistrations, onOpenRegistrations, onPause, onResume, onArchive, onRestore, onDelete,
}) {
  const isActive = !status || status === 'active';
  const isPaused = status === 'paused';
  const isArchived = status === 'archived';

  const { t } = useLocalization();
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('circles.manage.title')}>
      <div className="space-y-2">
        {isPaused && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/10 text-warning text-xs font-medium mb-1">
            <Pause className="w-4 h-4" /> {t('circles.manage.paused_only_you')}
          </div>
        )}
        {isArchived && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted text-muted-foreground text-xs font-medium mb-1">
            <Archive className="w-4 h-4" /> {t('circles.manage.archived_only_you')}
          </div>
        )}
        <Row icon={Pencil} label={t('circles.manage.edit')} onClick={onEdit} />
        <Row icon={Users} label={`Members (${memberCount})`} onClick={onMembers} />
        <Row icon={Inbox} label={t('circles.manage.requests')} onClick={onMembers} />
        <Row icon={UserPlus} label={t('calendar.filter.pending')} onClick={onInvite} />
        <Row icon={MessageSquare} label={t('community.detail.tab_chat')} onClick={onChat} />
        <Row icon={Settings2} label={t('circles.manage.settings')} onClick={onEdit} />
        {registrationsOpen !== false
          ? <Row icon={Inbox} label={t('experiences.host_controls.close')} onClick={onCloseRegistrations} />
          : <Row icon={Inbox} label={t('circles.manage.open_registrations')} onClick={onOpenRegistrations} />}
        <Row icon={Crown} label={t('circles.transfer.title')} onClick={onTransfer} />
        {isActive && <Row icon={Pause} label={t('circles.manage.pause_circle')} onClick={onPause} />}
        {isPaused && <Row icon={Play} label={t('circles.manage.resume_circle')} onClick={onResume} />}
        {(isActive || isPaused) && <Row icon={Archive} label={t('circles.manage.archive_circle')} onClick={onArchive} />}
        {isArchived && <Row icon={RotateCcw} label={t('circles.manage.restore_circle')} onClick={onRestore} />}
        <Row icon={Trash2} label={t('circles.manage.delete_circle')} onClick={onDelete} danger />
      </div>
    </BottomSheet>
  );
}