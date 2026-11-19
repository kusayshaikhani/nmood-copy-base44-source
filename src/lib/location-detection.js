import { notifyLocationPermissionGranted } from './location-permission-event';
// Worldwide city-level location detection for onboarding and Edit Profile.
// Device coordinates are used transiently, reverse-geocoded, and discarded.
// Only a canonical country from Nmood's country catalog and a city are returned.

import { COUNTRIES } from '@/lib/master-data';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

const GPS_TIMEOUT_MS = 15000;
const DETECTION_TIMEOUT_MS = 32000;
const GPS_MAX_AGE_MS = 600000;
const LOW_ACCURACY_THRESHOLD_M = 5000;
const COUNTRY_UNKNOWN = 'Unknown';
const CITY_UNKNOWN = 'Unknown';

/** Resolve an API country name/code to the canonical value used by selectors. */
export function normalizeSupportedCountry({ name = '', code = '' } = {}) {
  const normalizedName = String(name).trim().replace(/\s*\(the\)\s*$/i, '').toLocaleLowerCase('en');
  const normalizedCode = String(code).trim().toUpperCase();
  const country = COUNTRIES.find((item) =>
    (normalizedCode && [item.iso2, item.iso3, item.key].some((value) => String(value || '').toUpperCase() === normalizedCode))
    || (normalizedName && item.name.toLocaleLowerCase('en') === normalizedName)
  );
  return country ? { name: country.name, key: country.key, code: country.iso2 } : null;
}

function unknownResult(errorType) {
  return {
    country: COUNTRY_UNKNOWN,
    countryKey: '',
    countryCode: '',
    city: CITY_UNKNOWN,
    state: '',
    source: 'unknown',
    accuracy: null,
    isApproximate: false,
    errorType,
    latitude: null,
    longitude: null,
  };
}

async function reverseGeocode(lat, lng) {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw Object.assign(new Error('reverse geocode failed'), { type: 'reverse_geocode' });
  const data = await response.json();
  const country = normalizeSupportedCountry({ name: data.countryName, code: data.countryCode });
  const city = String(data.city || data.locality || data.district || '').trim();
  const state = String(data.principalSubdivision || '').trim();
  if (!country || !(city || state)) {
    throw Object.assign(new Error('reverse geocode returned an unsupported or incomplete location'), { type: 'reverse_geocode' });
  }
  return { country, city: city || state, state, usedSubdivision: !city && Boolean(state) };
}

// Read permission without prompting or acquiring a position. Main onboarding can
// suggest a location automatically only after permission was already granted.
export async function hasGrantedLocationPermission() {
  try {
    if (Capacitor.isNativePlatform()) {
      return (await Geolocation.checkPermissions()).location === 'granted';
    }
    if (!navigator.permissions?.query) return false;
    return (await navigator.permissions.query({ name: 'geolocation' })).state === 'granted';
  } catch {
    return false;
  }
}

async function requestNativeGps(maximumAge) {
  let current;
  try {
    current = await Geolocation.checkPermissions();
  } catch (error) {
    throw { type: classifyNativeLocationError(error) };
  }
  let state = current.location;
  if (state === 'prompt' || state === 'prompt-with-rationale') {
    try {
      state = (await Geolocation.requestPermissions({ permissions: ['location'] })).location;
    } catch (error) {
      throw { type: classifyNativeLocationError(error) };
    }
  }
  if (state !== 'granted') throw { type: 'denied' };
  notifyLocationPermissionGranted();
  let position;
  try {
    // Existing callers may use a cached city fix; Passport explicitly requests
    // a fresh position after travel. Support Wi-Fi-only iPads, then retry
    // with high accuracy when iOS cannot produce that position in time.
    position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: false, timeout: GPS_TIMEOUT_MS, maximumAge,
    });
  } catch (firstError) {
    const firstType = classifyNativeLocationError(firstError);
    if (firstType !== 'timeout' && firstType !== 'no_coordinates' && firstType !== 'plugin_failure') throw { type: firstType };
    try {
      position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true, timeout: GPS_TIMEOUT_MS, maximumAge,
      });
    } catch (retryError) {
      throw { type: classifyNativeLocationError(retryError) };
    }
  }
  const rawLat = position?.coords?.latitude;
  const rawLng = position?.coords?.longitude;
  if (rawLat === null || rawLat === undefined || rawLng === null || rawLng === undefined) throw { type: 'no_coordinates' };
  const lat = Number(rawLat);
  const lng = Number(rawLng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw { type: 'no_coordinates' };
  return { lat, lng, accuracy: Number(position?.coords?.accuracy) || null };
}

