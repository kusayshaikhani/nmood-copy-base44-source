import React, { useEffect, useRef, useState, useCallback } from 'react';
import UnifiedMapView from '@/components/map/UnifiedMapView';
import { reverseGeocode } from '@/lib/maptiler-utils';
import { placeSearch, resolveSelection } from '@/lib/place-search';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { Search, Loader2, X, MapPin, Check, Crosshair, Navigation, Clock } from 'lucide-react';

// MAP-001 — MapTiler-powered location picker.
// Uses the shared MapLibreView component. Features: MapTiler Geocoding autocomplete,
// tap, long press, draggable marker, GPS + IP fallback, reverse geocoding,
// Confirm Location card, location types, search history.

const DEFAULT_COORDS = [25.2048, 55.2708]; // Dubai [lat, lng]

const LOCATION_TYPES = [
  { id: 'exact_meeting_point', label_key: 'hosting.step_location.type_exact' },
  { id: 'building_entrance', label_key: 'hosting.step_location.type_entrance' },
  { id: 'parking_area', label_key: 'hosting.step_location.type_parking' },
  { id: 'cafe_inside_mall', label_key: 'hosting.step_location.type_cafe_mall' },
  { id: 'metro_exit', label_key: 'hosting.step_location.type_metro' },
  { id: 'venue_entrance', label_key: 'hosting.step_location.type_venue' },
  { id: 'custom_pin', label_key: 'hosting.step_location.type_custom' },
];

const HISTORY_KEY = 'nmood:map-search-history';

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}
function saveHistory(items) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 8))); } catch { /* */ }
}

