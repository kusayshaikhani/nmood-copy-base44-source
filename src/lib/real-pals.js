import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { resolveMemberNames } from '@/lib/member-names';

// RC-005A/CRITICAL-3 — Real pals data replacing pals-data.js mock.
// Fetches real PalConnection entities with shared experience enrichment.
// Mock data is NEVER used — empty arrays are returned when the DB is empty.

export function mapConnectionToPal(c) {
  if (!c) return null;
  return {
    id: c.id,
    pal_user_id: c.pal_user_id,
    name: c.pal_name || 'Pal',
    avatar: c.pal_avatar || null,
    city: c.pal_city || '',
    interests: c.mutual_interests || [],
    sharedInterests: c.mutual_interests || [],
    mutualExperiences: c.mutual_experiences_count || 1,
    firstExperienceTogether: c.first_experience_title || '',
    lastExperienceTogether: c.last_experience_title || '',
    lastExperienceDate: c.last_experience_date || '',
    connectedDate: c.connected_date || '',
    experiencesTogether: [], // enriched from Attendance
    photosTogether: c.photos_together || [],
    online: false,
    distance: '',
    showOnlineStatus: false,
    verified: false,
    lastActivityAt: c.last_activity_at || c.updated_date,
    raw: c,
  };
}

// Hook: fetch all active PalConnections for the current user.
export function useRealPals() {
  const { user } = useAuth();
  const [pals, setPals] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) {
      setPals([]);
      setLoading(false);
      return;
    }
    try {
      const conns = await base44.entities.PalConnection.filter(
        { created_by_id: String(user.id), is_active: true },
        '-updated_date',
        200
      );
      const mapped = (conns || []).map(mapConnectionToPal).filter(Boolean);
      const userIds = mapped.map((p) => p.pal_user_id).filter(Boolean);
      const names = await resolveMemberNames({ userIds });
      setPals(mapped.map((p) => ({ ...p, name: names[p.pal_user_id] || 'Member' })));
    } catch {
      setPals([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!user?.id) return;
    try {
      const unsub = base44.entities.PalConnection.subscribe(() => load());
      return unsub;
    } catch {}
  }, [user?.id, load]);

  return { pals, loading, refresh: load };
}

