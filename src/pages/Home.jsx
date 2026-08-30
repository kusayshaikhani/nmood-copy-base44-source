import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { getOwnMember } from '@/lib/member-profile';
import { resolveMemberName } from '@/lib/member-display';
import HomeSkeleton from '@/components/home/HomeSkeleton';
import { useExperiences } from '@/lib/discover-store';
import { getRecommendedExperiences } from '@/lib/discover-engine';
import { useMergedCircles, getRecommendedCircles } from '@/lib/circle-store';
import { useJoinedExperienceIds } from '@/lib/activity-store';
import { startTimer } from '@/lib/performance-monitor';
import { useMembershipAccess } from '@/components/membership/MembershipProvider';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { MEMBERSHIP_CHANGED_EVENT } from '@/lib/subscription-service';
import { onGlobalRefresh } from '@/lib/interactions';
import { queryClientInstance } from '@/lib/query-client';
import PremiumHero from '@/components/home/premium/PremiumHero';
import AiPicksSection from '@/components/home/premium/AiPicksSection';
import TodaysExperienceCard from '@/components/home/premium/TodaysExperienceCard';
import PopularCircles from '@/components/home/premium/PopularCircles';
import NewPalsSection from '@/components/home/premium/NewPalsSection';
import NmoodsHomeSection from '@/components/home/NmoodsHomeSection';
import NmoodConciergeSuggestions from '@/components/concierge/NmoodConciergeSuggestions';
import UpgradeMembershipCTA from '@/components/membership/UpgradeMembershipCTA';

/**
 * UI-003 — Nmood Premium Home (definitive rebuild).
 * Purple gradient hero → large rounded white content container → floating
 * premium bottom nav. All data hooks, recommendation engines, onboarding
 * redirect, membership refresh and routes are preserved exactly.
 */
export default function Home() {
  const { user, member: authenticatedMember } = useAuth();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const joinedIds = useJoinedExperienceIds();
  const { isPremium } = useMembershipAccess();
  const { t } = useLocalization();
  const [premiumTick, setPremiumTick] = useState(0);
  const { experiences: allExperiences } = useExperiences();

  // MP-005: refresh AI Picks / Experiences / Circles on Premium activation.
  useEffect(() => {
    const handler = () => setPremiumTick((x) => x + 1);
    window.addEventListener(MEMBERSHIP_CHANGED_EVENT, handler);
    return () => window.removeEventListener(MEMBERSHIP_CHANGED_EVENT, handler);
  }, []);

  // Pull-to-refresh: invalidate queries and recompute recommendations.
  useEffect(() => {
    return onGlobalRefresh(() => {
      queryClientInstance.invalidateQueries();
      setPremiumTick((x) => x + 1);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const timer = startTimer('home_load', 'home');
    const checkMember = async () => {
      try {
        // AuthContext already resolved the authenticated user's canonical
        // profile. Re-reading it here used to make a completed account look
        // incomplete when a direct RLS request was delayed or unavailable.
        const myMember = authenticatedMember || await getOwnMember(user.id, user.email);
        if (!myMember || !myMember.onboarding_completed) {
          navigate('/onboarding', { replace: true });
          return;
        }
        setMember(myMember);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
        timer.end();
      }
    };
    checkMember();
  }, [user, authenticatedMember, navigate]);

  const fullName = resolveMemberName(member, user);
  const firstName = fullName?.split(' ')[0] || t('home.friend');

  const todaysPicks = useMemo(
    () =>
      getRecommendedExperiences(allExperiences, { interests: member?.interests || [], limit: 10 })
        .filter((e) => !joinedIds.has(e.id)),
    [member?.interests, joinedIds, isPremium, premiumTick]
  );

  const mergedCircles = useMergedCircles();
  const recommendedCircles = useMemo(
    () => getRecommendedCircles(mergedCircles, { interests: member?.interests || [], limit: 8 }),
    [mergedCircles, member?.interests, isPremium, premiumTick]
  );

  if (loading) return <HomeSkeleton />;

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <PremiumHero firstName={firstName} onOpenMenu={() => navigate('/settings')} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative -mt-8 rounded-t-[32px] bg-card px-6 pt-8 pb-28 flex-1 space-y-10"
      >
        <AiPicksSection />
        <NmoodConciergeSuggestions />
        <UpgradeMembershipCTA source="home" />
        <NmoodsHomeSection />
        <TodaysExperienceCard experiences={todaysPicks} />
        <PopularCircles circles={recommendedCircles} />
        <NewPalsSection member={member} />
      </motion.div>
    </div>
  );
}
