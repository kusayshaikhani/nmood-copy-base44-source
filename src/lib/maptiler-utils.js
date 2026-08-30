// PB-005 — MapTiler geocoding utilities.
// The public MapTiler key is read from build config (VITE_MAPTILER_KEY). It was
// previously fetched from the Base44 `mapConfig` backend function, which does
// not answer on the independently-hosted build — the key resolved to null and
// autocomplete silently returned nothing.

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || '';

/** True when a place/map provider key is configured for this build. */
export function isMapProviderConfigured() {
  return Boolean(MAPTILER_KEY);
}

/**
 * Returns the MapTiler API key, or null when unconfigured so callers can
 * degrade gracefully (manual entry / OSM raster fallback) instead of throwing.
 * @returns {Promise<string|null>}
 */
export async function getMapTilerKey() {
  return MAPTILER_KEY || null;
}

/**
 * Returns the MapTiler streets style URL for MapLibre GL, or a keyless OSM
 * raster style object when no MapTiler key is configured so the map still
 * renders (no blank map).
 */
export async function getMapStyle(theme) {
  const key = await getMapTilerKey();
  if (!key) {
    return {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
        },
      },
      layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
    };
  }
  const styleId = theme === 'dark' ? 'streets-dark' : 'streets';
  return `https://api.maptiler.com/maps/${styleId}/style.json?key=${key}`;
}

/**
 * Forward geocoding / autocomplete.
 * @param {string} query — search text (landmarks, buildings, businesses, addresses)
 * @param {Object} opts — { limit, lat, lng, radius } for proximity bias
 * @returns {Promise<Array>} — array of { place_name, text, center: [lng, lat], place_type, context }
 */
const _geocodeCache = new Map();

export async function geocodeSearch(query, opts = {}) {
  if (!query || query.trim().length < 2) return [];
  const cacheKey = `${query.trim().toLowerCase()}:${opts.lat || ''}:${opts.lng || ''}`;
  if (_geocodeCache.has(cacheKey)) return _geocodeCache.get(cacheKey);
  const key = await getMapTilerKey();
  if (!key) return []; // missing-key fallback: no autocomplete
  const params = new URLSearchParams({
    key,
    autocomplete: 'true',
    limit: String(opts.limit || 6),
  });
  if (typeof opts.lat === 'number' && typeof opts.lng === 'number') {
    params.set('proximity', `${opts.lng},${opts.lat}`);
  }
  const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?${params}`;
  const res = await fetch(url);
  if (!res.ok) {
    // Surfaced to the UI: 403 means the key is restricted or out of quota.
    throw new Error(`Place search unavailable (${res.status}).`);
  }
  const data = await res.json();
  const features = data.features || [];
  _geocodeCache.set(cacheKey, features);
  if (_geocodeCache.size > 100) { const k = _geocodeCache.keys().next().value; _geocodeCache.delete(k); }
  return features;
}

/**
 * Reverse geocoding — converts [lng, lat] to a human-readable address.
 * @param {number} lng
 * @param {number} lat
 * @returns {Promise<Object|null>} — { place_name, text, address, city, country, area, context }
 */
export async function reverseGeocode(lng, lat) {
  const key = await getMapTilerKey();
  if (!key) return null; // missing-key fallback: no reverse geocoding
  const params = new URLSearchParams({ key, limit: '1' });
  const url = `https://api.maptiler.com/geocoding/${lng},${lat}.json?${params}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error('[maptiler] Reverse geocoding HTTP error:', res.status, res.statusText);
      return null;
    }
    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) return null;

    // Parse context to extract city, country, area from the feature's context array.
    let city = '';
    let country = '';
    let area = '';
    if (feature.context) {
      for (const ctx of feature.context) {
        const typeId = ctx.id?.split('.')[0];
        if (typeId === 'place' || typeId === 'municipality') city = ctx.text;
        else if (typeId === 'country') country = ctx.text;
        else if (typeId === 'region' || typeId === 'subregion') area = area || ctx.text;
        else if (typeId === 'locality' || typeId === 'neighborhood') area = ctx.text;
      }
    }
    // Fallbacks if context didn't have the fields
    if (!city && feature.place_type?.includes('municipality')) city = feature.text;
    if (!country && feature.place_type?.includes('country')) country = feature.text;

    return {
      place_name: feature.place_name || feature.text || '',
      text: feature.text || '',
      address: feature.place_name || '',
      city,
      country,
      area,
      center: feature.center, // [lng, lat]
    };
  } catch (err) {
    console.error('[maptiler] Reverse geocoding failed:', err);
    return null;
  }
}