// Hook: fetch a single PalConnection by entity ID (for Relationship Timeline).
export function useRealPal(palId) {
  const { user } = useAuth();
  const [pal, setPal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!palId) {
        setPal(null);
        setLoading(false);
        return;
      }
      try {
        const conn = await base44.entities.PalConnection.get(palId);
        if (!active) return;
        if (!conn || conn.is_active === false) {
          setPal(null);
          setLoading(false);
          return;
        }
        // Verify ownership: only the connection owner can view the timeline.
        if (user?.id && String(conn.created_by_id) !== String(user.id)) {
          setPal(null);
          setLoading(false);
          return;
        }
        let mapped = mapConnectionToPal(conn);

        // Enrich with shared experiences from Attendance.
        // Fetch the pal's attendance records to find mutual experiences.
        try {
          if (conn.pal_user_id) {
            const palAttendance = await base44.entities.Attendance.filter(
              { member_user_id: String(conn.pal_user_id), status: 'going' },
              '-created_date',
              50
            ).catch(() => []);
            const myAttendance = await base44.entities.Attendance.filter(
              { member_user_id: String(user.id), status: 'going' },
              '-created_date',
              50
            ).catch(() => []);
            const myExpIds = new Set((myAttendance || []).map((a) => String(a.experience_id)));
            const sharedExpIds = (palAttendance || [])
              .filter((a) => myExpIds.has(String(a.experience_id)))
              .map((a) => String(a.experience_id));
            if (sharedExpIds.length > 0) {
              const exps = await Promise.all(
                sharedExpIds.slice(0, 10).map((id) => base44.entities.Experience.get(id).catch(() => null))
              );
              mapped.experiencesTogether = exps.filter(Boolean).map((e) => e.title);
              mapped.mutualExperiences = mapped.experiencesTogether.length;
            }
          }
        } catch {}

        if (!active) return;
        setPal(mapped);
      } catch {
        if (active) setPal(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [palId, user?.id]);

  return { pal, loading };
}

// Hook: fetch other attendees of an experience (for BecomePalsSheet).
// Excludes the current user and existing pals.
export function useExperienceParticipants(experienceId) {
  const { user } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!experienceId) {
        setParticipants([]);
        setLoading(false);
        return;
      }
      try {
        const records = await base44.entities.Attendance.filter(
          { experience_id: experienceId, status: 'going' },
          '-created_date',
          50
        );
        if (!active) return;

        // Exclude the current user
        const others = (records || []).filter((r) => {
          if (!user?.id) return true;
          return String(r.member_user_id) !== String(user.id);
        });

        // Fetch existing pal connections to exclude
        let palUserIds = new Set();
        try {
          const conns = await base44.entities.PalConnection.filter(
            { created_by_id: String(user.id), is_active: true },
            '-updated_date',
            200
          );
          palUserIds = new Set((conns || []).map((c) => String(c.pal_user_id)));
        } catch {}

        // Fetch member profiles for names/avatars
        const memberIds = others.map((r) => r.member_user_id).filter(Boolean);
        const members = await Promise.all(
          [...new Set(memberIds)].slice(0, 20).map((id) =>
            base44.entities.Member.filter({ created_by_id: String(id) }).catch(() => [])
          )
        );
        const memberMap = {};
        members.forEach((list) => {
          if (list && list[0]) memberMap[String(list[0].created_by_id)] = list[0];
        });

        const mapped = others
          .filter((r) => r.member_user_id && !palUserIds.has(String(r.member_user_id)))
          .map((r) => {
            const m = memberMap[String(r.member_user_id)];
            return {
              id: r.member_user_id,
              user_id: r.member_user_id,
              name: '',
              avatar: m?.photo_url || r.member_avatar || null,
              sharedExperience: '',
              mutualInterests: m?.interests ? m.interests.slice(0, 3) : [],
            };
          });

        const partNames = await resolveMemberNames({ userIds: mapped.map((p) => p.user_id).filter(Boolean) });
        const final = mapped
          .map((p) => ({ ...p, name: partNames[p.user_id] || 'Member' }))
          .filter((p) => p.name !== 'Member' || p.avatar);

        if (!active) return;
        setParticipants(final);
      } catch {
        if (active) setParticipants([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [experienceId, user?.id]);

  return { participants, loading };
}

// Hook: fetch real pals for InterestPollWizard pal selection.
export function usePalsForPoll() {
  const { pals, loading } = useRealPals();
  // Shape for the wizard: id, name, avatar, city, interests
  const pollPals = pals.map((p) => ({
    id: p.id,
    pal_user_id: p.pal_user_id,
    name: p.name,
    avatar: p.avatar,
    city: p.city,
    interests: p.interests,
  }));
  const recentlyMet = pollPals.slice(0, 3);
  return { pals: pollPals, recentlyMetPals: recentlyMet, loading };
}

// Hook: fetch hidden pals for ReconnectSettings.
// Hidden pal IDs are stored in localStorage; resolve them to real PalConnection records.
export function useHiddenPals() {
  const { pals } = useRealPals();
  const getHiddenIds = () => {
    try { return JSON.parse(localStorage.getItem('inmood_reconnect_hidden_pals') || '[]'); } catch { return []; }
  };
  const hiddenIds = getHiddenIds();
  return pals.filter((p) => hiddenIds.includes(p.id) || hiddenIds.includes(p.pal_user_id));
}

// Hook: fetch pals for BlockMemberSheet (your connections, to select and block).
export function usePalsForBlocking() {
  const { pals, loading } = useRealPals();
  return {
    pals: pals.map((p) => ({
      id: p.pal_user_id || p.id,
      name: p.name,
      avatar: p.avatar,
      city: p.city,
    })),
    loading,
  };
}

// RC-005A: Real reconnect suggestions derived from PalConnection entities.
// Computes time-gap from last_activity_at. No fabricated names, photos, or history.
export function useReconnectSuggestions() {
  const { pals, loading } = useRealPals();
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (loading || !pals.length) { setSuggestions([]); return; }
    const now = Date.now();
    const DAY = 86400000;
    const derived = pals
      .map((p) => {
        const lastActivity = p.lastActivityAt ? new Date(p.lastActivityAt).getTime() : 0;
        const daysSince = lastActivity > 0 ? Math.floor((now - lastActivity) / DAY) : 0;
        const firstName = (p.name || 'your pal').split(' ')[0];
        return {
          id: `rc-${p.id}`,
          palId: p.id,
          palUserId: p.pal_user_id,
          palName: p.name,
          palAvatar: p.avatar,
          palCity: p.city,
          reasonType: 'time_gap',
          daysSince,
          reason: daysSince >= 1
            ? `You haven't seen ${firstName} in ${daysSince} day${daysSince > 1 ? 's' : ''}.`
            : `Reach out to ${firstName} to plan something new.`,
          suggestedExperiences: [],
        };
      })
      .filter((s) => s.daysSince >= 3) // only suggest after 3+ days of no activity
      .sort((a, b) => b.daysSince - a.daysSince)
      .slice(0, 5);
    setSuggestions(derived);
  }, [pals, loading]);

  return { suggestions, loading };
}