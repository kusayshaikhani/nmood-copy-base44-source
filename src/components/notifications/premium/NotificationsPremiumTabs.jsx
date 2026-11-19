import React from 'react';
import { notificationFilters } from '@/lib/notification-presentation';

/**
 * UI-019 — Premium pill tabs with animated active indicator.
 * Snap-scrolling, smooth transitions, unread badge.
 */
export default function NotificationsPremiumTabs({ tab, onTabChange, unreadCount }) {
  const tabs = notificationFilters.map(([id, label]) => ({ id, label }));

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar overscroll-x-contain snap-x snap-mandatory">
      {tabs.map((tabItem) => {
        const isActive = tab === tabItem.id;
        return (
          <button
            key={tabItem.id}
            aria-pressed={isActive}
            onClick={() => onTabChange(tabItem.id)}
            className={`relative snap-start px-4 min-h-11 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-200 flex items-center gap-1.5 border ${
              isActive
                ? 'bg-primary text-primary-foreground border-primary shadow-soft'
                : 'bg-card text-muted-foreground border-border hover:bg-muted/60'
            }`}
          >
            {tabItem.label}
            {tabItem.id === 'unread' && unreadCount > 0 && (
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                isActive ? 'bg-primary-foreground/20' : 'bg-primary/10 text-primary'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}