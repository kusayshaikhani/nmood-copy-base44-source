import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { LayoutDashboard, Users, Calendar, Circle, Crown, Flag, CreditCard, Bell, FileText, BarChart3, Settings, ScrollText, ArrowLeft, LogOut, Activity, ListChecks, Bug, Rocket, FileCode, Gauge, LifeBuoy, LineChart, HeartPulse, AlertOctagon, ToggleLeft, SlidersHorizontal, Lock, Store, ShieldCheck, ClipboardCheck, ShieldAlert, Radar } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const navItems = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Members', path: '/admin/members', icon: Users },
  { label: 'Activities', path: '/admin/activities', icon: Calendar },
  { label: 'Circles', path: '/admin/circles', icon: Circle },
  { label: 'Hosts', path: '/admin/hosts', icon: Crown },
  { label: 'Reports', path: '/admin/reports', icon: Flag },
  { label: 'Support', path: '/admin/support', icon: LifeBuoy },
  { label: 'Memberships', path: '/admin/memberships', icon: CreditCard },
  { label: 'Notifications', path: '/admin/notifications', icon: Bell },
  { label: 'Content', path: '/admin/content', icon: FileText },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Product', path: '/admin/product', icon: LineChart },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
  { label: 'Audit Logs', path: '/admin/audit-logs', icon: ScrollText },
  { label: 'Quality Assurance', path: '/admin/qa', icon: ClipboardCheck },
  { label: 'Security Center', path: '/admin/security', icon: ShieldAlert },
  { label: 'Observability', path: '/admin/observability', icon: Radar },
];

const opsItems = [
  { label: 'Ops Dashboard', path: '/admin/ops', icon: Activity, end: true },
  { label: 'System Health', path: '/admin/ops/health', icon: HeartPulse },
  { label: 'Error Log', path: '/admin/ops/errors', icon: AlertOctagon },
  { label: 'Audit Trail', path: '/admin/ops/audit', icon: ScrollText },
  { label: 'Performance', path: '/admin/ops/performance', icon: Gauge },
  { label: 'Feature Flags', path: '/admin/ops/flags', icon: ToggleLeft },
  { label: 'Configuration', path: '/admin/ops/config', icon: SlidersHorizontal },
  { label: 'Final Validation', path: '/admin/ops/checklist', icon: ListChecks },
  { label: 'Release Info', path: '/admin/ops/releases', icon: Rocket },
  { label: 'Release 1.0', path: '/admin/ops/release-definition', icon: Lock },
  { label: 'Known Issues', path: '/admin/ops/issues', icon: Bug },
  { label: 'Build Notes', path: '/admin/ops/build-notes', icon: FileCode },
  { label: 'Quality', path: '/admin/ops/quality', icon: Rocket },
  { label: 'Store Readiness', path: '/admin/ops/store-readiness', icon: Store },
  { label: 'Legal & Compliance', path: '/admin/ops/legal-compliance', icon: ShieldCheck },
  { label: 'Launch Plan', path: '/admin/ops/launch-plan', icon: Rocket },
];

export default function AdminSidebar({ open, onClose }) {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout(false);
    navigate('/admin/login');
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />}
      <aside className={'fixed top-0 left-0 h-full w-60 bg-sidebar border-r border-sidebar-border z-50 transform transition-transform duration-200 lg:translate-x-0 ' + (open ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">Nmood</p>
                <p className="text-[10px] text-sidebar-foreground/60">{t('admin.admin_console')}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-default ' +
                  (isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent')
                }
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </NavLink>
            ))}

            <div className="px-3 pt-4 pb-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">{t('mission.operations')}</p>
            </div>
            {opsItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-default ' +
                  (isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent')
                }
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="p-3 border-t border-sidebar-border space-y-0.5">
            <div className="px-3 py-2 mb-1 rounded-lg bg-sidebar-accent/50">
              <p className="text-[10px] text-sidebar-foreground/50">{t('admin.signed_in_as')}</p>
              <p className="text-xs font-medium truncate">{user?.email || 'Administrator'}</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-default"
            >
              <ArrowLeft className="w-4 h-4 flex-shrink-0" />
              {t('admin.back_to_app')}
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-default"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {t('admin.sign_out')}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}