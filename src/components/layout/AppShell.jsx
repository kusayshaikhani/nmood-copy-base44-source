import RegionConfirmationGate from '@/components/region/RegionControls';
import FloatingBack from './FloatingBack';
import { useMemberIndicatorActivity } from '@/lib/use-member-indicator-activity';
import ExplorerPolicyGate from '@/components/membership/ExplorerPolicyGate';
import React, { useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';

import RouteErrorBoundary from './RouteErrorBoundary';

import MobileNav from './MobileNav';
import TopBar from './TopBar';
import CelebrationOverlay from '@/components/engagement/CelebrationOverlay';
import WeeklyRecapGate from '@/components/engagement/WeeklyRecapGate';
import PageTransition from '@/components/shared/PageTransition';
import OfflineBanner from '@/components/shared/OfflineBanner';
import { useEngagement } from '@/hooks/useEngagement';
import { TabNavigationProvider } from '@/lib/tab-navigation';
import MemberDebugPanel from '@/components/dev/MemberDebugPanel';
import { useAuth } from '@/lib/AuthContext';
import PushNotificationBootstrap from '@/components/notifications/PushNotificationBootstrap';

export function shouldShowPersistentBottomNavigation({ user, member } = {}) {
  return Boolean(user?.id) && member?.onboarding_completed !== false;
}

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
  const isAndroid = Capacitor.getPlatform() === 'android';
  const mainRef = useRef(null);
  const { member, user } = useAuth();
  useMemberIndicatorActivity(user?.id);

  // AppShell is mounted only inside the authenticated route tree. Keep the
  // navigator present while the member record is being refreshed, while still
  // withholding it from an explicitly unfinished member record. Mandatory
  // onboarding is outside this shell.
  const showNav = shouldShowPersistentBottomNavigation({ user, member });

  const isCircleDetail =
    /^\/circle\/[^/]+$/.test(location.pathname);

  const isExperienceDetail =
    /^\/experience\/[^/]+$/.test(location.pathname);

  const isExperienceChat =
    /^\/experience\/[^/]+\/chat$/.test(location.pathname);

  const isPrivateChat = /^\/messages\/[^/]+$/.test(location.pathname);

  const isFullBleed =
    [
      '/',
      '/explore',
      '/discover-people',
      '/in-orbit',
      '/communities',
      '/notifications',
      '/profile',
      '/host/create',
      '/host/create-circle',
      '/inmood-v2',
    ].includes(location.pathname) ||
    (!isAndroid && location.pathname === '/nmood') ||
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

  const mainClassName = isCircleDetail || isPrivateChat
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
    <TabNavigationProvider scrollRef={mainRef}>
      <div className="fixed inset-0 flex min-w-0 min-h-0 flex-col bg-background">
        <PushNotificationBootstrap />
        <OfflineBanner />

        {!isFullBleed && <TopBar />}

        {!isPrivateChat && <FloatingBack />}
        <main ref={mainRef} className={mainClassName}>
          <div
            className={
              isCircleDetail || isPrivateChat
                ? 'flex-1 min-h-0 w-full flex flex-col overflow-y-auto'
                : 'w-full'
            }
          >
            {/* Notifications must mount visibly even if the previous route's exit
                animation never completes (for example, a suspended WebView). */}
            <RouteErrorBoundary key={location.key}>
              {location.pathname === '/notifications' ? (
                <div data-testid="notifications-route" className="w-full"><ExplorerPolicyGate><RegionConfirmationGate><Outlet /></RegionConfirmationGate></ExplorerPolicyGate></div>
              ) : <AnimatePresence mode="wait">
                <PageTransition key={location.pathname} className={isCircleDetail || isPrivateChat ? 'h-full min-h-0 w-full flex flex-col' : ''}>
                  <div
                    className={
                      isCircleDetail || isPrivateChat
                        ? 'h-full min-h-0 w-full flex flex-col'
                        : 'w-full'
                    }
                  >
                    <ExplorerPolicyGate><RegionConfirmationGate><Outlet /></RegionConfirmationGate></ExplorerPolicyGate>
                  </div>
                </PageTransition>
              </AnimatePresence>}
            </RouteErrorBoundary>
          </div>
        </main>

        {showNav && (
          <div data-testid="persistent-bottom-navigation" className="flex-none shrink-0">
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
