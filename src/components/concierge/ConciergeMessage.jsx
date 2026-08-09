import React, { useState, useMemo } from 'react';
import { ThumbsUp, ThumbsDown, AlertTriangle, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import RecommendationCard from './RecommendationCard';
import ItineraryCard from './ItineraryCard';
import ConciergeFilterTabs from './ConciergeFilterTabs';
import ConciergeRecommendationSection from './ConciergeRecommendationSection';

export default function ConciergeMessage({ message, conversationId }) {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState(null);
  const [filterTab, setFilterTab] = useState('all');
  const [hiddenIds, setHiddenIds] = useState(new Set());

  const isUser = message.role === 'user';

  const handleFeedback = async (rating) => {
    if (feedback) return;
    setFeedback(rating);
    try {
      await base44.entities.ConciergeFeedback.create({
        user_id: String(user.id),
        message_id: message.id || '',
        conversation_id: conversationId || '',
        rating,
      });
    } catch { /* non-fatal */ }
  };

  const handleHidden = (rec) => {
    setHiddenIds(prev => new Set([...prev, rec.id || rec.title]));
  };

  // Parse combined recommendations + itinerary + clarifying question
  const parsed = (() => {
    try {
      const raw = JSON.parse(message.recommendations || '[]');
      if (Array.isArray(raw)) return { circles: [], experiences: [], people: [], inspirational: [], recommendations: raw, itinerary: null, clarifying_question: null, category_availability: null, inspirational_notice: null };
      return {
        circles: raw.circles || [],
        experiences: raw.experiences || [],
        people: raw.people || [],
        inspirational: raw.inspirational || [],
        recommendations: raw.recommendations || [],
        itinerary: raw.itinerary || null,
        clarifying_question: raw.clarifying_question || null,
        category_availability: raw.category_availability || null,
        inspirational_notice: raw.inspirational_notice || null,
      };
    } catch { return { circles: [], experiences: [], people: [], inspirational: [], recommendations: [], itinerary: null, clarifying_question: null, category_availability: null, inspirational_notice: null }; }
  })();

  // Filter out hidden recommendations and group by type
  const visibleRecs = useMemo(() => {
    // New format: use experiences/circles/people/inspirational arrays from the backend.
    // Old format: fall back to the recommendations array for existing messages.
    const hasNewFormat = parsed.circles?.length || parsed.experiences?.length || parsed.people?.length || parsed.inspirational?.length;
    if (hasNewFormat) {
      return [
        ...parsed.experiences.map((r) => ({ ...r, type: r.type || 'experience' })),
        ...parsed.circles.map((r) => ({ ...r, type: r.type || 'circle' })),
        ...parsed.people.map((r) => ({ ...r, type: r.type || 'member' })),
        ...parsed.inspirational.map((r) => ({ ...r, type: 'inspirational' })),
      ].filter((r) => {
        const key = r.id || r.title;
        return !hiddenIds.has(key);
      });
    }
    return (parsed.recommendations || []).filter((r) => {
      const key = r.id || r.title;
      return !hiddenIds.has(key);
    });
  }, [parsed.circles, parsed.experiences, parsed.people, parsed.inspirational, parsed.recommendations, hiddenIds]);

  const grouped = useMemo(() => {
    return {
      experience: visibleRecs.filter((r) => r.type === 'experience'),
      circle: visibleRecs.filter((r) => r.type === 'circle'),
      member: visibleRecs.filter((r) => r.type === 'member'),
      inspirational: visibleRecs.filter((r) => r.type === 'inspirational'),
      other: visibleRecs.filter((r) => !['circle', 'experience', 'member', 'inspirational'].includes(r.type)),
    };
  }, [visibleRecs]);

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in-up">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-nmood-cta text-primary-foreground px-4 py-2.5 shadow-soft">
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  const counts = {
    all: visibleRecs.length,
    experience: grouped.experience.length,
    circle: grouped.circle.length,
    member: grouped.member.length,
    inspirational: grouped.inspirational.length,
  };

  const itinerary = parsed.itinerary;
  const clarifyingQuestion = parsed.clarifying_question;
  const categoryAvailability = parsed.category_availability;
  const inspirationalNotice = parsed.inspirational_notice;
  const hasCategoryInfo = categoryAvailability && typeof categoryAvailability.experiences === 'number';
  const hasRecs = visibleRecs.length > 0;
  const showSections = hasRecs || hasCategoryInfo;

  return (
    <div className="flex justify-start animate-fade-in-up">
      <div className="max-w-[92%] w-full">
        {/* Avatar + message */}
        <div className="flex items-start gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-xl bg-nmood-gradient flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-relaxed text-foreground/90">{message.content}</p>
          </div>
        </div>

        {/* Clarifying question */}
        {clarifyingQuestion && (
          <div className="ms-10 mb-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 px-3 py-2">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">{clarifyingQuestion}</p>
          </div>
        )}

        {/* Itinerary */}
        {itinerary && (
          <div className="ms-10 mb-2">
            <ItineraryCard itinerary={itinerary} />
          </div>
        )}

        {/* Inspirational notice — shown when any inspirational content exists */}
        {inspirationalNotice && (counts.inspirational > 0 || itinerary) && (
          <div className="ms-10 mb-2 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/30 px-3 py-2">
            <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-snug">
              {inspirationalNotice}
            </p>
          </div>
        )}

        {/* Filter tabs + grouped recommendations */}
        {showSections && (
          <div className="ms-10">
            {counts.all > 0 && (counts.experience > 0 || counts.circle > 0 || counts.member > 0 || counts.inspirational > 0) && (
              <div className="mb-2.5">
                <ConciergeFilterTabs
                  active={filterTab}
                  onChange={setFilterTab}
                  counts={counts}
                />
              </div>
            )}

            {/* All tab — show grouped sections in priority order */}
            {filterTab === 'all' && (
              <>
                <ConciergeRecommendationSection
                  type="experience"
                  recommendations={grouped.experience}
                  conversationId={conversationId}
                  onHidden={handleHidden}
                  eligibleCount={categoryAvailability?.experiences}
                />
                <ConciergeRecommendationSection
                  type="circle"
                  recommendations={grouped.circle}
                  conversationId={conversationId}
                  onHidden={handleHidden}
                  eligibleCount={categoryAvailability?.circles}
                />
                <ConciergeRecommendationSection
                  type="member"
                  recommendations={grouped.member}
                  conversationId={conversationId}
                  onHidden={handleHidden}
                  eligibleCount={categoryAvailability?.members}
                />
                <ConciergeRecommendationSection
                  type="inspirational"
                  recommendations={grouped.inspirational}
                  conversationId={conversationId}
                  onHidden={handleHidden}
                  eligibleCount={categoryAvailability?.inspirational}
                />
                {/* Other/venue recommendations (legacy) */}
                {grouped.other.length > 0 && (
                  <div className="space-y-2.5 mb-2">
                    {grouped.other.map((rec, i) => (
                      <RecommendationCard key={`other-${i}`} rec={rec} conversationId={conversationId} onHidden={handleHidden} />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Filtered tabs — show two-tier sections */}
            {filterTab !== 'all' && (
              <ConciergeRecommendationSection
                type={filterTab}
                recommendations={grouped[filterTab] || []}
                conversationId={conversationId}
                onHidden={handleHidden}
                eligibleCount={categoryAvailability?.[filterTab === 'member' ? 'members' : filterTab === 'circle' ? 'circles' : filterTab === 'experience' ? 'experiences' : 'inspirational']}
              />
            )}
          </div>
        )}

        {/* Feedback buttons — only when assistant content is non-empty */}
        {!message.is_clarifying && message.id && String(message.content || '').trim() && (
          <div className="ms-10 flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={() => handleFeedback('up')}
              disabled={!!feedback}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-default ${
                feedback === 'up' ? 'bg-success/15 text-success' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <ThumbsUp className="w-3 h-3" /> Helpful
            </button>
            <button
              type="button"
              onClick={() => handleFeedback('down')}
              disabled={!!feedback}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-default ${
                feedback === 'down' ? 'bg-destructive/15 text-destructive' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <ThumbsDown className="w-3 h-3" /> Not helpful
            </button>
            {feedback === 'down' && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Thanks — we'll review this
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}