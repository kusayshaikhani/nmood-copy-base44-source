import React from 'react';
import { Calendar, Clock, Hourglass, AlertCircle } from 'lucide-react';
import moment from 'moment';
import MapLibreLocationPicker from '@/components/map/MapLibreLocationPicker';
import { useLocalization } from '@/lib/i18n/useLocalization';
import FloatingInput from './FloatingInput';

const defaultCoords = [25.2048, 55.2708];

/**
 * UI-020 — Step 3: Time & Location (date/time for experiences, location for all).
 */
export default function PremiumStepTimeLocation({ data, update, errors = {}, isCircle }) {
  const { t } = useLocalization();
  const location = data.location || {};
  const coords = location.coordinates || defaultCoords;
  const today = moment().format('YYYY-MM-DD');

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

  const computeDuration = (start, end, overnight) => {
    if (!start || !end) return null;
    const s = moment(start, 'HH:mm');
    const e = moment(end, 'HH:mm');
    if (!s.isValid() || !e.isValid()) return null;
    let diff = e.diff(s, 'hours', true);
    if (diff <= 0) {
      if (overnight === true) diff += 24;
      else return null;
    }
    const h = Math.floor(diff);
    const m = Math.round((diff - h) * 60);
    if (m === 0) return `${h}h`;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  const isOvernightPossible = data.startTime && data.endTime && moment(data.endTime, 'HH:mm').isBefore(moment(data.startTime, 'HH:mm'));
  const duration = computeDuration(data.startTime, data.endTime, data.overnight);

  const dateInputClass = 'w-full h-14 px-4 rounded-2xl bg-card border border-border text-base focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all';

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold">{isCircle ? t('create.premium.location_title') : t('create.premium.timelocation_title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{isCircle ? t('create.premium.location_subtitle') : t('create.premium.timelocation_subtitle')}</p>
      </div>

      {/* Date & Time (experience only) */}
      {!isCircle && (
        <>
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> {t('hosting.step_datetime.date')}
            </label>
            <input type="date" min={today} value={data.date || ''} onChange={(e) => update('date', e.target.value)} className={dateInputClass} />
            {errors.date && <p className="text-xs text-destructive mt-1.5">{errors.date}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" /> {t('hosting.step_datetime.start_time')}
              </label>
              <input type="time" value={data.startTime || ''} onChange={(e) => { update('startTime', e.target.value); update('overnight', null); }} className={dateInputClass} />
              {errors.startTime && <p className="text-xs text-destructive mt-1.5">{errors.startTime}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" /> {t('hosting.step.end_time')}
              </label>
              <input type="time" value={data.endTime || ''} onChange={(e) => { update('endTime', e.target.value); update('overnight', null); }} className={dateInputClass} />
            </div>
          </div>

          {isOvernightPossible && (
            <div className="p-3.5 rounded-card bg-warning/10 border border-warning/20">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-2">{t('hosting.step.ends_next_day')}</p>
                  <div className="flex gap-2">
                    <button onClick={() => update('overnight', true)} type="button"
                      className={`px-4 py-2 rounded-button text-sm font-medium transition-all ${data.overnight === true ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {t('hosting.step_basic.yes')}
                    </button>
                    <button onClick={() => update('overnight', false)} type="button"
                      className={`px-4 py-2 rounded-button text-sm font-medium transition-all ${data.overnight === false ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {t('hosting.step_basic.no')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {duration && (
            <div className="flex items-center justify-center gap-2 p-3 rounded-card bg-primary/5 border border-primary/20">
              <Hourglass className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">{duration}</span>
            </div>
          )}
        </>
      )}

      {/* Location card with map */}
      <div className="space-y-4">
        {/* overflow-visible: the autocomplete dropdown is absolute-positioned
            below the search input and must escape this card to overlay the
            map. The map inside already has its own rounded-2xl overflow-hidden. */}
        <div className="rounded-card overflow-visible border border-border/50 shadow-soft">
          <MapLibreLocationPicker
            value={location}
            onChange={handleLocationPicked}
            height="180px"
          />
        </div>

        <FloatingInput
          label={t('hosting.step_location.venue')}
          value={location.venueName}
          onChange={(e) => updateLocation('venueName', e.target.value)}
          error={errors.location}
          placeholder={t('hosting.step.venue_placeholder')}
        />

        <div className="relative">
          <FloatingInput
            label={t('hosting.step_location.address')}
            value={location.address}
            onChange={(e) => updateLocation('address', e.target.value)}
            placeholder={t('hosting.step_location.street')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FloatingInput
            label={t('hosting.step.area')}
            value={location.area}
            onChange={(e) => updateLocation('area', e.target.value)}
            placeholder={t('hosting.step_location.venue_placeholder')}
          />
          <FloatingInput
            label={t('profile.edit.city')}
            value={location.city}
            onChange={(e) => updateLocation('city', e.target.value)}
            placeholder={t('hosting.step.city_placeholder')}
          />
        </div>
        <FloatingInput
          label={t('profile.edit.country')}
          value={location.country}
          onChange={(e) => updateLocation('country', e.target.value)}
          placeholder={t('hosting.step.country_placeholder')}
        />
      </div>
    </div>
  );
}