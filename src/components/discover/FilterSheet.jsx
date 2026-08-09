import React, { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import BottomSheet from '@/components/shared/BottomSheet';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { categoryLabel } from '@/lib/i18n/label-resolvers';

const categories = ['Coffee', 'Food', 'Sports', 'Networking', 'Photography', 'Wellness', 'Learning', 'Arts', 'Gaming', 'Music', 'Nature', 'Outdoors'];
const budgetOptions = ['Any Budget', 'Free', '$', '$$', '$$$'];
const BUDGET_KEYS = {
  'Any Budget': 'discovery.filters.budget.any',
  'Free': 'discovery.filters.budget.free',
  '$': 'discovery.filters.budget.low',
  '$$': 'discovery.filters.budget.mid',
  '$$$': 'discovery.filters.budget.high',
};

export default function FilterSheet({ open, onOpenChange, onApply, initialFilters }) {
  const { t } = useLocalization();
  const [distance, setDistance] = useState(initialFilters?.distance ?? 25);
  const [budget, setBudget] = useState(initialFilters?.budget ?? 'Any Budget');
  const [selectedCategories, setSelectedCategories] = useState(initialFilters?.categories ?? []);
  const [freeOnly, setFreeOnly] = useState(initialFilters?.freeOnly ?? false);
  const [availableSpots, setAvailableSpots] = useState(initialFilters?.availableSpots ?? false);

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const handleReset = () => {
    setDistance(25);
    setBudget('Any Budget');
    setSelectedCategories([]);
    setFreeOnly(false);
    setAvailableSpots(false);
  };

  const handleApply = () => {
    onApply?.({ distance, budget, categories: selectedCategories, freeOnly, availableSpots });
    onOpenChange(false);
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('discovery.filters.title')}>
      <div className="space-y-5 pb-2">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">{t('discovery.filters.distance')}</label>
            <span className="text-xs text-muted-foreground">{t('discovery.filters.distance_value', { distance })}</span>
          </div>
          <Slider value={[distance]} onValueChange={(v) => setDistance(v[0])} min={1} max={200} step={1} />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">{t('discovery.filters.budget')}</label>
          <div className="flex gap-2 flex-wrap">
            {budgetOptions.map((b) => (
              <button key={b} onClick={() => setBudget(b)} type="button" className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-default ${budget === b ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}>{t(BUDGET_KEYS[b])}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">{t('discovery.filters.category')}</label>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button key={cat} onClick={() => toggleCategory(cat)} type="button" className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-default ${selectedCategories.includes(cat) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}>{categoryLabel(t, cat)}</button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium block">{t('discovery.filters.quick_toggles')}</label>
          <button onClick={() => setFreeOnly((p) => !p)} type="button" className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-default ${freeOnly ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}>
            {t('discovery.filters.free_only')}
            <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${freeOnly ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
              {freeOnly && <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </span>
          </button>
          <button onClick={() => setAvailableSpots((p) => !p)} type="button" className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-default ${availableSpots ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}>
            {t('discovery.filters.available_spots')}
            <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${availableSpots ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
              {availableSpots && <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </span>
          </button>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={handleReset}>{t('common.reset')}</Button>
          <Button className="flex-1" onClick={handleApply}>{t('common.apply')}</Button>
        </div>
      </div>
    </BottomSheet>
  );
}