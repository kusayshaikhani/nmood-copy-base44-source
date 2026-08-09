import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import MobileNav from './MobileNav';
import TopBar from './TopBar';
import CelebrationOverlay from '@/components/engagement/CelebrationOverlay';
import WeeklyRecapGate from '@/components/engagement/WeeklyRecapGate';
import PageTransition from '@/components/shared/PageTransition';
import PullToRefresh from '@/components/shared/PullToRefresh';
import OfflineBanner from '@/components/shared/OfflineBanner';
import { useEngagement } from '@/hooks/useEngagement';
import { TabNavigationProvider } from '@/lib/tab-navigation';
import MemberDebugPanel from '@/components/dev/MemberDebugPanel';
import { useAuth } from '@/lib/AuthContext';

function EngagementOverlays() {
  const { achievements } = useEngagement();

  return (
    <>
      <CelebrationOverlay achievements={achievements} />
      <WeeklyRecapGate />
    </>
  );
}

/**
 * UI-001 — Premium application shell.
 *
 * IMPORTANT:
 * MobileNav is a REAL layout row at the bottom.
 *
 * Circle detail pages receive the FULL remaining height above MobileNav.
 * They control their own internal scrolling so their CTA can sit directly
 * against the bottom navigation instead of floating over content.
 */
export default function AppShell() {
  const location = useLocation();
  const { member } = useAuth();

  const showNav = !!member?.onboarding_completed;

  const isCircleDetail =
    /^\/circle\/[^/]+$/.test(location.pathname);

  const isExperienceDetail =
    /^\/experience\/[^/]+$/.test(location.pathname);

  const isExperienceChat =
    /^\/experience\/[^/]+\/chat$/.test(location.pathname);

  const isFullBleed =
    [
      '/',
      '/explore',
      '/discover-people',
      '/communities',
      '/notifications',
      '/profile',
      '/host/create',
      '/host/create-circle',
      '/inmood-v2',
      '/nmood',
    ].includes(location.pathname) ||
    isExperienceDetail ||
    isExperienceChat ||
    isCircleDetail;

  /*
   * CircleDetail is special:
   *
   * DO NOT let AppShell scroll it.
   * Give CircleDetail the complete remaining height.
   *
   * Structure becomes:
   *
   * ┌─────────────────────────────┐
   * │ CircleDetail                │
   * │                             │
   * │ scrollable circle content   │
   * │                             │
   * │ Request to Join             │
   * ├─────────────────────────────┤
   * │ MobileNav                   │
   * └─────────────────────────────┘
   */
  // /nmoods needs the TopBar but no py-6 gap, so the sticky header sticks
  // directly below the TopBar with no translucent gap for cards to show through.
  const isNoPaddingPage = location.pathname === '/nmoods';

  const mainClassName = isCircleDetail
    ? [
        'flex-1',
        'min-h-0',
        'min-w-0',
        'w-full',
        'overflow-hidden',
        'flex',
        'flex-col',
      ].join(' ')
    : isFullBleed || isNoPaddingPage
      ? [
          'flex-1',
          'min-h-0',
          'min-w-0',
          'overflow-x-clip',
          'overflow-y-auto',
        ].join(' ')
      : [
          'flex-1',
          'min-h-0',
          'min-w-0',
          'w-full',
          'max-w-5xl',
          'mx-auto',
          'px-4',
          'sm:px-6',
          'lg:px-8',
          'py-6',
          'overflow-x-clip',
          'overflow-y-auto',
        ].join(' ');

  return (
    <TabNavigationProvider>
      <div className="fixed inset-0 flex min-w-0 min-h-0 flex-col bg-background">
        <PullToRefresh />

        <OfflineBanner />

        {!isFullBleed && <TopBar />}

        <main className={mainClassName}>
          <div
            className={
              isCircleDetail
                ? 'flex-1 min-h-0 w-full flex flex-col overflow-y-auto'
                : 'w-full'
            }
          >
            <AnimatePresence mode="wait">
              <PageTransition key={location.pathname}>
                <div
                  className={
                    isCircleDetail
                      ? 'h-full min-h-0 w-full flex flex-col'
                      : 'w-full'
                  }
                >
                  <Outlet />
                </div>
              </PageTransition>
            </AnimatePresence>
          </div>
        </main>

        {showNav && (
          <div className="flex-none shrink-0">
            <MobileNav />
          </div>
        )}

        <EngagementOverlays />

        {new URLSearchParams(location.search).get('debug') === '1' && (
          <MemberDebugPanel />
        )}
      </div>
    </TabNavigationProvider>
  );
}