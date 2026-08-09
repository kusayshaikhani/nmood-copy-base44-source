import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Crown, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLocalization } from '@/lib/i18n/useLocalization';
import { toast } from '@/components/ui/use-toast';

/**
 * Nmood Premium attendees — overlapping avatar stack, total count,
 * and "View all" expand. All attendance logic preserved.
 */
export default function AttendeesList({ experience, isHost = false, onChange }) {
  const { t } = useLocalization();
  const [participants, setParticipants] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const expId = experience?.id;

  useEffect(() => {
    if (!expId) return;
    let active = true;
    let intervalId = null;
    let inFlight = false;
    const load = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        // SEC — trusted backend read. Hosts/admins see the full management list;
        // ordinary attendees see only 'going' attendees with public fields.
        const resp = await base44.functions.invoke('experienceAttendees', { action: 'listExperienceAttendees', experienceId: expId });
        const res = resp?.data || resp;
        if (active) setParticipants(res?.attendees || []);
      } catch {
        if (active) setParticipants([]);
      } finally { inFlight = false; }
    };
    load();
    // Light polling (30s) with visibility handling — keeps the list fresh
    // without relying on direct Attendance subscriptions.
    const startPolling = () => { if (!intervalId) intervalId = setInterval(load, 30000); };
    const stopPolling = () => { if (intervalId) { clearInterval(intervalId); intervalId = null; } };
    const onVis = () => { if (document.hidden) stopPolling(); else { load(); startPolling(); } };
    document.addEventListener('visibilitychange', onVis);
    if (!document.hidden) startPolling();
    return () => { active = false; stopPolling(); document.removeEventListener('visibilitychange', onVis); };
  }, [expId]);

  const spotsTotal = experience?.spotsTotal || 0;
  const goingCount = participants.length;
  const remaining = Math.max(0, spotsTotal - goingCount);
  const host = experience?.host;

  const removeParticipant = async (p) => {
    try {
      const resp = await base44.functions.invoke('authorizationGate', { action: 'removeAttendee', attendanceId: p.id });
      const res = resp?.data || resp;
      if (!res?.ok) { toast(res?.message || 'Could not remove attendee.'); return; }
      setParticipants((prev) => prev.filter((x) => x.id !== p.id));
      onChange?.(res.experience);
    } catch { toast('Could not remove attendee.'); }
  };

  const visibleCount = showAll ? participants.length : Math.min(5, participants.length);
  const list = showAll ? participants : participants.slice(0, 5);

  return (
    <div className="p-6 rounded-card border border-border/50 bg-card shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-section-title text-foreground">{t('hosting.summary.participants')}</h2>
        <span className="text-caption text-muted-foreground">
          {goingCount} attending · {remaining} {remaining === 1 ? 'spot' : 'spots'} left
        </span>
      </div>

      {/* Overlapping avatar stack */}
      <div className="flex items-center gap-4">
        <div className="flex items-center">
          {/* Host avatar — first, with crown */}
          {host && (
            <div className="relative -me-2.5 z-20">
              <Avatar className="w-11 h-11 border-2 border-card rounded-full shadow-soft">
                <AvatarImage src={host.avatar} alt={host.name} />
                <AvatarFallback className="text-sm bg-primary/10 text-primary font-semibold">{host.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-nmood-cta flex items-center justify-center shadow-soft">
                <Crown className="w-3 h-3 text-white" />
              </span>
            </div>
          )}

          {list.map((p) => (
            <div key={p.id} className="relative -me-2.5 z-10">
              <Avatar className="w-11 h-11 border-2 border-card rounded-full shadow-soft">
                <AvatarImage src={p.member_avatar} alt={p.member_name} />
                <AvatarFallback className="text-sm bg-secondary text-secondary-foreground font-semibold">{p.member_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              {isHost && (
                <button
                  onClick={() => removeParticipant(p)}
                  type="button"
                  className="pressable absolute -top-0.5 -end-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-soft"
                  aria-label={t('experiences.attendees.aria_remove')}
                >
                  <X className="w-2.5 h-2.5" strokeWidth={3} />
                </button>
              )}
            </div>
          ))}

          {/* +N overflow indicator */}
          {!showAll && goingCount > visibleCount && (
            <span className="relative -me-2.5 z-0 w-11 h-11 rounded-full border-2 border-card bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold shadow-soft">
              +{goingCount - visibleCount}
            </span>
          )}
        </div>

        {goingCount > 5 && (
          <button
            type="button"
            onClick={() => setShowAll((s) => !s)}
            className="pressable flex items-center gap-1 text-sm font-semibold text-primary ms-2"
          >
            {showAll ? 'Show Less' : `View All (${goingCount})`}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {goingCount === 0 && !host && (
        <p className="text-caption text-muted-foreground">{t('experiences.attendees.no_one')}</p>
      )}

      {/* Expanded full list */}
      {showAll && goingCount > 5 && (
        <div className="flex flex-wrap gap-3 mt-5 pt-5 border-t border-border/60">
          {participants.map((p) => (
            <div key={p.id} className="flex flex-col items-center gap-1.5 w-14">
              <Avatar className="w-12 h-12 border border-border/50">
                <AvatarImage src={p.member_avatar} alt={p.member_name} />
                <AvatarFallback className="text-xs bg-muted">{p.member_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-caption text-muted-foreground truncate w-full text-center">{p.member_name?.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}