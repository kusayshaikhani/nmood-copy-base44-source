export const EMOTIONS = [
  { key: 'reset', emoji: '🌧', label: 'I need a reset', cats: ['Wellness', 'Outdoors', 'Photography'] },
  { key: 'company', emoji: '🤝', label: "I'd like some company", cats: ['Coffee', 'Networking', 'Gaming', 'Food'] },
  { key: 'exploring', emoji: '🌍', label: 'I want to explore', cats: ['Outdoors', 'Photography', 'Music', 'Networking'] },
  { key: 'inspiration', emoji: '💡', label: 'I need inspiration', cats: ['Learning', 'Music', 'Networking', 'Arts'] },
  { key: 'fun', emoji: '😂', label: 'I want to have fun', cats: ['Gaming', 'Sports', 'Music', 'Food'] },
  { key: 'peace', emoji: '🌿', label: 'I need some peace', cats: ['Wellness', 'Outdoors', 'Photography'] },
  { key: 'surprise', emoji: '🎲', label: 'Surprise me', cats: [] },
];

export const ENERGIES = [
  { key: 'calm', emoji: '⚪', label: 'Calm', cats: ['Wellness', 'Photography', 'Outdoors'] },
  { key: 'relaxed', emoji: '🟢', label: 'Relaxed', cats: ['Coffee', 'Food', 'Music'] },
  { key: 'social', emoji: '🟡', label: 'Social', cats: ['Networking', 'Gaming', 'Coffee'] },
  { key: 'active', emoji: '🟠', label: 'Active', cats: ['Sports', 'Outdoors', 'Wellness'] },
  { key: 'adventure', emoji: '🔴', label: 'Adventure', cats: ['Sports', 'Outdoors'] },
];

export const CATEGORIES = ['Coffee', 'Food', 'Photography', 'Networking', 'Business', 'Technology', 'Learning', 'Music', 'Travel', 'Nature', 'Fitness', 'Sports', 'Gaming', 'Arts', 'Animals', 'Volunteering'];

export function getGreeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Good Morning';
  if (h < 18) return 'Good Afternoon';
  return 'Good Evening';
}

const scoreForInterests = (e, interests) =>
  e.cats.filter((c) => interests.some((i) => c.toLowerCase().includes(i.toLowerCase()) || i.toLowerCase().includes(c.toLowerCase()))).length;

export function pickInitialEmotions(interests = []) {
  const h = new Date().getHours();
  let pool = [...EMOTIONS];
  if (h < 12) pool.sort((a, b) => (['peace', 'reset', 'company'].includes(a.key) ? -1 : 1));
  else if (h < 18) pool.sort((a, b) => (['company', 'inspiration', 'exploring'].includes(a.key) ? -1 : 1));
  else pool.sort((a, b) => (['fun', 'company', 'peace'].includes(a.key) ? -1 : 1));
  if (interests.length) pool.sort((a, b) => scoreForInterests(b, interests) - scoreForInterests(a, interests));
  const picked = pool.slice(0, 3).map((p) => p.key);
  if (!picked.includes('surprise') && Math.random() < 0.4) picked[2] = 'surprise';
  return picked;
}

export function scoreExperience(exp, emotion, energy, interests = []) {
  let s = 50;
  // 1. Selected mood
  const emo = EMOTIONS.find((e) => e.key === emotion);
  const en = ENERGIES.find((e) => e.key === energy);
  const cats = [...(emo?.cats || []), ...(en?.cats || [])];
  if (cats.includes(exp.category)) s += 20;
  // 2. Shared interests
  if (interests.length) {
    const iLower = interests.map((i) => i.toLowerCase());
    const hit = iLower.some((i) =>
      (exp.category || '').toLowerCase().includes(i) ||
      (exp.tags || []).some((t) => t.toLowerCase().includes(i) || i.includes(t.toLowerCase()))
    );
    if (hit) s += 15;
  }
  // 3. Distance (closer ranks higher)
  const dist = parseFloat(String(exp.distance || '').replace(/[^0-9.]/g, '')) || 999;
  s += Math.max(0, 15 - Math.min(dist, 15));
  // 4. Active users (attendee momentum)
  const attendees = exp.attendees?.length || 0;
  s += Math.min(10, attendees);
  // 5 & 6. Upcoming recency (sooner upcoming ranks higher)
  if (exp.date) {
    const year = new Date().getFullYear();
    const d = new Date(`${exp.date} ${year}`);
    if (!isNaN(d.getTime())) {
      const days = Math.max(0, Math.floor((d.getTime() - Date.now()) / 86400000));
      if (days <= 7) s += 10 - days;
    }
  }
  if (exp.origin_type === 'circle' || exp.origin_type === 'community') s += 6;
  if (exp.isRecommended) s += 8;
  if (exp.isPopular) s += 5;
  if (exp.isFree) s += 4;
  if (exp.tags?.includes('nearby')) s += 3;
  return Math.min(99, s);
}

