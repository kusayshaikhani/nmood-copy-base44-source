import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap } from '@capacitor/google-maps';
import { AlertCircle, Loader2, Locate, Minus, Plus, RefreshCw } from 'lucide-react';
import { getGoogleMapsBrowserKey } from '@/lib/google-maps-loader';

const DEFAULT_CENTER = [25.2048, 55.2708];
const DEFAULT_ZOOM = 12;

// Android uses the official native Maps SDK. Its restricted key comes from
// AndroidManifest metadata, so this renderer must not depend on a browser
// Maps key being compiled into the web bundle.
export default function NativeGoogleMapsView({
  markers = [], center = DEFAULT_CENTER, zoom = DEFAULT_ZOOM, height = '100%',
  className = '', interactive = true, showControls = false, onMapClick,
  markerPosition, onMarkerDrag, showMyLocation = false, onRecenter, onError,
}) {
  const elementRef = useRef(null);
  const mapRef = useRef(null);
  // Keep one native map identity for the life of this React component. A
  // timestamp here meant a re-render could create a second Android MapView
  // while the first one was still being disposed.
  const mapIdRef = useRef(`nmood-native-map-${Math.random().toString(36).slice(2)}`);
  const centerRef = useRef(center);
  const zoomRef = useRef(zoom);
  const onMapClickRef = useRef(onMapClick);
  const onErrorRef = useRef(onError);
  centerRef.current = center;
  zoomRef.current = zoom;
  onMapClickRef.current = onMapClick;
  onErrorRef.current = onError;
  const markerIdsRef = useRef([]);
  const controlledMarkerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const createMap = useCallback(async (isActive) => {
    const apiKey = getGoogleMapsBrowserKey() || '';
    if (!elementRef.current) throw new Error('Google Maps container is not ready');
    const [lat, lng] = centerRef.current;
    const map = await GoogleMap.create({
      id: mapIdRef.current,
      element: elementRef.current,
      apiKey,
      forceCreate: true,
      config: {
        center: { lat, lng }, zoom: zoomRef.current,
        disableDefaultUI: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      },
    });
    if (!isActive()) {
      await map.destroy?.().catch(() => {});
      return null;
    }
    mapRef.current = map;
    // The Android plugin only listens for window scrolling. Nmood scrolls in
    // an app container, so its first native bounds can be stale when this
    // screen has settled. Refresh after two layout frames and once more after
    // the native view is attached.
    const refreshBounds = () => {
      try { map.updateMapBounds?.(); } catch { /* map may be disposing */ }
    };
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (isActive()) refreshBounds();
    }));
    window.setTimeout(() => {
      if (isActive()) refreshBounds();
    }, 250);
    await map.setOnMapClickListener((event) => {
      if (event?.latitude != null && event?.longitude != null) onMapClickRef.current?.([event.latitude, event.longitude]);
    });
    if (isActive()) setLoading(false);
    return map;
  }, []);

  useEffect(() => {
    let active = true;
    const transparentLayers = [];
    let layer = elementRef.current?.parentElement;
    // On Android the map view sits below the WebView. Every opaque page
    // ancestor otherwise paints over that native surface, even after the
    // WebView itself is transparent.
    while (layer && layer !== document.body) {
      transparentLayers.push({
        element: layer,
        value: layer.style.getPropertyValue('background-color'),
        priority: layer.style.getPropertyPriority('background-color'),
      });
      layer.style.setProperty('background-color', 'transparent', 'important');
      layer = layer.parentElement;
    }
    document.documentElement.classList.add('nmood-native-map-active');
    document.body.classList.add('nmood-native-map-active');
    // `scroll` does not bubble, but capture sees scrolling from Nmood's
    // internal content container. Keep the native Android surface aligned to
    // the DOM slot rather than the last window-scroll position.
    const syncNativeBounds = () => {
      try { mapRef.current?.updateMapBounds?.(); } catch { /* disposing */ }
    };
    window.addEventListener('scroll', syncNativeBounds, true);
    window.addEventListener('resize', syncNativeBounds);
    createMap(() => active).catch((error) => {
      if (!active) return;
      console.warn('[NativeGoogleMapsView] init failed:', error?.message || error);
      setFailed(true); setLoading(false); onErrorRef.current?.();
    });
    return () => {
      active = false;
      transparentLayers.forEach(({ element, value, priority }) => {
        if (value) element.style.setProperty('background-color', value, priority);
        else element.style.removeProperty('background-color');
      });
      document.documentElement.classList.remove('nmood-native-map-active');
      document.body.classList.remove('nmood-native-map-active');
      window.removeEventListener('scroll', syncNativeBounds, true);
      window.removeEventListener('resize', syncNativeBounds);
      mapRef.current?.destroy?.().catch(() => {});
      mapRef.current = null;
    };
  }, [createMap]);

  // Update the native camera in place when React props change. Recreating the
  // native view during ordinary renders can leave overlapping Android maps.
  useEffect(() => {
    const [lat, lng] = center;
    mapRef.current?.setCamera({ coordinate: { lat, lng }, zoom }).catch(() => {});
  }, [center, zoom]);

  useEffect(() => {
    const syncMarkers = async () => {
      const map = mapRef.current;
      if (!map || loading || failed) return;
      if (markerIdsRef.current.length) await map.removeMarkers(markerIdsRef.current).catch(() => {});
      markerIdsRef.current = [];
      const safe = markers.filter((marker) => Array.isArray(marker.position) && marker.position.length === 2)
        .map((marker) => ({ coordinate: { lat: marker.position[0], lng: marker.position[1] }, title: marker.title || '', snippet: marker.subtitle || '' }));
      if (safe.length) markerIdsRef.current = await map.addMarkers(safe);
    };
    syncMarkers().catch(() => {});
  }, [markers, loading, failed]);

  useEffect(() => {
    const syncControlledMarker = async () => {
      const map = mapRef.current;
      if (!map || loading || failed) return;
      if (controlledMarkerRef.current) await map.removeMarker(controlledMarkerRef.current).catch(() => {});
      controlledMarkerRef.current = null;
      if (!Array.isArray(markerPosition) || markerPosition.length !== 2) return;
      controlledMarkerRef.current = await map.addMarker({
        coordinate: { lat: markerPosition[0], lng: markerPosition[1] },
        draggable: Boolean(onMarkerDrag),
      });
      await map.setCamera({ coordinate: { lat: markerPosition[0], lng: markerPosition[1] } });
      if (onMarkerDrag) {
        await map.setOnMarkerDragEndListener((event) => {
          if (event?.latitude != null && event?.longitude != null) onMarkerDrag([event.latitude, event.longitude]);
        });
      }
    };
    syncControlledMarker().catch(() => {});
  }, [markerPosition, onMarkerDrag, loading, failed]);

  const moveCamera = useCallback((amount) => {
    const map = mapRef.current;
    if (map) map.setCamera({ zoom: Math.max(3, Math.min(20, zoom + amount)) }).catch(() => {});
  }, [zoom]);
  const recenter = useCallback(() => {
    const map = mapRef.current;
    if (map) map.setCamera({ coordinate: { lat: center[0], lng: center[1] }, zoom }).catch(() => {});
    onRecenter?.();
  }, [center, zoom, onRecenter]);

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <capacitor-google-map ref={elementRef} style={{ display: 'inline-block', width: '100%', height: '100%' }} />
      {loading && !failed && <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-muted/30"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="text-xs text-muted-foreground">Loading map…</p></div>}
      {failed && <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-muted/30 px-4"><AlertCircle className="h-6 w-6 text-muted-foreground" /><p className="text-center text-xs font-medium text-muted-foreground">We couldn’t load the map preview right now. You can still enter a location below.</p><button onClick={() => window.location.reload()} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"><RefreshCw className="h-3.5 w-3.5" /> Retry</button></div>}
      {showControls && !loading && !failed && <div className="absolute bottom-3 end-3 z-30 flex flex-col gap-2"><button onClick={() => moveCamera(1)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card shadow-lg" aria-label="Zoom in"><Plus className="h-5 w-5" /></button><button onClick={() => moveCamera(-1)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card shadow-lg" aria-label="Zoom out"><Minus className="h-5 w-5" /></button>{showMyLocation && <button onClick={recenter} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card shadow-lg" aria-label="My location"><Locate className="h-5 w-5 text-primary" /></button>}</div>}
    </div>
  );
}
