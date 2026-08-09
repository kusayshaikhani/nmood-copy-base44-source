import React from 'react';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-007 — Premium pill tabs for the Notifications page.
 */
export default function NotificationTabs({ tab, onTabChange, unreadCount }) {
  const { t } = useLocalization();
  const tabs = [
    { id: 'all', label: t('notifications.tab.all') },
    { id: 'unread', label: t('notifications.tab.unread') },
    { id: 'activities', label: t('notifications.tab.activities') },
    { id: 'pals', label: t('notifications.tab.pals') },
    { id: 'system', label: t('notifications.tab.system') },
  ];

  return (
    <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar overscroll-x-contain -mx-6 px-6 snap-x snap-mandatory">
      {tabs.map((t2) => {
        const isActive = tab === t2.id;
        return (
          <button
            key={t2.id}
            onClick={() => onTabChange(t2.id)}
            className={`snap-start px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-default flex items-center gap-1.5 border ${isActive ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:bg-muted'}`}
          >
            {t2.label}
            {t2.id === 'unread' && unreadCount > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-primary-foreground/20' : 'bg-primary/10 text-primary'}`}>
                {unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}