import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Crown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { useOriginState } from '@/lib/safe-navigation';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { isFounderAccessEnabled } from '@/lib/launch-mode';
import { trackMembershipEvent, MEMBERSHIP_EVENTS } from '@/lib/membership-analytics';
import { trackProductEvent, PRODUCT_EVENTS } from '@/lib/product-analytics';

// Screens where an upgrade prompt must never appear: authentication, password
// reset, the paywall/checkout itself, and the creation wizards.
const SUPPRESSED_PATHS = new Set([
  '/splash', '/welcome', '/language-select', '/auth', '/login', '/register',
  '/signup', '/create-account', '/verify-email', '/verify-otp',
  '/forgot-password', '/reset-password', '/onboarding',
  '/upgrade', '/membership', '/host/create', '/host/create-circle',
]);

export function isUpgradeCtaSuppressed(pathname) {
  const clean = (pathname || '').split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  return SUPPRESSED_PATHS.has(clean);
}

/**
 * Opens the one real paywall: the /upgrade screen, whose plans and purchase
 * come from the live RevenueCat `default` offering and the `nmood_premium`
 * entitlement. Never simulates a purchase or hardcodes a price.
 */
export function useOpenPaywall(source) {
  const navigate = useNavigate();
  const originState = useOriginState();
  return React.useCallback(() => {
    trackMembershipEvent(MEMBERSHIP_EVENTS.UPGRADE_CLICKED, { reason: source });
    trackProductEvent(PRODUCT_EVENTS.UPGRADE_CLICKED, { feature: source });
    navigate('/upgrade', { state: originState() });
  }, [navigate, originState, source]);
}

/**
 * The single Upgrade Membership entry point shared by every primary screen.
 * Premium state comes only from the membership provider (live RevenueCat
 * entitlement) — never from local flags.
 *
 * @param {'banner'|'inline'} variant  banner = full-width card, inline = compact row
 * @param {string} source              analytics source for the CTA
 */
export default function UpgradeMembershipCTA({ variant = 'banner', source = 'primary_screen', className = '' }) {
  const { t } = useLocalization();
  const { isPremium, loading, cancel } = useMembershipAccess();
  const location = useLocation();
  const openPaywall = useOpenPaywall(source);

  // Wait for the real entitlement before rendering either state, so a
  // premium member never sees a flash of "Upgrade".
  if (loading) return null;
  if (isFounderAccessEnabled()) return null;
  if (isUpgradeCtaSuppressed(location.pathname)) return null;

  if (isPremium) {
    return (
      <div className={`flex items-center gap-2 ${className}`} data-testid="premium-membership-status">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Crown className="h-3.5 w-3.5" /> {t('membership.cta.premium_badge')}
        </span>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => cancel()}>
          {t('membership.cta.manage_membership')}
        </Button>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={openPaywall}
        data-testid="upgrade-membership-cta"
        className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-nmood-cta px-4 py-3 text-sm font-semibold text-primary-foreground shadow-soft active:scale-[0.98] transition-transform ${className}`}
      >
        <Crown className="h-4 w-4" /> {t('membership.cta.nmood_action')}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openPaywall}
      data-testid="upgrade-membership-cta"
      className={`flex w-full items-center gap-3 rounded-card border border-primary/25 bg-gradient-to-br from-primary/10 to-accent/10 p-4 text-start active:scale-[0.99] transition-transform ${className}`}
    >
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Crown className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-foreground">{t('membership.cta.title')}</span>
        <span className="block truncate text-xs text-muted-foreground">{t('membership.cta.subtitle')}</span>
      </span>
      <span className="flex-shrink-0 text-xs font-semibold text-primary">{t('membership.upgrade')}</span>
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-primary" />
    </button>
  );
}
