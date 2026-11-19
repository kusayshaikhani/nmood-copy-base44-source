/**
 * Provider-agnostic location layer.
 *
 * Every Circle / Experience screen talks to this module only, and always
 * receives the same normalized shape:
 *
 *   { coordinates: [lat, lng], venueName, address, area, city, country }
 *
 * The work is delegated to whichever adapter is registered in
 * `@/lib/geo/provider-registry`. MapTiler serves this build. Adding a direct
 * Google Maps Platform implementation later means writing one adapter and
 * calling `registerLocationProvider` — the picker and the creation wizards do
 * not change.
 */
import { PLACE_SEARCH_STATUS } from '@/lib/place-search';
import { getLocationProvider, getLocationProviderLabel } from '@/lib/geo/provider-registry';

export { PLACE_SEARCH_STATUS };
export { getLocationProviderLabel };

export const EMPTY_LOCATION = {
  coordinates: null,
  venueName: '',
  address: '',
  area: '',
  city: '',
  country: '',
};

function normalize(partial) {
  return {
    coordinates: partial?.coordinates || null,
    venueName: partial?.venueName || '',
    address: partial?.address || '',
    area: partial?.area || '',
    city: partial?.city || '',
    country: partial?.country || '',
  };
}

/** Autocomplete places. Returns the raw provider features plus a status. */
export function searchPlaces(query, opts) {
  return getLocationProvider().search(query, opts);
}

/** Turn a selected suggestion into a normalized location. */
export async function resolvePlace(feature) {
  const resolved = await getLocationProvider().resolve(feature);
  if (!resolved?.coordinates) return null;
  return normalize(resolved);
}

/**
 * Reverse-geocode a dropped/dragged pin.
 * Never throws: callers get { ok, location, error } so a failure can be shown
 * without blocking the user from typing the address by hand.
 */
export async function reverseLookup(lat, lng) {
  const coordinates = [lat, lng];
  const fallback = 'We could not read the address for that pin. You can type it in below.';
  try {
    const result = await getLocationProvider().reverse(lat, lng);
    if (!result) {
      return { ok: false, location: normalize({ coordinates }), error: fallback };
    }
    return { ok: true, location: normalize({ ...result, coordinates }) };
  } catch (err) {
    return { ok: false, location: normalize({ coordinates }), error: err?.message || fallback };
  }
}
