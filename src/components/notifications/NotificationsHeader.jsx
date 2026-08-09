import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, CheckCheck, CheckSquare } from 'lucide-react';
import { getBrandLogoUrl } from '@/lib/brand-assets';
import HeroTitle from '@/components/ui/premium/HeroTitle';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-007 — Premium gradient hero for the Notifications page.
 * Back · logo · glass action buttons (mark all read, select, settings).
 * All action callbacks preserved exactly.
 */
export default function NotificationsHeader({ onMarkAllRead, onOpenSettings, unreadCount, onSelectMode, selectMode }) {
  const { t } = useLocalization();
  const navigate = useNavigate();
  return (
    <div className="relative bg-nmood-gradient px-6 pt-[calc(3.5rem+env(safe-area-inset-top))] pb-10">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 active:scale-95 transition-transform duration-200"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <img src={getBrandLogoUrl('dark')} alt="Nmood" draggable={false} className="h-7 w-auto object-contain" />
        <div className="flex items-center gap-2">
          {!selectMode && (
            <button
              type="button"
              onClick={onMarkAllRead}
              aria-label={t('notifications.mark_all_read')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 active:scale-95 transition-transform duration-200"
            >
              <CheckCheck className="w-5 h-5 text-white" />
            </button>
          )}
          {!selectMode && (
            <button
              type="button"
              onClick={onSelectMode}
              aria-label={t('notifications.select')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 active:scale-95 transition-transform duration-200"
            >
              <CheckSquare className="w-5 h-5 text-white" />
            </button>
          )}
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Settings"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 active:scale-95 transition-transform duration-200"
          >
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <HeroTitle className="mt-6 text-white leading-tight">{t('notifications.title')}</HeroTitle>
      <p className="mt-1.5 text-white/80 text-sm font-medium">
        {unreadCount > 0 ? t('notifications.unread_count', { count: unreadCount }) : t('notifications.all_caught_up')}
      </p>
    </div>
  );
}