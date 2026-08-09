import moment from 'moment';
import { scoreExperience, EMOTIONS } from '@/lib/inmood-engine';
import { isExperienceExpired } from '@/lib/discover-engine';

const PERS_KEY = 'inmood_personalization';
const HIDDEN_KEY = 'inmood_hidden';
const NI_KEY = 'inmood_not_interested';

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}
function write(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ } }

export function getViewed() { return read(PERS_KEY, { viewed: [], joined: [], ignored: [] }); }

export function trackFeedView(id) {
  const p = getViewed();
  const sid = String(id);
  if (!p.viewed.includes(sid)) p.viewed.push(sid);
  if (p.viewed.length > 80) p.viewed = p.viewed.slice(-80);
  write(PERS_KEY, p);
}

export function trackFeedJoin(id) {
  const p = getViewed();
  const sid = String(id);
  if (!p.joined.includes(sid)) p.joined.push(sid);
  write(PERS_KEY, p);
}

export function getHidden() { return read(HIDDEN_KEY, []); }

export function markNotInterested(exp) {
  const hidden = getHidden();
  const sid = String(exp.id);
  if (!hidden.includes(sid)) { hidden.push(sid); write(HIDDEN_KEY, hidden); }
  const ni = read(NI_KEY, { cats: [], tags: [] });
  if (exp.category && !ni.cats.includes(exp.category)) ni.cats.push(exp.category);
  (exp.tags || []).slice(0, 2).forEach((t) => { if (!ni.tags.includes(t)) ni.tags.push(t); });
  write(NI_KEY, ni);
}

export function undoHide(id) {
  write(HIDDEN_KEY, getHidden().filter((x) => x !== String(id)));
}

function distNum(e) { return parseFloat(String(e.distance || '').replace(/[^0-9.]/g, '')) || 999; }

function expMoment(e) {
  const year = new Date().getFullYear();
  const raw = e.date ? `${e.date} ${year}` : null;
  if (!raw) return null;
  const m = moment(raw);
  return m.isValid() ? m : null;
}

function isToday(e) { const m = expMoment(e); return m && m.isSame(moment(), 'day'); }
function isTomorrow(e) { const m = expMoment(e); return m && m.isSame(moment().add(1, 'day'), 'day'); }
function isWeekend(e) { const m = expMoment(e); return m && [0, 5, 6].includes(m.day()); }
function isThisWeek(e) { const m = expMoment(e); return m && m.isAfter(moment().subtract(1, 'day')) && m.isBefore(moment().add(8, 'days')); }
function isMorning(e) { const m = expMoment(e); return m && m.hour() < 12; }
function isAfternoon(e) { const m = expMoment(e); return m && m.hour() >= 12 && m.hour() < 17; }
function isEvening(e) { const m = expMoment(e); return m && m.hour() >= 17; }

function startingSoonBonus(e) {
  const m = expMoment(e);
  if (!m) return 0;
  const hrs = m.diff(moment(), 'hours', true);
  if (hrs >= 0 && hrs <= 3) return 14;
  if (hrs > 3 && hrs <= 24) return 6;
  return 0;
}

function recentPostBonus(e) {
  if (!e.created_date) return 0;
  const hrs = (Date.now() - new Date(e.created_date).getTime()) / 3600000;
  if (hrs < 6) return 9;
  if (hrs < 24) return 4;
  return 0;
}

function popularityBonus(e) {
  const a = e.attendees?.length || e.spotsFilled || 0;
  return Math.min(12, a);
}

function notInterestedPenalty(e, ni) {
  let p = 0;
  if (ni.cats.includes(e.category)) p += 18;
  if ((e.tags || []).some((t) => ni.tags.includes(t))) p += 10;
  return p;
}

export function aiInsight(exp, emotion, interests = []) {
  const cat = (exp.category || '').toLowerCase();
  const matchedInterest = (interests || []).find((i) =>
    cat.includes(i.toLowerCase()) || (exp.tags || []).some((t) => t.toLowerCase().includes(i.toLowerCase()))
  );
  if (matchedInterest) return { key: 'inmood.ai.interest', params: { interest: matchedInterest } };
  const emo = EMOTIONS.find((e) => e.key === emotion);
  if (emo && (emo.cats || []).includes(exp.category)) return { key: 'inmood.ai.mood', params: {} };
  if ((exp.tags || []).includes('popular') || exp.isPopular) return { key: 'inmood.ai.popular', params: { category: exp.category || 'this' } };
  return { key: 'inmood.ai.default', params: {} };
}

