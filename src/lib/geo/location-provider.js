/**
 * Provider-agnostic location layer.
 *
 * Every creation screen talks to this module only, and always receives the
 * same normalized shape:
 *
 *   { coordinates: [lat, lng], venueName, address, area, city, country }
 *
 * MapTiler is the provider for this build. Switching to Google Maps later
 * means replacing the two adapter functions below — the picker and the
 * creation wizard do not change.
 */
import { placeSearch, resolveSelection, PLACE_SEARCH_STATUS } from '@/lib/place-search';
import { reverseGeocode } from '@/lib/maptiler-utils';

export { PLACE_SEARCH_STATUS };

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
  return placeSearch(query, opts);
}

/** Turn a selected suggestion into a normalized location. */
export async function resolvePlace(feature) {
  const resolved = await resolveSelection(feature);
  if (!resolved?.coordinates) return null;
  return normalize({
    ...resolved,
    venueName: resolved.venueName || feature?.text || '',
    address: resolved.address || feature?.place_name || '',
  });
}

/**
 * Reverse-geocode a dropped/dragged pin.
 * Never throws: callers get { ok, location, error } so a failure can be shown
 * without blocking the user from typing the address by hand.
 */
export async function reverseLookup(lat, lng) {
  const coordinates = [lat, lng];
  try {
    const result = await reverseGeocode(lng, lat);
    if (!result) {
      return {
        ok: false,
        location: normalize({ coordinates }),
        error: 'We could not read the address for that pin. You can type it in below.',
      };
    }
    return {
      ok: true,
      location: normalize({
        coordinates,
        venueName: result.text || '',
        address: result.address || result.place_name || '',
        area: result.area || '',
        city: result.city || '',
        country: result.country || '',
      }),
    };
  } catch (err) {
    return {
      ok: false,
      location: normalize({ coordinates }),
      error: err?.message || 'We could not read the address for that pin. You can type it in below.',
    };
  }
}
