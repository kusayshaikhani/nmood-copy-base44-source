import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Sparkles, MessageCircle, UsersRound } from 'lucide-react';

import { useTabNavigation } from '@/lib/tab-navigation';
import NmoodNavIcon from '@/components/brand/NmoodNavIcon';

const navItems = [
  { label: 'Home', icon: Home, path: '/' },
  { label: 'Discover', icon: Sparkles, path: '/explore' },
  { label: 'Nmood', customIcon: 'nmood', path: '/nmood' },
  { label: 'Circles', icon: UsersRound, path: '/communities' },
  { label: 'Messages', icon: MessageCircle, path: '/messages' },
];

/**
 * Bottom navigation — fixed in-flow 126px tall row (no portal, no fixed
 * positioning, no safe-area padding).
 *
 * Sits as the last flex child of AppShell's h-dvh flex-column. The nav
 * occupies a fixed 126px height so content scrolls above it with no
 * obstruction and no Android safe-area inflation.
 */
export default function MobileNav({ onBeforeNavigate } = {}) {
  const { handleTabClick, currentTab } = useTabNavigation();

  return (
    <nav
      data-no-pull="true"
      aria-label="Primary navigation"
      className="flex h-[63px] flex-shrink-0 w-full flex-col rounded-t-[26px] border-t border-border/50 bg-white dark:bg-card"
    >
      <div className="flex h-full w-full items-center justify-around px-3">
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
              className="relative flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1"
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

              {item.customIcon === 'nmood' ? (
                <NmoodNavIcon active={active} size={28} />
              ) : (
                <Icon
                  className={`relative h-5 w-5 ${
                    active ? 'text-primary' : 'nav-inactive'
                  }`}
                  strokeWidth={active ? 2.5 : 2}
                />
              )}

              <span
                className={`relative text-[10px] ${
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