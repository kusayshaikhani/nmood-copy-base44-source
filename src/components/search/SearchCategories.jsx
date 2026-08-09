import React from 'react';
import { useLocalization } from '@/lib/i18n/useLocalization';

const categories = ['All', 'Experiences', 'Circles', 'Members', 'Organizers', 'Interests', 'Locations'];
const LABEL_KEYS = {
  'All': 'search.category.all',
  'Experiences': 'search.category.experiences',
  'Circles': 'search.category.circles',
  'Members': 'search.category.members',
  'Organizers': 'search.category.organizers',
  'Interests': 'search.category.interests',
  'Locations': 'search.category.locations',
};

export default function SearchCategories({ active, onChange }) {
  const { t } = useLocalization();
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onChange(cat)}
          className={`px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition-default border ${
            active === cat
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground border-border hover:border-muted-foreground/30'
          }`}
        >
          {t(LABEL_KEYS[cat])}
        </button>
      ))}
    </div>
  );
}