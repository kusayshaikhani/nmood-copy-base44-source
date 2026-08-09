import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useEngagement } from '@/hooks/useEngagement';
import JourneyHero from '@/components/journey/JourneyHero';
import TimelineSection from '@/components/journey/TimelineSection';
import MemoriesGallery from '@/components/journey/MemoriesGallery';
import JourneyMap from '@/components/journey/JourneyMap';
import InsightsSection from '@/components/journey/InsightsSection';
import LookBackSection from '@/components/journey/LookBackSection';
import ShareJourneySheet from '@/components/journey/ShareJourneySheet';
import EngagementStats from '@/components/engagement/EngagementStats';
import MilestonesSection from '@/components/engagement/MilestonesSection';
import AchievementsSection from '@/components/engagement/AchievementsSection';
import ActivityHistory from '@/components/engagement/ActivityHistory';

export default function Journey() {
  const { member } = useAuth();
  const [showShare, setShowShare] = useState(false);
  const { stats, achievements, milestones, history, loading } = useEngagement();

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-8">
      <JourneyHero member={member} onShare={() => setShowShare(true)} />
      {stats && <EngagementStats stats={stats} />}
      <MilestonesSection milestones={milestones} />
      <AchievementsSection achievements={achievements} />
      <ActivityHistory history={history} loading={loading} />
      <TimelineSection />
      <MemoriesGallery />
      <JourneyMap />
      <InsightsSection />
      <LookBackSection />
      <ShareJourneySheet open={showShare} onOpenChange={setShowShare} />
    </div>
  );
}