import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { callSupabaseRpc } from '@/api/supabaseClient';

/**
 * UI-017 — Premium profile statistics: Pals, Circles, Experiences,
 * joined participation and recommendations received on hosted Experiences.
 * The server owns every count so it can exclude the member's own content.
 * Also exposes reviews (rated experiences with reviewer info) for the
 * Recommendations section.
 */
export function useProfileStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ pals: 0, circles: 0, experiences: 0, joined: 0, recommendations: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const result = await callSupabaseRpc('nmood_get_my_profile_stats');
      const value = Array.isArray(result) ? result[0] : result;
      setStats({
        pals: Number(value?.pals || 0),
        circles: Number(value?.circles || 0),
        experiences: Number(value?.experiences || 0),
        joined: Number(value?.joined || 0),
        recommendations: Number(value?.recommendations || 0),
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
    try {
      const value = await callSupabaseRpc('nmood_list_my_experience_reviews');
      const rows = Array.isArray(value) ? value : [];
      setReviews(rows.slice(0, 5).map(row => ({
        id: row.id,
        name: row.name || 'Member',
        avatar: row.avatar || '',
        rating: Number(row.rating || 0),
        review: row.review || '',
        experienceTitle: row.experience_title || '',
        date: row.created_at ? new Date(row.created_at).toLocaleDateString() : '',
      })));
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);
  return { reviews, loading };
}
