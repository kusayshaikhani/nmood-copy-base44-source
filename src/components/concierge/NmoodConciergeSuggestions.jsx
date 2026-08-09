import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { useAuth } from '@/lib/AuthContext';
import { getConciergeSuggestions } from '@/lib/nmood-recommendations';

const TEXT_MAP = {
  nearby_coffee: 'nmoods.concierge.nearby_coffee',
  interest_match: 'nmoods.concierge.interest_match',
  starting_soon: 'nmoods.concierge.starting_soon',
  needs_player: 'nmoods.concierge.needs_player',
  same_inmood: 'nmoods.concierge.same_inmood',
};

export default function NmoodConciergeSuggestions() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const { member } = useAuth();
  const suggestions = getConciergeSuggestions({ interests: member?.interests || [], inmood: member?.current_inmood }, 4);
  if (suggestions.length === 0) return null;

  const getText = (s) => {
    const key = TEXT_MAP[s.type];
    if (!key) return '';
    if (s.type === 'interest_match') return t(key, { category: s.data?.category || '' });
    if (s.type === 'starting_soon') return t(key, { time: s.data?.time || '20 min' });
    return t(key);
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <p className="font-semibold text-sm">{t('nmoods.concierge.title')}</p>
      </div>
      <div className="space-y-1.5">
        {suggestions.map((s, i) => (
          <button
            key={`${s.type}-${i}`}
            type="button"
            onClick={() => s.nmoodId && navigate(`/nmood/${s.nmoodId}`)}
            className="w-full flex items-center gap-2.5 text-left p-2.5 rounded-xl hover:bg-white/40 dark:hover:bg-white/5 transition-colors"
          >
            <span className="text-lg leading-none flex-shrink-0">{s.icon}</span>
            <p className="text-sm font-medium leading-snug">{getText(s)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}