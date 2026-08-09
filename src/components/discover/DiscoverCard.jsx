import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Clock, Wallet, Users, Heart, Share2, BadgeCheck, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SmartImage from '@/components/shared/SmartImage';
import { getBudgetCardLabel } from '@/lib/budget-utils';
import { getCountdown, getRemainingSpots } from '@/lib/discover-engine';
import { useLocalization } from '@/lib/i18n/useLocalization';

const getWishlist = () => {
  try { return JSON.parse(localStorage.getItem('inmood_wishlist') || '[]'); } catch { return []; }
};

/**
 * UI-004 — Large premium event card. Beautiful imagery with gradient overlay,
 * glass badges, host identity, meta grid and a modern RSVP button.
 * All wishlist / navigation logic is preserved exactly.
 */
export default function DiscoverCard({ experience, compact }) {
  const [wishlisted, setWishlisted] = useState(() => getWishlist().includes(String(experience.id)));
  const navigate = useNavigate();
  const { t } = useLocalization();
  const { id, image, title, host, distance, time, category, verified, mood, date, description } = experience;
  const budgetLabel = getBudgetCardLabel(experience);
  const countdown = getCountdown(experience);
  const remaining = getRemainingSpots(experience);

  const toggleWishlist = (e) => {
    e.stopPropagation();
    const list = getWishlist();
    const idStr = String(id);
    if (list.includes(idStr)) {
      localStorage.setItem('inmood_wishlist', JSON.stringify(list.filter((x) => x !== idStr)));
      setWishlisted(false);
    } else {
      localStorage.setItem('inmood_wishlist', JSON.stringify([...list, idStr]));
      setWishlisted(true);
    }
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98, transition: { duration: 0.15 } }}
      className={`rounded-card overflow-hidden bg-card shadow-card border border-border/40 cursor-pointer hover-lift ${compact ? 'w-72 flex-shrink-0 snap-start' : 'w-full'}`}
      onClick={() => navigate(`/experience/${id}`)}
    >
      {/* Imagery */}
      <div className="relative h-56">
        <SmartImage
          src={image}
          alt={title}
          rounded="rounded-none"
          className="w-full h-full"
          fallback={<div className="w-full h-full bg-primary/10" />}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-black/10" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {category && (
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/15 backdrop-blur-md border border-white/25 text-white px-2.5 py-1 rounded-full">
              {category}
            </span>
          )}
          {mood && (
            <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-2.5 py-1 rounded-full">
              {mood}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          <button
            onClick={toggleWishlist}
            type="button"
            aria-label={t('home.card.add_to_wishlist')}
            className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center active:scale-95 transition-transform duration-150"
          >
            <Heart className={`w-4 h-4 ${wishlisted ? 'fill-white text-white' : 'text-white'}`} />
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            type="button"
            aria-label={t('discovery.card.share')}
            className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center active:scale-95 transition-transform duration-150"
          >
            <Share2 className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Title + host overlay */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white text-lg font-bold leading-tight line-clamp-2">{title}</h3>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Avatar className="w-5 h-5 border border-white/50">
              <AvatarImage src={host?.avatar} alt={host?.name} />
              <AvatarFallback className="text-[8px] bg-white/20 text-white">{host?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-white/90 text-xs font-medium truncate">{host?.name}</span>
            {verified && <BadgeCheck className="w-3.5 h-3.5 text-white flex-shrink-0" />}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {experience.origin_type && experience.origin_type !== 'public' && (
          <div className="mb-3">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${experience.origin_type === 'circle' ? 'bg-chart-4/10 text-chart-4' : 'bg-primary/10 text-primary'}`}>
              {experience.origin_type === 'circle' ? t('discovery.card.inside', { name: experience.origin_name }) : t('discovery.card.hosted_by', { name: experience.origin_name })}
            </span>
          </div>
        )}
        {!compact && description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{description}</p>
        )}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 flex-shrink-0 text-primary" />{distance}</span>
          {countdown ? (
            <span className="flex items-center gap-1.5 text-primary font-medium"><Clock className="w-3.5 h-3.5 flex-shrink-0" />{countdown}</span>
          ) : (
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 flex-shrink-0 text-primary" />{date}</span>
          )}
          <span className="flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5 flex-shrink-0 text-primary" />{budgetLabel}</span>
          <span className="flex items-center gap-1.5 text-primary font-medium"><Users className="w-3.5 h-3.5 flex-shrink-0" />{t('home.card.spots_left', { count: remaining })}</span>
        </div>
        {/* Modern RSVP button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate(`/experience/${id}`); }}
          className="w-full h-11 rounded-button bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-default flex items-center justify-center gap-2"
        >
          {t('home.card.join_experience')}
          <Calendar className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}