export default function MapLibreLocationPicker({ value, onChange, height = '220px' }) {
  const { t } = useLocalization();

  const coords = value?.coordinates || DEFAULT_COORDS;

  const [markerPos, setMarkerPos] = useState(coords);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [reverseLoading, setReverseLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [confirmedLocation, setConfirmedLocation] = useState(null);
  const [locationType, setLocationType] = useState(value?.location_type || '');
  const [history, setHistory] = useState(loadHistory);
  const [showHistory, setShowHistory] = useState(false);

  // Sync marker with external value changes
  useEffect(() => {
    if (value?.coordinates && value.coordinates.length === 2) {
      setMarkerPos(value.coordinates);
      if (value.venueName || value.address) {
        setConfirmedLocation(value);
      }
    }
  }, [value]);

  // Debounced MapTiler autocomplete
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await placeSearch(searchQuery, {
          lat: coords[0],
          lng: coords[1],
          limit: 6,
        });
        setSuggestions(results);
        setShowSuggestions(true);
        setShowHistory(false);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const placeMarker = useCallback(async (lat, lng) => {
    setMarkerPos([lat, lng]);
    setReverseLoading(true);
    try {
      const result = await reverseGeocode(lng, lat);
      const location = {
        coordinates: [lat, lng],
        venueName: result?.text || '',
        address: result?.address || result?.place_name || '',
        area: result?.area || '',
        city: result?.city || '',
        country: result?.country || '',
        location_type: locationType || undefined,
      };
      setConfirmedLocation(location);
      onChange?.(location);
    } catch {
      const location = { coordinates: [lat, lng], location_type: locationType || undefined };
      setConfirmedLocation(location);
      onChange?.(location);
    } finally {
      setReverseLoading(false);
    }
  }, [onChange, locationType]);

  const handleSuggestionClick = useCallback(async (feature) => {
    setShowSuggestions(false);
    setSearchQuery(feature.place_name || feature.text || '');
    const loc = await resolveSelection(feature);
    if (!loc || !loc.coordinates) return;
    const [lat, lng] = loc.coordinates;
    setMarkerPos([lat, lng]);
    const location = {
      coordinates: [lat, lng],
      venueName: loc.venueName || feature.text || '',
      address: loc.address || feature.place_name || '',
      area: loc.area || '',
      city: loc.city || '',
      country: loc.country || '',
      location_type: locationType || undefined,
    };
    setConfirmedLocation(location);
    onChange?.(location);
    const histItem = { text: feature.place_name || feature.text, center: [lat, lng], ts: Date.now() };
    const newHist = [histItem, ...loadHistory().filter((h) => h.text !== histItem.text)].slice(0, 8);
    saveHistory(newHist);
    setHistory(newHist);
  }, [onChange, locationType]);

  const handleMapClick = useCallback((latLng) => {
    placeMarker(latLng[0], latLng[1]);
  }, [placeMarker]);

  const handleMapLongPress = useCallback((latLng) => {
    placeMarker(latLng[0], latLng[1]);
  }, [placeMarker]);

  const handleMarkerDrag = useCallback((latLng) => {
    placeMarker(latLng[0], latLng[1]);
  }, [placeMarker]);

  const handleCurrentLocation = useCallback(() => {
    setLocating(true);
    if (!navigator.geolocation) {
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        placeMarker(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => {
        // GPS denied — IP fallback via BigDataCloud (free, keyless, CORS-enabled).
        // Avoids ipapi.co which can mis-detect UAE users as Ajman/Sharjah.
        fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=0&longitude=0&localityLanguage=en')
          .then(() => {
            // BigDataCloud reverse-geocode needs coords; for IP fallback use ipwho.is
            // (same provider as location-detection.js, consistent with onboarding).
            return fetch('https://ipwho.is/');
          })
          .then((r) => r.json())
          .then((data) => {
            if (data.latitude && data.longitude) placeMarker(data.latitude, data.longitude);
          })
          .catch(() => {})
          .finally(() => setLocating(false));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [placeMarker]);

  const handleLocationTypeChange = useCallback((typeId) => {
    setLocationType(typeId);
    if (confirmedLocation) {
      const updated = { ...confirmedLocation, location_type: typeId };
      setConfirmedLocation(updated);
      onChange?.(updated);
    }
  }, [confirmedLocation, onChange]);

  const handleHistoryClick = useCallback((item) => {
    setShowHistory(false);
    setSearchQuery(item.text || '');
    if (item.center && item.center.length === 2) {
      placeMarker(item.center[0], item.center[1]);
    }
  }, [placeMarker]);

  const locationTypeLabel = (typeId) => {
    const found = LOCATION_TYPES.find((t) => t.id === typeId);
    return found ? (t(found.label_key) || found.id) : '';
  };

  return (
    <div className="space-y-3">
      {/* Search with MapTiler autocomplete.
          z-30 establishes a stacking context above the map div (z-auto) so
          the absolute dropdown always paints on top of the Google/MapLibre map,
          whose internal panes create their own stacking contexts. */}
      <div className="relative z-30">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (history.length > 0 && !searchQuery) setShowHistory(true);
          }}
          onBlur={() => setTimeout(() => { setShowSuggestions(false); setShowHistory(false); }, 200)}
          placeholder={t('hosting.step.search_place') || 'Search for a place, address, or landmark…'}
          className="w-full h-12 ps-9 pe-9 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default"
        />
        {searching && <Loader2 className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />}
        {!searching && searchQuery && (
          <button onClick={() => { setSearchQuery(''); setSuggestions([]); setShowHistory(false); }} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Autocomplete dropdown — z-50 to sit above the map's internal panes */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
            {suggestions.map((s, i) => (
              <button
                key={s.id || i}
                onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(s); }}
                className="w-full flex items-start gap-2 p-3 text-start hover:bg-muted/50 transition-default border-b border-border last:border-0"
              >
                <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.text}</p>
                  {s.place_name && s.place_name !== s.text && (
                    <p className="text-xs text-muted-foreground truncate">{s.place_name}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Search history / recent searches */}
        {showHistory && !showSuggestions && history.length > 0 && (
          <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> {t('hosting.step_location.recent') || 'Recent searches'}
            </div>
            {history.map((h, i) => (
              <button
                key={i}
                onMouseDown={(e) => { e.preventDefault(); handleHistoryClick(h); }}
                className="w-full flex items-start gap-2 p-3 text-start hover:bg-muted/50 transition-default border-b border-border last:border-0"
              >
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm truncate">{h.text}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative rounded-2xl overflow-hidden border border-border" style={{ height }}>
        <UnifiedMapView
          center={markerPos}
          zoom={14}
          height="100%"
          className="rounded-2xl"
          interactive={true}
          showControls={true}
          showMyLocation={true}
          onMapClick={handleMapClick}
          onMapLongPress={handleMapLongPress}
          markerPosition={markerPos}
          onMarkerDrag={handleMarkerDrag}
          onRecenter={handleCurrentLocation}
        />

        {/* Current location button */}
        <button
          onClick={handleCurrentLocation}
          disabled={locating}
          className="absolute end-3 top-3 w-10 h-10 rounded-xl bg-card border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-default disabled:opacity-50 z-20"
          title={t('hosting.step_location.use_current') || 'Use current location'}
        >
          {locating ? <Loader2 className="w-5 h-5 text-primary animate-spin" /> : <Crosshair className="w-5 h-5 text-primary" />}
        </button>

        {/* Drag hint */}
        <div className="absolute top-3 start-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur text-xs text-muted-foreground pointer-events-none z-10">
          <MapPin className="w-3 h-3" /> {t('hosting.step.drag_pin') || 'Tap or drag to place pin'}
        </div>
      </div>

      {/* Confirm Location card */}
      {confirmedLocation && (
        <div className="p-3 rounded-xl border border-primary/20 bg-primary/5">
          <div className="flex items-start gap-2 mb-2">
            <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground mb-0.5">{t('hosting.step_location.selected') || 'Selected location'}</p>
              {reverseLoading ? (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('hosting.step_location.locating') || 'Locating…'}
                </p>
              ) : (
                <>
                  {confirmedLocation.venueName && <p className="text-sm font-medium truncate">{confirmedLocation.venueName}</p>}
                  {confirmedLocation.address && <p className="text-xs text-muted-foreground truncate">{confirmedLocation.address}</p>}
                  {(confirmedLocation.city || confirmedLocation.country) && (
                    <p className="text-xs text-muted-foreground truncate">{[confirmedLocation.city, confirmedLocation.country].filter(Boolean).join(', ')}</p>
                  )}
                  {confirmedLocation.coordinates && (
                    <p className="text-xs text-muted-foreground/70 font-mono mt-1">
                      {confirmedLocation.coordinates[0].toFixed(4)}, {confirmedLocation.coordinates[1].toFixed(4)}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Location types (Phase 7) */}
          {!reverseLoading && (
            <div className="mt-2 pt-2 border-t border-primary/10">
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">{t('hosting.step_location.type_label') || 'Location type'}</p>
              <div className="flex flex-wrap gap-1.5">
                {LOCATION_TYPES.map((lt) => (
                  <button
                    key={lt.id}
                    onClick={() => handleLocationTypeChange(lt.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-default ${
                      locationType === lt.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {t(lt.label_key) || lt.id}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}