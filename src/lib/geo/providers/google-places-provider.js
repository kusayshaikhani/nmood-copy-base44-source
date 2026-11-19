/**
 * Google Places adapter for the location provider contract
 * (see @/lib/geo/provider-registry).
 *
 * Only active when VITE_GOOGLE_MAPS_API_KEY is configured (see
 * @/lib/google-maps-loader). Labelled truthfully as Google — never presented
 * as MapTiler data. Falls back to the MapTiler provider automatically when
 * the key is absent (see registerDefaultLocationProvider()).
 */
import { loadGoogleMaps, isGoogleMapsBrowserAvailable } from '@/lib/google-maps-loader';
import { PLACE_SEARCH_STATUS } from '@/lib/place-search';

let autocompleteService = null;
let placesService = null;
let geocoder = null;
let sessionToken = null;

async function getServices() {
  const gmaps = await loadGoogleMaps();
  if (!gmaps.places) throw new Error('Google Places library did not load');
  if (!autocompleteService) autocompleteService = new gmaps.places.AutocompleteService();
  if (!placesService) {
    // PlacesService needs a DOM node or map instance; a detached div is fine
    // for Details-only lookups (no rendering happens on it).
    placesService = new gmaps.places.PlacesService(document.createElement('div'));
  }
  if (!geocoder) geocoder = new gmaps.Geocoder();
  if (!sessionToken) sessionToken = new gmaps.places.AutocompleteSessionToken();
  return gmaps;
}

function addressComponent(components, type) {
  return components?.find((c) => c.types?.includes(type))?.long_name || '';
}

const googlePlacesProvider = {
  id: 'google',
  label: 'Google Places',

  isConfigured() {
    return isGoogleMapsBrowserAvailable();
  },

  async search(query, opts = {}) {
    if (!query || query.trim().length < 2) {
      return { status: PLACE_SEARCH_STATUS.TOO_SHORT, results: [] };
    }
    if (!this.isConfigured()) {
      return { status: PLACE_SEARCH_STATUS.NOT_CONFIGURED, results: [], error: 'Place search is not configured for this build.' };
    }
    try {
      await getServices();
      const request = { input: query, sessionToken };
      if (opts?.proximity && Array.isArray(opts.proximity)) {
        const [lng, lat] = opts.proximity;
        request.locationBias = { center: { lat, lng }, radius: 50000 };
      }
      const predictions = await new Promise((resolve, reject) => {
        autocompleteService.getPlacePredictions(request, (results, status) => {
          const gmaps = window.google.maps;
          if (status === gmaps.places.PlacesServiceStatus.OK && results) return resolve(results);
          if (status === gmaps.places.PlacesServiceStatus.ZERO_RESULTS) return resolve([]);
          reject(new Error('Google Places request failed'));
        });
      });
      return {
        status: predictions.length > 0 ? PLACE_SEARCH_STATUS.OK : PLACE_SEARCH_STATUS.EMPTY,
        results: predictions.map((p) => ({
          id: p.place_id,
          text: p.structured_formatting?.main_text || p.description,
          place_name: p.description,
        })),
      };
    } catch (err) {
      return { status: PLACE_SEARCH_STATUS.ERROR, results: [], error: err?.message || 'Place search failed.' };
    }
  },

  async resolve(feature) {
    if (!feature?.id) return null;
    try {
      await getServices();
      const gmaps = window.google.maps;
      const place = await new Promise((resolve, reject) => {
        placesService.getDetails(
          { placeId: feature.id, fields: ['geometry', 'address_component', 'formatted_address', 'name'], sessionToken },
          (result, status) => {
            if (status === gmaps.places.PlacesServiceStatus.OK && result) return resolve(result);
            reject(new Error('Google Place details request failed'));
          },
        );
      });
      sessionToken = null; // spent — a new session begins on next search()
      const loc = place.geometry?.location;
      if (!loc) return null;
      const components = place.address_components;
      return {
        coordinates: [loc.lat(), loc.lng()],
        venueName: place.name || feature.text || '',
        address: place.formatted_address || feature.place_name || '',
        city: addressComponent(components, 'locality'),
        country: addressComponent(components, 'country'),
        area: addressComponent(components, 'administrative_area_level_1') || addressComponent(components, 'sublocality'),
      };
    } catch {
      return null;
    }
  },

  async reverse(lat, lng) {
    try {
      await getServices();
      const gmaps = window.google.maps;
      const result = await new Promise((resolve, reject) => {
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === gmaps.GeocoderStatus.OK && results?.[0]) return resolve(results[0]);
          reject(new Error('Reverse geocode failed'));
        });
      });
      const components = result.address_components;
      return {
        coordinates: [lat, lng],
        venueName: result.formatted_address || '',
        address: result.formatted_address || '',
        city: addressComponent(components, 'locality'),
        country: addressComponent(components, 'country'),
        area: addressComponent(components, 'administrative_area_level_1') || addressComponent(components, 'sublocality'),
      };
    } catch {
      return null;
    }
  },
};

export default googlePlacesProvider;
