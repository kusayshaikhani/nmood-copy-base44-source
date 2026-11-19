import React from 'react';
import { Link } from 'react-router-dom';
import { Home, MessageCircle, Sparkles } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

import { useTabNavigation } from '@/lib/tab-navigation';
import LikesNavIcon from '@/components/brand/LikesNavIcon';
import CirclesNavIcon from '@/components/brand/CirclesNavIcon';
import { formatUnreadMessageCount, useUnreadMessageCount } from '@/lib/unread-messages-store';
import { useIncomingLikes } from '@/lib/incoming-likes-store';

const navItems = [
  { label: 'Home', icon: Home, path: '/' },
  { label: 'Community', customIcon: 'circles', path: '/circles' },
  { label: 'Nmood Shares', icon: Sparkles, path: '/nmood' },
  { label: 'Likes', customIcon: 'likes', path: '/likes' },
  { label: 'Messages', icon: MessageCircle, path: '/messages' },
];

/**
 * Bottom navigation — an in-flow row, never a fixed overlay.
 *
 * Android 15+ draws the app edge-to-edge. Some WebViews do not expose a
 * non-zero CSS safe-area inset for the system gesture bar, so reserve a
 * conservative Android-only inset beneath the 63px control row. This keeps
 * every label and touch target above the phone controls without affecting
 * web or iOS layout.
 */
export default function MobileNav({ onBeforeNavigate } = {}) {
  const { handleTabClick, currentTab } = useTabNavigation();
  const unreadMessages = useUnreadMessageCount();
  const { unread: unreadLikes } = useIncomingLikes();
  const isAndroid = Capacitor.getPlatform() === 'android';
  const androidNavigationInset = 'max(32px, env(safe-area-inset-bottom, 0px))';

  return (
    <nav
      data-no-pull="true"
      data-android-safe-nav={isAndroid ? 'true' : undefined}
      aria-label="Primary navigation"
      className="flex h-[63px] flex-shrink-0 w-full flex-col rounded-t-[26px] border-t border-border/50 bg-white dark:bg-card"
      style={isAndroid ? {
        height: `calc(63px + ${androidNavigationInset})`,
        paddingBottom: androidNavigationInset,
      } : undefined}
    >
      <div className="flex h-[63px] w-full shrink-0 items-center justify-around px-1">
        {navItems.map((item) => {
          const active = currentTab === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={(event) => {
                event.preventDefault();

                if (onBeforeNavigate && !onBeforeNavigate()) {
                  return;
                }

                handleTabClick(item.path);
              }}
              className="relative flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-1"
            >
              {active && (
                <>
                  <span
                    aria-hidden="true"
                    className="absolute top-0 h-9 w-12 rounded-2xl bg-primary/10 blur-sm"
                  />

                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-0 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary"
                  />
                </>
              )}

              {item.label === 'Messages' && unreadMessages > 0 && <span aria-label={unreadMessages + ' unread messages'} className="absolute top-0 left-1/2 ml-2 z-10 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{formatUnreadMessageCount(unreadMessages)}</span>}
              {item.label === 'Likes' && unreadLikes > 0 && <span aria-label={unreadLikes + ' new likes'} className="absolute top-0 left-1/2 ml-2 z-10 min-w-5 h-5 px-1 rounded-full bg-[#ff557a] text-white text-[10px] font-bold flex items-center justify-center">{formatUnreadMessageCount(unreadLikes)}</span>}

              {item.customIcon === 'likes' ? (
                <LikesNavIcon active={active} size={20} />
              ) : item.customIcon === 'circles' ? (
                <CirclesNavIcon active={active} size={20} />
              ) : (
                <Icon
                  className={`relative h-5 w-5 ${
                    active ? 'text-primary' : 'nav-inactive'
                  }`}
                  strokeWidth={active ? 2.5 : 2}
                />
              )}

              <span
                className={`relative block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[8px] leading-none tracking-tight ${
                  active
                    ? 'font-semibold text-primary'
                    : 'font-medium nav-inactive'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
