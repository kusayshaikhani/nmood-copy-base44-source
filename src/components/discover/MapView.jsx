import React, { useState } from 'react';
import UnifiedMapView from '@/components/map/UnifiedMapView';
import BottomSheet from '@/components/shared/BottomSheet';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Wallet, Users, BadgeCheck } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function MapView({ experiences }) {
  const [selected, setSelected] = useState(null);
  const center = experiences[0]?.coordinates || [25.2048, 55.2708];
  const { t } = useLocalization();

  const markers = experiences
    .filter((exp) => exp.coordinates && exp.coordinates.length === 2)
    .map((exp) => ({
      position: exp.coordinates,
      title: exp.title,
      subtitle: exp.host?.name || '',
      image: exp.image,
      onClick: () => setSelected(exp),
    }));

  return (
    <>
      <div className="rounded-2xl overflow-hidden border border-border h-[50vh] sm:h-[60vh]">
        <UnifiedMapView markers={markers} center={center} zoom={12} height="100%" />
      </div>

      <BottomSheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)} title={selected?.title}>
        {selected && (
          <div className="space-y-3 pb-2">
            <img src={selected.image} alt={selected.title} className="w-full h-36 rounded-xl object-cover" />
            <div className="flex items-center gap-2">
              <img src={selected.host.avatar} alt={selected.host.name} className="w-6 h-6 rounded-full" />
              <span className="text-xs font-medium">{selected.host.name}</span>
              {selected.verified && <BadgeCheck className="w-3.5 h-3.5 text-primary" />}
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{selected.distance}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{selected.time}</span>
              <span className="flex items-center gap-1"><Wallet className="w-3 h-3" />{selected.budget}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="flex items-center gap-1 text-xs text-primary font-medium">
                <Users className="w-3 h-3" />{selected.spots}
              </span>
              <Button size="sm">{t('discovery.map.join')}</Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </>
  );
}