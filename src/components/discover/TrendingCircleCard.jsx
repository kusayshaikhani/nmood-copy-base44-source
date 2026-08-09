import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import SmartImage from '@/components/shared/SmartImage';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-004 Phase 3 — Compact trending circle card for the horizontal rail.
 * Cover image, name, interest, member count, Join button.
 * Join action navigates to /circle/:id (same as existing CircleCard).
 */
export default function TrendingCircleCard({ circle }) {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const { id, cover_photo, name, member_count, shared_interests } = circle;
  const interest = (shared_interests || [])[0] || '';

  return (
    <motion.div
      whileTap={{ scale: 0.98, transition: { duration: 0.15 } }}
      className="flex-shrink-0 w-[200px] rounded-2xl overflow-hidden bg-card shadow-card border border-border/40 cursor-pointer snap-start"
      onClick={() => navigate(`/circle/${id}`)}
    >
      <div className="relative h-[100px]">
        <SmartImage
          src={cover_photo}
          alt={name}
          rounded="rounded-none"
          className="w-full h-full"
          fallback={<div className="w-full h-full bg-primary/10" />}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-foreground line-clamp-1 mb-1">{name}</p>
        {interest && <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-2">{interest}</p>}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            {member_count || 0} {t('discovery.featured.members')}
          </span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); navigate(`/circle/${id}`); }}
            className="px-3.5 py-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold active:scale-95 transition-transform duration-200"
          >
            {t('discovery.featured.join')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}