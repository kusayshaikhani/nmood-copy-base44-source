import PendingInvitations from '@/components/invite/PendingInvitations';
import { respondCircleMembership } from '@/lib/circle-membership';
import { respondExperienceAttendance } from '@/lib/experience-membership';
import { refreshNotificationCenter } from '@/lib/notifications-store';
import { notificationDestination } from '@/lib/notification-destination';
import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Trash2, Check, Mail, X, CheckSquare } from 'lucide-react';
import NotificationsPremiumHero from '@/components/notifications/premium/NotificationsPremiumHero';
import NotificationsPremiumTabs from '@/components/notifications/premium/NotificationsPremiumTabs';
import NotificationGroupSection from '@/components/notifications/premium/NotificationGroupSection';
import NotificationsEmptyPremium from '@/components/notifications/premium/NotificationsEmptyPremium';
import NotificationsSkeleton from '@/components/notifications/premium/NotificationsSkeleton';
import NotificationsSettings from '@/components/notifications/NotificationsSettings';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { useNotifications } from '@/lib/notifications-store';
import { notificationSettings as defaultSettings } from '@/lib/notifications-data';
import { respondCircleInvitation, respondExperienceInvitation } from '@/api/supabaseClient';
import { groupNotifications, matchesNotificationFilter } from '@/lib/notification-presentation';
import { feedback } from '@/lib/feedback';

/**
 * UI-019 — Complete Notifications Center redesign (Nmood Premium Design System).
 * Sticky gradient header (title + subtitle + actions) merges with a solid
 * tab bar into one sticky unit. Below: 22px rounded cards with category
 * accents, unread indicators, skeleton loaders, and elegant section
 * headers. The notification engine (store, actions, persistence) is
 * untouched — only the presentation layer changed.
 */
