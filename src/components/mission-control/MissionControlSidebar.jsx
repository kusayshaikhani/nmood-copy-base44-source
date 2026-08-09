import React from 'react';
import { NavLink } from 'react-router-dom';
import { X, PanelLeftClose, PanelLeft } from 'lucide-react';
import { MODULES, SIDEBAR_ORDER, modulePath } from '@/lib/mission-control-modules';
import { cn } from '@/lib/utils';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * FM-001: Collapsible left sidebar. Desktop collapses to icon rail; mobile
 * slides in as a drawer with a backdrop.
 */
export default function MissionControlSidebar({ collapsed, mobileOpen, onMobileClose, onToggleCollapse }) {
  const { t } = useLocalization();
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onMobileClose} aria-hidden="true" />
      )}

      <aside
        className={cn(
          'z-50 flex flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl transition-all duration-200',
          'fixed md:static inset-y-0 left-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex items-center justify-between h-16 px-3 border-b border-sidebar-border flex-shrink-0">
          {!collapsed && <span className="text-sm font-semibold px-1">{t('mission.navigation')}</span>}
          <div className="flex items-center gap-1">
            <button
              className="hidden md:inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-sidebar-accent text-sidebar-foreground"
              onClick={onToggleCollapse}
              aria-label={t('mission.toggle_sidebar')}
            >
              {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
            <button
              className="md:hidden inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-sidebar-accent text-sidebar-foreground"
              onClick={onMobileClose}
              aria-label={t('mission.close_sidebar')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto pt-3 pb-24 space-y-1 px-2 no-scrollbar">
          {SIDEBAR_ORDER.map((id) => {
            const m = MODULES[id];
            const Icon = m.icon;
            return (
              <NavLink
                key={id}
                to={modulePath(id)}
                end={id === 'dashboard'}
                onClick={onMobileClose}
                title={collapsed ? m.title : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-default',
                    isActive
                      ? 'bg-primary/15 text-primary font-medium'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    collapsed && 'justify-center'
                  )
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span className="truncate">{m.title}</span>}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}