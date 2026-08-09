import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { recordProfileView } from '@/lib/profile-views';
import { useRealPal } from '@/lib/real-pals';
import {
  getTimelineEvents,
  getMemories,
  getMilestones,
  getInsights,
  getRelationshipStrength,
  useUpcomingShared,
} from '@/lib/relationship-timeline-live';
import RelationshipHeader from '@/components/relationship-timeline/RelationshipHeader';
import SpecialMoments from '@/components/relationship-timeline/SpecialMoments';
import TimelineCard from '@/components/relationship-timeline/TimelineCard';
import MemoriesGallery from '@/components/relationship-timeline/MemoriesGallery';
import UpcomingExperiences from '@/components/relationship-timeline/UpcomingExperiences';
import InvitationActions from '@/components/relationship-timeline/InvitationActions';
import RelationshipInsights from '@/components/relationship-timeline/RelationshipInsights';

export default function RelationshipTimeline() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [hiddenMemories, setHiddenMemories] = useState(new Set());
  const [removedPhotos, setRemovedPhotos] = useState(new Set());

  const { pal, loading } = useRealPal(id);

  const { member } = useAuth();

  useEffect(() => {
    base44.auth.me().then((u) => setCurrentUser(u)).catch(() => {});
  }, []);

  // Record a Profile View only when a member opens another member's full profile.
  useEffect(() => {
    if (!pal || !currentUser) return;
    const today = new Date().toISOString().slice(0, 10);
    const flag = `inmood_pv_${pal.pal_user_id || pal.id}_${today}`;
    if (localStorage.getItem(flag)) return;
    localStorage.setItem(flag, '1');
    const age = member?.date_of_birth
      ? Math.max(0, Math.floor((Date.now() - new Date(member.date_of_birth).getTime()) / 31557600000))
      : null;
    recordProfileView({
      owner: { id: pal.pal_user_id || pal.id },
      viewer: {
        id: currentUser.id,
        name: member?.display_name || currentUser.full_name || 'Someone',
        avatar: member?.photo_url || currentUser.image_url || '',
        age,
        location: member?.city || '',
        verified: !!(member?.phone_verified && member?.photo_url),
        is_connected: true,
        connection_pending: false,
        shared_interests: pal.sharedInterests || [],
        shared_moods: [],
        mutual_circles: 0,
        mutual_experiences: pal.mutualExperiences || 0,
        profile_view_visibility: member?.profile_view_visibility || 'visible',
      },
    });
  }, [pal, currentUser, member]);

  const events = useMemo(() => getTimelineEvents(pal), [pal]);
  const memories = useMemo(() => getMemories(pal).filter((m) => !hiddenMemories.has(m.id)), [pal, hiddenMemories]);
  const milestones = useMemo(() => getMilestones(pal), [pal]);
  const insights = useMemo(() => getInsights(pal), [pal]);
  const upcoming = useUpcomingShared(pal);
  const strength = useMemo(() => getRelationshipStrength(pal), [pal]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto pb-24 flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!pal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <p className="text-muted-foreground mb-4">Pal not found.</p>
        <button onClick={() => navigate('/pals')} type="button" className="text-primary font-medium">Back to Pals</button>
      </div>
    );
  }

  const toggleHideMemory = (memId) => {
    setHiddenMemories((prev) => {
      const next = new Set(prev);
      if (next.has(memId)) next.delete(memId);
      else next.add(memId);
      return next;
    });
  };

  const removePhoto = (photoUrl) => {
    setRemovedPhotos((prev) => new Set([...prev, photoUrl]));
  };

  return (
    <div className="max-w-2xl mx-auto pb-24 space-y-6">
      <button onClick={() => navigate('/pals')} type="button" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-default">
        <ArrowLeft className="w-4 h-4" /> Back to Pals
      </button>

      <RelationshipHeader pal={pal} currentUser={currentUser} strength={strength} />

      <SpecialMoments milestones={milestones} />

      <section>
        <h2 className="text-lg font-semibold mb-3">Your Journey</h2>
        <div className="space-y-0">
          {events.map((event) => (
            <TimelineCard key={event.id} event={event} removedPhotos={removedPhotos} onRemovePhoto={removePhoto} />
          ))}
        </div>
      </section>

      <MemoriesGallery
        memories={memories}
        onToggleHide={toggleHideMemory}
        onRemovePhoto={removePhoto}
        removedPhotos={removedPhotos}
        palId={pal.id}
      />

      <UpcomingExperiences upcoming={upcoming} pal={pal} />

      <InvitationActions pal={pal} />

      <RelationshipInsights insights={insights} />

      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60 py-2">
        <Lock className="w-3 h-3" />
        This timeline is private. Only you and {(pal.name || 'your pal').split(' ')[0]} can see it.
      </div>
    </div>
  );
}