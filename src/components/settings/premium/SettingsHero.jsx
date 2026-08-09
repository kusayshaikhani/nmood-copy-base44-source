import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/AuthContext';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { isMonetizationEnabled, isFounderAccessEnabled } from '@/lib/launch-mode';
import { Crown, Sparkles } from 'lucide-react';

/**
 * UI-022 — Premium Settings hero. Large title, subtitle, and the user's
 * avatar + display name with a membership hint. Presentation only.
 */
export default function SettingsHero() {
  const { t } = useLocalization();
  const { user, member } = useAuth();
  const { isPremium } = useMembershipAccess();

  const name = member?.display_name || member?.first_name || user?.full_name || user?.email || '';
  const initial = (name || '?').charAt(0).toUpperCase();

  return (
    <div className="px-5 pt-2 pb-3">
      <h1 className="text-[2rem] leading-tight font-bold tracking-tight text-balance">
        {t('settings.title')}
      </h1>
      <p className="text-muted-foreground mt-1.5 text-[15px]">
        {t('settings.premium.subtitle')}
      </p>

      <div className="flex items-center gap-3.5 mt-5">
        <Avatar className="w-14 h-14 ring-2 ring-background shadow-card">
          <AvatarImage src={member?.photo_url} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
            {initial}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[15px] truncate">{name}</p>
          {isFounderAccessEnabled() && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">
                {t('founder_access.badge')}
              </span>
            </div>
          )}
          {isMonetizationEnabled() && !isFounderAccessEnabled() && (
            <div className="flex items-center gap-1.5 mt-0.5">
              {isPremium ? (
                <>
                  <Crown className="w-3.5 h-3.5 text-accent-foreground" />
                  <span className="text-xs font-medium text-accent-foreground">
                    {t('membership.premium')}
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">{t('membership.explorer')}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}