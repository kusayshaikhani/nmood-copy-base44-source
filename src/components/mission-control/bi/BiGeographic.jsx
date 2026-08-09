import React from 'react';
import { Globe, MapPin, TrendingUp, Map } from 'lucide-react';
import { MCKpiCard, MCKpiGrid, MCSection } from '@/components/mission-control/ui';
import BiTable from './BiTable';
import { useLocalization } from '@/lib/i18n/useLocalization';

/** FM-010 — Geographic intelligence (prepared for interactive world map). */
export default function BiGeographic({ geographic }) {
  const { t } = useLocalization();
  const g = geographic || {};
  return (
    <div className="space-y-4">
      <MCKpiGrid>
        <MCKpiCard icon={Globe} label="Active Countries" value={g.activeCountries ?? 0} color="success" sublabel="Activity in last 7 days" />
        <MCKpiCard icon={TrendingUp} label="Fastest Growing Country" value={g.fastestGrowingCountry?.name || '—'}
          color="primary" sublabel={g.fastestGrowingCountry ? `+${g.fastestGrowingCountry.count} new` : ''} />
        <MCKpiCard icon={MapPin} label="Fastest Growing City" value={g.fastestGrowingCity?.name || '—'}
          color="info" sublabel={g.fastestGrowingCity ? `+${g.fastestGrowingCity.count} new` : ''} />
        <MCKpiCard icon={Map} label="World Map" value="Soon" color="warning" sublabel="Interactive map planned" />
      </MCKpiGrid>
      <div className="grid lg:grid-cols-2 gap-4">
        <MCSection icon={Globe} title={t('mission.members_by_country')}>
          <BiTable columns={[{ key: 'name', label: 'Country' }, { key: 'count', label: 'Members' }]} rows={g.byCountry || []} />
        </MCSection>
        <MCSection icon={MapPin} title={t('mission.members_by_city')}>
          <BiTable columns={[{ key: 'name', label: 'City' }, { key: 'count', label: 'Members' }]} rows={g.byCity || []} />
        </MCSection>
        <MCSection icon={TrendingUp} title={t('mission.growth_by_country_7d')}>
          <BiTable columns={[{ key: 'name', label: 'Country' }, { key: 'count', label: 'New' }]} rows={g.growthByCountry || []} />
        </MCSection>
        <MCSection icon={TrendingUp} title={t('mission.growth_by_city_7d')}>
          <BiTable columns={[{ key: 'name', label: 'City' }, { key: 'count', label: 'New' }]} rows={g.growthByCity || []} />
        </MCSection>
      </div>
    </div>
  );
}