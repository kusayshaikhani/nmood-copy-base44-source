import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { useOriginState } from '@/lib/safe-navigation';

const SUPPRESSED_PATHS = new Set(['/splash', '/welcome', '/language-select', '/auth', '/login', '/register', '/signup', '/create-account', '/verify-email', '/verify-otp', '/forgot-password', '/reset-password', '/onboarding', '/upgrade', '/membership', '/host/create', '/host/create-circle']);
export function isUpgradeCtaSuppressed(pathname) {
  return SUPPRESSED_PATHS.has((pathname || '').split(/[?#]/)[0].replace(/\/+$/, '') || '/');
}
export function useOpenPaywall() {
  const navigate = useNavigate();
  const originState = useOriginState();
  const { isPremium } = useMembershipAccess();
  return React.useCallback(() => navigate(isPremium ? '/membership' : '/upgrade', { state: originState() }), [navigate, originState, isPremium]);
}
export default function UpgradeMembershipCTA({ variant = 'banner', className = '' }) {
  const { isPremium, loading, entitlementState, sync } = useMembershipAccess();
  const location = useLocation();
  const open = useOpenPaywall();
  if (isUpgradeCtaSuppressed(location.pathname) || loading) return null;
  if (entitlementState === 'unavailable') return <div role="status" className="p-3 text-sm">Membership could not be refreshed. <button type="button" className="min-h-11 px-3 underline" onClick={() => sync()}>Retry</button>{isPremium && <button type="button" onClick={open} className="min-h-11 px-3 underline">Manage Membership</button>}</div>;
  // Primary screens already show their own locked feature state. Avoid an
  // additional unsolicited upsell banner on every visit.
  if (!isPremium && variant === 'banner') return null;
  return <button type="button" onClick={open} className={`min-h-11 rounded-xl px-4 py-2 text-sm font-semibold text-primary ${className}`} data-testid={isPremium ? 'premium-membership-status' : 'upgrade-membership-cta'}>{isPremium ? 'Manage Membership' : 'Upgrade'}</button>;
}
