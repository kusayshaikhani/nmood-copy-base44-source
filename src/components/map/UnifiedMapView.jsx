import React, { useState } from 'react';
import GoogleMapsView from './GoogleMapsView';
import MapLibreView from './MapLibreView';
import NativeGoogleMapsView from './NativeGoogleMapsView';
import { Capacitor } from '@capacitor/core';
import { isGoogleMapsBrowserAvailable } from '@/lib/google-maps-loader';

// Renders MapLibre/MapTiler, which is the configured provider for this build.
// If an operator later sets VITE_GOOGLE_MAPS_API_KEY the Google renderer
// is used instead, falling back to MapLibre if the SDK fails to load. The
// decision is synchronous, so the map paints on the first frame.

export default function UnifiedMapView({ requireGoogle = false, ...props }) {
  // Android's native Capacitor Maps plugin reads its restricted key from the
  // AndroidManifest. It must not be gated on the browser-only JS Maps key.
  const useNativeGoogle = Capacitor.getPlatform() === 'android';
  const configured = useNativeGoogle || isGoogleMapsBrowserAvailable();
  const [useGoogle, setUseGoogle] = useState(() => configured);

  if (requireGoogle && !configured) {
    return (
      <div role="status" data-testid="google-maps-unconfigured" className="h-full w-full flex items-center justify-center bg-muted/30 px-6 text-center">
        <p className="text-sm text-muted-foreground">
          Google Maps is not configured for this build. Enter the venue and address manually below.
        </p>
      </div>
    );
  }

  if (requireGoogle && !useGoogle) {
    return (
      <div role="status" data-testid="google-maps-load-failed" className="h-full w-full flex items-center justify-center bg-muted/30 px-6 text-center">
        <p className="text-sm text-muted-foreground">
          Google Maps could not load. Check your connection or enter the venue and address manually below.
        </p>
      </div>
    );
  }

  if (useGoogle) {
    if (useNativeGoogle) {
      return <NativeGoogleMapsView {...props} onError={() => setUseGoogle(false)} />;
    }
    return <GoogleMapsView {...props} onError={() => setUseGoogle(false)} />;
  }
  return <MapLibreView {...props} />;
}
