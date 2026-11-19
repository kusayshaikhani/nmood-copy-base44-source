const VALID_TARGETS = new Set(['rehearsal', 'production']);

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function validateSupabaseConfig(input) {
  const mode = clean(input.mode);
  const target = clean(input.target);
  const projectRef = clean(input.projectRef);
  const productionProjectRef = clean(input.productionProjectRef);
  const publishableKey = clean(input.publishableKey);
  const allowProduction = input.allowProduction === true || clean(input.allowProduction) === 'true';
  let url;

  try {
    url = new URL(clean(input.url));
  } catch {
    throw new Error('VITE_SUPABASE_URL must be a valid HTTPS URL.');
  }

  if (!VALID_TARGETS.has(target)) {
    throw new Error('VITE_SUPABASE_TARGET must be either rehearsal or production.');
  }
  if (!projectRef || !productionProjectRef || !publishableKey) {
    throw new Error('Supabase URL, publishable key, project ref, and production project ref are required.');
  }
  if (url.protocol !== 'https:' || url.hostname !== `${projectRef}.supabase.co`) {
    throw new Error('VITE_SUPABASE_URL must match VITE_SUPABASE_PROJECT_REF on supabase.co.');
  }

  if (target === 'rehearsal') {
    if (projectRef === productionProjectRef) {
      throw new Error('Rehearsal Supabase configuration must not target production.');
    }
    if (mode === 'production') {
      throw new Error('A production build cannot use the rehearsal Supabase target.');
    }
  }

  if (target === 'production') {
    if (mode !== 'production' || !allowProduction) {
      throw new Error('Production Supabase requires production mode and explicit release opt-in.');
    }
    if (projectRef !== productionProjectRef) {
      throw new Error('Production Supabase target must match the declared production project ref.');
    }
  }

  return Object.freeze({
    baseUrl: url.toString().replace(/\/$/, ''), publishableKey, projectRef, target,
  });
}
