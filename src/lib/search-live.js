import { useDiscoveryPeople } from '@/lib/use-discovery-people';
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

// Home, Discover All and Pals share one account-scoped query.
export function useSearchPeople() {
  const query = useDiscoveryPeople();
  return { ...query, loading: query.isLoading };
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
        memberId: e.host_user_id || null,
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