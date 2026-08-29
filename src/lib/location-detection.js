// UX-021 — Automatic country & city detection during onboarding.
//
// Detects the user's country and city, in priority order:
//   1. Device GPS (requires permission) → reverse-geocode coordinates.
//      Uses enableHighAccuracy for best available coordinates.
//      Checks coords.accuracy and labels low-accuracy results as approximate.
//   2. IP-based geolocation (no permission) — used when GPS is denied, fails,
//      or times out (>12s). Always labeled as approximate.
//   3. Unknown — onboarding never blocks; both fields fall back to 'Unknown'.
//
// Only city-level location is ever stored on the member profile. GPS
// coordinates are used transiently for reverse geocoding and discarded — they
// are never persisted or exposed publicly (see UX-021 §Privacy).
//
// APIs (free, key-less, CORS-enabled):
//   - Reverse geocode: BigDataCloud client endpoint (no API key required).
//   - IP geolocation:  ipwho.is (no API key required).

const GPS_TIMEOUT_MS = 8000;
// Must exceed GPS_TIMEOUT_MS plus room for the reverse-geocode (or IP
// fallback) network round-trip that runs *after* GPS resolves. This was
// previously 6000ms — shorter than GPS_TIMEOUT_MS itself — so on real
// devices (where a cold GPS fix plus reverse-geocode routinely takes
// longer than 6s) this outer race always won first, reporting "denied/
// unavailable" even when the user had just granted permission and GPS
// would have succeeded moments later.
const DETECTION_TIMEOUT_MS = 14000;
const GPS_MAX_AGE_MS = 30000;
const LOW_ACCURACY_THRESHOLD_M = 5000; // >5km = approximate
const COUNTRY_UNKNOWN = 'Unknown';
const CITY_UNKNOWN = 'Unknown';

// Normalize country names from various APIs to a consistent format.
// ipwho.is returns "United Arab Emirates (the)" — strip the "(the)" suffix.
function normalizeCountryName(name) {
  if (!name) return '';
  let n = String(name).trim();
  // Strip " (the)" suffix used by some APIs (e.g. ipwho.is).
  n = n.replace(/\s*\(the\)\s*$/i, '');
  return n;
}

function normalizeResult({ country, city, state, source, accuracy, isApproximate, errorType, latitude, longitude }) {
  return {
    country: normalizeCountryName(country) || COUNTRY_UNKNOWN,
    city: (city && String(city).trim()) || CITY_UNKNOWN,
    state: (state && String(state).trim()) || '',
    source,
    accuracy: accuracy || null,
    isApproximate: !!isApproximate,
    errorType: errorType || null,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
  };
}

// Reverse-geocode GPS coordinates to a country + city using BigDataCloud's
// free client endpoint (no API key, CORS-enabled).
// Prefers city/locality/district over principalSubdivision (emirate/state)
// to avoid returning the wrong emirate when the user is in a nearby emirate.
async function reverseGeocode(lat, lng) {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`reverse geocode failed: ${res.status}`);
  const data = await res.json();
  const country = data.countryName || '';
  // Prefer city, then locality, then district — only use principalSubdivision
  // (emirate/state) as a last resort, since it is less precise and may
  // return a neighboring emirate instead of the actual city.
  const city = data.city || data.locality || data.district || '';
  const state = data.principalSubdivision || '';
  if (!country) throw new Error('reverse geocode returned no country');
  return { country, city: city || state, state, usedSubdivision: !city && !!state };
}

// Request device GPS position with high accuracy and a 12s hard timeout.
// Resolves to { lat, lng, accuracy } or rejects with { type, message }.
function requestGps() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({ type: 'unavailable' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      (err) => reject({
        type: err.code === 1 ? 'denied' : err.code === 3 ? 'timeout' : 'unavailable',
        message: err.message,
      }),
      { enableHighAccuracy: true, timeout: GPS_TIMEOUT_MS, maximumAge: GPS_MAX_AGE_MS }
    );
  });
}

// IP-based geolocation fallback (ipwho.is — free, no key, CORS-enabled).
async function detectViaIP() {
  const res = await fetch('https://ipwho.is/', { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`ip lookup failed: ${res.status}`);
  const data = await res.json();
  if (!data || data.success === false) throw new Error(data?.message || 'ip lookup unsuccessful');
  const country = data.country || '';
  const city = data.city || data.region || '';
  const state = data.region || '';
  const latitude = data.latitude || null;
  const longitude = data.longitude || null;
  if (!country && !city) throw new Error('ip lookup returned no location');
  return { country, city, state, latitude, longitude };
}

/**
 * Detect the user's location automatically.
 *
 * Strategy: try GPS first (high accuracy); on denial, timeout, or error,
 * fall back to IP-based geolocation. If both fail, returns Unknown for both
 * fields — callers must never block on this.
 *
 * @returns {Promise<{country, city, source, accuracy, isApproximate, errorType}>}
 *   - source: 'gps' | 'ip' | 'unknown'
 *   - accuracy: meters (GPS only, null otherwise)
 *   - isApproximate: true for IP, low-accuracy GPS, or subdivision-only results
 *   - errorType: 'denied' | 'timeout' | 'unavailable' | null
 */
export async function detectLocation() {
  const detection = detectLocationWithFallback();
  const timeout = new Promise((resolve) => {
    setTimeout(() => resolve(normalizeResult({
      country: COUNTRY_UNKNOWN,
      city: CITY_UNKNOWN,
      source: 'unknown',
      errorType: 'timeout',
    })), DETECTION_TIMEOUT_MS);
  });
  return Promise.race([detection, timeout]);
}

async function detectLocationWithFallback() {
  let gpsErrorType = null;

  // 1. GPS (high accuracy, 12s timeout).
  try {
    const { lat, lng, accuracy } = await requestGps();
    const { country, city, state, usedSubdivision } = await reverseGeocode(lat, lng);
    const isApproximate = (accuracy && accuracy > LOW_ACCURACY_THRESHOLD_M) || usedSubdivision;
    return normalizeResult({
      country, city, state, source: 'gps',
      accuracy, isApproximate, latitude: lat, longitude: lng,
    });
  } catch (err) {
    gpsErrorType = err?.type || 'unavailable';
    // Fall through to IP.
  }

  // 2. IP-based fallback (always approximate).
  try {
    const { country, city, state, latitude, longitude } = await detectViaIP();
    return normalizeResult({
      country, city, state, source: 'ip',
      isApproximate: true,
      errorType: gpsErrorType === 'denied' ? 'denied' : null,
      latitude, longitude,
    });
  } catch {
    // Fall through to Unknown.
  }

  // 3. Unknown — never block onboarding.
  return normalizeResult({
    country: COUNTRY_UNKNOWN, city: CITY_UNKNOWN, source: 'unknown',
    errorType: gpsErrorType || 'unavailable',
  });
}

export { COUNTRY_UNKNOWN, CITY_UNKNOWN, LOW_ACCURACY_THRESHOLD_M };