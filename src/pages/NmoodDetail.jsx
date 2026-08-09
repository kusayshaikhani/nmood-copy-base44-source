import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { getNmoodById, getSimilarNmoods } from '@/lib/nmoods-data';
import { useLocalization } from '@/lib/i18n/useLocalization';
import NmoodDetailHeader from '@/components/nmoods/detail/NmoodDetailHeader';
import PlanDetailGrid from '@/components/nmoods/detail/PlanDetailGrid';
import NmoodAboutSection from '@/components/nmoods/detail/NmoodAboutSection';
import NmoodHostCard from '@/components/nmoods/detail/NmoodHostCard';
import NmoodInterestedAvatars from '@/components/nmoods/detail/NmoodInterestedAvatars';
import NmoodAiInsights from '@/components/nmoods/detail/NmoodAiInsights';
import NmoodMiniMap from '@/components/nmoods/detail/NmoodMiniMap';
import NmoodSimilarSection from '@/components/nmoods/detail/NmoodSimilarSection';
import NmoodBottomBar from '@/components/nmoods/detail/NmoodBottomBar';
import NmoodReportSheet from '@/components/nmoods/detail/NmoodReportSheet';
import NmoodStatusBadge from '@/components/nmoods/NmoodStatusBadge';
import NmoodCountdown from '@/components/nmoods/NmoodCountdown';
import NmoodHostStats from '@/components/nmoods/detail/NmoodHostStats';
import NmoodCompletionCard from '@/components/nmoods/detail/NmoodCompletionCard';
import { computeNmoodStatus } from '@/lib/nmood-lifecycle';

export default function NmoodDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLocalization();
  const [showReport, setShowReport] = useState(false);

  const post = useMemo(() => getNmoodById(id), [id]);
  const similar = useMemo(() => (post ? getSimilarNmoods(post) : []), [post]);

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-lg font-semibold">{t('nmoods.detail.not_found')}</p>
        <p className="text-sm text-muted-foreground">{t('nmoods.detail.not_found_desc')}</p>
        <Button onClick={() => navigate('/nmoods')} className="mt-2">{t('nmoods.detail.back_to_feed')}</Button>
      </div>
    );
  }

  const status = computeNmoodStatus(post);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-background"
    >
      <NmoodDetailHeader onBack={() => navigate(-1)} onReport={() => setShowReport(true)} />

      <div className="px-5 pt-5 space-y-7 pb-44">
        {/* Category badge */}
        <div className="flex items-center gap-2">
          <span className="text-2xl leading-none">{post.category_icon}</span>
          <span className="text-sm font-medium text-muted-foreground">{post.category}</span>
          <span className="ml-auto">
            <NmoodStatusBadge status={status} size="md" />
          </span>
        </div>

        {/* Main title — the visual hero */}
        <div>
          <p className="text-sm font-medium text-muted-foreground/80 mb-1">{t('nmoods.im_nmood_for')}</p>
          <h1 className="text-2xl font-bold leading-snug text-balance">{post.intention_text}</h1>
        </div>

        <NmoodCountdown post={post} variant="prominent" />

        <PlanDetailGrid post={post} />
        <NmoodAboutSection post={post} />
        <NmoodHostCard post={post} />
        <NmoodHostStats post={post} />
        <NmoodInterestedAvatars post={post} />
        <NmoodAiInsights post={post} />
        <NmoodMiniMap post={post} />
        <NmoodSimilarSection nmoods={similar} />
        <NmoodCompletionCard post={post} />
      </div>

      <NmoodBottomBar post={post} />
      <NmoodReportSheet open={showReport} onClose={() => setShowReport(false)} />
    </motion.div>
  );
}