import React, { useEffect, useRef, useState, useCallback } from 'react';
import { loadGoogleMaps } from '@/lib/google-maps-loader';
import { useTheme } from '@/lib/ThemeProvider';
import { Plus, Minus, Locate, AlertCircle, WifiOff, Loader2, RefreshCw } from 'lucide-react';

// MAP-GOOGLE-VIEW — Google Maps JS renderer.
// Drop-in match for MapLibreView's prop contract so UnifiedMapView can swap
// between them without consumers changing: markers, center [lat,lng], zoom,
// height, interactive, showControls, onMapClick, onMapLongPress,
// markerPosition, onMarkerDrag, showMyLocation, onRecenter. Plus onError
// (used by UnifiedMapView to fall back to MapLibre on load failure).

const DEFAULT_CENTER = [25.2048, 55.2708]; // Dubai [lat, lng]
const DEFAULT_ZOOM = 12;

// Compact dark style matching the app's dark palette (#0B1437 base).
const DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0B1437' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0B1437' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7e89b5' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#c5cbe8' }] },
  { featureType: 'administrative.neighborhood', elementType: 'labels.text.fill', stylers: [{ color: '#9aa3c8' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#102050' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2756' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8b95c0' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2a3a7a' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#aab4dc' }] },
  { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1840' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3a5a8a' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#0d1840' }] },
];

export default function GoogleMapsView({
  markers = [],
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  height = '100%',
  className = '',
  interactive = true,
  showControls = false,
  onMapClick,
  onMapLongPress,
  markerPosition,
  onMarkerDrag,
  showMyLocation = false,
  onRecenter,
  onError,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const controlledMarkerRef = useRef(null);
  const longPressTimerRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine);
  const [mapReady, setMapReady] = useState(false);

  const { theme } = useTheme();
  const themeRef = useRef(theme);

  // Offline detection (mirrors MapLibreView)
  useEffect(() => {
    const onOff = () => setOffline(true);
    const onOn = () => setOffline(false);
    window.addEventListener('offline', onOff);
    window.addEventListener('online', onOn);
    return () => {
      window.removeEventListener('offline', onOff);
      window.removeEventListener('online', onOn);
    };
  }, []);

  // Initialize map (once)
  useEffect(() => {
    let cancelled = false;

    const waitForSize = (resolve) => {
      if (cancelled || !containerRef.current) return resolve(false);
      const { clientWidth, clientHeight } = containerRef.current;
      if (clientWidth > 0 && clientHeight > 0) return resolve(true);
      requestAnimationFrame(() => waitForSize(resolve));
    };

    const initMap = async () => {
      const hasSize = await new Promise(waitForSize);
      if (cancelled || !hasSize) return;
      try {
        const gmaps = await loadGoogleMaps();
        if (cancelled) return;
        const [lat, lng] = center;
        const map = new gmaps.Map(containerRef.current, {
          center: { lat, lng },
          zoom,
          disableDefaultUI: true,
          gestureHandling: interactive ? 'auto' : 'none',
          draggable: interactive,
          clickableIcons: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: false,
          scaleControl: false,
          rotateControl: false,
          ...(themeRef.current === 'dark' ? { styles: DARK_STYLE } : {}),
        });
        mapRef.current = map;

        map.addListener('idle', () => {
          if (!cancelled) { setLoading(false); setMapReady(true); }
        });

        if (onMapClick) {
          map.addListener('click', (e) => {
            if (e && e.latLng) onMapClick([e.latLng.lat(), e.latLng.lng()]);
          });
        }

        if (onMapLongPress) {
          let moved = false;
          let pressLL = null;
          map.addListener('mousedown', (e) => {
            pressLL = e && e.latLng ? e.latLng : null;
            moved = false;
            longPressTimerRef.current = setTimeout(() => {
              if (!moved && pressLL) onMapLongPress([pressLL.lat(), pressLL.lng()]);
            }, 500);
          });
          const cancel = () => {
            if (longPressTimerRef.current) {
              clearTimeout(longPressTimerRef.current);
              longPressTimerRef.current = null;
            }
          };
          map.addListener('dragstart', () => { moved = true; cancel(); });
          map.addListener('drag', () => { moved = true; cancel(); });
          map.addListener('mouseup', cancel);
          map.addListener('zoom_changed', cancel);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Google Maps failed to load');
          setLoading(false);
          onError?.();
        }
      }
    };

    initMap();

    return () => {
      cancelled = true;
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      if (controlledMarkerRef.current) { controlledMarkerRef.current.setMap(null); controlledMarkerRef.current = null; }
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Theme switch
  useEffect(() => {
    const prev = themeRef.current;
    themeRef.current = theme;
    if (!mapRef.current || !mapReady) return;
    if (prev === theme) return;
    mapRef.current.setOptions(theme === 'dark' ? { styles: DARK_STYLE } : { styles: null });
  }, [theme, mapReady]);

  // Render markers
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const gmaps = window.google.maps;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    markers.forEach((mk) => {
      if (!mk.position || mk.position.length !== 2) return;
      const marker = new gmaps.Marker({
        position: { lat: mk.position[0], lng: mk.position[1] },
        map: mapRef.current,
        title: mk.title || '',
      });
      if (mk.title || mk.subtitle) {
        const imgHtml = mk.image
          ? `<img src="${mk.image}" alt="" style="width:100%;height:72px;object-fit:cover;border-radius:8px;margin-bottom:6px;" />`
          : '';
        const html = `<div style="padding:4px;min-width:140px;">${imgHtml}<div style="font-weight:600;font-size:13px;line-height:1.2;">${mk.title || ''}</div>${mk.subtitle ? `<div style="color:#888;font-size:11px;margin-top:2px;">${mk.subtitle}</div>` : ''}</div>`;
        const info = new gmaps.InfoWindow({ content: html });
        marker.addListener('click', () => info.open({ anchor: marker, map: mapRef.current }));
      }
      if (mk.onClick) marker.addListener('click', () => mk.onClick(mk));
      markersRef.current.push(marker);
    });
  }, [markers, mapReady]);

  // Controlled draggable marker (location picker)
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const gmaps = window.google.maps;
    if (markerPosition && markerPosition.length === 2) {
      const pos = { lat: markerPosition[0], lng: markerPosition[1] };
      if (controlledMarkerRef.current) {
        controlledMarkerRef.current.setPosition(pos);
      } else {
        controlledMarkerRef.current = new gmaps.Marker({
          position: pos,
          map: mapRef.current,
          draggable: !!onMarkerDrag,
        });
        if (onMarkerDrag) {
          controlledMarkerRef.current.addListener('dragend', () => {
            const p = controlledMarkerRef.current.getPosition();
            onMarkerDrag([p.lat(), p.lng()]);
          });
        }
      }
      mapRef.current.panTo(pos);
    } else if (controlledMarkerRef.current) {
      controlledMarkerRef.current.setMap(null);
      controlledMarkerRef.current = null;
    }
  }, [markerPosition, mapReady, onMarkerDrag]);

  const handleZoomIn = useCallback(() => {
    if (mapRef.current) mapRef.current.setZoom(mapRef.current.getZoom() + 1);
  }, []);
  const handleZoomOut = useCallback(() => {
    if (mapRef.current) mapRef.current.setZoom(mapRef.current.getZoom() - 1);
  }, []);
  const handleRecenter = useCallback(() => {
    if (mapRef.current) {
      const [lat, lng] = center;
      mapRef.current.panTo({ lat, lng });
      if (onRecenter) onRecenter();
    }
  }, [center, onRecenter]);

  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    setTimeout(() => window.location.reload(), 100);
  }, []);

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />

      {loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/30 z-20">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground">Loading map…</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/30 z-20 px-4">
          <AlertCircle className="w-6 h-6 text-destructive shrink-0" />
          <p className="text-xs text-destructive font-medium text-center break-all max-h-[60%] overflow-auto">{error}</p>
          <button onClick={handleRetry} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-default shrink-0">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {offline && !mapReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/30 z-20">
          <WifiOff className="w-6 h-6 text-muted-foreground" />
          <p className="text-xs text-muted-foreground text-center px-4">You're offline. Map will load when connection returns.</p>
        </div>
      )}

      {showControls && mapReady && (
        <div className="absolute end-3 bottom-3 flex flex-col gap-2 z-10">
          <button onClick={handleZoomIn} className="w-10 h-10 rounded-xl bg-card border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-default" aria-label="Zoom in">
            <Plus className="w-5 h-5" />
          </button>
          <button onClick={handleZoomOut} className="w-10 h-10 rounded-xl bg-card border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-default" aria-label="Zoom out">
            <Minus className="w-5 h-5" />
          </button>
          {showMyLocation && (
            <button onClick={handleRecenter} className="w-10 h-10 rounded-xl bg-card border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-default" aria-label="My location">
              <Locate className="w-5 h-5 text-primary" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}