export default function Notifications() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const {
    items, unreadCount, loading, error,
    markAllRead, markRead, markSelectedAsRead, markSelectedAsUnread,
    deleteNotification, deleteSelected,
  } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('filter') || 'all';
  const setTab = filter => setSearchParams(filter === 'all' ? {} : { filter }, { replace: true });
  const [undo,setUndo]=useState(null),[dismissError,setDismissError]=useState('');
  const undoBusy=useRef(false);
  const dismiss=async id=>{try{const restore=await deleteNotification(id);if(restore)setUndo(()=>restore);setDismissError('');}catch{setDismissError('Notification could not be dismissed. Please try again.');}};
  const restoreDismissed=async()=>{if(undoBusy.current||!undo)return;undoBusy.current=true;try{await undo();setUndo(null);setDismissError('');}catch{setDismissError('Undo could not finish. Please try again.');}finally{undoBusy.current=false;}};
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const filtered = items.filter(n => matchesNotificationFilter(n, tab));
  const groups = groupNotifications(filtered);

  const handleMarkAllRead = () => markAllRead().catch(feedback.error);

  const toggleSetting = (id) => {
    setSettings((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };

  const groupFlights = useRef(new Set());
  const handleAction = async (action, notification) => {
    if (['approve_group_request','decline_group_request'].includes(action)) {
      if (!notification._groupRequest || groupFlights.current.has(notification.id)) return;
      groupFlights.current.add(notification.id);
      try {
        const respond = notification._type === 'circle_join_request' ? respondCircleMembership : respondExperienceAttendance;
        await respond(notification._entityId, action === 'approve_group_request');
        window.dispatchEvent(new Event('nmood:feed-changed'));
        await refreshNotificationCenter();
      } catch { feedback.error(new Error('This request could not be updated. Refresh to check its current status.')); }
      finally { groupFlights.current.delete(notification.id); }
      return;
    }
    if (notification._locked && !['read', 'mute', 'delete'].includes(action)) { navigate('/upgrade'); return; }
    if (action === 'open_outgoing_request') {
      const path = notification._recipientPath;
      if (path !== '/pals' && !(typeof path === 'string' && /^\/pal\/[^/]+$/.test(path))) return;
      markRead(notification.id).catch(feedback.error);
      navigate(path);
      return;
    }
    if (action === 'open_requester') {
      if (!notification._actorId || notification._actor?.deleted || notification._targetAvailable === false) return;
      markRead(notification.id).catch(feedback.error);
      navigate(`/pal/${encodeURIComponent(notification._actorId)}`);
      return;
    }
    if (action === 'read' || action === 'mute') {
      markRead(notification.id).catch(feedback.error);
      return;
    }
    if (action === 'delete') {
      void dismiss(notification.id);
      return;
    }

    markRead(notification.id).catch(feedback.error);
    if (notification._targetAvailable === false) { feedback.error(new Error('This item is no longer available.')); return; }

    if (action === 'open_activity' && ['announcement','welcome'].includes(notification._type)) {
      navigate(notificationDestination(notification));
    } else if (action === 'open_safety') {
      navigate('/safety-center');
    } else if (action === 'view_own_profile') {
      navigate('/profile');
    } else if (action === 'open_invitation') {
      navigate(`/${notification._invitationType === 'circle' ? 'circle' : 'experience'}/${notification._targetId}`);
    } else if (action === 'open_activity') {
      navigate(notificationDestination(notification));
    } else if (['approve', 'view_activity', 'open_circle', 'get_directions'].includes(action)) {
      navigate('/my-experiences');
    } else if (['view_profile', 'accept', 'send_message'].includes(action)) {
      navigate('/pals');
    } else if (action === 'open_chat') {
      navigate('/messages');
    } else if (action === 'explore') {
      navigate('/explore');
    } else if (action === 'renew_membership' || action === 'upgrade') {
      navigate('/membership');
    } else if (action === 'decline_invitation') {
      try {
        const respond = notification._invitationType === 'circle' ? respondCircleInvitation : respondExperienceInvitation;
        await respond(notification._entityId, 'declined');
        deleteNotification(notification.id).catch(feedback.error);
      } catch (error) {
        feedback.error(error);
      }
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(filtered.map((n) => n.id)));

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleMarkSelectedRead = () => markSelectedAsRead([...selectedIds]).catch(feedback.error);
  const handleMarkSelectedUnread = () => markSelectedAsUnread([...selectedIds]).catch(feedback.error);
  const handleDeleteSelected = () => {
    deleteSelected([...selectedIds]).catch(feedback.error);
    exitSelectMode();
  };

  return (
    <div className="bg-background min-h-screen flex flex-col">
      {/* Sticky header = gradient hero + solid tab bar */}
      <div className="sticky top-0 z-30">
        <NotificationsPremiumHero
          onMarkAllRead={handleMarkAllRead}
          onOpenSettings={() => setSettingsOpen(true)}
          unreadCount={unreadCount}
        />
        <div className="bg-background px-6 pt-4 pb-3 border-b border-border/40">
          <NotificationsPremiumTabs tab={tab} onTabChange={setTab} unreadCount={unreadCount} />
        </div>
      </div>

      {undo&&<div role="status" className="sticky top-0 z-40 flex items-center justify-between rounded-xl bg-card p-3 shadow">Notification dismissed.<button type="button" className="min-h-11 px-4 text-primary" onClick={()=>void restoreDismissed()}>Undo</button></div>}
      {dismissError&&<p role="alert">{dismissError}</p>}
      {/* Content */}
      <div
        className="flex-1 px-6 pt-5 pb-28"
      >
        {/* Select-mode toggle + multi-select toolbar */}
        {!selectMode && filtered.length > 0 && !loading && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setSelectMode(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              {t('notifications.select')}
            </button>
          </div>
        )}

        {selectMode && (
          <div className="flex items-center justify-between gap-2 mb-5 p-3 rounded-card border border-primary/25 bg-primary/5 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {selectedIds.size} {t('notifications.selected')}
              </span>
              <button onClick={selectAll} className="text-xs text-primary font-medium hover:underline">
                {t('notifications.select_all')}
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handleMarkSelectedRead} disabled={selectedIds.size === 0} className="flex items-center gap-1 px-2.5 py-1.5 rounded-button text-xs font-medium hover:bg-muted transition-default disabled:opacity-40" title={t('notifications.mark_read')}>
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('notifications.mark_read')}</span>
              </button>
              <button onClick={handleMarkSelectedUnread} disabled={selectedIds.size === 0} className="flex items-center gap-1 px-2.5 py-1.5 rounded-button text-xs font-medium hover:bg-muted transition-default disabled:opacity-40" title={t('notifications.mark_unread')}>
                <Mail className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('notifications.mark_unread')}</span>
              </button>
              <button onClick={handleDeleteSelected} disabled={selectedIds.size === 0} className="flex items-center gap-1 px-2.5 py-1.5 rounded-button text-xs font-medium text-destructive hover:bg-destructive/10 transition-default disabled:opacity-40" title={t('notifications.delete')}>
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('notifications.delete')}</span>
              </button>
              <button onClick={exitSelectMode} className="flex items-center gap-1 px-2.5 py-1.5 rounded-button text-xs font-medium hover:bg-muted transition-default">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {error && <p role="status" className="mb-4 text-sm text-muted-foreground">{error} Your saved notifications remain below.</p>}

        {['all', 'activities'].includes(tab) && <PendingInvitations />}

        {/* Notification list */}
        {loading ? (
          <NotificationsSkeleton />
        ) : filtered.length === 0 ? (
          <NotificationsEmptyPremium />
        ) : (
          <div className="space-y-7">
            {groups.map((g) => (
              <section key={g.label} aria-label={g.label} className="space-y-5">
              <h2 className="text-lg font-semibold">{g.label}</h2>
              {g.sections.map(section => <NotificationGroupSection
                key={section.label}
                label={section.label}
                items={section.items}
                onAction={handleAction}
                selectMode={selectMode}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
              />)}
              </section>
            ))}
          </div>
        )}
      </div>

      <NotificationsSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onToggle={toggleSetting}
      />
    </div>
  );
}