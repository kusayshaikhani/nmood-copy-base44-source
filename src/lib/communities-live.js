import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
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

/** Hook: fetch all communities from the database.
 *  Uses filter() as primary (more reliable across user roles) with list() fallback.
 *  Logs errors instead of silently swallowing them. */
export function useCommunities() {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const refreshKey = useActivityRefresh();
  useEffect(() => {
    let active = true;
    (async () => {
      let db = null;
      try {
        db = await base44.entities.Community.filter({}, '-created_date', 100);
      } catch (err) {
        console.error('[Communities] filter() failed, trying list():', err?.message || err);
        try {
          db = await base44.entities.Community.list('-created_date', 100);
        } catch (err2) {
          console.error('[Communities] list() also failed:', err2?.message || err2);
        }
      }
      if (!active) return;
      const norm = (db || []).map(normalizeCommunity).filter(Boolean);
      setCommunities(norm);
      setLoading(false);
    })();
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
      try {
        const c = await base44.entities.Community.get(id);
        if (!active) return;
        if (!c || !c.id) { setCommunity(null); setLoading(false); return; }

        const normalized = normalizeCommunity(c);

        // Fetch community messages (real chat)
        try {
          const msgs = await base44.entities.CommunityMessage.filter(
            { community_id: parseInt(id) }, '-created_date', 50
          );
          if (active) {
            normalized.chat_messages = (msgs || []).map((m) => ({
              sender_name: m.sender_name || 'Member',
              sender_avatar: m.sender_avatar || '',
              sender_role: m.sender_role || 'member',
              type: m.type || 'text',
              content: m.content || '',
              is_pinned: m.is_pinned || false,
            }));
          }
        } catch { /* no messages yet */ }

        // Fetch circles linked to this community
        try {
          const allCircles = await base44.entities.Circle.list('-created_date', 100);
          if (active) {
            const linked = (allCircles || []).filter(
              (ci) => (ci.status === 'active' || !ci.status) && String(ci.community_id) === String(id)
            );
            setCircles(linked);
          }
        } catch { /* no circles yet */ }

        if (active) setCommunity(normalized);
      } catch {
        if (active) setCommunity(null);
      }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [id, refreshKey]);

  return { community, loading, circles };
}