export function classifyNativeLocationError(error) {
  const code = String(error?.code || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();
  if (code === 'OS-PLUG-GLOC-0003' || code === 'OS-PLUG-GLOC-0008' || /permission.*denied|not authorized|restricted/.test(message)) return 'denied';
  if (code === 'OS-PLUG-GLOC-0007' || /location services.*(disabled|not enabled)|services are not enabled/.test(message)) return 'services_disabled';
  if (code === 'OS-PLUG-GLOC-0010' || /timed?\s*out|obtain location in time/.test(message)) return 'timeout';
  if (/no coordinates|position.*unavailable/.test(message)) return 'no_coordinates';
  return 'plugin_failure';
}

function requestWebGps(maximumAge) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({ type: 'unavailable' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }),
      (error) => reject({
        type: error.code === 1 ? 'denied' : error.code === 3 ? 'timeout' : 'unavailable',
      }),
      { enableHighAccuracy: true, timeout: GPS_TIMEOUT_MS, maximumAge },
    );
  });
}

async function detectFromDevice(maximumAge) {
  try {
    const { lat, lng, accuracy } = Capacitor.isNativePlatform()
      ? await requestNativeGps(maximumAge)
      : await requestWebGps(maximumAge);
    const { country, city, state, usedSubdivision } = await reverseGeocode(Math.round(lat * 100) / 100, Math.round(lng * 100) / 100);
    return {
      country: country.name,
      countryKey: country.key,
      countryCode: country.code,
      city,
      state,
      source: 'gps',
      accuracy: accuracy || null,
      isApproximate: Boolean((accuracy && accuracy > LOW_ACCURACY_THRESHOLD_M) || usedSubdivision),
      errorType: null,
      latitude: null,
      longitude: null,
    };
  } catch (error) {
    return unknownResult(error?.type || 'unavailable');
  }
}

export async function detectLocation({ fresh = false } = {}) {
  let timeoutId;
  const timeout = new Promise((resolve) => {
    timeoutId = setTimeout(() => resolve(unknownResult('timeout')), DETECTION_TIMEOUT_MS);
  });
  return Promise.race([detectFromDevice(fresh ? 0 : GPS_MAX_AGE_MS), timeout]).finally(() => clearTimeout(timeoutId));
}

export function locationFailureMessage(errorType) {
  if (!Capacitor.isNativePlatform()) {
    if (errorType === 'denied') return 'Location access is off for this website. Allow Location in your browser’s site permissions, then use Settings → Privacy → Distance and online status → Allow location and refresh distance. You can also enter your country and city manually.';
    if (errorType === 'services_disabled') return 'Device Location Services are disabled. Enable them in your device settings and allow this website to use location, or enter your country and city manually.';
    if (errorType === 'no_coordinates' || errorType === 'unavailable') return 'Your browser could not obtain a location. Check your connection and site location permission, then retry or enter your country and city manually.';
    if (!['timeout', 'reverse_geocode'].includes(errorType)) return 'Your browser could not complete the location request. Try again or choose your country and city manually.';
  }
  if (errorType === 'denied') return 'Location access is off. Open iOS Settings → Nmood → Location, or choose your country and city manually.';
  if (errorType === 'services_disabled') return 'Device Location Services are disabled. Open iOS Settings → Privacy & Security → Location Services, or enter your country and city manually.';
  if (errorType === 'no_coordinates' || errorType === 'unavailable') return 'No coordinates are currently available. Wi-Fi-only iPads are supported; try again with a network connection or enter your country and city manually.';
  if (errorType === 'timeout') return 'Location detection timed out. Try again or enter your country and city manually.';
  if (errorType === 'reverse_geocode') return 'Nmood found your position but could not determine a city and country. Choose them manually.';
  return 'The native location service could not complete the request. Try again or choose your country and city manually.';
}

export function locationFailureTitle(errorType) {
  if (errorType === 'denied') return 'Location permission denied';
  if (errorType === 'services_disabled') return 'Location Services disabled';
  if (errorType === 'timeout') return 'Location detection timed out';
  if (errorType === 'no_coordinates' || errorType === 'unavailable') return 'Location unavailable';
  if (errorType === 'reverse_geocode') return 'City lookup unavailable';
  return 'Location detection failed';
}

export { COUNTRY_UNKNOWN, CITY_UNKNOWN, LOW_ACCURACY_THRESHOLD_M };
