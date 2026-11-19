import { callSupabaseRpc } from '@/api/supabaseClient';
import { toEntity } from '@/api/supabaseRecords';
import { useDiscoveryQuery, invalidateDiscovery } from '@/lib/discovery-query';
import { getCircleById, listCircles } from '@/api/contentRecords';

// Map a persisted Circle record (flat DB fields) to the rich shape the UI expects.
export function normalizeCircle(c) {
  if (!c) return null;
  const hostName = c.host_name || (c.host && c.host.name) || 'Host';
  const hostAvatar = c.host_avatar || (c.host && c.host.avatar) || '';
  return {
    ...c,
    name: c.name,
    description: c.description || '',
    cover_photo: c.cover_photo || '',
    community_id: c.community_id,
    community_name: c.community_name || '',
    privacy: c.privacy || 'public',
    member_count: c.member_count || 1,
    max_members: c.max_members,
    shared_interests: c.shared_interests || [],
    host: { name: hostName, avatar: hostAvatar, role: 'host' },
    members: [{ name: hostName, avatar: hostAvatar, role: 'host', joined: 'Just now' }],
    chat_messages: c.chat_messages || [],
    upcoming_experiences: c.upcoming_experiences || [],
    past_experiences: c.past_experiences || [],
    recent_memories: c.recent_memories || [],
    tags: c.tags || ['new'],
  };
}

export function invalidateCircleCache() { return invalidateDiscovery('circles'); }
export function useCircleDiscovery() {
  const query = useDiscoveryQuery('circles', async signal => (await listCircles({ limit: 100, signal })).map(normalizeCircle).filter(c =>
    (!c.status || c.status === 'active') && !c.is_demo && !c.is_hidden && !c.is_archived && ['public', 'approval'].includes(c.privacy)));
  return { ...query, circles: query.data || [], loading: query.isLoading };
}
export function useMergedCircles() { return useCircleDiscovery().circles; }

// Recommended circles for discovery: active, discoverable (not private/invite), not full.
export function getRecommendedCircles(circles, { interests = [], limit = 6 } = {}) {
  return circles
    .filter((c) => !c.status || c.status === 'active')
    .filter((c) => c.privacy === 'public' || c.privacy === 'approval')
    .filter((c) => !c.max_members || (c.member_count || 0) < c.max_members)
    .map((c) => {
      let score = 0;
      if (interests.length) {
        const ci = interests.map((i) => i.toLowerCase());
        score += (c.shared_interests || []).filter((si) =>
          ci.some((i) => si.toLowerCase().includes(i) || i.includes(si.toLowerCase()))
        ).length * 10;
      }
      if ((c.tags || []).includes('recommended')) score += 6;
      if ((c.tags || []).includes('popular')) score += 5;
      if ((c.tags || []).includes('nearby')) score += 4;
      score += Math.min(8, c.member_count || 0);
      return { c, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.c);
}

// Resolve a single circle by id from the direct Supabase app_records layer.
export async function getMergedCircleById(id) {
  try {
    const c = await getCircleById(id);
    if (!c) return null;
    let rows;
    try { rows = await callSupabaseRpc('nmood_circle_experiences', {p_circle_id:id}); }
    catch { return {...normalizeCircle(c),upcoming_experiences:[],past_experiences:[],experiences_unavailable:true}; }
    const experiences = (rows || []).map(toEntity).filter(Boolean);
    return {...normalizeCircle(c), ...partitionCircleExperiences(experiences)};
  } catch {
    return null;
  }
}
export function partitionCircleExperiences(rows, now = Date.now()) {
 const visible = rows.filter(r => ['active','published','scheduled'].includes(r.status) && !r.is_draft && !r.is_hidden && !r.is_archived && !r.is_deleted)
  .map(r => ({...r, image:r.cover_image, host:r.host_name, starts:Date.parse(`${r.date}T${r.time || '00:00'}`)}))
  .filter(r => Number.isFinite(r.starts));
 return {upcoming_experiences:visible.filter(r=>r.starts>=now).sort((a,b)=>a.starts-b.starts),past_experiences:visible.filter(r=>r.starts<now).sort((a,b)=>b.starts-a.starts)};
}
