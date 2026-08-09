import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Users, MapPin, Smile, Flame, Star, TrendingUp } from 'lucide-react';
import SmartImage from '@/components/shared/SmartImage';
import { getCountdown } from '@/lib/discover-engine';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-004 Phase 5 — Cinematic featured experience card.
 * Ken Burns slow zoom, animated gradient overlay, live activity
 * indicators (real data only — omitted when unavailable), premium
 * gradient "Featured" badge. Navigation identical to DiscoverCard.
 */
export default function FeaturedExperienceCard({ experience }) {
  const navigate = useNavigate();
  const { t } = useLocalization();
  if (!experience) return null;

  const { id, image, title, category, mood, venue, distance, spotsFilled, spotsTotal, date, tags, isFeatured } = experience;

  const timingLabel = (tags || []).includes('weekend')
    ? t('discovery.featured.this_weekend')
    : (tags || []).includes('today')
      ? t('discovery.featured.today')
      : (getCountdown(experience) || date || t('discovery.featured.upcoming'));

  const locationLabel = venue?.name || experience.location || '';
  const distPart = distance ? `${distance} ${t('discovery.featured.away')}` : '';
  const locationFull = [locationLabel, distPart].filter(Boolean).join(' • ');
  const categoryInterest = [category, mood].filter(Boolean).join(' • ');

  // Live activity — REAL data only; omit indicators when unavailable
  const spotsRemaining = spotsTotal > 0 ? spotsTotal - (spotsFilled || 0) : 0;
  const isFillingQuickly = spotsTotal > 0 && (spotsFilled || 0) > 0 && spotsRemaining > 0 && (spotsFilled / spotsTotal) >= 0.5;
  const isPopularEvening = (tags || []).includes('today') && (spotsFilled || 0) >= 5;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileTap={{ scale: 0.98, transition: { duration: 0.15 } }}
      className="relative w-full h-[320px] rounded-[28px] overflow-hidden shadow-elevated cursor-pointer"
      onClick={() => navigate(`/experience/${id}`)}
    >
      {/* Cinematic cover with Ken Burns slow zoom */}
      <SmartImage
        src={image}
        alt={title}
        rounded="rounded-none"
        className="absolute inset-0 w-full h-full ken-burns"
        fallback={<div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/40 to-primary/10" />}
      />
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
      {/* Soft animated gradient breathe overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-accent/20 animated-overlay" />

      {/* Top badges */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-10">
        <div className="flex flex-col gap-2 items-start">
          {isFeatured && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary to-accent text-white text-xs font-bold shadow-lg">
              <Star className="w-3.5 h-3.5 fill-white" />
              {t('discovery.featured.featured_badge')}
            </span>
          )}
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            {timingLabel}
          </span>
          {isFillingQuickly && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/80 backdrop-blur-md border border-orange-300/30 text-white text-xs font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              {t('discovery.featured.filling_quickly')}
            </span>
          )}
          {isPopularEvening && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/80 backdrop-blur-md border border-orange-300/30 text-white text-xs font-semibold">
              <Flame className="w-3.5 h-3.5" />
              {t('discovery.featured.popular_evening')}
            </span>
          )}
        </div>
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-semibold">
          <Users className="w-3.5 h-3.5" />
          {spotsFilled || 0} {t('discovery.featured.going')}
        </span>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
        <h2 className="text-white text-2xl font-bold leading-tight line-clamp-2 mb-1.5">{title}</h2>
        {categoryInterest && (
          <p className="text-white/90 text-sm font-semibold mb-1">{categoryInterest}</p>
        )}
        {locationFull && (
          <div className="flex items-center gap-1.5 text-white/80 text-sm mb-4">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{locationFull}</span>
          </div>
        )}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); navigate(`/experience/${id}`); }}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full border-2 border-primary bg-primary/25 backdrop-blur-md text-white text-sm font-semibold shadow-lg active:scale-95 transition-transform duration-200"
          >
            <Smile className="w-4 h-4" />
            {t('discovery.featured.im_inmood')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}