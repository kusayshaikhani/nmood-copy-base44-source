// MAP-UNIFIED — Unified place autocomplete.
// Prefers Google Places (via the server-side googleMaps proxy so the key never
// reaches the browser) when configured; falls back to the existing MapTiler
// geocoding integration when Google is unavailable or the request fails.
// Returns MapTiler-shaped features so existing callers (MapLibreLocationPicker)
// need no structural changes.

import { base44 } from '@/api/base44Client';
import { geocodeSearch as maptilerGeocode } from '@/lib/maptiler-utils';

let _googleAvailable = null; // null = unknown, true/false after first check
let _checkPromise = null;

async function checkGoogleAvailable() {
  if (_googleAvailable !== null) return _googleAvailable;
  if (_checkPromise) return _checkPromise;
  _checkPromise = (async () => {
    try {
      const res = await base44.functions.invoke('googleMaps', { action: 'autocomplete', input: '' });
      const body = res?.data || res;
      _googleAvailable = body?.available === true;
    } catch {
      _googleAvailable = false;
    } finally {
      _checkPromise = null;
    }
    return _googleAvailable;
  })();
  return _checkPromise;
}

/**
 * Unified autocomplete. Returns MapTiler-shaped features:
 *   { id, text, place_name, center:[lng,lat]|null, context, _google_place_id? }
 */
export async function placeSearch(query, opts = {}) {
  if (!query || query.trim().length < 2) return [];
  const useGoogle = await checkGoogleAvailable();
  if (useGoogle) {
    try {
      const res = await base44.functions.invoke('googleMaps', {
        action: 'autocomplete',
        input: query,
        lat: opts.lat,
        lng: opts.lng,
        radius: opts.radius,
      });
      const body = res?.data || res;
      // Only short-circuit on a non-empty Google result. When Google returns
      // empty predictions (e.g. PERMISSION_DENIED, quota, key restriction, or
      // a genuinely obscure query) the googleMaps proxy still resolves 200 with
      // { available: true, predictions: [], error } — without this guard the
      // empty array is returned and the MapTiler fallback never runs, leaving
      // the user with zero suggestions.
      if (body?.available && Array.isArray(body.predictions) && body.predictions.length > 0) {
        return body.predictions.map((p) => ({
          id: p.place_id,
          text: p.text,
          place_name: p.place_name,
          center: null, // resolved on selection via placeDetails
          _google_place_id: p.place_id,
          context: [],
        }));
      }
      if (body?.error) {
        console.warn('[place-search] Google Places returned an error, falling back to MapTiler:', body.error);
      }
    } catch (e) {
      console.warn('[place-search] Google Places failed, falling back to MapTiler:', e?.message || e);
    }
  }
  // MapTiler fallback (handles missing key gracefully — returns [])
  return maptilerGeocode(query, opts);
}

/**
 * Resolve a selected suggestion into a location object.
 * Google predictions have center=null until resolved via Place Details;
 * MapTiler features already carry center + context.
 * Returns { coordinates:[lat,lng], venueName, address, city, country, area }
 * or null on failure.
 */
export async function resolveSelection(feature) {
  if (!feature) return null;
  if (feature._google_place_id) {
    try {
      const res = await base44.functions.invoke('googleMaps', {
        action: 'placeDetails',
        place_id: feature._google_place_id,
      });
      const body = res?.data || res;
      if (body?.available && body?.result) return body.result;
    } catch {
      /* fall through */
    }
    return null;
  }
  if (feature.center && feature.center.length === 2) {
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
      city, country, area,
    };
  }
  return null;
}

export async function isGoogleMapsAvailable() {
  return await checkGoogleAvailable();
}