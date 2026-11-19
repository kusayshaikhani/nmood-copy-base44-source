// Owner-authorized rehearsal and in-place production only. Server consent remains authoritative.
export function memberIndicatorsEnabledForBuild({mode,target,projectRef,url}) {
 return ((mode === 'rehearsal' && target === 'rehearsal') || (mode === 'production' && target === 'production'))
  && projectRef === 'vudvrofhxwopgbldunky'
  && url === 'https://vudvrofhxwopgbldunky.supabase.co';
}
export const MEMBER_INDICATORS_ENABLED = memberIndicatorsEnabledForBuild({
 mode:import.meta.env.MODE,
 target:import.meta.env.VITE_SUPABASE_TARGET,
 projectRef:import.meta.env.VITE_SUPABASE_PROJECT_REF,
 url:import.meta.env.VITE_SUPABASE_URL,
});
