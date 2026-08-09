import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Users, Calendar } from 'lucide-react';
import SectionTitle from '@/components/ui/premium/SectionTitle';
import { useLocalization } from '@/lib/i18n/useLocalization';

const EXPLORE_LINKS = [
  { icon: Compass, labelKey: 'discovery.explore_more.experiences', path: '/search' },
  { icon: Users, labelKey: 'discovery.explore_more.circles', path: '/communities' },
  { icon: Calendar, labelKey: 'discovery.explore_more.calendar', path: '/calendar' },
];

/**
 * UI-004 Phase 5 — "Explore More" quick-access grid.
 * Links to existing browse surfaces. Shown for all type filters.
 */
export default function ExploreMoreSection() {
  const navigate = useNavigate();
  const { t } = useLocalization();

  return (
    <div>
      <SectionTitle>
        {t('discovery.section.explore_more')}
      </SectionTitle>
      <div className="grid grid-cols-3 gap-3">
        {EXPLORE_LINKS.map(({ icon: Icon, labelKey, path }) => (
          <motion.button
            key={path}
            whileTap={{ scale: 0.97, transition: { duration: 0.15 } }}
            onClick={() => navigate(path)}
            type="button"
            className="flex flex-col items-center justify-center gap-2.5 p-5 rounded-2xl bg-card border border-border/40 shadow-card"
          >
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" strokeWidth={1.8} />
            </div>
            <span className="text-xs font-semibold text-center leading-tight">{t(labelKey)}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}