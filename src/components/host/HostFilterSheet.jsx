import React from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function HostFilterSheet({ open, onClose, filters, setFilters }) {
  const { t } = useLocalization();
  if (!open) return null;

  const typeOptions = [
    { id: 'all', label: 'All Types' },
    { id: 'experience', label: 'Experiences' },
    { id: 'circle', label: 'Circles' },
  ];

  const dateOptions = [
    { id: 'all', label: 'Any Date' },
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
  ];

  const optionClass = (selected) =>
    'w-full p-3 rounded-xl border-2 text-start text-sm font-medium transition-default flex items-center justify-between ' +
    (selected ? 'border-primary bg-primary/5' : 'border-border');

  const update = (field, value) => setFilters({ ...filters, [field]: value });

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full bg-card rounded-t-2xl p-4 pb-8 max-h-[80vh] overflow-y-auto"
        style={{ animation: 'slideUp 0.2s ease-out' }}
      >
        <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{t('hosting.filters.title')}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium mb-2 block">{t('hosting.filters.type')}</label>
            <div className="space-y-2">
              {typeOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => update('type', opt.id)}
                  className={optionClass(filters.type === opt.id)}
                >
                  {opt.label}
                  {filters.type === opt.id && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">{t('hosting.step_datetime.date')}</label>
            <div className="space-y-2">
              {dateOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => update('date', opt.id)}
                  className={optionClass(filters.date === opt.id)}
                >
                  {opt.label}
                  {filters.date === opt.id && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">{t('hosting.filters.location')}</label>
            <input
              value={filters.location || ''}
              onChange={(e) => update('location', e.target.value)}
              placeholder={t('hosting.filter.location_placeholder')}
              className="w-full h-11 px-3.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setFilters({ type: 'all', date: 'all', location: '' })}
          >
            Reset
          </Button>
          <Button className="flex-1" onClick={onClose}>
            {t('common.apply')}
          </Button>
        </div>
      </div>
    </div>
  );
}