import React, { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import MissionControlSidebar from './MissionControlSidebar';
import MissionControlHeader from './MissionControlHeader';
import MobileNav from '@/components/layout/MobileNav';
import { TabNavigationProvider } from '@/lib/tab-navigation';
import { AdminConfirmProvider } from '@/components/admin/AdminConfirmProvider';
import { HardDeleteProvider } from '@/components/admin/HardDeleteProvider';

/**
 * FM-001: Founder Mission Control enterprise shell.
 * Forces a dark, glassmorphic interface consistent with the Nmood brand.
 * Responsive: collapsible desktop sidebar + mobile drawer.
 *
 * MC-R1 — Release 1.0 Navigation: the standard Nmood bottom navigation bar
 * remains available throughout Mission Control so administrators are never
 * trapped. Selecting any member-facing item immediately exits Mission Control.
 * If an editor (Sheet/Dialog) is open, leaving is confirmed to prevent data loss.
 */
export default function MissionControlLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Self-contained navigation guard: if any shadcn Sheet/Dialog editor is open
  // in the DOM, confirm before navigating away. No editor wiring required.
  const navGuard = useCallback(() => {
    const openEditor = document.querySelector('[data-state="open"][role="dialog"]');
    if (openEditor) {
      return window.confirm('An editor is open. Unsaved changes may be lost. Leave Mission Control anyway?');
    }
    return true;
  }, []);

  return (
    <TabNavigationProvider>
    <div className="dark fixed inset-0 flex bg-background text-foreground">
      <MissionControlSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <MissionControlHeader onToggleSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
          <AdminConfirmProvider>
            <HardDeleteProvider>
              <Outlet />
            </HardDeleteProvider>
          </AdminConfirmProvider>
        </main>
        {/* MC-R1: bottom nav for mobile only. Desktop uses the sidebar;
            placing it as a child of the column (not the row-flex root)
            keeps it pinned to the bottom instead of across the top. */}
        <div className="md:hidden">
          <MobileNav onBeforeNavigate={navGuard} />
        </div>
      </div>
    </div>
    </TabNavigationProvider>
  );
}