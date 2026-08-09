import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Users, Sparkles, Check, Star, Clock } from 'lucide-react';
import { useLocalization } from '@/lib/i18n/useLocalization';

export default function PalSelectionList({ search, selectedIds, onTogglePal, suggestions, favoritePals, allPals, recentlyMet }) {
  const { t } = useLocalization();
  const q = search.toLowerCase();
  const filterFn = (p) => !search || p.name.toLowerCase().includes(q) || (p.interests || []).some(i => i.toLowerCase().includes(q)) || (p.city || '').toLowerCase().includes(q);

  const renderPalRow = (pal, showReasons) => (
    <button
      key={pal.id}
      onClick={() => onTogglePal(pal.id)}
      type="button"
      className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-default text-start ${
        selectedIds.has(pal.id) ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
      }`}
    >
      <div className="relative flex-shrink-0">
        <Avatar className="w-10 h-10">
          <AvatarImage src={pal.avatar} alt={pal.name} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm">{pal.name.charAt(0)}</AvatarFallback>
        </Avatar>
        {pal.showOnlineStatus && pal.online && (
          <span className="absolute bottom-0 end-0 w-3 h-3 rounded-full bg-success border-2 border-card" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-sm font-medium truncate">{pal.name}</p>
          {showReasons && pal.reasons?.length > 0 && (
            <Sparkles className="w-3 h-3 text-accent flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-2.5 h-2.5" /> {pal.city} · {t('connections.invite_exp.mutual', { count: pal.mutualExperiences })}
        </p>
        {showReasons && pal.reasons?.length > 0 && (
          <p className="text-[10px] text-accent-foreground/70 mt-0.5">{pal.reasons.join(' · ')}</p>
        )}
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
        selectedIds.has(pal.id) ? 'border-primary bg-primary' : 'border-muted-foreground/30'
      }`}>
        {selectedIds.has(pal.id) && <Check className="w-3 h-3 text-primary-foreground" />}
      </div>
    </button>
  );

  const filteredAll = allPals.filter(filterFn);
  const filteredFavorites = favoritePals.filter(filterFn);
  const filteredRecent = recentlyMet.filter(filterFn);
  const filteredSuggestions = suggestions.filter(filterFn);

  return (
    <div className="space-y-4">
      {filteredSuggestions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-accent" /> {t('connections.invite_exp.smart_suggestions')}
          </p>
          <div className="space-y-2">
            {filteredSuggestions.map(pal => renderPalRow(pal, true))}
          </div>
        </div>
      )}

      {!search && filteredFavorites.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
            <Star className="w-3 h-3 text-warning" fill="currentColor" /> {t('connections.invite_exp.favorite_pals')}
          </p>
          <div className="space-y-2">
            {filteredFavorites.map(pal => renderPalRow(pal, false))}
          </div>
        </div>
      )}

      {!search && filteredRecent.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {t('connections.invite_exp.recently_met')}
          </p>
          <div className="space-y-2">
            {filteredRecent.map(pal => renderPalRow(pal, false))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">{t('connections.invite_exp.my_pals')}</p>
        <div className="space-y-2">
          {filteredAll.map(pal => renderPalRow(pal, false))}
        </div>
      </div>
    </div>
  );
}