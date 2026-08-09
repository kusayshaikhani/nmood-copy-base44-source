// Concierge filter vocabulary — seeded defaults + dynamic builder.
//
// The seeded lists are intentional fallbacks so the filters always have
// sensible options tonight. buildConciergeFilterOptions() promotes real,
// frequency-sorted values from loaded data above the seeds, so the
// vocabulary evolves naturally as the community grows. No list here is
// meant to be permanently fixed — extend the seeds or replace with live
// data anytime without touching the UI.

// Aspirational / human-vocabulary seeds. Goals don't map 1:1 to a Member
// field today (they're interpreted via interests in the scoring engine),
// so they stay seeded until a life-goal signal exists on profiles.
export const CONCIERGE_FILTER_SEEDS = {
  interests: [
    'Coffee', 'Wellness', 'Photography', 'Sports', 'Food', 'Networking',
    'Learning', 'Art', 'Music', 'Outdoors', 'Gaming', 'Technology',
  ],
  goals: [
    'Be More Social', 'Stay Active', 'Explore the City',
    'Meet Creative People', 'Grow Professionally', 'Learn Something New',
  ],
  circles: [
    'Mindful Mornings', 'Creative Souls', 'Coffee Connoisseurs', 'Book Lovers',
    'Padel Pros', 'Fitness Friends', 'Foodies Circle', 'Wellness Circle',
    'Music Lovers', 'Photography Club', 'Travelers', 'AI Founders Circle',
  ],
  availability: [
    'Today, Morning', 'Today, Afternoon', 'Today, Evening',
    'Tomorrow', 'This Weekend', 'Weekday Evenings',
  ],
};

// Radius presets — proximity intent. Stored on the context so it can drive
// real geo filtering once member coordinates are available; today it acts as
// a soft city-level signal in the scoring engine.
export const RADIUS_PRESETS = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' },
];

const sortByFreq = (counts) =>
  [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v);

// Real (frequency-sorted) first, then any seeds not already present — so
// popular real values lead and the list never loses sensible coverage.
const mergeRealAndSeeds = (real, seeds) => {
  const realSet = new Set(real);
  return [...real, ...seeds.filter((s) => !realSet.has(s))];
};

/**
 * Build concierge filter options from real loaded data.
 * Real, frequency-sorted values are promoted above seeded fallbacks so the
 * filter vocabulary tracks the actual community. Returns the seeded lists
 * unchanged when no data is available, so the sheet is always usable.
 *
 * @param {object} args
 * @param {Array} args.members  Mapped member records (need `interests`, `search_availability`).
 * @param {Array} args.circles  Mapped circle records (need `name`).
 * @returns {{interests:string[], goals:string[], circles:string[], availability:string[], radius:Array}}
 */
export function buildConciergeFilterOptions({ members = [], circles = [] } = {}) {
  // Interests — from real member profiles, frequency-sorted.
  const interestCounts = new Map();
  members.forEach((m) => {
    (Array.isArray(m?.interests) ? m.interests : []).forEach((i) => {
      const v = String(i).trim();
      if (v) interestCounts.set(v, (interestCounts.get(v) || 0) + 1);
    });
  });

  // Circles — from real Circle entity names.
  const circleCounts = new Map();
  circles.forEach((c) => {
    const name = String(c?.name || '').trim();
    if (name) circleCounts.set(name, (circleCounts.get(name) || 0) + 1);
  });

  // Availability — from member.search_availability when present.
  const availCounts = new Map();
  members.forEach((m) => {
    (Array.isArray(m?.search_availability) ? m.search_availability : []).forEach((a) => {
      const v = String(a).trim();
      if (v) availCounts.set(v, (availCounts.get(v) || 0) + 1);
    });
  });

  return {
    interests: mergeRealAndSeeds(sortByFreq(interestCounts), CONCIERGE_FILTER_SEEDS.interests),
    goals: CONCIERGE_FILTER_SEEDS.goals,
    circles: mergeRealAndSeeds(sortByFreq(circleCounts), CONCIERGE_FILTER_SEEDS.circles),
    availability: mergeRealAndSeeds(sortByFreq(availCounts), CONCIERGE_FILTER_SEEDS.availability),
    radius: RADIUS_PRESETS,
  };
}