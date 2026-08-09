import React from 'react';
import { Settings2, MessageSquare, Share2, UserPlus, LogOut, Flag, Lock, ShieldAlert, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function CircleActionBar({
  role, privacy, registrationsOpen = true,
  onJoin, onRequestJoin, onManage, onChat, onInvite, onLeave, onShare, onSave, onReport,
}) {
  const { t } = useLocalization();
  if (role === 'organizer') {
    return (
      <div className="flex gap-2">
        <Button className="flex-1 h-10 gap-1.5" onClick={onManage}><Settings2 className="w-4 h-4" />{t('circles.manage.title')}</Button>
        <Button variant="outline" size="icon" className="h-10 w-10" onClick={onChat}><MessageSquare className="w-4 h-4" /></Button>
        <Button variant="outline" size="icon" className="h-10 w-10" onClick={onShare}><Share2 className="w-4 h-4" /></Button>
      </div>
    );
  }

  if (role === 'member') {
    return (
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <Button className="h-10 px-3 rounded-xl text-xs font-medium gap-1.5 flex-shrink-0" onClick={onChat}><MessageSquare className="w-3.5 h-3.5" />{t('circles.actionbar.open_chat')}</Button>
        <Button variant="outline" className="h-10 px-3 rounded-xl text-xs font-medium gap-1.5 flex-shrink-0" onClick={onInvite}><UserPlus className="w-3.5 h-3.5" />{t('circles.actionbar.invite_pal')}</Button>
        <Button variant="outline" className="h-10 px-3 rounded-xl text-xs font-medium gap-1.5 flex-shrink-0" onClick={onShare}><Share2 className="w-3.5 h-3.5" /> {t('hosting.success.share')}</Button>
        <Button variant="outline" className="h-10 px-3 rounded-xl text-xs font-medium gap-1.5 flex-shrink-0" onClick={onLeave}><LogOut className="w-3.5 h-3.5" /> {t('experiences.leave.leave')}</Button>
        <Button variant="ghost" className="h-10 px-3 rounded-xl text-xs font-medium gap-1.5 flex-shrink-0 text-muted-foreground" onClick={onReport}><Flag className="w-3.5 h-3.5" /> {t('circles.actionbar.report')}</Button>
      </div>
    );
  }

  if (role === 'banned') {
    return (
      <div className="flex items-center justify-center gap-2 py-2 text-sm text-destructive">
        <ShieldAlert className="w-4 h-4" />{t('circles.actionbar.banned')}</div>
    );
  }

  if (role === 'pending') {
    return (
      <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
        <Lock className="w-4 h-4" /> {t('circles.actionbar.pending')}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {privacy === 'invite' ? (
        <Button size="lg" className="flex-1" disabled><Lock className="w-4 h-4 me-1" />{t('community.detail.invitation_only')}</Button>
      ) : !registrationsOpen ? (
        <Button size="lg" className="flex-1" disabled><Lock className="w-4 h-4 me-1" />{t('circles.actionbar.registrations_closed')}</Button>
      ) : privacy === 'private' ? (
        <Button size="lg" className="flex-1" onClick={onRequestJoin}><Lock className="w-4 h-4 me-1" />{t('community.detail.request_join')}</Button>
      ) : (
        <Button size="lg" className="flex-1 bg-success hover:bg-success/90" onClick={onJoin}>{t('circles.actionbar.join_circle')}</Button>
      )}
      <Button variant="outline" size="icon" className="h-10 w-10" onClick={onShare}><Share2 className="w-4 h-4" /></Button>
      <Button variant="outline" size="icon" className="h-10 w-10" onClick={onSave}><Bookmark className="w-4 h-4" /></Button>
    </div>
  );
}