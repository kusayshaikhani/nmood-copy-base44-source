import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { fetchDiscoverableMembers } from '@/lib/member-update';
import { resolveMemberNames } from '@/lib/member-names';
import { resolveDisplayName, MEMBER_NAME_FALLBACK } from '@/lib/member-display';
import { Coffee, Footprints, Camera, Dumbbell, Users, Utensils, BookOpen, Music, Heart } from 'lucide-react';

/**
 * PB-004 — Search live data.
 * Replaces search-data.js mock with real Member + Experience queries.
 * Category and location counts are computed dynamically.
 */

/** Static filter config (UI config, not fake data). */
export const filterDefinitions = [
  { id: 'when', label: 'When', options: ['Any', 'Today', 'Tomorrow', 'Weekend'] },
  { id: 'price', label: 'Price', options: ['Any', 'Free', 'Paid'] },
  { id: 'setting', label: 'Setting', options: ['Any', 'Indoor', 'Outdoor'] },
  { id: 'distance', label: 'Distance', options: ['Any', '< 1km', '< 5km', '< 10km'] },
  { id: 'interests', label: 'Interests', options: ['Any', 'Coffee', 'Walking', 'Photography', 'Sports', 'Networking', 'Food', 'Learning', 'Music', 'Wellness'] },
];

/** Static trending search suggestions (UI hints, not fake data). */
export const trendingSearches = ['Coffee', 'Padel', 'Photography', 'Networking', 'Yoga', 'Art Walk'];

/** Category icon mapping (UI config). */
const CATEGORY_ICONS = {
  Coffee: Coffee, coffee: Coffee,
  Walking: Footprints, walking: Footprints, Outdoors: Footprints,
  Photography: Camera, photography: Camera,
  Sports: Dumbbell, sports: Dumbbell, Gaming: Dumbbell,
  Networking: Users, networking: Users, Entrepreneurs: Users,
  Food: Utensils, food: Utensils, 'Food Lovers': Utensils,
  Learning: BookOpen, learning: BookOpen, Books: BookOpen,
  Music: Music, music: Music,
  Wellness: Heart, wellness: Heart, Yoga: Heart,
};

function getIcon(category) {
  return CATEGORY_ICONS[category] || Heart;
}

// Module-level cache so re-entry to Search reuses data instead of refetching.
let _membersCache = null;
let _membersPromise = null;

function fetchMembers() {
  if (_membersCache) return Promise.resolve(_membersCache);
  if (_membersPromise) return _membersPromise;
  _membersPromise = (async () => {
    try {
      // AGE-001 — Use the backend discoverMembers action for server-side
      // eligibility filtering (excludes no-DOB, under-18, suspended, deleted,
      // not-onboarded, private members at the query level).
      const db = await fetchDiscoverableMembers(100);
      _membersCache = (db || [])
        .map((m) => ({
          id: m.id,
          user_id: m.user_id || m.created_by_id,
          name: m.display_name || MEMBER_NAME_FALLBACK,
          avatar: m.photo_url || '',
          languages: m.languages || [],
          interests: m.interests || [],
          looking_for_tags: m.looking_for_tags || [],
          zodiac: m.zodiac || '',
          gender: m.gender || '',
          age: typeof m.age === 'number' ? m.age : null,
          bio: m.bio || '',
          city: m.city || '',
          country: m.country || '',
          latitude: typeof m.latitude === 'number' ? m.latitude : null,
          longitude: typeof m.longitude === 'number' ? m.longitude : null,
          verified: false,
          created_date: m.created_date || '',
        }));
    } catch {
      _membersCache = [];
    }
    return _membersCache;
  })();
  return _membersPromise;
}

/** Hook: fetch active, non-private members for people search. */
export function useSearchPeople() {
  const [members, setMembers] = useState(_membersCache || []);
  const [loading, setLoading] = useState(!_membersCache);

  useEffect(() => {
    let active = true;
    (async () => {
      const raw = await fetchMembers();
      if (!active) return;
      const userIds = raw.map((r) => r.user_id).filter(Boolean);
      const names = await resolveMemberNames({ userIds });
      if (!active) return;
      setMembers(raw.map((r) => ({ ...r, name: names[r.user_id] || r.name || MEMBER_NAME_FALLBACK })));
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  return { members, loading };
}

/** Derive hosts from a list of experiences (unique by host_user_id). */
export function deriveHosts(experiences) {
  const map = new Map();
  (experiences || []).forEach((e) => {
    const key = e.host_user_id || e.host_name;
    if (!key) return;
    if (map.has(key)) {
      map.get(key).hostedActivities += 1;
    } else {
      map.set(key, {
        id: key,
        name: e.host_name || 'Host',
        avatar: e.host_avatar || '',
        hostedActivities: 1,
        languages: [],
      });
    }
  });
  return Array.from(map.values());
}

/** Compute category counts dynamically from experiences. */
export function computeSearchCategories(experiences) {
  const counts = {};
  (experiences || []).forEach((e) => {
    const cat = e.category || e.category;
    if (cat) counts[cat] = (counts[cat] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, count]) => ({ id: name.toLowerCase(), name, icon: getIcon(name), count }))
    .sort((a, b) => b.count - a.count);
}

/** Compute location counts dynamically from experiences. */
export function computeSearchLocations(experiences) {
  const map = new Map();
  (experiences || []).forEach((e) => {
    const loc = e.location || (e.venue && e.venue.name);
    if (!loc) return;
    if (map.has(loc)) {
      map.get(loc).count += 1;
    } else {
      map.set(loc, { id: map.size + 1, name: loc, area: '', count: 1 });
    }
  });
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}