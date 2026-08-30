import { useState, useEffect } from 'react';
import moment from 'moment';
/**
 * RC-004A/HIGH-2 — Experience store backed by real Experience entities.
 * Mock data is used ONLY as an empty-state fallback when the database
 * contains zero experiences. All discovery surfaces (Explore, Home,
 * InMood, Search, Saved) consume this hook instead of static mock data.
 */

/**
 * Map a persisted Experience entity (flat DB fields) to the rich shape
 * the UI expects — the same shape the mock experiences have. This lets
 * every existing component (DiscoverCard, ExperienceSection, etc.) work
 * with real data without any UI changes.
 */
export function normalizeExperience(exp) {
  if (!exp) return null;
  const date = normalizeExpDate(exp.date);
  const tags = computeTags(exp, date);
  const remaining = spotsRemaining(exp.max_participants, exp.spots_filled);
  const unlimited = isUnlimitedCapacity(exp.max_participants);
  const isFree = (exp.budget || '').toLowerCase() === 'free' || (exp.budget_amount || 0) === 0;

  return {
    ...exp,
    id: exp.id,
    image: exp.cover_image || '',
    gallery: exp.cover_image ? [exp.cover_image] : [],
    title: exp.title || '',
    host: {
      name: exp.host_name || 'Host',
      avatar: exp.host_avatar || '',
      bio: '',
      trustScore: 0,
      hostedCount: 0,
    },
    verified: false,
    distance: '',
    time: exp.time || '',
    budget: exp.budget || (isFree ? 'Free' : ''),
    category: exp.category || '',
    spots: unlimited ? 'Unlimited spots' : (remaining > 0 ? `${remaining} spots left` : 'Full'),
    spotsTotal: unlimited ? null : exp.max_participants,
    spotsFilled: exp.spots_filled || 0,
    mood: '',
    coordinates: exp.location_lat && exp.location_lng ? [exp.location_lat, exp.location_lng] : null,
    date,
    duration: exp.duration || '',
    venue: { name: exp.location || '', address: exp.location_address || '' },
    joinType: 'instant',
    attendees: [],
    description: exp.description || '',
    about: { what: exp.description || '', who: '', expect: '', bring: '' },
    tags,
    isFeatured: exp.is_featured || false,
    isRecommended: tags.includes('popular'),
    isFree,
    isPopular: tags.includes('popular'),
    isNew: tags.includes('new'),
    origin_type: '',
    origin_name: '',
  };
}

/** Normalize any date string (ISO or "MMM D") to "MMM D" format for engine compat. */
function normalizeExpDate(dateStr) {
  if (!dateStr) return '';
  // ISO format (YYYY-MM-DD) → "MMM D"
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const m = moment(dateStr);
    if (m.isValid()) return m.format('MMM D');
  }
  return dateStr;
}

/** Compute discovery tags from real experience data (replaces hardcoded tags). */
function computeTags(exp, normalizedDate) {
  const tags = [];
  if (normalizedDate) {
    const m = moment(`${normalizedDate} ${new Date().getFullYear()}`, 'MMM D YYYY');
    if (m.isValid()) {
      const now = moment();
      if (m.isSame(now, 'day')) {
        tags.push('today');
        if (exp.time) {
          const t = exp.time.toUpperCase();
          if (t.includes('PM') && !t.startsWith('12:')) tags.push('tonight');
        }
      }
      const dayOfWeek = m.day();
      if (dayOfWeek === 0 || dayOfWeek === 6) tags.push('weekend');
      const daysAway = m.diff(now.startOf('day'), 'days');
      if (daysAway >= 0 && daysAway <= 14) tags.push('nearby');
    }
  }
  if ((exp.budget || '').toLowerCase() === 'free' || (exp.budget_amount || 0) === 0) tags.push('free');
  if ((exp.spots_filled || 0) > 10) tags.push('popular');
  if (exp.is_featured) tags.push('featured');
  // 'new' — created within last 7 days
  if (exp.created_date) {
    const created = moment(exp.created_date);
    if (created.isValid() && moment().diff(created, 'days') <= 7) tags.push('new');
  }
  return tags;
}

/** Compute featured experiences from a list (replaces static export). */
export function computeFeatured(exps) {
  return (exps || []).filter(e => e.isFeatured || (e.tags || []).includes('featured'));
}

/**
 * Compute recommended experiences: featured first, then new arrivals within
 * the last 7 days, then recently-dated experiences. Intentionally distinct
 * from computePopular so the two Explore sections show different content.
 */
export function computeRecommended(exps) {
  return (exps || [])
    .filter(e => e.isFeatured || e.isNew || (e.tags || []).includes('featured') || (e.tags || []).includes('new'))
    .sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });
}

/**
 * Compute popular experiences: highest spots_filled, capped to avoid
 * permanently-popular stale events (must have >= 3 spots filled).
 */
export function computePopular(exps) {
  return (exps || [])
    .filter(e => (e.spotsFilled || 0) >= 3 || (e.tags || []).includes('popular'))
    .sort((a, b) => (b.spotsFilled || 0) - (a.spotsFilled || 0));
}

// Module-level cache so all consumers on the same page share one DB query.
// Cache is invalidated on explicit refresh calls (create/join/leave actions).
let _cache = null;
let _promise = null;

export function invalidateExperienceCache() {
  _cache = null;
  _promise = null;
}

function fetchExperiences(force = false) {
  if (!force && _cache) return Promise.resolve(_cache);
  if (!force && _promise) return _promise;
  _promise = (async () => {
    try {
      const db = await listExperiences({ limit: 100 });
      const norm = (db || []).map(normalizeExperience).filter(Boolean);
      // Filter out hidden/archived/cancelled from public discovery
      const visible = norm.filter(e =>
        !e.is_hidden && !e.is_archived && !e.is_demo && e.status !== 'cancelled' && e.status !== 'completed'
      );
      _cache = visible;
    } catch {
      _cache = [];
    }
    return _cache;
  })();
  return _promise;
}

/**
 * Hook: returns real experiences from the DB with mock fallback.
 * All consumers share a single cached query.
 */
export function useExperiences(forceRefresh = false) {
  const [experiences, setExperiences] = useState(_cache || []);
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    if (!forceRefresh && _cache) {
      setExperiences(_cache);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    fetchExperiences(forceRefresh).then((exps) => {
      if (active) {
        setExperiences(exps);
        setLoading(false);
      }
    });
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceRefresh]);

  return { experiences, loading };
}