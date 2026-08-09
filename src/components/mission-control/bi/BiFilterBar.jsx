import React from 'react';
import { useLocalization } from '@/lib/i18n/useLocalization';

function Select({ label, value, onChange, options }) {
  const { t } = useLocalization();
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-card border rounded-lg text-sm px-2.5 py-1.5 min-w-[120px]">
        <option value="all">{t('mission.all')}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

/** FM-010 — Global multi-filter bar. Applies simultaneously across all BI sections. */
export default function BiFilterBar(props) {
  const { t } = useLocalization();
  const p = props;
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card/60 backdrop-blur p-3">
      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{t('mission.date_range')}</span>
        <select value={p.range} onChange={(e) => p.setRange(Number(e.target.value))} className="bg-card border rounded-lg text-sm px-2.5 py-1.5">
          <option value={7}>{t('mission.7_days')}</option>
          <option value={30}>{t('mission.30_days')}</option>
          <option value={90}>{t('mission.90_days')}</option>
        </select>
      </label>
      <Select label="Country" value={p.country} onChange={p.setCountry} options={p.options.countries} />
      <Select label="City" value={p.city} onChange={p.setCity} options={p.options.cities} />
      <Select label="Membership" value={p.membership} onChange={p.setMembership} options={['explorer', 'premium']} />
      <Select label="Language" value={p.language} onChange={p.setLanguage} options={p.options.languages} />
      <Select label="Interest" value={p.interest} onChange={p.setInterest} options={p.options.interests} />
      <Select label="Experience Category" value={p.expCategory} onChange={p.setExpCategory} options={p.options.expCategories} />
      <Select label="Circle Category" value={p.circleCategory} onChange={p.setCircleCategory} options={p.options.circleCategories} />
    </div>
  );
}