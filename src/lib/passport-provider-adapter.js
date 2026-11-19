import { REGION_ENABLED } from './region-config';

// Signal only: neither SDK data nor generic membership status grants Passport.
export function signalPassportSubscriptionChange() {
 if (REGION_ENABLED && typeof window !== 'undefined') window.dispatchEvent(new Event('nmood:passport-entitlement-changed'));
}

// Provider boundary: a notification can only withdraw and request server revalidation.
// No SDK, receipt, token, provider response or generic Premium flag is accepted as authority.
export function watchPassportProviderChanges({ source, invalidate, recheck }) {
 let stopped = false;
 const changed = () => {
  if (stopped) return;
  invalidate();
  void Promise.resolve().then(() => { if (!stopped) return recheck(); }).catch(() => {});
 };
 const remove = source.subscribe(changed);
 return () => { stopped = true; remove?.(); };
}
export const localMembershipSignals = {
 subscribe(changed) {
  window.addEventListener('nmood:subscription-changed', changed);
  window.addEventListener('nmood:membership-changed', changed);
  window.addEventListener('nmood:passport-entitlement-changed', changed);
  return () => {
   window.removeEventListener('nmood:subscription-changed', changed);
   window.removeEventListener('nmood:membership-changed', changed);
   window.removeEventListener('nmood:passport-entitlement-changed', changed);
  };
 },
};
