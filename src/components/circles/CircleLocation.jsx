import React from 'react';
import GoogleMapsView from '@/components/map/GoogleMapsView';
import { isGoogleMapsBrowserAvailable } from '@/lib/google-maps-loader';
import { AlertCircle, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { openDirections } from '@/lib/maps-utils';
import { useLocalization } from '@/lib/i18n/useLocalization';

const DEFAULT_COORDS = [25.2048, 55.2708];

export default function CircleLocation({ circle }) {
  const { t } = useLocalization();
  const lat = circle?.location_lat;
  const lng = circle?.location_lng;
  const hasCoords = typeof lat === 'number' && typeof lng === 'number';
  const coords = hasCoords ? [lat, lng] : DEFAULT_COORDS;
  const venueName = circle?.location || '';
  const address = circle?.location_address || '';

  if (!venueName && !hasCoords) return null;
  return (
    <div className="space-y-3">
      <h2 className="font-semibold">{t('circles.location.title')}</h2>
      {hasCoords ? (
        <div className="rounded-2xl overflow-hidden border border-border h-40">
          {isGoogleMapsBrowserAvailable() ? (
            <GoogleMapsView markers={[{ position: coords, title: venueName }]} center={coords} zoom={13} height="100%" />
          ) : (
            <div role="status" className="h-full flex items-center justify-center gap-2 px-5 text-center text-xs text-muted-foreground bg-muted/20">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Circle map unavailable until Google Maps is configured.
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 h-24 flex items-center justify-center">
          <span className="text-xs text-muted-foreground">{t('circles.location.no_pin')}</span>
        </div>
      )}
      <div className="flex items-start gap-2">
        <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium">{venueName}</p>
          {address && <p className="text-xs text-muted-foreground">{address}</p>}
        </div>
      </div>
      <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => openDirections(hasCoords ? coords : null, venueName)}>
        <Navigation className="w-3.5 h-3.5" />{t('experiences.location.get_directions')}</Button>
    </div>
  );
}