export function applySearch(list, search) {
  if (!search || !search.trim()) return list;
  const q = search.toLowerCase();
  return list.filter((e) =>
    (e.title || '').toLowerCase().includes(q) ||
    (e.category || '').toLowerCase().includes(q) ||
    (e.host?.name || '').toLowerCase().includes(q) ||
    (e.tags || []).some((t) => t.toLowerCase().includes(q)) ||
    (e.venue?.name || '').toLowerCase().includes(q) ||
    (e.location || '').toLowerCase().includes(q)
  );
}

export function applyFilters(list, filters = {}) {
  let result = list;
  if (filters.when === 'today') result = result.filter(isToday);
  else if (filters.when === 'tonight') result = result.filter((e) => isEvening(e) || (e.tags || []).includes('tonight'));
  else if (filters.when === 'tomorrow') result = result.filter(isTomorrow);
  else if (filters.when === 'weekend') result = result.filter(isWeekend);
  else if (filters.when === 'this_week') result = result.filter(isThisWeek);
  else if (filters.when === 'morning') result = result.filter(isMorning);
  else if (filters.when === 'afternoon') result = result.filter(isAfternoon);
  else if (filters.when === 'evening') result = result.filter(isEvening);

  if (filters.distance && filters.distance < 50) result = result.filter((e) => distNum(e) <= filters.distance);
  if (filters.free) result = result.filter((e) => e.isFree || e.budget === 'Free');
  if (filters.paid) result = result.filter((e) => !(e.isFree || e.budget === 'Free'));
  if (filters.verified) result = result.filter((e) => e.verified || e.host?.verified);
  if (filters.trending) result = result.filter((e) => (e.tags || []).includes('popular') || e.isPopular);
  if (filters.newest) result = result.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
  if (filters.friends) result = result.filter((e) => (e.attendees?.length || 0) > 0);
  if (filters.nearby) result = result.filter((e) => (e.tags || []).includes('nearby'));
  if (filters.indoor) result = result.filter((e) => (e.tags || []).includes('indoor'));
  if (filters.outdoor) result = result.filter((e) => (e.tags || []).includes('outdoor') || (e.tags || []).includes('outdoors'));
  if (filters.accessibility) result = result.filter((e) => (e.tags || []).includes('accessible') || (e.tags || []).includes('accessibility'));
  if (filters.languages?.length) result = result.filter((e) => (filters.languages || []).some((l) => (e.languages || []).includes(l)));
  return result;
}

export function rankFeed(experiences, opts = {}) {
  const { emotion = 'surprise', energy = 'social', interests = [], joinedIds = new Set(), filters = {}, search = '' } = opts;
  const hidden = new Set(getHidden());
  const ni = read(NI_KEY, { cats: [], tags: [] });

  let list = experiences
    .filter((e) => !isExperienceExpired(e))
    .filter((e) => !joinedIds.has(e.id))
    .filter((e) => !hidden.has(String(e.id)));

  list = applySearch(list, search);
  list = applyFilters(list, filters);

  const scored = list.map((e) => {
    let s = scoreExperience(e, emotion, energy, interests);
    s += startingSoonBonus(e);
    s += recentPostBonus(e);
    s += popularityBonus(e);
    s -= notInterestedPenalty(e, ni);
    return { ...e, _score: Math.max(0, Math.min(99, s)) };
  });

  return scored.sort((a, b) => b._score - a._score);
}

export function friendsAttending(exp) {
  return (exp.attendees || []).slice(0, 3);
}

export function featuredBanners(ranked, emotion) {
  const banners = [];
  if (ranked.length === 0) return banners;
  const trending = ranked.find((e) => (e.tags || []).includes('popular') || e.isPopular);
  const mood = ranked.find((e) => {
    const emo = EMOTIONS.find((x) => x.key === emotion);
    return emo && (emo.cats || []).includes(e.category);
  });
  const friends = ranked.find((e) => (e.attendees?.length || 0) >= 2);
  if (mood) banners.push({ type: 'mood_match', pos: 1 });
  if (trending) banners.push({ type: 'trending', pos: 3 });
  if (friends) banners.push({ type: 'friends_joining', pos: 5 });
  return banners;
}

export function filterCount(filters) {
  let count = 0;
  if (filters.when) count++;
  if (filters.distance && filters.distance < 50) count++;
  ['free', 'paid', 'verified', 'trending', 'newest', 'friends', 'nearby', 'indoor', 'outdoor', 'accessibility'].forEach((k) => { if (filters[k]) count++; });
  return count;
}