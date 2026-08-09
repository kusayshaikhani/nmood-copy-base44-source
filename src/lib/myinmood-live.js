import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useCalendarActivities } from '@/lib/calendar-live';
import { useRealPals } from '@/lib/real-pals';
import { expDateISO } from '@/lib/experience-utils';
import moment from 'moment';

// RC-005A — Real MyInMood dashboard data replacing myinmood-data.js mock.
// All metrics, memories, invitations, and suggestions derive from real entities.
// Empty arrays are returned when the DB has no data (never fabricated).

const CATEGORY_EMOJI = {
  coffee: '☕', food: '🍽️', sports: '🏆', wellness: '🧘', music: '🎵',
  art: '🎨', learning: '📚', photography: '📸', gaming: '🎮', networking: '🤝',
  outdoor: '🏔️', default: '⭐',
};

function emojiForCategory(cat) {
  if (!cat) return CATEGORY_EMOJI.default;
  const k = cat.toLowerCase();
  for (const key of Object.keys(CATEGORY_EMOJI)) {
    if (k.includes(key)) return CATEGORY_EMOJI[key];
  }
  return CATEGORY_EMOJI.default;
}

// Hook: real social snapshot from entity counts
export function useSocialSnapshot() {
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) { setSnapshot([]); setLoading(false); return; }
    const uid = String(user.id);
    try {
      const [attendance, hosted, pals] = await Promise.all([
        base44.entities.Attendance.filter({ created_by_id: uid, status: 'going' }, '-created_date', 500).catch(() => []),
        base44.entities.Experience.filter({ host_user_id: uid }, '-created_date', 200).catch(() => []),
        base44.entities.PalConnection.filter({ created_by_id: uid, is_active: true }, '-updated_date', 200).catch(() => []),
      ]);
      // Compute unique cities from attended experiences
      const expIds = [...new Set((attendance || []).map((a) => Number(a.experience_id)).filter(Boolean))];
      const exps = await Promise.all(expIds.slice(0, 50).map((id) => base44.entities.Experience.get(id).catch(() => null)));
      const cities = new Set(exps.filter(Boolean).map((e) => e.location || e.location_address).filter(Boolean));

      setSnapshot([
        { id: 'joined', label: 'Experiences Joined', value: (attendance || []).length },
        { id: 'hosted', label: 'Experiences Hosted', value: (hosted || []).filter((e) => e.status !== 'cancelled').length },
        { id: 'pals', label: 'Pals', value: (pals || []).length },
        { id: 'cities', label: 'Cities Explored', value: cities.size },
      ]);
    } catch {
      setSnapshot([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);
  return { snapshot, loading };
}

// Hook: real "This Week" data
export function useThisWeekData() {
  const { user } = useAuth();
  const [data, setData] = useState({ upcomingExperiences: [], pendingInvitations: [], reconnectSuggestions: [], suggestedExperiences: [] });
  const [loading, setLoading] = useState(true);
  const { pals } = useRealPals();

  const load = useCallback(async () => {
    if (!user?.id) { setData({ upcomingExperiences: [], pendingInvitations: [], reconnectSuggestions: [], suggestedExperiences: [] }); setLoading(false); return; }
    const uid = String(user.id);
    try {
      const todayStr = moment().format('YYYY-MM-DD');
      const weekEnd = moment().add(7, 'day').format('YYYY-MM-DD');

      const [attendance, circleInvs, palReqs, allExps] = await Promise.all([
        base44.entities.Attendance.filter({ created_by_id: uid, status: 'going' }, '-created_date', 100).catch(() => []),
        base44.entities.CircleInvitation.filter({ pal_user_id: uid, status: 'pending' }, '-created_date', 10).catch(() => []),
        base44.entities.PalRequest.filter({ receiver_user_id: uid, status: 'pending' }, '-created_date', 10).catch(() => []),
        base44.entities.Experience.filter({ status: 'active', is_hidden: false }, '-created_date', 50).catch(() => []),
      ]);

      // Upcoming experiences from attendance
      const attExpIds = [...new Set((attendance || []).map((a) => Number(a.experience_id)).filter(Boolean))];
      const attExps = await Promise.all(attExpIds.slice(0, 20).map((id) => base44.entities.Experience.get(id).catch(() => null)));
      const upcoming = attExps
        .filter(Boolean)
        .filter((e) => {
          const d = expDateISO(e);
          return d && d >= todayStr && d <= weekEnd;
        })
        .slice(0, 4)
        .map((e) => ({
          id: e.id,
          title: e.title,
          date: e.date || '',
          time: e.time || '',
          image: e.cover_image || '',
        }));

      // Pending invitations
      const pendingInvitations = [
        ...(circleInvs || []).map((inv) => ({
          id: `ci-${inv.id}`,
          title: inv.circle_name || 'Circle Invitation',
          from: inv.sender_name || 'Someone',
          date: inv.created_date ? moment(inv.created_date).format('MMM D') : '',
        })),
        ...(palReqs || []).map((r) => ({
          id: `pr-${r.id}`,
          title: r.experience_title || 'Pal Request',
          from: r.sender_name || 'Someone',
          date: r.created_date ? moment(r.created_date).format('MMM D') : '',
        })),
      ].slice(0, 4);

      // Reconnect suggestions from real pals (time gap)
      const now = Date.now();
      const DAY = 86400000;
      const reconnect = pals
        .map((p) => {
          const lastActivity = p.lastActivityAt ? new Date(p.lastActivityAt).getTime() : 0;
          const daysSince = lastActivity > 0 ? Math.floor((now - lastActivity) / DAY) : 0;
          return {
            id: `rc-${p.id}`,
            name: p.name,
            avatar: p.avatar,
            lastMet: daysSince >= 1 ? `${daysSince} day${daysSince > 1 ? 's' : ''} ago` : 'Recently',
          };
        })
        .filter((s) => s.lastMet !== 'Recently')
        .slice(0, 4);

      // Suggested experiences (not yet joined)
      const joinedIds = new Set(attExpIds);
      const suggested = (allExps || [])
        .filter((e) => !joinedIds.has(e.id))
        .slice(0, 4)
        .map((e) => ({
          id: e.id,
          title: e.title,
          date: e.date || '',
          image: e.cover_image || '',
        }));

      setData({ upcomingExperiences: upcoming, pendingInvitations, reconnectSuggestions: reconnect, suggestedExperiences: suggested });
    } catch {
      setData({ upcomingExperiences: [], pendingInvitations: [], reconnectSuggestions: [], suggestedExperiences: [] });
    } finally {
      setLoading(false);
    }
  }, [user?.id, pals]);

  useEffect(() => { load(); }, [load]);
  return { data, loading };
}

// Hook: real memories from past attended experiences
export function useMemoriesData() {
  const { user } = useAuth();
  const [data, setData] = useState({ recentPhotos: [], recentExperiences: [], recentMilestones: [] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) { setData({ recentPhotos: [], recentExperiences: [], recentMilestones: [] }); setLoading(false); return; }
    const uid = String(user.id);
    try {
      const todayStr = moment().format('YYYY-MM-DD');
      const attendance = await base44.entities.Attendance.filter({ created_by_id: uid, status: 'going' }, '-created_date', 100).catch(() => []);
      const expIds = [...new Set((attendance || []).map((a) => Number(a.experience_id)).filter(Boolean))];
      const exps = await Promise.all(expIds.slice(0, 30).map((id) => base44.entities.Experience.get(id).catch(() => null)));
      const past = exps.filter(Boolean).filter((e) => {
        const d = expDateISO(e);
        return d && d < todayStr;
      });

      const recentPhotos = past
        .filter((e) => e.cover_image)
        .slice(0, 4)
        .map((e) => ({ id: `photo-${e.id}`, url: e.cover_image, caption: e.title }));

      const recentExperiences = past.slice(0, 5).map((e) => ({
        id: `exp-${e.id}`,
        title: e.title,
        date: e.date || '',
        emoji: emojiForCategory(e.category),
      }));

      // Milestones derived from total count
      const totalCount = (attendance || []).length;
      const recentMilestones = [];
      if (totalCount >= 1) recentMilestones.push({ id: 'ms-first', title: 'First Experience', date: 'Completed', emoji: '⭐' });
      if (totalCount >= 10) recentMilestones.push({ id: 'ms-10', title: '10 Experiences', date: 'Achieved', emoji: '🏆' });
      if (totalCount >= 50) recentMilestones.push({ id: 'ms-50', title: '50 Experiences', date: 'Achieved', emoji: '👑' });

      setData({ recentPhotos, recentExperiences, recentMilestones });
    } catch {
      setData({ recentPhotos: [], recentExperiences: [], recentMilestones: [] });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);
  return { data, loading };
}

// Hook: real mood insights from attended experience categories
export function useMoodInsights() {
  const { user } = useAuth();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) { setInsights([]); setLoading(false); return; }
    const uid = String(user.id);
    try {
      const attendance = await base44.entities.Attendance.filter({ created_by_id: uid, status: 'going' }, '-created_date', 200).catch(() => []);
      const expIds = [...new Set((attendance || []).map((a) => Number(a.experience_id)).filter(Boolean))];
      const exps = await Promise.all(expIds.slice(0, 50).map((id) => base44.entities.Experience.get(id).catch(() => null)));
      const cats = (exps.filter(Boolean)).map((e) => e.category || 'Other').filter(Boolean);
      if (cats.length === 0) { setInsights([]); return; }

      const counts = {};
      cats.forEach((c) => { counts[c] = (counts[c] || 0) + 1; });
      const total = cats.length;
      const colors = ['bg-chart-1', 'bg-chart-4', 'bg-chart-2', 'bg-chart-3', 'bg-chart-5'];
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
      const result = sorted.map(([label, count], i) => ({
        label,
        percentage: Math.round((count / total) * 100),
        emoji: emojiForCategory(label),
        color: colors[i % colors.length],
      }));
      setInsights(result);
    } catch {
      setInsights([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);
  return { insights, loading };
}

// Hook: real calendar events for the current month
export function useCalendarEvents() {
  const activities = useCalendarActivities();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const now = moment();
    const month = now.month();
    const year = now.year();
    const mapped = (activities || [])
      .map((a) => {
        if (!a.date) return null;
        const m = moment(a.date);
        if (m.month() !== month || m.year() !== year) return null;
        return {
          day: m.date(),
          type: a.type === 'circle' ? 'joined' : (a.type === 'hosted' ? 'hosted' : 'joined'),
          label: a.title,
        };
      })
      .filter(Boolean);
    // Dedupe by day (keep first)
    const seen = new Set();
    const deduped = mapped.filter((e) => {
      if (seen.has(e.day)) return false;
      seen.add(e.day);
      return true;
    });
    setEvents(deduped);
  }, [activities]);

  return events;
}