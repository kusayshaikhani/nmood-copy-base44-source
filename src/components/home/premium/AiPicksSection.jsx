import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

import { useAuth } from '@/lib/AuthContext';
import { useMergedCircles, getRecommendedCircles } from '@/lib/circle-store';
import SmartImage from '@/components/shared/SmartImage';
import SectionTitle from '@/components/ui/premium/SectionTitle';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * "Picked for You" — personalized Circle recommendations.
 *
 * Reuses the existing circle-store (module-level cached query — no N+1) and
 * the existing getRecommendedCircles ranking function, which scores by
 * overlap with the signed-in user's saved interests and falls back to
 * popular/recent circles (member_count) when interests are absent or sparse.
 *
 * Eligibility is enforced by the existing functions:
 *   - useMergedCircles: excludes is_demo, is_hidden, non-active status
 *   - getRecommendedCircles: excludes private/invite, full, draft/inactive
 *
 * "See all" navigates to the existing Communities discovery route.
 */
export default function AiPicksSection() {
  const navigate = useNavigate();
  const { member } = useAuth();
  const { t } = useLocalization();
  const circles = useMergedCircles();

  const picks = getRecommendedCircles(circles, {
    interests: member?.interests || [],
    limit: 8,
  });

  if (picks.length === 0) return null;

  return (
    <section>
      <SectionTitle
        action={
          <button type="button" onClick={() => navigate('/communities')} className="text-sm font-medium text-primary">
            {t('common.see_all')}
          </button>
        }
      >
        {t('home.picked_for_you')}
      </SectionTitle>

      <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
        {picks.map((c, i) => (
          <motion.button
            key={c.id}
            type="button"
            onClick={() => navigate(`/circle/${c.id}`)}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="flex-shrink-0 w-44 text-start rounded-card bg-card overflow-hidden shadow-card border border-border/40"
          >
            <div className="relative h-28 bg-muted">
              <SmartImage
                src={c.cover_photo}
                alt={c.name}
                rounded="rounded-none"
                className="w-full h-full"
                fallback={
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                    <Users className="w-8 h-8" />
                  </div>
                }
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <h3 className="absolute bottom-2 start-2 end-2 text-white font-semibold text-sm line-clamp-1">{c.name}</h3>
            </div>
            <div className="p-3">
              <div className="flex flex-wrap gap-1 mb-1.5">
                {(c.shared_interests || []).slice(0, 2).map((interest) => (
                  <span key={interest} className="text-[9px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                    {interest}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="w-3 h-3" />
                {c.member_count || 0}
                {c.max_members ? ` / ${c.max_members}` : ''}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}