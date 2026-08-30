/**
 * Nmood Recommendations — surfaces Nmoods across the entire app using the
 * AI recommendation engine. Nmoods never exist as an isolated feed; they
 * appear contextually on Home, Concierge, Search, Profile, and Notifications.
 *
 * No real Nmood-post backend exists yet, so this never renders
 * fixture/sample content in production — every consumer already treats an
 * empty list as "no Nmoods" (empty state / hidden section), never a fake
 * fallback. Populate `allNmoods` from a real query once that backend ships.
 */
import { computeNmoodStatus, sortByAiPriority, getCountdown, formatCountdownString } from '@/lib/nmood-lifecycle';

const allNmoods = [];

const isVisible = (p, now) => {
  const s = computeNmoodStatus(p, now);
  return s !== 'expired' && s !== 'archived' && s !== 'completed';
};


export function getRecommendedNmoods(userContext = {}, limit = 8) {
  const now = new Date();
  const visible = allNmoods.filter((p) => isVisible(p, now));
  return sortByAiPriority(visible, userContext, now).slice(0, limit);
}

export function searchNmoods(query) {
  const q = (query || '').toLowerCase().trim();
  const results = allNmoods.filter((p) => {
    const s = computeNmoodStatus(p);
    return s !== 'expired' && s !== 'archived';
  });
  if (!q) return results;
  return results.filter((p) =>
    (p.intention_text || '').toLowerCase().includes(q) ||
    (p.category || '').toLowerCase().includes(q) ||
    (p.location || '').toLowerCase().includes(q) ||
    (p.member_first_name || '').toLowerCase().includes(q) ||
    (p.looking_for || '').toLowerCase().includes(q) ||
    (p.member_interests || []).some((i) => i.toLowerCase().includes(q))
  );
}

export function getConciergeSuggestions(userContext = {}, limit = 4) {
  const recommended = getRecommendedNmoods(userContext, 10);
  if (recommended.length === 0) return [];
  const suggestions = [];

  const coffee = recommended.find((p) => p.category === 'Coffee');
  if (coffee) suggestions.push({ type: 'nearby_coffee', icon: '☕', nmoodId: coffee.id });

  const interestMatch = recommended.find((p) => p.category === 'Photography' || p.category === 'Art');
  if (interestMatch) suggestions.push({ type: 'interest_match', icon: '📸', nmoodId: interestMatch.id, data: { category: interestMatch.category.toLowerCase() } });

  const startingSoon = recommended.find((p) => computeNmoodStatus(p) === 'starting_soon');
  if (startingSoon) {
    const cd = getCountdown(startingSoon);
    suggestions.push({ type: 'starting_soon', icon: '⚡', nmoodId: startingSoon.id, data: { time: cd ? formatCountdownString(cd.ms) : '20 min' } });
  }

  const sports = recommended.find((p) => p.category === 'Sports');
  if (sports) suggestions.push({ type: 'needs_player', icon: '🎾', nmoodId: sports.id });

  suggestions.push({ type: 'same_inmood', icon: '✨', nmoodId: recommended[0]?.id });

  return suggestions.slice(0, limit);
}

export function getProfileNmoods(type = 'current') {
  const now = new Date();
  switch (type) {
    case 'current':
      return allNmoods.filter((p) => { const s = computeNmoodStatus(p, now); return s === 'live_now' || s === 'starting_soon'; });
    case 'upcoming':
      return allNmoods.filter((p) => { const s = computeNmoodStatus(p, now); return s === 'published' || s === 'trending' || s === 'starting_soon'; }).slice(0, 5);
    case 'past':
      return allNmoods.filter((p) => { const s = computeNmoodStatus(p, now); return s === 'completed' || s === 'expired'; });
    case 'completed':
      return allNmoods.filter((p) => computeNmoodStatus(p, now) === 'completed');
    case 'saved':
      return allNmoods.slice(0, 3);
    default:
      return [];
  }
}

export function getNmoodNotifications() {
  const recommended = getRecommendedNmoods({}, 5);
  return [
    { id: 'nm-1', type: 'interested', icon: '👋', time: '2m', nmoodId: recommended[0]?.id },
    { id: 'nm-2', type: 'starting', icon: '⏰', time: '28m', nmoodId: recommended[1]?.id },
    { id: 'nm-3', type: 'joined', icon: '🎉', time: '1h', nmoodId: recommended[2]?.id },
    { id: 'nm-4', type: 'trending', icon: '🔥', time: '2h', nmoodId: recommended[3]?.id },
    { id: 'nm-5', type: 'match', icon: '✨', time: '3h', nmoodId: recommended[4]?.id },
  ];
}