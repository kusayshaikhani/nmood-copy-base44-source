import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SectionReveal from '@/components/experience/SectionReveal';
import { useProfileReviews } from '@/hooks/useProfileStats';
import { useLocalization } from '@/lib/i18n/useLocalization';

function Stars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );
}

/**
 * UI-017 — Review / recommendation cards with large avatars, star ratings,
 * and recommendation text. Data from ExperienceRating on hosted experiences.
 */
export default function ProfileReviews() {
  const { reviews, loading } = useProfileReviews();
  const { t } = useLocalization();

  return (
    <SectionReveal>
      <div className="px-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-section-title font-semibold">{t('profile.premium.reviews.title')}</h2>
          {reviews.length > 0 && (
            <button type="button" className="text-sm font-semibold text-primary active:scale-95 transition-transform">
              {t('profile.premium.reviews.view_all')}
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => <div key={i} className="h-24 rounded-card bg-muted shimmer" />)}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 rounded-card border border-dashed border-border/60 bg-muted/20">
            <p className="text-sm text-muted-foreground px-6">{t('profile.premium.reviews.empty')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-card border border-border/50 bg-card p-4 shadow-soft"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="w-12 h-12 border-2 border-card shadow-soft flex-shrink-0">
                    {r.avatar && <AvatarImage src={r.avatar} alt={r.name} />}
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">{r.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm truncate">{r.name}</p>
                      <Stars rating={r.rating} />
                    </div>
                    {r.experienceTitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.experienceTitle}</p>}
                    {r.review && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{r.review}</p>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </SectionReveal>
  );
}