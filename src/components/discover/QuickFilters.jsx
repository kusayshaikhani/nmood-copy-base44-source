import { useLocalization } from '@/lib/i18n/useLocalization';

const filters = ['All', 'Today', 'This Weekend', 'Free Only', 'Available Spots'];
const LABEL_KEYS = {
  'All': 'discovery.quick.all',
  'Today': 'discovery.quick.today',
  'This Weekend': 'discovery.quick.weekend',
  'Free Only': 'discovery.quick.free',
  'Available Spots': 'discovery.quick.spots',
};

/**
 * UI-004 — Premium quick-filter chips with snap scrolling.
 */
export default function QuickFilters({ active, onChange }) {
  const { t } = useLocalization();
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar overscroll-x-contain">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onChange(filter)}
          type="button"
          className={`px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition-default border snap-start ${
            active === filter
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-card text-muted-foreground border-border hover:border-primary/30'
          }`}
        >
          {t(LABEL_KEYS[filter])}
        </button>
      ))}
    </div>
  );
}