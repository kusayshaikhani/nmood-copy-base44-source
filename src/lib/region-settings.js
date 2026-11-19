import { PASSPORT_CONTRACT, PASSPORT_COUNTRY_RPC, checkedPassport, passportUpdate } from './passport-contract';
import { isRegionalQuery } from './region-cache';
import { callSupabaseRpc } from '@/api/supabaseClient';
import { withTimeout } from './bounded-operation';

export { REGION_ENABLED, regionEnabledForBuild } from './region-config';

export function checkedRegion(value) {
 if (value?.contract !== PASSPORT_CONTRACT || typeof value.needs_confirmation !== 'boolean'
  || typeof value.browse_everywhere !== 'boolean' || typeof value.share_everywhere !== 'boolean'
  || !Array.isArray(value.countries) || !value.countries.length
  || value.countries.some(c => !/^[A-Z]{2}$/.test(c.code) || typeof c.name !== 'string')
  || new Set(value.countries.map(c => c.code)).size !== value.countries.length
  || (value.needs_confirmation ? value.home_country !== null || value.scope_revision !== null
   : !value.countries.some(c => c.code === value.home_country) || !Number.isSafeInteger(value.scope_revision) || value.scope_revision < 1)) {
  throw new Error('Country settings are unavailable. Please retry.');
 }
 const passport = checkedPassport(value.passport);
 if ((value.needs_confirmation || !passport.eligible) && (value.browse_everywhere || value.share_everywhere)) {
  throw new Error('Global visibility could not be confirmed.');
 }
 return { contract: value.contract, home_country: value.home_country, needs_confirmation: value.needs_confirmation,
  browse_everywhere: value.browse_everywhere, share_everywhere: value.share_everywhere,
  scope_revision: value.scope_revision, countries: value.countries.map(({code,name}) => ({code,name})), passport };
}
export async function getMyRegion(expectedUserId) {
 return checkedRegion(await withTimeout(() => callSupabaseRpc(PASSPORT_COUNTRY_RPC.read, {}, { expectedUserId })));
}
export async function saveMyRegion(changes, revision, queryClient, expectedUserId, generation) {
 const payload = passportUpdate(changes, revision, generation);
 const keys = Object.keys(changes);
 window.dispatchEvent(new Event('nmood:region-save-pending'));
 window.dispatchEvent(new Event('nmood:region-visibility-withdrawn'));
 // Hide delivered discovery and detail results even if an OFF save fails.
 // No optimistic broadening. A newly authorized load owns the next feed order.
 await queryClient.cancelQueries({predicate:isRegionalQuery});
 queryClient.removeQueries({predicate:isRegionalQuery});
 try {
  const saved = checkedRegion(await withTimeout(() => callSupabaseRpc(PASSPORT_COUNTRY_RPC.save, payload, { expectedUserId })));
  if (saved.passport.generation !== generation || saved.scope_revision <= (revision ?? 0) || saved.needs_confirmation || keys.some(k => saved[k] !== changes[k])) throw new Error('Save not confirmed');
  window.dispatchEvent(new Event('nmood:access-changed'));
  window.dispatchEvent(new Event('nmood:region-local-change'));
  return saved;
 } catch {
  throw new Error('Country settings could not be saved. Your choices are still here. Please retry.');
 }
}
