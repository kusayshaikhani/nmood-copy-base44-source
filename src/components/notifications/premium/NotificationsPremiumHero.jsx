import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSafeBack } from '@/lib/safe-navigation';
import { ArrowLeft, CheckCheck, Settings } from 'lucide-react';
import { getBrandLogoUrl } from '@/lib/brand-assets';
import HeroTitle from '@/components/ui/premium/HeroTitle';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-019 — Premium sticky hero for the Notifications Center.
 * Full-bleed gradient, large title, subtitle, and top-right actions
 * (Mark All Read + Notification Settings). Sticky while scrolling.
 */
export default function NotificationsPremiumHero({ onMarkAllRead, onOpenSettings, unreadCount }) {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const handleBack = useSafeBack('/');

  return (
    <div className="sticky top-0 z-30 bg-nmood-gradient px-6 pt-[calc(3.5rem+env(safe-area-inset-top))] pb-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          aria-label={t('common.back')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 active:scale-95 transition-transform duration-200"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <img src={getBrandLogoUrl('dark')} alt="Nmood" draggable={false} className="h-7 w-auto object-contain" />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMarkAllRead}
            aria-label={t('notifications.mark_all_read')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 active:scale-95 transition-transform duration-200 disabled:opacity-40"
            disabled={unreadCount === 0}
          >
            <CheckCheck className="w-5 h-5 text-white" />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label={t('notifications.settings_title')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 active:scale-95 transition-transform duration-200"
          >
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <HeroTitle className="mt-6 text-white leading-tight">{t('notifications.title')}</HeroTitle>
      <p className="mt-1.5 text-white/75 text-sm font-medium">
        {t('notifications.premium.subtitle')}
      </p>
    </div>
  );
}