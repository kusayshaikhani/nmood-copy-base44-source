/**
 * MP-006 — Shared label resolvers for Discovery & Search.
 * Maps dynamic data ids (interests, categories, filter options) to
 * localized strings via the centralized Localization Service.
 * Reuses onboarding.interest.* and discovery.category.* to avoid duplicates.
 */

export const ONBOARDING_INTEREST_IDS = new Set([
  'coffee', 'travel', 'fitness', 'walking', 'photography', 'technology',
  'business', 'movies', 'gaming', 'reading', 'cooking', 'networking',
  'art', 'music', 'nature', 'wellness',
]);

export const DISCOVERY_CATEGORY_IDS = new Set([
  'food', 'sports', 'learning', 'arts', 'outdoors',
]);

/**
 * Resolve a category / interest value (id or display string) to a label.
 * Falls back to the original value for unknown content.
 */
export function categoryLabel(t, value) {
  if (!value) return '';
  const lc = String(value).toLowerCase();
  if (ONBOARDING_INTEREST_IDS.has(lc)) return t('onboarding.interest.' + lc);
  if (DISCOVERY_CATEGORY_IDS.has(lc)) return t('discovery.category.' + lc);
  return String(value);
}

/**
 * Resolve a Search filter option (from search-data filterDefinitions) to a
 * label. Known UI options map to search.filter.option.*; interest options
 * reuse categoryLabel; unknown content falls back to the original.
 */
const SEARCH_OPTION_KEYS = {
  'Any': 'search.filter.option.any',
  'Today': 'search.filter.option.today',
  'Tomorrow': 'search.filter.option.tomorrow',
  'Weekend': 'search.filter.option.weekend',
  'Free': 'search.filter.option.free',
  'Paid': 'search.filter.option.paid',
  'Indoor': 'search.filter.option.indoor',
  'Outdoor': 'search.filter.option.outdoor',
  '< 1km': 'search.filter.option.lt1',
  '< 5km': 'search.filter.option.lt5',
  '< 10km': 'search.filter.option.lt10',
};

export function searchOptionLabel(t, opt) {
  if (opt == null) return '';
  const key = SEARCH_OPTION_KEYS[opt];
  if (key) return t(key);
  return categoryLabel(t, opt);
}

/**
 * MP-007 — Profile reference-data resolvers.
 * Maps gender / lifestyle enum values to localized labels via the centralized
 * Localization Service. Gender reuses onboarding.gender.*; lifestyle uses
 * profile.lifestyle.*. Unknown values fall back to the original string.
 */
export function genderLabel(t, value) {
  if (!value) return '';
  const lc = String(value).toLowerCase();
  return t('onboarding.gender.' + lc);
}

export function lifestyleLabel(t, value) {
  if (!value) return '';
  return t('profile.lifestyle.' + String(value));
}