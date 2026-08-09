import moment from 'moment';

export const getCountdown = (experience) => {
  if (!experience?.date) return '';
  const year = new Date().getFullYear();
  const start = moment(`${experience.date} ${year} ${experience.time || ''}`, 'MMM D YYYY h:mm A');
  if (!start.isValid()) return experience.date;

  const now = moment();
  const diffMin = start.diff(now, 'minutes');

  if (diffMin < 0) return 'Started';
  if (diffMin <= 60) return `Starts in ${diffMin} min`;
  if (start.isSame(now, 'day')) return `Starts in ${Math.floor(diffMin / 60)}h`;
  if (start.isSame(now.clone().add(1, 'day'), 'day')) return 'Tomorrow';
  if (start.diff(now, 'days') < 7) return start.format('dddd');
  if (start.diff(now, 'days') < 14) return 'Next Week';
  return start.format('MMM D');
};

export const getRemainingSpots = (exp) => (exp.spotsTotal || 0) - (exp.spotsFilled || 0);

export const isExperienceExpired = (exp) => {
  if (!exp?.date) return false;
  const year = new Date().getFullYear();
  const d = moment(`${exp.date} ${year}`, 'MMM D YYYY');
  if (!d.isValid()) return false;
  return d.isBefore(moment().startOf('day'));
};

export const smartSort = (exps, opts = {}) => {
  const { interests = [], previousCategories = [] } = opts;
  return [...exps].sort((a, b) => scoreExperience(b, opts) - scoreExperience(a, opts));
};

const scoreExperience = (exp, { interests = [], previousCategories = [] } = {}) => {
  let score = 0;
  const dist = parseFloat(String(exp.distance).replace(/[^0-9.]/g, '')) || 999;
  score += Math.max(0, 50 - dist);
  const expYear = new Date().getFullYear();
  const expDate = moment(`${exp.date} ${expYear}`, 'MMM D YYYY');
  if (expDate.isValid()) {
    const daysAway = expDate.diff(moment(), 'days');
    if (daysAway >= 0) score += Math.max(0, 15 - Math.min(daysAway, 7) * 2);
  }
  if (interests.length > 0) {
    const iLower = interests.map((i) => i.toLowerCase());
    if (iLower.some((i) => (exp.category || '').toLowerCase().includes(i) || (exp.tags || []).some((t) => t.toLowerCase().includes(i)))) {
      score += 30;
    }
  }
  if (previousCategories.includes(exp.category)) score += 20;
  if (exp.isNew || (exp.tags || []).includes('new')) score += 10;
  if (getRemainingSpots(exp) > 0) score += 5;
  if (exp.isRecommended) score += 8;
  return score;
};

export const getDiscoverSections = (allExps, opts = {}) => {
  const { interests = [] } = opts;
  const today = allExps.filter((e) => (e.tags || []).includes('today') || (e.tags || []).includes('tonight'));
  const nearby = allExps.filter((e) => (e.tags || []).includes('nearby'));
  const weekend = allExps.filter((e) => (e.tags || []).includes('weekend'));
  const newExps = allExps.filter((e) => e.isNew || (e.tags || []).includes('new'));
  const recommended = allExps.filter((e) => e.isRecommended);

  const todaysPicks = smartSort([...today, ...recommended].slice(0, 6), opts);
  const happeningToday = today;
  const nearYou = smartSort(nearby.length > 0 ? nearby : allExps.slice(0, 4), opts);
  const thisWeekend = weekend;
  const newExperiences = newExps;
  const continueExploring = smartSort(allExps, opts);

  const fallbackInterests = interests.length > 0 ? interests : ['Coffee', 'Wellness', 'Sports'];
  const interestSections = fallbackInterests.slice(0, 3).map((interest) => {
    const iLower = interest.toLowerCase();
    const matched = allExps.filter(
      (e) =>
        (e.category || '').toLowerCase().includes(iLower) ||
        (e.mood || '').toLowerCase().includes(iLower) ||
        (e.tags || []).some((t) => t.toLowerCase().includes(iLower))
    );
    return { interest, experiences: matched.length > 0 ? matched : recommended.slice(0, 5) };
  });

  return { todaysPicks, happeningToday, nearYou, thisWeekend, newExperiences, interestSections, continueExploring };
};

export const getRecommendedExperiences = (allExps, { interests = [], limit = 10 } = {}) => {
  const seen = new Set();
  return allExps
    .filter((e) => !isExperienceExpired(e))
    .filter((e) => {
      if (!e || seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    })
    .sort((a, b) => scoreExperience(b, { interests }) - scoreExperience(a, { interests }))
    .slice(0, limit);
};

export const searchExperiences = (allExps, query) => {
  if (!query || !query.trim()) return [];
  const q = query.toLowerCase().trim();
  return allExps.filter(
    (e) =>
      (e.title || '').toLowerCase().includes(q) ||
      (e.host?.name || '').toLowerCase().includes(q) ||
      (e.category || '').toLowerCase().includes(q) ||
      (e.venue?.name || '').toLowerCase().includes(q) ||
      (e.venue?.address || '').toLowerCase().includes(q) ||
      (e.mood || '').toLowerCase().includes(q) ||
      (e.tags || []).some((t) => t.toLowerCase().includes(q))
  );
};