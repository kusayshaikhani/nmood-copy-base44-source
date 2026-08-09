import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getMapStyle } from '@/lib/maptiler-utils';
import { useTheme } from '@/lib/ThemeProvider';
import { Plus, Minus, Locate, AlertCircle, WifiOff, Loader2, RefreshCw } from 'lucide-react';

// MAP-001 — Shared MapLibre + MapTiler map component.
// Every map in Nmood uses this. Fixes blank-map root cause: waits for non-zero
// container dimensions before init, uses ResizeObserver for resize handling,
// and never leaves a blank container (loading / error / offline / retry states).

const DEFAULT_CENTER = [25.2048, 55.2708]; // Dubai [lat, lng]
const DEFAULT_ZOOM = 12;

// Convert [lat, lng] → [lng, lat] for MapLibre/MapTiler
const toLngLat = (c) => (Array.isArray(c) && c.length === 2 ? [c[1], c[0]] : c);

export default function MapLibreView({
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
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const controlledMarkerRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const longPressTimerRef = useRef(null);

  const [mapReady, setMapReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine);
  const [retrying, setRetrying] = useState(false);

  const { theme } = useTheme();
  const themeRef = useRef(theme);
  // Guard: skip the theme effect's first run (the mapReady false→true
  // transition) so setStyle() never interrupts the initial style load.
  const themeEffectReadyRef = useRef(false);

  // Offline detection
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
    let map = null;

    const waitForSize = (resolve) => {
      if (cancelled || !containerRef.current) return resolve(false);
      const { clientWidth, clientHeight } = containerRef.current;
      if (clientWidth > 0 && clientHeight > 0) return resolve(true);
      requestAnimationFrame(() => waitForSize(resolve));
    };

    const initMap = async () => {
      // ROOT CAUSE FIX: wait for non-zero container dimensions before init.
      // In lazy-loaded routes / flexbox layouts the container is 0×0 on mount,
      // which causes MapLibre to render nothing (blank map).
      const hasSize = await new Promise(waitForSize);
      if (cancelled || !hasSize) return;

      try {
        setRetrying(false);
        const styleUrl = await getMapStyle(themeRef.current);
        if (cancelled) return;

        let loaded = false;

        map = new maplibregl.Map({
          container: containerRef.current,
          style: styleUrl,
          center: toLngLat(center),
          zoom,
          interactive,
          attributionControl: true,
          cooperativeGestures: false,
        });
        mapRef.current = map;

        map.on('styledata', () => {
          if (!cancelled && !loaded) {
            loaded = true;
            setLoading(false);
            setMapReady(true);
          }
        });
        map.on('load', () => {
          loaded = true;
          if (!cancelled) {
            setLoading(false);
            setMapReady(true);
          }
        });

        map.on('error', (e) => {
          if (!cancelled && !loaded) {
            setError(e?.error?.message || 'Map error');
            setLoading(false);
          }
        });

        // ROOT CAUSE FIX: ResizeObserver calls map.resize() whenever the
        // container dimensions change (tab switch, layout shift, modal open).
        if ('ResizeObserver' in window) {
          resizeObserverRef.current = new ResizeObserver(() => {
            if (mapRef.current) mapRef.current.resize();
          });
          resizeObserverRef.current.observe(containerRef.current);
        }

        // Click + long press handlers
        if (onMapClick || onMapLongPress) {
          let longPressFired = false;
          let pressLngLat = null;

          map.on('click', (e) => {
            if (longPressFired) { longPressFired = false; return; }
            if (onMapClick && e.lngLat) onMapClick([e.lngLat.lat, e.lngLat.lng]);
          });

          if (onMapLongPress) {
            map.on('mousedown', (e) => {
              pressLngLat = e.lngLat;
              longPressFired = false;
              longPressTimerRef.current = setTimeout(() => {
                longPressFired = true;
                if (pressLngLat) onMapLongPress([pressLngLat.lat, pressLngLat.lng]);
              }, 500);
            });
            const cancel = () => {
              if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
              }
            };
            map.on('mousemove', cancel);
            map.on('mouseup', cancel);
            map.on('touchstart', (e) => {
              pressLngLat = e.lngLat;
              longPressFired = false;
              longPressTimerRef.current = setTimeout(() => {
                longPressFired = true;
                if (pressLngLat) onMapLongPress([pressLngLat.lat, pressLngLat.lng]);
              }, 500);
            });
            map.on('touchmove', cancel);
            map.on('touchend', cancel);
          }
        }
      } catch (err) {
        if (!cancelled) { setError(err?.message || 'Map failed to load'); setLoading(false); }
      }
    };

    initMap();

    return () => {
      cancelled = true;
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      if (resizeObserverRef.current) { resizeObserverRef.current.disconnect(); resizeObserverRef.current = null; }
      if (controlledMarkerRef.current) { controlledMarkerRef.current.remove(); controlledMarkerRef.current = null; }
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (map) { map.remove(); mapRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Theme switch — update style without re-initializing.
  // Guard: skip the initial mapReady false→true transition so setStyle()
  // never interrupts the first style load; only fire on a real theme change
  // after the map is fully ready.
  useEffect(() => {
    const prevTheme = themeRef.current;
    themeRef.current = theme;
    if (!mapRef.current || !mapReady) return;
    if (!themeEffectReadyRef.current) {
      themeEffectReadyRef.current = true;
      return;
    }
    if (prevTheme === theme) return;
    getMapStyle(theme)
      .then((styleUrl) => { if (mapRef.current) mapRef.current.setStyle(styleUrl); })
      .catch(() => {});
  }, [theme, mapReady]);

  // Render markers
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    markers.forEach((mk) => {
      if (!mk.position || mk.position.length !== 2) return;
      const el = document.createElement('div');
      el.style.cssText = 'width:28px;height:28px;background:hsl(var(--primary));border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer;';
      const marker = new maplibregl.Marker(el)
        .setLngLat(toLngLat(mk.position))
        .addTo(mapRef.current);

      if (mk.title || mk.subtitle) {
        const imgHtml = mk.image ? `<img src="${mk.image}" alt="${mk.title || 'Location image'}" style="width:100%;height:72px;object-fit:cover;border-radius:8px;margin-bottom:6px;" />` : '';
        const html = `<div style="padding:4px;min-width:140px;">${imgHtml}<div style="font-weight:600;font-size:13px;line-height:1.2;">${mk.title || ''}</div>${mk.subtitle ? `<div style="color:#888;font-size:11px;margin-top:2px;">${mk.subtitle}</div>` : ''}</div>`;
        const popup = new maplibregl.Popup({ offset: 25, maxWidth: '240px' }).setHTML(html);
        marker.setPopup(popup);
      }
      if (mk.onClick) el.addEventListener('click', (ev) => { ev.stopPropagation(); mk.onClick(mk); });
      markersRef.current.push(marker);
    });
  }, [markers, mapReady]);

  // Controlled draggable marker (location picker)
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    if (markerPosition && markerPosition.length === 2) {
      if (controlledMarkerRef.current) {
        controlledMarkerRef.current.setLngLat(toLngLat(markerPosition));
      } else {
        const el = document.createElement('div');
        el.style.cssText = 'width:28px;height:28px;background:hsl(var(--primary));border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:grab;';
        controlledMarkerRef.current = new maplibregl.Marker(el, { draggable: !!onMarkerDrag })
          .setLngLat(toLngLat(markerPosition))
          .addTo(mapRef.current);
        if (onMarkerDrag) {
          controlledMarkerRef.current.on('dragend', () => {
            const ll = controlledMarkerRef.current.getLngLat();
            onMarkerDrag([ll.lat, ll.lng]);
          });
        }
      }
      mapRef.current.panTo(toLngLat(markerPosition));
    } else if (controlledMarkerRef.current) {
      controlledMarkerRef.current.remove();
      controlledMarkerRef.current = null;
    }
  }, [markerPosition, mapReady, onMarkerDrag]);

  // Map controls
  const handleZoomIn = useCallback(() => {
    if (mapRef.current) mapRef.current.zoomIn();
  }, []);
  const handleZoomOut = useCallback(() => {
    if (mapRef.current) mapRef.current.zoomOut();
  }, []);
  const handleRecenter = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({ center: toLngLat(center), zoom, duration: 500 });
      if (onRecenter) onRecenter();
    }
  }, [center, zoom, onRecenter]);

  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    setRetrying(true);
    // Force re-init by reloading the component
    setTimeout(() => window.location.reload(), 100);
  }, []);

  // Map container is ALWAYS mounted so MapLibre can initialize.
  // Loading / error / offline render as overlays on top of the container,
  // never replacing it (replacing it nulls containerRef and breaks init).
  return (
    <div className={`relative ${className}`} style={{ height }}>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />

      {/* Loading overlay */}
      {loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/30 z-20">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground">Loading map…</p>
        </div>
      )}

      {/* Error overlay — displays the actual captured error, not a generic message */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/30 z-20 px-4">
          <AlertCircle className="w-6 h-6 text-destructive shrink-0" />
          <p className="text-xs text-destructive font-medium text-center break-all max-h-[60%] overflow-auto">{error}</p>
          <button onClick={handleRetry} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-default shrink-0">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Offline overlay */}
      {offline && !mapReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/30 z-20">
          <WifiOff className="w-6 h-6 text-muted-foreground" />
          <p className="text-xs text-muted-foreground text-center px-4">You're offline. Map will load when connection returns.</p>
        </div>
      )}

      {/* Map controls */}
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