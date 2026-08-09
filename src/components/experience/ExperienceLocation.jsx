import React from 'react';
import UnifiedMapView from '@/components/map/UnifiedMapView';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { openDirections } from '@/lib/maps-utils';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * Nmood Premium location — embedded map card with 24px rounded corners,
 * venue details, and "Open in Maps" action.
 */
export default function ExperienceLocation({ experience }) {
  const { t } = useLocalization();
  const { coordinates, venue } = experience;

  const markers = (coordinates && coordinates.length === 2)
    ? [{ position: coordinates, title: venue?.name }]
    : [];

  return (
    <div className="space-y-3">
      <h2 className="text-section-title text-foreground">{t('hosting.filters.location')}</h2>
      <div className="rounded-[24px] overflow-hidden border border-border/50 shadow-card h-44 bg-muted">
        <UnifiedMapView markers={markers} center={coordinates} zoom={13} height="100%" />
      </div>
      <div className="flex items-start gap-2.5 px-1">
        <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{venue.name}</p>
          <p className="text-caption text-muted-foreground">{venue.address}</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2 rounded-button"
        onClick={() => openDirections(coordinates, venue.name)}
      >
        <Navigation className="w-4 h-4" />
        {t('experiences.location.get_directions')}
      </Button>
    </div>
  );
}