import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Wallet, Users, Heart, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SmartImage from '@/components/shared/SmartImage';
import { getBudgetCardLabel } from '@/lib/budget-utils';
import { getCountdown, getRemainingSpots } from '@/lib/discover-engine';
import { useLocalization } from '@/lib/i18n/useLocalization';

const getWishlist = () => {
  try { return JSON.parse(localStorage.getItem('inmood_wishlist') || '[]'); } catch { return []; }
};

export default function ExperienceCard({ id, image, title, host, distance, date, time, budget, spots, spotsTotal, spotsFilled, category, mood, tags, budgetOption, customAmount, budgetType }) {
  const [wishlisted, setWishlisted] = useState(() => getWishlist().includes(String(id)));
  const navigate = useNavigate();
  const { t } = useLocalization();
  const budgetLabel = getBudgetCardLabel({ budget, budgetOption, customAmount, budgetType, isFree: budget === 'Free' });
  const countdown = getCountdown({ date, time });
  const remaining = getRemainingSpots({ spotsTotal, spotsFilled });

  const toggleWishlist = (e) => {
    e.stopPropagation();
    const list = getWishlist();
    const idStr = String(id);
    if (list.includes(idStr)) {
      localStorage.setItem('inmood_wishlist', JSON.stringify(list.filter((t) => t !== idStr)));
      setWishlisted(false);
    } else {
      localStorage.setItem('inmood_wishlist', JSON.stringify([...list, idStr]));
      setWishlisted(true);
    }
  };

  return (
    <div className="flex-shrink-0 w-64 rounded-2xl overflow-hidden border border-border bg-card hover-lift cursor-pointer" onClick={() => navigate(`/experience/${id}`)}>
      <div className="h-40 relative">
        <SmartImage src={image} alt={title} rounded="rounded-none" className="w-full h-full" />
        {category && (
          <span className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wider bg-background/80 backdrop-blur px-2 py-1 rounded-full">
            {category}
          </span>
        )}
        <button
          onClick={toggleWishlist}
          type="button"
          aria-label={t('home.card.add_to_wishlist')}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center transition-default hover:bg-background"
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-foreground'}`} />
        </button>
      </div>
      <div className="p-3.5">
        <h3 className="font-semibold text-sm mb-2 line-clamp-1">{title}</h3>
        {host?.name && (
          <div className="flex items-center gap-1.5 mb-2">
            {host.avatar && <SmartImage src={host.avatar} alt={host.name} rounded="rounded-full" className="w-4 h-4" />}
            <span className="text-xs text-muted-foreground truncate">{host.name}</span>
            {host.verified && <BadgeCheck className="w-3 h-3 text-primary flex-shrink-0" />}
          </div>
        )}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{distance}</span>
            {countdown && <span className="flex items-center gap-1 text-primary font-medium"><Clock className="w-3 h-3" />{countdown}</span>}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Wallet className="w-3 h-3" />{budgetLabel}</span>
            <span className="flex items-center gap-1 text-primary font-medium"><Users className="w-3 h-3" />{t('home.card.spots_left', { count: remaining })}</span>
          </div>
        </div>
        <Button size="sm" className="w-full h-9" onClick={(e) => { e.stopPropagation(); navigate(`/experience/${id}`); }}>{t('home.card.join_experience')}</Button>
      </div>
    </div>
  );
}