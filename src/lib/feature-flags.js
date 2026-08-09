// F-003 Feature flags — centralized toggles, editable without redeploy.
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export const DEFAULT_FLAGS = {
  ai_features: { name: 'AI Features', enabled: true, category: 'ai', description: 'Nmood AI picks, concierge & matchmaker' },
  premium_features: { name: 'Premium Features', enabled: true, category: 'premium', description: 'Membership-gated capabilities' },
  beta_features: { name: 'Beta Features', enabled: false, category: 'beta', description: 'Experimental capabilities' },
  seasonal_campaigns: { name: 'Seasonal Campaigns', enabled: false, category: 'seasonal', description: 'Time-limited campaigns' },
  ai_recommendations: { name: 'AI Recommendations', enabled: true, category: 'ai', description: 'Personalised AI picks & matchmaker' },
  business_communities: { name: 'Business Communities', enabled: false, category: 'core', description: 'Business-led communities' },
  sponsored_experiences: { name: 'Sponsored Experiences', enabled: false, category: 'core', description: 'Sponsored experience placements' },
  premium_experiments: { name: 'Premium Experiments', enabled: false, category: 'premium', description: 'Premium-tier experiments' },
  upcoming_features: { name: 'Upcoming Features', enabled: false, category: 'beta', description: 'Pre-release upcoming features' },
};

let cache = null;
let inflight = null;

export async function loadFeatureFlags(force = false) {
  if (cache && !force) return cache;
  if (inflight && !force) return inflight;
  inflight = base44.functions
    .invoke('systemOps', { mode: 'listFlags' })
    .then((res) => {
      const map = { ...DEFAULT_FLAGS };
      for (const f of res?.flags || []) {
        map[f.key] = { name: f.name, enabled: f.enabled, category: f.category, description: f.description };
      }
      cache = map;
      return cache;
    })
    .catch(() => {
      cache = DEFAULT_FLAGS;
      return cache;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState(cache || DEFAULT_FLAGS);
  useEffect(() => {
    loadFeatureFlags().then(setFlags);
  }, []);
  return flags;
}

export function useFeatureFlag(key) {
  const flags = useFeatureFlags();
  const f = flags[key];
  if (f) return f.enabled;
  return DEFAULT_FLAGS[key]?.enabled ?? false;
}