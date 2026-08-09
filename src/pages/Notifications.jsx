import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import NmoodNotificationsBanner from '@/components/notifications/NmoodNotificationsBanner';

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
    items, loading, groupOrder, groupLabels,
    markAllRead, markRead, markUnread, markSelectedAsRead, markSelectedAsUnread,
    deleteNotification, deleteSelected,
  } = useNotifications();
  const [tab, setTab] = useState('all');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const unreadCount = items.filter((n) => !n.read).length;

  const filtered = items.filter((n) => {
    if (tab === 'all') return true;
    if (tab === 'unread') return !n.read;
    return n.tab === tab;
  });

  const groups = groupOrder
    .map((g) => ({ group: g, label: t(`notifications.group.${groupLabels[g]}`), items: filtered.filter((n) => n.group === g) }))
    .filter((g) => g.items.length > 0);

  const handleMarkAllRead = () => markAllRead();

  const toggleSetting = (id) => {
    setSettings((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };

  const handleAction = (action, notification) => {
    if (action === 'read' || action === 'mute') {
      markRead(notification.id);
      return;
    }
    if (action === 'delete') {
      deleteNotification(notification.id);
      return;
    }

    markRead(notification.id);

    if (['approve', 'view_activity', 'open_activity', 'open_circle', 'get_directions'].includes(action)) {
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
      deleteNotification(notification.id);
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

  const handleMarkSelectedRead = () => markSelectedAsRead([...selectedIds]);
  const handleMarkSelectedUnread = () => markSelectedAsUnread([...selectedIds]);
  const handleDeleteSelected = () => {
    deleteSelected([...selectedIds]);
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

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
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

        {/* Notification list */}
        {loading ? (
          <NotificationsSkeleton />
        ) : filtered.length === 0 ? (
          <NotificationsEmptyPremium />
        ) : (
          <div className="space-y-7">
            <NmoodNotificationsBanner />
            {groups.map((g) => (
              <NotificationGroupSection
                key={g.group}
                label={g.label}
                items={g.items}
                onAction={handleAction}
                selectMode={selectMode}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        )}
      </motion.div>

      <NotificationsSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onToggle={toggleSetting}
      />
    </div>
  );
}