import { validateSupabaseConfig } from '../../config/supabase-boundary.js';
export { validateSupabaseConfig } from '../../config/supabase-boundary.js';

function runtimeInput() {
  return {
    mode: import.meta.env.MODE,
    target: import.meta.env.VITE_SUPABASE_TARGET,
    url: import.meta.env.VITE_SUPABASE_URL,
    publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    projectRef: import.meta.env.VITE_SUPABASE_PROJECT_REF,
    productionProjectRef: import.meta.env.VITE_PRODUCTION_SUPABASE_PROJECT_REF,
    allowProduction: import.meta.env.VITE_ALLOW_PRODUCTION_SUPABASE,
  };
}

// Unit tests are hermetic even when ignored env files contain production
// values. The reserved .invalid host can never resolve on the public internet.
export const supabaseConfig = import.meta.env.MODE === 'test'
  ? Object.freeze({
      baseUrl: 'https://nmood-test.invalid',
      publishableKey: 'test-only-publishable-key',
      projectRef: 'nmood-test',
      target: 'rehearsal',
    })
  : validateSupabaseConfig(runtimeInput());

export const useSupabase = true;
