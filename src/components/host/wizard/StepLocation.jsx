import React from 'react';
import MapLibreLocationPicker from '@/components/map/MapLibreLocationPicker';
import { MapPin, Navigation } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const defaultCoords = [25.2048, 55.2708];

export default function StepLocation({ data, update, errors = {} }) {
  const { t } = useLocalization();
  const location = data.location || {};
  const coords = location.coordinates || defaultCoords;
  const inputClass = 'w-full h-12 px-3.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default';

  const updateLocation = (field, value) => update('location', { ...location, [field]: value });

  const handleLocationPicked = (picked) => {
    update('location', {
      ...location,
      coordinates: picked.coordinates,
      venueName: picked.venueName || location.venueName || '',
      address: picked.address || location.address || '',
      area: picked.area || location.area || '',
      city: picked.city || location.city || '',
      country: picked.country || location.country || '',
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h2 className="text-lg font-semibold">{t('hosting.filters.location')}</h2>
        <p className="text-sm text-muted-foreground">{t('hosting.step.location_desc')}</p>
      </div>

      <MapLibreLocationPicker
        value={location}
        onChange={handleLocationPicked}
        height="180px"
      />

      <div>
        <label className="text-sm font-medium mb-1.5 block">{t('hosting.step_location.venue')}</label>
        <input value={location.venueName || ''} onChange={(e) => updateLocation('venueName', e.target.value)} placeholder={t('hosting.step.venue_placeholder')} className={inputClass} />
        {errors.location && <p className="text-xs text-destructive mt-1">{errors.location}</p>}
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">{t('hosting.step_location.address')}</label>
        <div className="relative">
          <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={location.address || ''} onChange={(e) => updateLocation('address', e.target.value)} placeholder={t('hosting.step_location.street')} className={inputClass + ' ps-9'} />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium mb-1.5 block">{t('hosting.step.area')}</label>
          <input value={location.area || ''} onChange={(e) => updateLocation('area', e.target.value)} placeholder={t('hosting.step_location.venue_placeholder')} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('profile.edit.city')}</label>
            <input value={location.city || ''} onChange={(e) => updateLocation('city', e.target.value)} placeholder={t('hosting.step.city_placeholder')} className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('profile.edit.country')}</label>
            <input value={location.country || ''} onChange={(e) => updateLocation('country', e.target.value)} placeholder={t('hosting.step.country_placeholder')} className={inputClass} />
          </div>
        </div>
      </div>
    </div>
  );
}