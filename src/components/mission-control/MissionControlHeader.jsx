import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Settings as SettingsIcon, LogOut, Menu, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import BrandLogo from '@/components/brand/BrandLogo';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * FM-001: Sticky top header — brand, Mission Control title, Founder badge,
 * current administrator, and working notification/settings/logout actions.
 * MC-002: Notifications → Communication Center; Settings → Platform Settings.
 */
export default function MissionControlHeader({ onToggleSidebar }) {
  const { t } = useLocalization();
  const { user, logout } = useAuth();
  const adminName = user?.full_name || user?.email || 'Administrator';
  const adminLabel = user?.role === 'founder' ? 'Founder' : 'Administrator';

  const iconBtn =
    'inline-flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 active:scale-95 active:bg-white/10 transition-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background';

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center gap-3 px-3 sm:px-4 border-b border-border bg-background/80 backdrop-blur-xl">
      <button className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={onToggleSidebar} aria-label={t('mission.open_sidebar')}>
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2.5">
        <BrandLogo size="sm" />
        <span className="hidden sm:inline text-sm font-semibold tracking-tight">{t('mission.mission_control')}</span>
      </div>
      <span className="ml-1 inline-flex items-center rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
        {adminLabel}
      </span>

      <div className="flex-1" />

      <div className="hidden sm:flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t('admin.signed_in_as')}</span>
        <span className="font-medium truncate max-w-[180px]">{adminName}</span>
      </div>

      <button className={iconBtn} onClick={() => window.location.reload()} aria-label={t('mission.refresh_this_view')} title={t('admin.refresh')}>
        <RefreshCw className="w-5 h-5" />
      </button>
      <Link to="/mission-control/notifications" className={iconBtn} aria-label={t('mission.notifications_open_communication_center')} title={t('admin.notifications')}>
        <Bell className="w-5 h-5" />
      </Link>
      <Link to="/mission-control/platform-settings" className={iconBtn} aria-label={t('mission.settings_open_platform_settings')} title={t('admin.settings')}>
        <SettingsIcon className="w-5 h-5" />
      </Link>
      <button className={iconBtn} onClick={() => logout(true)} aria-label={t('mission.log_out')} title={t('mission.log_out')}>
        <LogOut className="w-5 h-5" />
      </button>
    </header>
  );
}