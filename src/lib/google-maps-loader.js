// Google Maps JavaScript API loader (client-side, optional).
//
// No Google key ships with this build. If an operator later configures
// VITE_GOOGLE_MAPS_API_KEY, this loader activates the Google renderer and
// Google Places suggestions; until then every caller degrades to
// MapLibre/MapTiler with no network call.
//
// The key is intentionally public (it appears in browser requests) — security
// comes from Google Cloud HTTP-referrer + API restrictions (the iOS wrapper embeds the HTTPS page),
// not secrecy. A server-only key is NEVER read here.

let _loadPromise = null;

/**
 * The configured browser key, or null when Google Maps is not enabled.
 * @returns {string|null}
 */
export function getGoogleMapsBrowserKey() {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || null;
}

/**
 * Returns true when a browser Google Maps key is configured.
 * @returns {boolean}
 */
export function isGoogleMapsBrowserAvailable() {
  return Boolean(getGoogleMapsBrowserKey());
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
    const key = getGoogleMapsBrowserKey();
    if (!key) throw new Error('Google Maps browser key not configured');
    await new Promise((resolve, reject) => {
      const cbName = `__gmaps_cb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      window[cbName] = () => { resolve(); delete window[cbName]; };
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&callback=${cbName}`;
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