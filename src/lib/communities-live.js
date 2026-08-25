import { useState, useEffect } from 'react';
import { useActivityRefresh } from '@/lib/activity-store';

/**
 * PB-004 — Community live data store.
 * Replaces communities-data.js mock with real Community entities.
 * No fake members, chats, memories, or statistics.
 */

export function normalizeCommunity(c) {
  if (!c) return null;
  return {
    ...c,
    id: c.id,
    cover_photo: c.cover_photo || '',
    name: c.name || '',
    description: c.description || '',
    category: c.category || '',
    location: c.location || '',
    join_type: c.join_type || 'public',
    organizer: {
      name: c.organizer_name || 'Organizer',
      avatar: c.organizer_avatar || '',
      role: 'owner',
    },
    member_count: c.member_count || 0,
    members: c.organizer_name
      ? [{ name: c.organizer_name, avatar: c.organizer_avatar || '', role: 'owner', joined_date: '' }]
      : [],
    rules: c.rules ? String(c.rules).split('\n').filter(Boolean) : [],
    posting_guidelines: c.posting_guidelines || '',
    membership_requirements: '',
    upcoming_experiences: [],
    past_experiences: [],
    recurring_experiences: [],
    recent_memories: [],
    chat_messages: [],
    insights: { experiences_hosted: 0, avg_attendance: 0, growth_rate: 0, most_active: [] },
    tags: [],
  };
}

/**
 * Circles will use the independent Nmood data service.  The legacy Community
 * entity is deliberately not queried here: the independent schema does not
 * yet contain published Circle records, so the screen renders its clear
 * preview/empty state immediately instead of spinning forever.
 */
export function useCommunities() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const refreshKey = useActivityRefresh();
  useEffect(() => {
    let active = true;
    // Do not make a network call to a retired provider from this primary tab.
    // The next independent Circle migration will populate this collection.
    if (active) {
      setCommunities([]);
      setLoading(false);
    }
    return () => { active = false; };
  }, [refreshKey]);
  return { communities, loading };
}

/** Derive unique category strings from a community list (replaces static communityCategories). */
export function deriveCommunityCategories(communities) {
  const set = new Set();
  (communities || []).forEach((c) => { if (c.category) set.add(c.category); });
  return Array.from(set).sort();
}

/**
 * Hook: fetch a single community by id, plus related data
 * (community messages, linked circles). Returns null if not found.
 */
export function useCommunityDetail(id) {
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [circles, setCircles] = useState([]);
  const refreshKey = useActivityRefresh();

  useEffect(() => {
    if (!id) { setCommunity(null); setLoading(false); return; }
    let active = true;
    setLoading(true);
    (async () => {
      // A detail cannot be opened until independent Circle records exist.
      if (active) setCommunity(null);
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [id, refreshKey]);

  return { community, loading, circles };
}
