import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const geocodeSearch = vi.fn();
const isMapProviderConfigured = vi.fn();
vi.mock('@/lib/maptiler-utils', () => ({
  geocodeSearch: (...a) => geocodeSearch(...a),
  isMapProviderConfigured: () => isMapProviderConfigured(),
}));

const { placeSearch, resolveSelection, PLACE_SEARCH_STATUS } = await import('@/lib/place-search');

const feature = {
  id: 'poi.1',
  text: 'Dubai Marina Mall',
  place_name: 'Dubai Marina Mall, Dubai, UAE',
  center: [55.14, 25.07],
  context: [{ id: 'place.1', text: 'Dubai' }, { id: 'country.1', text: 'United Arab Emirates' }],
};

beforeEach(() => {
  geocodeSearch.mockReset();
  isMapProviderConfigured.mockReset().mockReturnValue(true);
});
afterEach(() => vi.clearAllMocks());

describe('placeSearch', () => {
  it('returns live suggestions from the configured provider while typing', async () => {
    geocodeSearch.mockResolvedValue([feature]);

    const res = await placeSearch('Dubai Mar', { lat: 25, lng: 55 });

    expect(geocodeSearch).toHaveBeenCalledWith('Dubai Mar', { lat: 25, lng: 55 });
    expect(res.status).toBe(PLACE_SEARCH_STATUS.OK);
    expect(res.results).toHaveLength(1);
  });

  it('does not query until at least two characters are typed', async () => {
    const res = await placeSearch('D');
    expect(res.status).toBe(PLACE_SEARCH_STATUS.TOO_SHORT);
    expect(geocodeSearch).not.toHaveBeenCalled();
  });

  it('reports an empty result distinctly from a failure — never fake local suggestions', async () => {
    geocodeSearch.mockResolvedValue([]);
    const res = await placeSearch('zzzzzzzz');
    expect(res.status).toBe(PLACE_SEARCH_STATUS.EMPTY);
    expect(res.results).toEqual([]);
  });

  it('reports a missing provider configuration instead of silently returning nothing', async () => {
    isMapProviderConfigured.mockReturnValue(false);
    const res = await placeSearch('Dubai');
    expect(res.status).toBe(PLACE_SEARCH_STATUS.NOT_CONFIGURED);
    expect(geocodeSearch).not.toHaveBeenCalled();
  });

  it('surfaces a provider error (restricted key / quota) as an error state', async () => {
    geocodeSearch.mockRejectedValue(new Error('Place search unavailable (403).'));
    const res = await placeSearch('Dubai');
    expect(res.status).toBe(PLACE_SEARCH_STATUS.ERROR);
    expect(res.error).toContain('403');
  });
});

describe('resolveSelection', () => {
  it('converts a suggestion into the location shape the wizard stores', async () => {
    await expect(resolveSelection(feature)).resolves.toEqual({
      coordinates: [25.07, 55.14],
      venueName: 'Dubai Marina Mall',
      address: 'Dubai Marina Mall, Dubai, UAE',
      city: 'Dubai',
      country: 'United Arab Emirates',
      area: '',
    });
  });

  it('returns null for a suggestion with no coordinates', async () => {
    await expect(resolveSelection({ text: 'x' })).resolves.toBeNull();
  });
});
