import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar } from 'lucide-react';
import SmartImage from '@/components/shared/SmartImage';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-004 Phase 3 — Compact carousel card (176×220) for the
 * "Experiences Near You" horizontal rail. Large image, glass location
 * badge, category, date. Navigation identical to DiscoverCard.
 */
export default function CompactExperienceCard({ experience }) {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const { id, image, title, category, distance, date, venue } = experience;
  const locationLabel = venue?.name || experience.location || distance || '';

  return (
    <motion.div
      whileTap={{ scale: 0.98, transition: { duration: 0.15 } }}
      className="flex-shrink-0 w-[176px] h-[220px] rounded-2xl overflow-hidden bg-card shadow-card border border-border/40 cursor-pointer snap-start"
      onClick={() => navigate(`/experience/${id}`)}
    >
      <div className="relative h-[130px]">
        <SmartImage
          src={image}
          alt={title}
          rounded="rounded-none"
          className="w-full h-full"
          fallback={<div className="w-full h-full bg-primary/10" />}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        {locationLabel && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-[10px] font-medium max-w-[150px]">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{locationLabel}</span>
          </span>
        )}
      </div>
      <div className="p-2.5">
        {category && <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-0.5">{category}</p>}
        <p className="text-xs font-semibold text-foreground line-clamp-1 mb-1">{title}</p>
        <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          {date || t('discovery.featured.upcoming')}
        </p>
      </div>
    </motion.div>
  );
}