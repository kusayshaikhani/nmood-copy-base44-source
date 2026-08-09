import React from 'react';
import { Circle as CircleIcon, Calendar, Users, Sparkles } from 'lucide-react';
import RecommendationCard from './RecommendationCard';

const SECTION_CONFIG = {
  experience: { title: 'Nmood Experiences', icon: Calendar, emptyLabel: 'No Experiences match your request right now.' },
  circle: { title: 'Nmood Circles', icon: CircleIcon, emptyLabel: 'No Circles match your request right now.' },
  member: { title: 'People you may connect with', icon: Users, emptyLabel: 'No People match your request right now.' },
  inspirational: { title: 'Inspirational ideas', icon: Sparkles, emptyLabel: 'No inspirational ideas right now.' },
};

export default function ConciergeRecommendationSection({ type, recommendations, conversationId, onHidden, eligibleCount }) {
  const config = SECTION_CONFIG[type];
  if (!config) return null;
  const Icon = config.icon;

  // If we have recommendations, render them in two confidence tiers.
  // Inspirational items don't have match scores — render them in a single list.
  if (recommendations.length > 0) {
    const isInspiration = type === 'inspirational';
    const bestMatches = isInspiration ? [] : recommendations.filter((r) => r.match_score >= 60);
    const alsoLike = isInspiration ? [] : recommendations.filter((r) => r.match_score < 60);

    return (
      <div className="mb-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <h4 className="text-xs font-bold text-foreground/80 uppercase tracking-wide">{config.title}</h4>
          <span className="text-[10px] text-muted-foreground">({recommendations.length})</span>
        </div>
        <div className="space-y-2.5">
          {isInspiration ? (
            recommendations.map((rec, i) => (
              <RecommendationCard key={`insp-${type}-${rec.id || i}`} rec={rec} conversationId={conversationId} onHidden={onHidden} />
            ))
          ) : (
            <>
              {bestMatches.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-primary/80 ms-5 mb-1">Best matches</p>
                  {bestMatches.map((rec, i) => (
                    <RecommendationCard key={`best-${type}-${rec.id || i}`} rec={rec} conversationId={conversationId} onHidden={onHidden} />
                  ))}
                </div>
              )}
              {alsoLike.length > 0 && (
                <div className={bestMatches.length > 0 ? 'mt-2' : ''}>
                  <p className="text-[11px] font-semibold text-muted-foreground/80 ms-5 mb-1">You may also like</p>
                  {alsoLike.map((rec, i) => (
                    <RecommendationCard key={`also-${type}-${rec.id || i}`} rec={rec} conversationId={conversationId} onHidden={onHidden} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // No recommendations AND zero eligible records — show per-category empty state.
  if (eligibleCount === 0) {
    return (
      <div className="mb-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Icon className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />
          <h4 className="text-xs font-bold text-foreground/50 uppercase tracking-wide">{config.title}</h4>
        </div>
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-2.5 text-center">
          <p className="text-xs text-muted-foreground/80">{config.emptyLabel}</p>
        </div>
      </div>
    );
  }

  // No recommendations but eligible records exist — should not happen with new backend.
  return null;
}