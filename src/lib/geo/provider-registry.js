/**
 * Location provider contract.
 *
 * Every Circle / Experience screen talks to `@/lib/geo/location-provider` only.
 * That module delegates to whichever provider is registered here, so a future
 * direct Google Maps Platform implementation can be added by writing one
 * adapter and registering it — no screen, picker or wizard changes.
 *
 * A provider must export:
 *
 *   id            string   stable machine id, e.g. 'maptiler' | 'google'
 *   label         string   human-readable provider name. MUST be truthful:
 *                          never label MapTiler results as Google.
 *   isConfigured()          -> boolean
 *   search(query, opts)     -> { status, results, error? }
 *                              status is one of PLACE_SEARCH_STATUS
 *                              results are opaque provider features, only ever
 *                              passed back into resolve()
 *   resolve(feature)        -> Promise<NormalizedLocation | null>
 *   reverse(lat, lng)       -> Promise<NormalizedLocation | null>
 *
 * NormalizedLocation:
 *   { coordinates: [lat, lng], venueName, address, area, city, country }
 */
import maptilerProvider from '@/lib/geo/providers/maptiler-provider';
import googlePlacesProvider from '@/lib/geo/providers/google-places-provider';
import supabaseLocationProvider from '@/lib/geo/providers/supabase-location-provider';
import { Capacitor } from '@capacitor/core';

// Google Places is used only when VITE_GOOGLE_MAPS_API_KEY is configured
// (see src/lib/google-maps-loader.js); otherwise MapTiler stays active. This
// choice is made once at module load — it never enables Google services or
// makes a network call unless the operator has already set the key.
let activeProvider = Capacitor.getPlatform() === 'android' ? supabaseLocationProvider : (googlePlacesProvider.isConfigured() ? googlePlacesProvider : maptilerProvider);

const REQUIRED = ['id', 'label', 'isConfigured', 'search', 'resolve', 'reverse'];

/** Swap the active provider. Throws if the adapter does not meet the contract. */
export function registerLocationProvider(provider) {
  const missing = REQUIRED.filter((key) => provider?.[key] === undefined);
  if (missing.length > 0) {
    throw new Error(`Location provider is missing: ${missing.join(', ')}`);
  }
  activeProvider = provider;
  return activeProvider;
}

export function getLocationProvider() {
  return activeProvider;
}

/** Truthful name of the provider actually serving results. */
export function getLocationProviderLabel() {
  return activeProvider.label;
}
