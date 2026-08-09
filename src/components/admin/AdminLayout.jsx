import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminTopBar from './AdminTopBar';
import { AdminConfirmProvider } from './AdminConfirmProvider';
import { HardDeleteProvider } from './HardDeleteProvider';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-muted/20">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-60">
        <AdminTopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
          <AdminConfirmProvider>
            <HardDeleteProvider>
              <Outlet />
            </HardDeleteProvider>
          </AdminConfirmProvider>
        </main>
      </div>
    </div>
  );
}