import React from 'react';
import HubOverview from '@/components/relationship/HubOverview';
import RelationshipTimeline from '@/components/relationship/RelationshipTimeline';
import SharedJourney from '@/components/relationship/SharedJourney';
import MilestoneBadge from '@/components/relationship/MilestoneBadge';
import ReflectionCard from '@/components/relationship/ReflectionCard';
import ConnectionSuggestion from '@/components/relationship/ConnectionSuggestion';
import { useRelationshipHub } from '@/lib/relationship-live';
import { Heart, Users, Sparkles } from 'lucide-react';

export default function RelationshipHub() {
  const { stats, timeline, sharedJourneys, milestones, reflections, suggestions, loading } = useRelationshipHub();

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relationship Hub</h1>
          <p className="text-sm text-muted-foreground">Your journey of meaningful connections.</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relationship Hub</h1>
        <p className="text-sm text-muted-foreground">Your journey of meaningful connections.</p>
      </div>

      <HubOverview stats={stats} />

      <div>
        <h2 className="text-lg font-semibold mb-3">Relationship Timeline</h2>
        {timeline.length > 0 ? (
          <RelationshipTimeline events={timeline} />
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <Users className="w-7 h-7 text-primary" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium mb-1">No timeline events yet</p>
            <p className="text-xs text-muted-foreground max-w-xs">Your relationship milestones — joining experiences, making pals, hosting — will appear here.</p>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-1">Shared Journeys</h2>
        <p className="text-sm text-muted-foreground mb-4">The connections you've built, one experience at a time.</p>
        {sharedJourneys.length > 0 ? (
          <div className="space-y-3">
            {sharedJourneys.map((pal) => (
              <SharedJourney key={pal.id} pal={pal} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <Heart className="w-7 h-7 text-primary" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium mb-1">No shared journeys yet</p>
            <p className="text-xs text-muted-foreground max-w-xs">When you make pals through experiences, your shared history will appear here.</p>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-1">Milestones</h2>
        <p className="text-sm text-muted-foreground mb-4">Moments worth celebrating.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {milestones.map((milestone) => (
            <MilestoneBadge key={milestone.id} milestone={milestone} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-1">Reflections</h2>
        <p className="text-sm text-muted-foreground mb-4">Private thoughts linked to your experiences.</p>
        {reflections.length > 0 ? (
          <div className="space-y-3">
            {reflections.map((reflection) => (
              <ReflectionCard key={reflection.id} reflection={reflection} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <Sparkles className="w-7 h-7 text-primary" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium mb-1">No reflections yet</p>
            <p className="text-xs text-muted-foreground max-w-xs">After attending an experience, rate it and share your thoughts — they'll appear here privately.</p>
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Connection Suggestions</h2>
          <div className="space-y-2.5">
            {suggestions.map((suggestion) => (
              <ConnectionSuggestion key={suggestion.id} suggestion={suggestion} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}