import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import SmartImage from '@/components/shared/SmartImage';
import SectionTitle from '@/components/ui/premium/SectionTitle';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * UI-001 — "Popular Circles". Round category icons with name + member count.
 * Uses the same recommended-circles data source as the previous layout.
 */
export default function PopularCircles({ circles = [] }) {
  const navigate = useNavigate();
  const { t } = useLocalization();
  const list = circles.slice(0, 8);
  if (list.length === 0) return null;

  return (
    <section>
      <SectionTitle
        action={
          <button type="button" onClick={() => navigate('/communities')} className="text-sm font-medium text-primary">
            {t('common.see_all')}
          </button>
        }
      >
        {t('home.popular_circles')}
      </SectionTitle>

      <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
        {list.map((c, i) => (
          <motion.button
            key={c.id}
            type="button"
            onClick={() => navigate(`/circle/${c.id}`)}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            className="flex-shrink-0 w-20 flex flex-col items-center gap-2 text-center"
          >
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border/40 shadow-sm bg-muted">
              <SmartImage
                src={c.cover_photo}
                alt={c.name}
                rounded="rounded-full"
                className="w-full h-full"
                fallback={
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                    <Users className="w-6 h-6" />
                  </div>
                }
              />
            </div>
            <div className="w-full">
              <p className="text-xs font-semibold text-foreground line-clamp-1 leading-tight">{c.name}</p>
              <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5 mt-0.5">
                <Users className="w-2.5 h-2.5" />{c.member_count || 0}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}