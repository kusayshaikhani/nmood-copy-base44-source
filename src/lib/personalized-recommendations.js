const RULE_VERSION = 'rehearsal-recs-v1';

// Concepts are language-agnostic buckets, not demographic or geographic rules.
// Extending this vocabulary changes matching only; it never fabricates profile data.
const CONCEPT_GROUPS = [
  ['camping', 'hiking', 'outdoors', 'trekking', 'nature', 'walking'],
  ['running', 'jogging', 'fitness', 'sport', 'sports'],
  ['photography', 'photo', 'camera'],
  ['coffee', 'cafe', 'cafes'],
  ['art', 'arts', 'painting', 'drawing', 'gallery'],
  ['music', 'concert', 'singing', 'instrument'],
  ['food', 'cooking', 'dining', 'restaurant'],
  ['technology', 'tech', 'coding', 'software'],
  ['books', 'book', 'reading', 'literature'],
  ['wellness', 'mindfulness', 'meditation', 'yoga'],
  ['travel', 'travelling', 'traveling', 'exploring'],
  ['gaming', 'games', 'boardgames', 'esports'],
];

const conceptByTerm = new Map(CONCEPT_GROUPS.flatMap((group, index) => group.map((term) => [term, `concept-${index}`])));

export function normalizeRecommendationTerm(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function terms(values) {
  return [...new Set((Array.isArray(values) ? values : []).map(normalizeRecommendationTerm).filter(Boolean).slice(0, 50))];
}

function concepts(values) {
  const output = new Set();
  for (const value of terms(values)) {
    output.add(value);
    for (const token of value.split(' ')) output.add(conceptByTerm.get(token) || token);
  }
  return output;
}

function overlap(left, right) {
  const b = concepts(right);
  return [...concepts(left)].filter((item) => b.has(item));
}

function cleanPreferences(preferences = {}) {
  return {
    enabled: preferences.enabled !== false,
    interests: terms(preferences.interests),
    languages: terms(preferences.languages),
    peopleTags: terms(preferences.people_tags || preferences.peopleTags),
    country: normalizeRecommendationTerm(preferences.country),
    city: normalizeRecommendationTerm(preferences.city),
    useLocation: preferences.use_location === true || preferences.useLocation === true,
  };
}

export function buildRecommendationContext(member = {}, preferences = {}, actionSignals = []) {
  const saved = cleanPreferences(preferences);
  return {
    enabled: member.personalized_recommendations !== false && saved.enabled,
    interests: terms([...(member.interests || []), ...saved.interests]),
    languages: saved.languages,
    peopleTags: saved.peopleTags,
    country: saved.useLocation && member.location_enabled !== false ? saved.country : '',
    city: saved.useLocation && member.location_enabled !== false ? saved.city : '',
    actionTags: terms(actionSignals.map((signal) => signal?.tag)),
    ruleVersion: RULE_VERSION,
  };
}

function stableRank(items, scorer, enabled) {
  const list = Array.isArray(items) ? items : [];
  if (!enabled) return list.map((item) => ({ ...item, recommendationWhy: 'Personalised ranking is off.' }));
  return list.map((item, index) => ({ item, index, ...scorer(item) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ item, reasons }) => ({
      ...item,
      recommendationWhy: reasons.length ? `Why you’re seeing this: ${reasons.slice(0, 2).join(' · ')}` : 'Why you’re seeing this: available on Nmood',
    }));
}

function locationReason(item, context) {
  const itemCountry = normalizeRecommendationTerm(item.country || item.location_country);
  const itemCity = normalizeRecommendationTerm(item.city || item.location_city);
  if (context.city && itemCity && context.city === itemCity) return 'in your selected city';
  if (context.country && itemCountry && context.country === itemCountry) return 'in your selected country';
  return '';
}

export function rankPeople(items, context) {
  return stableRank(items, (person) => {
    const reasons = [];
    const shared = overlap(person.interests, context.interests);
    const languages = overlap(person.languages, context.languages);
    const tags = overlap(person.looking_for_tags, context.peopleTags);
    const location = locationReason(person, context);
    if (shared.length) reasons.push('shared explicit interests');
    if (tags.length) reasons.push('matches your saved people preferences');
    if (languages.length) reasons.push('matches your selected languages');
    if (location) reasons.push(location);
    return { score: shared.length * 12 + tags.length * 8 + languages.length * 5 + (location ? 4 : 0), reasons };
  }, context?.enabled);
}

function rankContent(items, context) {
  return stableRank(items, (item) => {
    const reasons = [];
    const itemTerms = [item.category, item.mood, ...(item.tags || []), ...(item.shared_interests || [])];
    const interests = overlap(itemTerms, context.interests);
    const actions = overlap(itemTerms, context.actionTags);
    const location = locationReason(item, context);
    if (interests.length) reasons.push('matches your explicit interests');
    if (actions.length) reasons.push('similar to things you explored in Nmood');
    if (location) reasons.push(location);
    const activity = Math.min(6, Number(item.member_count || item.attendee_count || item.spotsFilled) || 0) / 10;
    return { score: interests.length * 12 + actions.length * 6 + (location ? 4 : 0) + activity, reasons };
  }, context?.enabled);
}

export const rankCircles = rankContent;
export const rankExperiences = rankContent;

export function sanitizeRecommendationPreferences(input = {}) {
  const clean = cleanPreferences(input);
  return {
    enabled: clean.enabled,
    interests: clean.interests,
    languages: clean.languages,
    people_tags: clean.peopleTags,
    country: clean.country,
    city: clean.city,
    use_location: clean.useLocation,
  };
}
