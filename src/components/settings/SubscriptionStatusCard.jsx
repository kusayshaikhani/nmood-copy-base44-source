import React, { useState } from 'react';
import { Crown, RotateCcw, Settings, Sparkles, AlertCircle } from 'lucide-react';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { detectStore } from '@/lib/native-billing-bridge';
import { trackMembershipEvent } from '@/lib/membership-analytics';

// Subscription status card for the Settings page.
// Shows current plan, status, renewal date, and store actions
// (restore purchases + manage subscription via Apple/Google).
export default function SubscriptionStatusCard() {
  const { t } = useLocalization();
  const { membership, isPremium, membershipStatus, billingPlatform, remainingDays, restore, cancel } = useMembershipAccess();
  const [restoring, setRestoring] = useState(false);

  const store = billingPlatform || detectStore() || 'apple';
  const storeLabel = store === 'google' ? 'Google Play' : 'App Store';

  const handleRestore = async () => {
    if (restoring) return;
    setRestoring(true);
    trackMembershipEvent('Restore Pressed', { source: 'settings_status_card' });
    try {
      await restore(store);
    } catch { /* ignore */ }
    setRestoring(false);
  };

  const handleManage = () => {
    trackMembershipEvent('Manage Subscription Pressed', { source: 'settings_status_card', store });
    cancel(store);
  };

  const statusTone = {
    active: 'text-success',
    trial: 'text-info',
    grace_period: 'text-warning',
    expired: 'text-muted-foreground',
    cancelled: 'text-muted-foreground',
    refunded: 'text-destructive',
  };
  const statusLabel = {
    active: t('membership.premium'),
    trial: 'Trial',
    grace_period: 'Grace Period',
    expired: 'Expired',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };

  const tone = statusTone[membershipStatus] || 'text-muted-foreground';
  const isGrace = membershipStatus === 'grace_period';
  const isExpired = membershipStatus === 'expired' || membershipStatus === 'cancelled' || membershipStatus === 'refunded';

  // Format renewal/expiry date
  const dateLabel = membership?.expires_at
    ? new Date(membership.expires_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : null;
  const dateKey = membership?.auto_renew ? 'membership.renews_on' : 'membership.expires_on';

  return (
    <div className="rounded-card border border-border/50 bg-card shadow-card overflow-hidden">
      {/* Header — plan badge */}
      <div className={`flex items-center gap-3 px-4 py-3.5 ${isPremium ? 'bg-nmood-gradient' : 'bg-muted/50'}`}>
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${isPremium ? 'bg-white/20' : 'bg-card'}`}>
          {isPremium ? <Crown className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[15px] font-bold leading-tight ${isPremium ? 'text-white' : 'text-foreground'}`}>
            {isPremium ? t('membership.premium') : t('membership.explorer')}
          </p>
          <p className={`text-[12px] mt-0.5 ${isPremium ? 'text-white/80' : 'text-muted-foreground'}`}>
            {isPremium ? t('membership.premium_member_label') : t('membership.explorer_member_label')}
          </p>
        </div>
        {isPremium && (
          <span className="text-[11px] font-semibold text-white/90 px-2.5 py-1 rounded-full bg-white/15">
            {storeLabel}
          </span>
        )}
      </div>

      {/* Body — status details (premium only) */}
      {isPremium && (
        <div className="px-4 py-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] text-muted-foreground">{t('membership.premium.status_label')}</span>
            <span className={`text-[12.5px] font-semibold flex items-center gap-1.5 ${tone}`}>
              {isGrace && <AlertCircle className="w-3.5 h-3.5" />}
              {statusLabel[membershipStatus] || membershipStatus}
            </span>
          </div>
          {dateLabel && (
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] text-muted-foreground">
                {membership?.auto_renew ? t('membership.renews_on') : t('membership.expires_on')}
              </span>
              <span className="text-[12.5px] font-medium">{dateLabel}</span>
            </div>
          )}
          {isGrace && remainingDays != null && remainingDays >= 0 && (
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] text-muted-foreground">{t('membership.premium.billing_label')}</span>
              <span className="text-[12.5px] font-medium text-warning">{remainingDays} days left</span>
            </div>
          )}
        </div>
      )}

      {/* Actions — stacked vertically below 380px, side-by-side at 380px+ */}
      <div className="px-4 pb-4 pt-1 flex flex-col min-[380px]:flex-row items-stretch min-[380px]:items-center gap-2">
        <button
          type="button"
          onClick={handleRestore}
          disabled={restoring}
          aria-label={t('membership.restore_purchases')}
          className="min-[380px]:flex-1 min-w-0 h-10 rounded-button border border-border/60 bg-card text-foreground text-[14px] font-medium flex items-center justify-center gap-1 whitespace-nowrap transition-colors hover:bg-secondary disabled:opacity-50"
        >
          <RotateCcw className={`w-4 h-4 flex-shrink-0 ${restoring ? 'animate-spin' : ''}`} />
          <span>{restoring ? t('membership.processing') : t('membership.restore_purchases')}</span>
        </button>
        {isPremium && !isExpired && (
          <button
            type="button"
            onClick={handleManage}
            aria-label={t('membership.premium.manage_subscription')}
            className="min-[380px]:flex-1 min-w-0 h-10 rounded-button bg-nmood-gradient text-primary-foreground text-[14px] font-medium flex items-center justify-center gap-1 whitespace-nowrap shadow-card hover:shadow-elevated transition-shadow"
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            <span>{t('membership.premium.manage_subscription')}</span>
          </button>
        )}
      </div>
    </div>
  );
}