export const compatibility = (exp, emotion, energy, interests = []) => Math.min(99, scoreExperience(exp, emotion, energy, interests));

export function magicScore(exp, emotion, energy, interests = []) {
  let s = 50;
  const emo = EMOTIONS.find((e) => e.key === emotion);
  const en = ENERGIES.find((e) => e.key === energy);
  const cats = [...(emo?.cats || []), ...(en?.cats || [])];
  if (cats.includes(exp.category)) s += 20;
  if (interests.length) {
    const iLower = interests.map((i) => i.toLowerCase());
    const hit = iLower.some((i) =>
      (exp.category || '').toLowerCase().includes(i) ||
      (exp.tags || []).some((t) => t.toLowerCase().includes(i) || i.includes(t.toLowerCase()))
    );
    if (hit) s += 18;
  }
  const dist = parseFloat(String(exp.distance || '').replace(/[^0-9.]/g, '')) || 999;
  s += Math.max(0, 20 - Math.min(dist, 20));
  const remaining = (exp.spotsTotal || 0) - (exp.spotsFilled || 0);
  if (remaining > 0) s += 8;
  if ((exp.tags || []).includes('popular') || exp.origin_type === 'community' || exp.origin_type === 'circle') s += 6;
  return s;
}

export function reasonFor(exp, emotion, interests = []) {
  const cat = (exp.category || '').toLowerCase();
  const title = exp.title || '';
  const venue = exp.venue?.name || exp.venue?.address || '';
  const locationHint = venue ? ` at ${venue}` : '';

  // Find the matching interest for a personal touch
  const matchedInterest = interests.find((i) =>
    cat.includes(i.toLowerCase()) || (exp.tags || []).some((t) => t.toLowerCase().includes(i.toLowerCase()))
  );
  const interestHint = matchedInterest ? `, matching your interest in ${matchedInterest}` : '';

  const map = {
    reset: `${title}${locationHint} — a calm ${cat} moment to help you decompress${interestHint}.`,
    company: `${title} offers warm company and easy conversation${interestHint}.`,
    exploring: `Explore something new with ${title}${locationHint}${interestHint}.`,
    inspiration: `${title} could spark fresh ideas${interestHint} — just right for today.`,
    fun: `${title} looks light and playful${interestHint}.`,
    peace: `A peaceful, low-pressure ${cat} moment${locationHint}${interestHint}.`,
    surprise: `${title} — an unexpected pick we think you'll enjoy${interestHint}.`,
  };
  return map[emotion] || `${title} was picked based on how you feel today${interestHint}.`;
}

export function parseSearch(q) {
  const s = (q || '').toLowerCase();
  const f = { free: false, maxBudget: null, cats: [], when: null, lang: null };
  if (/free|free activities/.test(s)) f.free = true;
  const m = s.match(/under\s*(?:aed\s*)?(\d+)/);
  if (m) f.maxBudget = parseInt(m[1], 10);
  const catMap = { coffee: 'Coffee', food: 'Food', photography: 'Photography', networking: 'Networking', business: 'Networking', technology: 'Technology', tech: 'Technology', learning: 'Learning', music: 'Music', travel: 'Travel', nature: 'Outdoors', fitness: 'Wellness', sports: 'Sports', gaming: 'Gaming', arts: 'Arts', animals: 'Animals', volunteering: 'Volunteering' };
  Object.keys(catMap).forEach((k) => { if (s.includes(k)) f.cats.push(catMap[k]); });
  if (/tonight|after work|evening/.test(s)) f.when = 'tonight';
  if (/weekend|saturday|sunday/.test(s)) f.when = 'weekend';
  if (/morning/.test(s)) f.when = 'morning';
  if (/arabic/.test(s)) f.lang = 'Arabic';
  return f;
}

export function filterExperiences(list, f) {
  return list.filter((e) => {
    if (f.free && !(e.isFree || e.budget === 'Free')) return false;
    if (f.maxBudget) {
      const b = parseInt(String(e.budget).replace(/[^0-9]/g, ''), 10);
      if (!isNaN(b) && b > f.maxBudget) return false;
    }
    if (f.cats.length && !f.cats.includes(e.category)) return false;
    if (f.when === 'tonight' && !e.tags?.includes('tonight')) return false;
    if (f.when === 'weekend' && !e.tags?.includes('weekend')) return false;
    if (f.lang === 'Arabic' && !(e.languages || []).includes('Arabic')) return false;
    return true;
  });
}

export const travelTime = (distStr) => {
  const km = parseFloat(String(distStr || '').replace(/[^0-9.]/g, ''));
  if (isNaN(km)) return '';
  const mins = Math.max(5, Math.round(km * 12));
  return `${mins} min`;
};