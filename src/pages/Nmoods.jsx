import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';
import NmoodCard from '@/components/nmoods/NmoodCard';
import NmoodCardSkeleton from '@/components/nmoods/NmoodCardSkeleton';
import NmoodFilterChips from '@/components/nmoods/NmoodFilterChips';
import CreateNmoodFlow from '@/components/nmoods/CreateNmoodFlow';
import EmptyState from '@/components/shared/EmptyState';
import { useNmoodsFeed, filterNmoods } from '@/lib/nmoods-data';
import { sortByAiPriority } from '@/lib/nmood-lifecycle';
import { useLocalization } from '@/lib/i18n/useLocalization';

/**
 * Nmoods — real-time intention discovery feed.
 * "People discover activities first. People discover people second."
 * Every card is an activity/intention, never a profile.
 */
export default function Nmoods() {
  const { t } = useLocalization();
  const [activeChip, setActiveChip] = useState('all');
  const [showShare, setShowShare] = useState(false);
  const { posts, loading } = useNmoodsFeed();

  const filtered = useMemo(() => sortByAiPriority(filterNmoods(posts, activeChip)), [posts, activeChip]);

  return (
    <div className="min-h-screen bg-background nav-safe-bottom">
      {/* Header — scrolls away; filter strip below sticks to top of main */}
      <div className="bg-background border-b border-border/30 px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight leading-tight">{t('nmoods.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('nmoods.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowShare(true)}
            className="flex items-center gap-1.5 h-11 px-4 rounded-full bg-nmood-cta text-primary-foreground text-sm font-semibold shadow-card hover:shadow-elevated transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline sm:inline">{t('nmoods.share')}</span>
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <NmoodFilterChips active={activeChip} onChange={setActiveChip} />

      {/* Feed */}
      <div className="px-5 pt-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <motion.div key="loading" className="space-y-4">
              {[0, 1, 2].map((i) => (
                <NmoodCardSkeleton key={i} />
              ))}
            </motion.div>
          ) : filtered.length === 0 ? (
            /* Empty state */
            <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <EmptyState
                icon={Sparkles}
                title={t('nmoods.empty.title')}
                description={t('nmoods.empty.desc')}
                actionLabel={t('nmoods.empty.cta')}
                onAction={() => setShowShare(true)}
              />
            </motion.div>
          ) : (
            /* Cards */
            <motion.div key="feed" className="space-y-4">
              {filtered.map((post, i) => (
                <NmoodCard key={post.id} post={post} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CreateNmoodFlow open={showShare} onClose={() => setShowShare(false)} />
    </div>
  );
}