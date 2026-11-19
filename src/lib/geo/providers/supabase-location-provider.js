import { invokeSupabaseFunction } from '@/api/supabaseClient';
import { PLACE_SEARCH_STATUS } from '@/lib/place-search';
const requestId = () => crypto.randomUUID();
const supabaseLocationProvider = { id: 'supabase-google-places', label: 'Google Places', isConfigured: () => true,
  async search(query) { if (!query || query.trim().length < 2) return { status: PLACE_SEARCH_STATUS.TOO_SHORT, results: [] }; try { const result = await invokeSupabaseFunction('nmood-location-search', { action: 'autocomplete', input: query.trim(), requestId: requestId() }); const results = Array.isArray(result?.predictions) ? result.predictions : []; return { status: results.length ? PLACE_SEARCH_STATUS.OK : PLACE_SEARCH_STATUS.EMPTY, results }; } catch { return { status: PLACE_SEARCH_STATUS.ERROR, results: [], error: 'Place search is temporarily unavailable.' }; } },
  async resolve(feature) { if (!feature?.id) return null; try { const result = await invokeSupabaseFunction('nmood-location-search', { action: 'details', placeId: feature.id, requestId: requestId() }); return result?.result?.coordinates ? result.result : null; } catch { return null; } },
  async reverse() { return null; },
};
export default supabaseLocationProvider;
