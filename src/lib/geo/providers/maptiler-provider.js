/**
 * MapTiler adapter for the location provider contract
 * (see @/lib/geo/provider-registry).
 *
 * This is the provider serving Nmood today. It is labelled MapTiler because
 * that is what it is — results are never presented as Google data.
 */
import { placeSearch, resolveSelection } from '@/lib/place-search';
import { reverseGeocode, isMapProviderConfigured } from '@/lib/maptiler-utils';

const maptilerProvider = {
  id: 'maptiler',
  label: 'MapTiler',

  isConfigured() {
    return isMapProviderConfigured();
  },

  search(query, opts) {
    return placeSearch(query, opts);
  },

  async resolve(feature) {
    const resolved = await resolveSelection(feature);
    if (!resolved?.coordinates) return null;
    return {
      ...resolved,
      venueName: resolved.venueName || feature?.text || '',
      address: resolved.address || feature?.place_name || '',
    };
  },

  async reverse(lat, lng) {
    const result = await reverseGeocode(lng, lat);
    if (!result) return null;
    return {
      coordinates: [lat, lng],
      venueName: result.text || '',
      address: result.address || result.place_name || '',
      area: result.area || '',
      city: result.city || '',
      country: result.country || '',
    };
  },
};

export default maptilerProvider;
