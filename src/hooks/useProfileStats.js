import { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

/**
 * UI-017 — Premium profile statistics: Pals, Circles, Experiences Hosted,
 * Experiences Joined, and Recommendations (ratings received on hosted
 * experiences). Pure read-only queries against existing entities.
 * Also exposes reviews (rated experiences with reviewer info) for the
 * Recommendations section.
 */
export function useProfileStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ pals: 0, circles: 0, hosted: 0, joined: 0, recommendations: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    const uid = String(user.id);
    try {
      const [pals, circles, hosted, joined] = await Promise.all([
        base44.entities.PalConnection.filter({ created_by_id: uid, is_active: true }).catch(() => []),
        base44.entities.CircleMembership.filter({ created_by_id: uid, status: 'member' }).catch(() => []),
        base44.entities.Experience.filter({ host_user_id: uid }).catch(() => []),
        base44.entities.Attendance.filter({ created_by_id: uid, status: 'going' }).catch(() => []),
      ]);
      const hostedIds = new Set((hosted || []).map((e) => Number(e.id)));
      let recommendations = 0;
      if (hostedIds.size > 0) {
        const ratings = await base44.entities.ExperienceRating.list('-created_date', 500).catch(() => []);
        recommendations = (ratings || []).filter((r) => hostedIds.has(Number(r.experience_id))).length;
      }
      setStats({
        pals: (pals || []).length,
        circles: (circles || []).length,
        hosted: (hosted || []).filter((e) => e.status !== 'cancelled').length,
        joined: (joined || []).length,
        recommendations,
      });
    } catch {
      /* keep defaults */
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);
  return { stats, loading };
}

export function useProfileReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    const uid = String(user.id);
    try {
      const hosted = await base44.entities.Experience.filter({ host_user_id: uid }).catch(() => []);
      const hostedMap = new Map((hosted || []).map((e) => [Number(e.id), e]));
      const hostedIds = new Set((hosted || []).map((e) => Number(e.id)));
      if (hostedIds.size === 0) { setReviews([]); setLoading(false); return; }
      const ratings = await base44.entities.ExperienceRating.list('-created_date', 500).catch(() => []);
      const mine = (ratings || []).filter((r) => hostedIds.has(Number(r.experience_id))).slice(0, 5);
      if (mine.length === 0) { setReviews([]); setLoading(false); return; }
      const reviewerIds = [...new Set(mine.map((r) => String(r.created_by_id)).filter(Boolean))];
      const memberLists = await Promise.all(
        reviewerIds.map((id) => base44.entities.Member.filter({ created_by_id: id }).catch(() => []))
      );
      const memberMap = new Map();
      memberLists.forEach((list, i) => { if (list && list[0]) memberMap.set(reviewerIds[i], list[0]); });
      setReviews(mine.map((r) => {
        const m = memberMap.get(String(r.created_by_id));
        const exp = hostedMap.get(Number(r.experience_id));
        return {
          id: r.id,
          name: m?.display_name || 'Member',
          avatar: m?.photo_url || '',
          rating: r.rating || 0,
          review: r.review || '',
          experienceTitle: exp?.title || '',
          date: r.created_date ? new Date(r.created_date).toLocaleDateString() : '',
        };
      }));
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);
  return { reviews, loading };
}