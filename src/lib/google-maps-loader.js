// MAP-GOOGLE-BROWSER — Google Maps JavaScript API loader (client-side).
//
// Loads the Google Maps JS SDK once using the public, website-restricted
// GOOGLE_MAPS_BROWSER_API_KEY served by the mapConfig backend. The key is
// intentionally public (it appears in browser requests) — security is via
// Google Cloud HTTP-referrer + API restrictions, not secrecy.
//
// The server-only GOOGLE_MAPS_API_KEY is NEVER requested or exposed here.
//
// Components call loadGoogleMaps() (returns window.google.maps) or
// isGoogleMapsBrowserAvailable() (returns boolean) to decide whether to
// render Google Maps or fall back to MapLibre/MapTiler.

import { base44 } from '@/api/base44Client';

let _browserKey = null;
let _keyResolved = false;
let _keyPromise = null;
let _loadPromise = null;

/**
 * Fetch the browser key from the mapConfig backend (cached module-level).
 * Returns null when unconfigured so callers can degrade to MapLibre.
 * @returns {Promise<string|null>}
 */
export async function getGoogleMapsBrowserKey() {
  if (_keyResolved) return _browserKey;
  if (_keyPromise) return _keyPromise;
  _keyPromise = (async () => {
    try {
      const res = await base44.functions.invoke('mapConfig', {});
      const body = res && res.data ? res.data : res;
      _browserKey = (body && body.browserKey) || null;
    } catch (err) {
      console.warn('[google-maps] Browser key unavailable — falling back to MapLibre.', err?.message || err);
      _browserKey = null;
    } finally {
      _keyResolved = true;
      _keyPromise = null;
    }
    return _browserKey;
  })();
  return _keyPromise;
}

/**
 * Returns true when a browser Google Maps key is configured.
 * @returns {Promise<boolean>}
 */
export async function isGoogleMapsBrowserAvailable() {
  const k = await getGoogleMapsBrowserKey();
  return !!k;
}

/**
 * Loads the Google Maps JavaScript SDK exactly once. Resolves to
 * window.google.maps. Rejects on missing key or script failure so the
 * caller can fall back to MapLibre.
 * @returns {Promise<typeof google.maps>}
 */
export async function loadGoogleMaps() {
  if (typeof window !== 'undefined' && window.google && window.google.maps) {
    return window.google.maps;
  }
  if (_loadPromise) return _loadPromise;
  _loadPromise = (async () => {
    const key = await getGoogleMapsBrowserKey();
    if (!key) throw new Error('Google Maps browser key not configured');
    await new Promise((resolve, reject) => {
      const cbName = `__gmaps_cb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      window[cbName] = () => { resolve(); delete window[cbName]; };
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=${cbName}`;
      script.async = true;
      script.onerror = () => {
        delete window[cbName];
        reject(new Error('Failed to load Google Maps JS SDK'));
      };
      document.head.appendChild(script);
    });
    if (!window.google || !window.google.maps) {
      throw new Error('Google Maps JS SDK loaded but google.maps undefined');
    }
    return window.google.maps;
  })();
  return _loadPromise;
}