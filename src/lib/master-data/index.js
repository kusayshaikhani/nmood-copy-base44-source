// Global Master Data Framework — single entry point.
// All modules across the platform import from here; never import a catalog module
// directly elsewhere. This guarantees a single source of truth and referential
// integrity for country / language / interest / experience / trait / goal keys.

import { COUNTRIES, COUNTRY_MAP, REGIONS, SUBREGIONS } from './countries';
import { LANGUAGES, LANGUAGE_MAP, RTL_LANGUAGES } from './languages';
import { INTERESTS, INTEREST_CATEGORIES, INTEREST_MAP } from './interests';
import { EXPERIENCE_TYPES, EXPERIENCE_TYPE_MAP } from './experience-types';
import { PERSONALITY_TRAITS, PERSONALITY_TRAIT_MAP } from './personality-traits';
import { LIFE_GOALS, LIFE_GOAL_MAP } from './life-goals';

export const MASTER_DATA = {
  countries: COUNTRIES,
  languages: LANGUAGES,
  interests: INTERESTS,
  experienceTypes: EXPERIENCE_TYPES,
  personalityTraits: PERSONALITY_TRAITS,
  lifeGoals: LIFE_GOALS,
};

const TYPES = {
  countries: COUNTRIES,
  languages: LANGUAGES,
  interests: INTERESTS,
  experienceTypes: EXPERIENCE_TYPES,
  personalityTraits: PERSONALITY_TRAITS,
  lifeGoals: LIFE_GOALS,
};

const MAPS = {
  countries: COUNTRY_MAP,
  languages: LANGUAGE_MAP,
  interests: INTEREST_MAP,
  experienceTypes: EXPERIENCE_TYPE_MAP,
  personalityTraits: PERSONALITY_TRAIT_MAP,
  lifeGoals: LIFE_GOAL_MAP,
};

// Canonical list for a master type, sorted alphabetically by label.
export function masterList(type, t) {
  const list = TYPES[type] || [];
  if (!t) return list;
  return [...list].sort((a, b) => masterLabel(type, a.key, t).localeCompare(masterLabel(type, b.key, t)));
}

// Resolve a single record by key.
export function masterItem(type, key) {
  return MAPS[type]?.[key] || null;
}

// Localizable label: prefers a translation key, falls back to the catalog label/native.
export function masterLabel(type, key, t) {
  if (t) {
    const tk = `master.${type}.${key}`;
    const tr = t(tk);
    if (tr && tr !== tk) return tr;
  }
  const it = masterItem(type, key);
  if (!it) return key;
  return it.label || it.name || key;
}

// Search any master catalog by name/native/key/ISO code (case-insensitive).
export function searchMaster(type, query) {
  const list = TYPES[type] || [];
  if (!query) return list;
  const q = String(query).toLowerCase().trim();
  return list.filter((it) => {
    const name = (it.name || it.label || '').toLowerCase();
    const native = (it.native || '').toLowerCase();
    const key = (it.key || '').toLowerCase();
    const iso2 = (it.iso2 || '').toLowerCase();
    const iso3 = (it.iso3 || '').toLowerCase();
    return name.includes(q) || native.includes(q) || key.includes(q) || iso2 === q || iso3 === q;
  });
}

// Country helpers
export const getCountry = (key) => COUNTRY_MAP[key] || null;
export const getLanguage = (key) => LANGUAGE_MAP[key] || null;
export const getInterest = (key) => INTEREST_MAP[key] || null;
export const getExperienceType = (key) => EXPERIENCE_TYPE_MAP[key] || null;
export const getPersonalityTrait = (key) => PERSONALITY_TRAIT_MAP[key] || null;
export const getLifeGoal = (key) => LIFE_GOAL_MAP[key] || null;
export const interestCategoryOf = (key) => INTEREST_MAP[key]?.category || null;

// Dialing-code options for phone inputs (flag + name + dialing).
export function dialingOptions() {
  return COUNTRIES.filter((c) => c.dialing).map((c) => ({
    key: c.key,
    label: `${c.flag} ${c.name} (${c.dialing})`,
    dialing: c.dialing,
    flag: c.flag,
    name: c.name,
  }));
}

// Regions / subregions for filters + raw catalog re-exports for direct use.
export {
  REGIONS, SUBREGIONS, RTL_LANGUAGES, INTEREST_CATEGORIES,
  COUNTRIES, LANGUAGES, INTERESTS, EXPERIENCE_TYPES, PERSONALITY_TRAITS, LIFE_GOALS,
};

export default MASTER_DATA;