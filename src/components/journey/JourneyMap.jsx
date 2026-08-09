import React from 'react';
import UnifiedMapView from '@/components/map/UnifiedMapView';
import { journeyLocations } from '@/lib/journey-data';

export default function JourneyMap() {
  const center = journeyLocations[0]?.position || [25.2048, 55.2708];

  const markers = journeyLocations.map((loc) => ({
    position: loc.position,
    title: loc.title,
    subtitle: `${loc.date} · ${loc.city}`,
  }));

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Journey Map</h2>
        <p className="text-sm text-muted-foreground">Places you've explored through Nmood.</p>
      </div>
      <div className="rounded-2xl overflow-hidden border border-border h-[40vh] sm:h-[50vh]">
        <UnifiedMapView markers={markers} center={center} zoom={9} height="100%" />
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {journeyLocations.map((loc) => (
          <span key={loc.id} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
            {loc.city}
          </span>
        ))}
      </div>
    </section>
  );
}