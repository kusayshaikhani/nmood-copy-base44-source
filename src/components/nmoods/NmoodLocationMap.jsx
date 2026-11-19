import React, { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { Crosshair, Loader2, MapPin, Search } from 'lucide-react';
import MapLibreLocationPicker from '@/components/map/MapLibreLocationPicker';
import MapLibreView from '@/components/map/MapLibreView';
import { searchPlaces, resolvePlace } from '@/lib/geo/location-provider';

function AndroidNmoodLocationMap({ point, onChange, locationName, onNameChange }) {
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const suppressNextSearch = useRef(false);
  const coordinates = point ? [point.lat, point.lng] : [25.2048, 55.2708];

  const setCoordinates = (next) => {
    if (!Array.isArray(next) || next.length !== 2) return;
    onChange({ lat: next[0], lng: next[1] });
  };

  useEffect(() => {
    if (suppressNextSearch.current) {
      suppressNextSearch.current = false;
      setSuggestions([]);
      setSearching(false);
      return undefined;
    }
    const query = locationName?.trim() || '';
    if (query.length < 2) {
      setSuggestions([]);
      setSearching(false);
      return undefined;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const { results = [] } = await searchPlaces(query, {
          lat: coordinates[0],
          lng: coordinates[1],
          limit: 4,
        });
        if (active) setSuggestions(results);
      } catch {
        if (active) setSuggestions([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [locationName, coordinates[0], coordinates[1]]);

  const chooseSuggestion = async (feature) => {
    setSuggestions([]);
    setSearching(true);
    setLocationError('');
    try {
      const location = await resolvePlace(feature);
      if (!location?.coordinates) throw new Error('Unable to resolve place');
      const [lat, lng] = location.coordinates;
      suppressNextSearch.current = true;
      onNameChange(location.venueName || location.address || feature.place_name || feature.text || '');
      setCoordinates([lat, lng]);
    } catch {
      setLocationError('That place could not be selected. Please choose another suggestion or tap the map.');
    } finally {
      setSearching(false);
    }
  };

  const useCurrentLocation = async () => {
    setLocating(true);
    setLocationError('');
    try {
      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
      onChange({ lat: position.coords.latitude, lng: position.coords.longitude });
    } catch {
      setLocationError('Location is unavailable right now. You can still choose a point on the map or add a place name.');
    } finally {
      setLocating(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="relative z-10 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <label className="block text-sm font-semibold">
          Place name or area <span className="font-normal text-muted-foreground">(optional)</span>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={locationName}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="e.g. Dubai Marina, Kite Beach"
              maxLength={160}
              className="block min-h-12 w-full rounded-xl border border-border bg-background py-2 ps-10 pe-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-autocomplete="list"
              aria-expanded={suggestions.length > 0}
            />
            {(searching || suggestions.length > 0) && (
              <div className="absolute start-0 top-[calc(100%+0.5rem)] z-50 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                {searching && suggestions.length === 0 && (
                  <p className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Finding places…</p>
                )}
                {suggestions.map((feature, index) => (
                  <button
                    key={feature.id || feature.place_id || `${feature.place_name || feature.text}-${index}`}
                    type="button"
                    onClick={() => chooseSuggestion(feature)}
                    className="block w-full border-b border-border px-3 py-3 text-start last:border-b-0 active:bg-muted"
                  >
                    <span className="block truncate text-sm font-medium">{feature.text || feature.place_name}</span>
                    {feature.place_name && feature.place_name !== feature.text && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{feature.place_name}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </label>
        <p className="mt-2 text-xs text-muted-foreground">Tap the map to choose the area you want to share.</p>
      </div>

      <div className="relative h-[220px] overflow-hidden rounded-2xl border border-border bg-muted">
        <MapLibreView
          center={coordinates}
          zoom={14}
          height="100%"
          className="rounded-2xl"
          interactive
          showControls
          showMyLocation={false}
          markerPosition={coordinates}
          onMapClick={setCoordinates}
          onMarkerDrag={setCoordinates}
        />
        <div className="pointer-events-none absolute start-3 top-3 z-20 flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-xs text-muted-foreground shadow-sm">
          <MapPin className="h-3.5 w-3.5" /> Tap to place your pin
        </div>
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="absolute bottom-3 end-3 z-30 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card shadow-lg disabled:opacity-60"
          aria-label="Use current location"
        >
          {locating ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Crosshair className="h-5 w-5 text-primary" />}
        </button>
      </div>

      <div className="relative z-10 rounded-xl bg-background px-1">
        {locationError
          ? <p role="alert" className="text-xs text-destructive">{locationError}</p>
          : <p role="status" className="text-xs text-muted-foreground">{point ? 'Location selected. You can tap the map again to adjust it.' : 'A location is optional. Add one to help nearby people find your share.'}</p>}
      </div>
    </section>
  );
}

function ExistingNmoodLocationMap({ point, onChange, locationName, onNameChange, hideLocation }) {
  const value = point
    ? { coordinates: [point.lat, point.lng], venueName: locationName || '' }
    : { venueName: locationName || '' };
  const handleChange = (location) => {
    const coordinates = Array.isArray(location?.coordinates) ? location.coordinates : null;
    if (coordinates?.length === 2 && Number.isFinite(coordinates[0]) && Number.isFinite(coordinates[1])) {
      onChange({ lat: coordinates[0], lng: coordinates[1] });
    }
    if (typeof location?.venueName === 'string') onNameChange(location.venueName);
    else if (typeof location?.address === 'string') onNameChange(location.address);
  };
  return <div className="space-y-3">
    <MapLibreLocationPicker value={value} onChange={handleChange} height="288px" googleMapsRequired />
    <label className="block text-sm font-medium">Place name (optional)
      <input className="mt-1 block min-h-11 w-full rounded-xl border border-border bg-card px-3" value={locationName} onChange={(event) => onNameChange(event.target.value)} maxLength={160} />
    </label>
    <p role="status" className="text-xs text-muted-foreground">
      {hideLocation
        ? 'Exact location is hidden. The selected pin and place name will not be sent when you publish.'
        : point
          ? 'Your selected location follows the same sharing rules as Circle and Experience creation.'
          : 'Choose a place or drop a pin. You can continue without a location.'}
    </p>
  </div>;
}

export default function NmoodLocationMap(props) {
  return Capacitor.getPlatform() === 'android'
    ? <AndroidNmoodLocationMap {...props} />
    : <ExistingNmoodLocationMap {...props} />;
}
