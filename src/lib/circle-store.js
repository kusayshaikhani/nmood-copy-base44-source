import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useActivityRefresh } from '@/lib/activity-store';

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

// Module-level cache so all consumers share one query. Invalidated when the
// activity refresh key changes (join/leave circle).
let _circleCache = null;
let _circlePromise = null;
let _circleCacheKey = null;

function fetchCircles(refreshKey) {
  if (_circleCache && _circleCacheKey === refreshKey) return Promise.resolve(_circleCache);
  if (_circlePromise && _circleCacheKey === refreshKey) return _circlePromise;
  _circleCacheKey = refreshKey;
  _circlePromise = (async () => {
    try {
      const db = await base44.entities.Circle.list('-created_date', 50);
      _circleCache = (db || [])
        .map(normalizeCircle)
        .filter((c) => (!c.status || c.status === 'active') && !c.is_demo && !c.is_hidden);
    } catch {
      _circleCache = [];
    }
    return _circleCache;
  })();
  return _circlePromise;
}

// Hook: returns real DB circles; cached at module level so re-entry to any
// consumer reuses data instead of refetching. Invalidates on activity changes.
export function useMergedCircles() {
  const [circles, setCircles] = useState(_circleCache || []);
  const refreshKey = useActivityRefresh();
  useEffect(() => {
    if (_circleCache && _circleCacheKey === refreshKey) {
      setCircles(_circleCache);
      return;
    }
    let active = true;
    fetchCircles(refreshKey).then((c) => {
      if (active) setCircles(c);
    });
    return () => { active = false; };
  }, [refreshKey]);
  return circles;
}

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

// Resolve a single circle by id — DB first, mock fallback.
export async function getMergedCircleById(id) {
  try {
    const c = await base44.entities.Circle.get(id);
    if (c) return normalizeCircle(c);
  } catch {
    // fall through
  }
  return null;
}