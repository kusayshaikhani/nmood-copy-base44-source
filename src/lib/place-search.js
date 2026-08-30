// Unified place autocomplete for Nmood.
//
// The provider is MapTiler Geocoding, called directly from the client with the
// public MapTiler key. The previous implementation resolved that key (and an
// optional Google Places proxy) through Base44 backend functions; on the
// independently-hosted build those functions never answer, so the key resolved
// to null and every query silently returned zero suggestions.
//
// Callers get an explicit status so the UI can distinguish "still typing",
// "nothing matched", "not configured" and "request failed" instead of showing
// an empty list for all four.
import { geocodeSearch, isMapProviderConfigured } from '@/lib/maptiler-utils';

export const PLACE_SEARCH_STATUS = {
  OK: 'ok',
  EMPTY: 'empty',
  TOO_SHORT: 'too_short',
  NOT_CONFIGURED: 'not_configured',
  ERROR: 'error',
};

/**
 * Autocomplete places.
 * @returns {Promise<{ status: string, results: Array, error?: string }>}
 *   results are MapTiler features: { id, text, place_name, center:[lng,lat], context }
 */
export async function placeSearch(query, opts = {}) {
  if (!query || query.trim().length < 2) {
    return { status: PLACE_SEARCH_STATUS.TOO_SHORT, results: [] };
  }
  if (!isMapProviderConfigured()) {
    return {
      status: PLACE_SEARCH_STATUS.NOT_CONFIGURED,
      results: [],
      error: 'Place search is not configured for this build.',
    };
  }
  try {
    const results = await geocodeSearch(query, opts);
    return {
      status: results.length > 0 ? PLACE_SEARCH_STATUS.OK : PLACE_SEARCH_STATUS.EMPTY,
      results,
    };
  } catch (err) {
    return {
      status: PLACE_SEARCH_STATUS.ERROR,
      results: [],
      error: err?.message || 'Place search failed.',
    };
  }
}

/**
 * Resolve a selected suggestion into a location object.
 * @returns {{ coordinates:[lat,lng], venueName, address, city, country, area }|null}
 */
export async function resolveSelection(feature) {
  if (!feature?.center || feature.center.length !== 2) return null;
  const [lng, lat] = feature.center;
  let city = '', country = '', area = '';
  if (feature.context) {
    for (const ctx of feature.context) {
      const typeId = ctx.id?.split('.')[0];
      if (typeId === 'place' || typeId === 'municipality') city = ctx.text;
      else if (typeId === 'country') country = ctx.text;
      else if (typeId === 'region' || typeId === 'subregion' || typeId === 'locality') area = area || ctx.text;
    }
  }
  return {
    coordinates: [lat, lng],
    venueName: feature.text || '',
    address: feature.place_name || '',
    city,
    country,
    area,
  };
}
