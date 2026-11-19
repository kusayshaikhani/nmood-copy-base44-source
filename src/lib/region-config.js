export function regionEnabledForBuild({ mode, target, projectRef, url, enabled }) {
 return enabled === 'true' && mode === 'rehearsal' && target === 'rehearsal'
  && projectRef === 'vudvrofhxwopgbldunky' && url === 'https://vudvrofhxwopgbldunky.supabase.co';
}
// Local implementation is held. Environment variables alone cannot release it.
// Changing this requires a separate release review; fixtures inject their own runtime.
export const PASSPORT_RELEASE_APPROVED = false;
export const REGION_ENABLED = PASSPORT_RELEASE_APPROVED && regionEnabledForBuild({ mode: import.meta.env.MODE,
 target: import.meta.env.VITE_SUPABASE_TARGET, projectRef: import.meta.env.VITE_SUPABASE_PROJECT_REF,
 url: import.meta.env.VITE_SUPABASE_URL, enabled: import.meta.env.VITE_REHEARSAL_REGION_ENABLED });

