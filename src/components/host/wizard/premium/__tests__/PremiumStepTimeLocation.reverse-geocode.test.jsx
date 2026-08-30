import React, { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import PremiumStepTimeLocation from '@/components/host/wizard/premium/PremiumStepTimeLocation';

// Only the true I/O boundaries are mocked: the map SDK (UnifiedMapView) and
// the network call (maptiler-utils.reverseGeocode). Everything in between —
// MapLibreLocationPicker's stale-response guard and PremiumStepTimeLocation's
// own merge logic — runs for real.
const reverseGeocodeMock = vi.fn();

vi.mock('@/lib/i18n/useLocalization', () => ({
  useLocalization: () => ({ t: (key) => key }),
}));

vi.mock('@/lib/maptiler-utils', () => ({
  reverseGeocode: (...args) => reverseGeocodeMock(...args),
  geocodeSearch: async () => [],
  isMapProviderConfigured: () => true,
  getMapTilerKey: async () => 'test-key',
  getMapStyle: async () => ({}),
}));

vi.mock('@/components/map/UnifiedMapView', () => ({
  default: ({ onMapClick, onMarkerDrag }) => (
    <div>
      <button type="button" onClick={() => onMapClick([25.1, 55.1])}>Tap pin A</button>
      <button type="button" onClick={() => onMarkerDrag([25.2, 55.2])}>Drag pin B</button>
    </div>
  ),
}));

function createDeferred() {
  let resolve;
  const promise = new Promise((res) => { resolve = res; });
  return { promise, resolve };
}

// Mirrors CreateActivity's real update('location', value) contract: the
// wizard replaces the whole location object, it does not merge per-field.
function Harness() {
  const [location, setLocation] = useState({
    venueName: '', address: '', area: '', city: '', country: '', coordinates: null,
  });
  const update = (field, value) => { if (field === 'location') setLocation(value); };
  return <PremiumStepTimeLocation data={{ location }} update={update} isCircle />;
}

// DOM order inside PremiumStepTimeLocation: [0] map search box (from
// MapLibreLocationPicker), [1] venueName, [2] address, [3] area, [4] city,
// [5] country. FloatingInput labels are not id/htmlFor-associated, so
// position is the only stable, non-ambiguous selector (same convention used
// by the sibling wizard test).
const fields = () => screen.getAllByRole('textbox');

// MapLibreLocationPicker debounces reverse-geocode by 250ms; real timers are
// used (not fake ones) because testing-library's waitFor polls via real
// timers and would otherwise deadlock against faked ones.
const afterDebounce = () => new Promise((resolve) => setTimeout(resolve, 300));

beforeEach(() => {
  reverseGeocodeMock.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('Map-pin reverse geocoding', () => {
  it('selecting (tapping) a pin fills address, area, city and country', async () => {
    reverseGeocodeMock.mockResolvedValueOnce({
      text: 'Coffee Shop A', place_name: '123 Main St', address: '123 Main St',
      area: 'Area A', city: 'City A', country: 'Country A',
    });
    render(<Harness />);

    fireEvent.click(screen.getByText('Tap pin A'));
    await act(afterDebounce);

    await waitFor(() => expect(fields()[2]).toHaveValue('123 Main St'));
    expect(fields()[1]).toHaveValue('Coffee Shop A');
    expect(fields()[3]).toHaveValue('Area A');
    expect(fields()[4]).toHaveValue('City A');
    expect(fields()[5]).toHaveValue('Country A');
  });

  it('dragging a pin also fills address, area, city and country', async () => {
    reverseGeocodeMock.mockResolvedValueOnce({
      text: 'Coffee Shop B', place_name: '456 Side St', address: '456 Side St',
      area: 'Area B', city: 'City B', country: 'Country B',
    });
    render(<Harness />);

    fireEvent.click(screen.getByText('Drag pin B'));
    await act(afterDebounce);

    await waitFor(() => expect(fields()[2]).toHaveValue('456 Side St'));
    expect(fields()[3]).toHaveValue('Area B');
    expect(fields()[4]).toHaveValue('City B');
    expect(fields()[5]).toHaveValue('Country B');
  });

  it('discards a stale reverse-geocode response so it cannot overwrite a newer pin', async () => {
    const deferredA = createDeferred();
    const deferredB = createDeferred();
    reverseGeocodeMock
      .mockImplementationOnce(() => deferredA.promise)
      .mockImplementationOnce(() => deferredB.promise);

    render(<Harness />);

    fireEvent.click(screen.getByText('Tap pin A'));
    await act(afterDebounce); // starts request A (pending)

    fireEvent.click(screen.getByText('Drag pin B'));
    await act(afterDebounce); // starts request B (pending)

    // The newer pin's response lands first.
    await act(async () => {
      deferredB.resolve({ text: 'Venue B', address: 'Address B', area: 'Area B', city: 'City B', country: 'Country B' });
    });
    await waitFor(() => expect(fields()[2]).toHaveValue('Address B'));

    // The older pin's response arrives late and must be discarded, not
    // overwrite the newer pin that is already on screen.
    await act(async () => {
      deferredA.resolve({ text: 'Venue A', address: 'Address A', area: 'Area A', city: 'City A', country: 'Country A' });
    });

    expect(fields()[1]).toHaveValue('Venue B');
    expect(fields()[2]).toHaveValue('Address B');
    expect(fields()[3]).toHaveValue('Area B');
    expect(fields()[4]).toHaveValue('City B');
    expect(fields()[5]).toHaveValue('Country B');
  });

  it('a reverse-geocode failure shows a non-blocking error and leaves the manual fields usable', async () => {
    reverseGeocodeMock.mockRejectedValueOnce(new Error('Network unreachable'));
    render(<Harness />);

    fireEvent.click(screen.getByText('Tap pin A'));
    await act(afterDebounce);

    await waitFor(() => expect(screen.getByTestId('reverse-geocode-error')).toHaveTextContent('Network unreachable'));

    const addressInput = fields()[2];
    expect(addressInput).not.toBeDisabled();
    fireEvent.change(addressInput, { target: { value: 'Manually typed address' } });
    expect(addressInput).toHaveValue('Manually typed address');
  });
});
