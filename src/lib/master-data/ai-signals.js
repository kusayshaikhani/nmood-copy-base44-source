// AI Integration — structured signals from the master datasets.
// Builds a normalized, key-resolved signal object for a member so AI matching,
// discovery, and recommendations analyze structured data rather than free text.

import {
  getCountry, getLanguage, getInterest, getExperienceType,
  getPersonalityTrait, getLifeGoal, interestCategoryOf,
} from './index';

function resolveArr(keys, resolver) {
  if (!Array.isArray(keys)) return [];
  return keys
    .map((k) => resolver(k))
    .filter(Boolean);
}

// Build structured, locale-agnostic signals for AI / matching.
export function buildMemberSignals(member, profile) {
  const m = member || {};
  const p = profile || {};

  const country = m.country ? { key: m.country, ...getCountry(m.country) } : null;
  const languages = resolveArr(m.languages || p.languages, (k) => {
    const l = getLanguage(k);
    return l ? { key: k, name: l.name, native: l.native, direction: l.direction } : null;
  });
  const interests = resolveArr(m.interests || p.interests, (k) => {
    const i = getInterest(k);
    return i ? { key: k, label: i.label, category: i.category } : null;
  });
  const experienceTypes = resolveArr(p.experience_types, (k) => {
    const e = getExperienceType(k);
    return e ? { key: k, label: e.label } : null;
  });
  const personalityTraits = resolveArr(p.personality_traits, (k) => {
    const t = getPersonalityTrait(k);
    return t ? { key: k, label: t.label } : null;
  });
  const lifeGoals = resolveArr(p.life_goals, (k) => {
    const g = getLifeGoal(k);
    return g ? { key: k, label: g.label } : null;
  });

  return {
    country: country ? { key: country.key, name: country.name, region: country.region, subregion: country.subregion, currency: country.currency } : null,
    languages,
    interests,
    interest_categories: [...new Set(interests.map((i) => i.category))],
    experience_types: experienceTypes,
    personality_traits: personalityTraits,
    life_goals: lifeGoals,
    // Lightweight compatibility vector signature for matching (sorted key strings).
    signature: [
      country?.key || '',
      ...languages.map((l) => `lang:${l.key}`),
      ...interests.map((i) => `int:${i.key}`),
      ...experienceTypes.map((e) => `exp:${e.key}`),
      ...personalityTraits.map((t) => `trait:${t.key}`),
      ...lifeGoals.map((g) => `goal:${g.key}`),
    ].sort().join('|'),
  };
}

// Overlap score (0-100) between two member signal objects — used by matching.
export function compatibilityScore(signalsA, signalsB) {
  if (!signalsA || !signalsB) return 0;
  const set = (arr, prefix) => new Set((arr || []).map((x) => `${prefix}:${x.key}`));
  const aLang = set(signalsA.languages, 'lang'), bLang = set(signalsB.languages, 'lang');
  const aInt = set(signalsA.interests, 'int'), bInt = set(signalsB.interests, 'int');
  const aExp = set(signalsA.experience_types, 'exp'), bExp = set(signalsB.experience_types, 'exp');
  const aTrait = set(signalsA.personality_traits, 'trait'), bTrait = set(signalsB.personality_traits, 'trait');
  const aGoal = set(signalsA.life_goals, 'goal'), bGoal = set(signalsB.life_goals, 'goal');

  const overlap = (x, y) => { if (!x.size || !y.size) return 0; let n = 0; x.forEach((v) => { if (y.has(v)) n++; }); return (2 * n) / (x.size + y.size); };

  const sameCountry = signalsA.country?.key && signalsA.country.key === signalsB.country?.key ? 1 : 0;

  const score =
    overlap(aLang, bLang) * 0.20 +
    overlap(aInt, bInt) * 0.35 +
    overlap(aExp, bExp) * 0.15 +
    overlap(aTrait, bTrait) * 0.15 +
    overlap(aGoal, bGoal) * 0.10 +
    sameCountry * 0.05;

  return Math.round(score * 100);
}