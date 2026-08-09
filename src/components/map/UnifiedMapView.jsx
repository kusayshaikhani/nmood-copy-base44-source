import React, { useEffect, useState } from 'react';
import GoogleMapsView from './GoogleMapsView';
import MapLibreView from './MapLibreView';
import { isGoogleMapsBrowserAvailable } from '@/lib/google-maps-loader';

// MAP-UNIFIED — Google Maps JS as primary renderer, MapLibre/MapTiler as
// automatic fallback. Forwards the exact same props as MapLibreView so
// every existing consumer (location picker, read-only maps) works unchanged.
//
// Decision flow:
//   1. Ask mapConfig for a browser Google Maps key (cached).
//   2. If a key exists → render GoogleMapsView. If Google then fails to load
//      (bad key, blocked, offline SDK), onError flips to MapLibre.
//   3. If no key → render MapLibreView directly (current behavior).

export default function UnifiedMapView(props) {
  const [mode, setMode] = useState(null); // null = deciding, 'google', 'maplibre'

  useEffect(() => {
    let mounted = true;
    isGoogleMapsBrowserAvailable()
      .then((avail) => { if (mounted) setMode(avail ? 'google' : 'maplibre'); })
      .catch(() => { if (mounted) setMode('maplibre'); });
    return () => { mounted = false; };
  }, []);

  if (mode === 'google') {
    return <GoogleMapsView {...props} onError={() => setMode('maplibre')} />;
  }
  if (mode === 'maplibre') {
    return <MapLibreView {...props} />;
  }
  // Deciding — neutral loading shell matching the map's height so layout
  // doesn't shift while the mapConfig response is in flight (cached after
  // the first map on the page, so this is typically a single frame).
  const { height = '100%', className = '' } = props;
  return (
    <div className={`relative ${className}`} style={{ height }}>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/30 z-20">
        <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground">Loading map…</p>
      </div>
    </div>
  );
}