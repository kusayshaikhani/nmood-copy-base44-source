import { base44 } from '@/api/base44Client';
import { fetchDiscoverableMembers } from '@/lib/member-update';
import { resolveMemberNames } from '@/lib/member-names';
import { isDemoMember } from '@/lib/demo-members';
import { resolveMemberPhoto } from '@/lib/member-photo';
import { resolveDisplayName, MEMBER_NAME_FALLBACK } from '@/lib/member-display';
import { CITY_NAMES } from '@/lib/master-data/cities';
import { LANGUAGE_MAP } from '@/lib/master-data/languages';

/**
 * RC-004A/HIGH-1 — Matchmaker engine backed by real Member entities.
 * The hardcoded demo pool has been removed. Recommendations are now fetched
 * from the Member entity with full exclusion of blocked, suspended, deleted,
 * hidden, and private profiles. The compatibility scoring algorithm
 * (calculateMatch), recommendation reasons, sorting, and filters are
 * preserved exactly — only the data source changed.
 */

// Broad, production-minded language subset derived from the master language
// dataset (ISO 639-1). Covers GCC, South Asian, European, East Asian, and
// African diaspora communities — extend FILTER_LANGUAGE_KEYS to add more.
const FILTER_LANGUAGE_KEYS = [
  'en', 'ar', 'hi', 'ur', 'fa', 'tr', 'fr', 'de', 'es', 'it', 'pt', 'ru',
  'zh', 'ja', 'ko', 'id', 'ms', 'tl', 'bn', 'ta', 'te', 'mr', 'pa', 'gu',
  'sw', 'nl', 'pl', 'uk', 'el', 'he', 'th', 'vi',
];
const FILTER_LANGUAGES = FILTER_LANGUAGE_KEYS
  .map((k) => LANGUAGE_MAP[k]?.name)
  .filter(Boolean);

// Reverse lookup: display name ("English") → ISO code ("en"). The Member
// entity stores ISO codes in `languages`, but search_preferences stores
// display names — the filter must normalize both to ISO codes to match.
const LANGUAGE_NAME_TO_CODE = {};
for (const [code, val] of Object.entries(LANGUAGE_MAP)) {
  if (val?.name) LANGUAGE_NAME_TO_CODE[val.name.toLowerCase()] = code;
}
function normalizeLanguageCode(value) {
  if (!value) return '';
  const v = String(value).toLowerCase();
  if (LANGUAGE_MAP[v]) return v; // already an ISO code
  return LANGUAGE_NAME_TO_CODE[v] || v; // display name → ISO code, or pass through
}

export const filterOptions = {
  interests: ['Coffee', 'Wellness', 'Photography', 'Sports', 'Food', 'Networking', 'Learning', 'Art', 'Music', 'Outdoors', 'Gaming', 'Technology'],
  goals: ['Be More Social', 'Stay Active', 'Explore the City', 'Meet Creative People', 'Grow Professionally', 'Learn Something New'],
  // Single, consolidated circle section — deduped, region-agnostic, and
  // curated for a premium feel. The previous separate "communities" list
  // (Dubai-prefixed demo names that overlapped this one) was removed to
  // eliminate the duplicate grouping.
  circles: [
    'Mindful Mornings', 'Creative Souls', 'Coffee Connoisseurs', 'Book Lovers',
    'Padel Pros', 'Fitness Friends', 'Foodies Circle', 'Wellness Circle',
    'Music Lovers', 'Photography Club', 'Travelers', 'AI Founders Circle',
  ],
  cities: CITY_NAMES,
  languages: FILTER_LANGUAGES,
  availability: ['Today, Morning', 'Today, Afternoon', 'Today, Evening', 'Tomorrow', 'This Weekend', 'Weekday Evenings'],
};

// Build dynamic city & language filter options from real member data.
// Cities/languages actually present in the loaded members are listed first
// (by frequency), then the seeded master lists fill in the rest as a
// fallback so the filters always have sensible options. Returns null when
// no members are available, letting callers fall back to the static
// filterOptions.
export function buildDynamicFilterOptions(members = []) {
  if (!Array.isArray(members) || members.length === 0) return null;
  const cityCounts = new Map();
  const langCounts = new Map();
  members.forEach((m) => {
    const city = String(m?.city || m?.location || '').trim();
    if (city) cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
    (Array.isArray(m?.languages) ? m.languages : []).forEach((l) => {
      const name = LANGUAGE_MAP[l]?.name || l;
      if (name) langCounts.set(name, (langCounts.get(name) || 0) + 1);
    });
  });
  const realCities = [...cityCounts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  const realLangs = [...langCounts.entries()].sort((a, b) => b[1] - a[1]).map(([l]) => l);
  const seededCities = CITY_NAMES.filter((c) => !cityCounts.has(c));
  const seededLangs = FILTER_LANGUAGES.filter((l) => !langCounts.has(l));
  const lookingForCounts = new Map();
  const zodiacCounts = new Map();
  members.forEach((m) => {
    (Array.isArray(m?.looking_for_tags) ? m.looking_for_tags : []).forEach((tag) => {
      lookingForCounts.set(tag, (lookingForCounts.get(tag) || 0) + 1);
    });
    if (m?.zodiac) {
      zodiacCounts.set(m.zodiac, (zodiacCounts.get(m.zodiac) || 0) + 1);
    }
  });
  return {
    cities: [...realCities, ...seededCities],
    languages: [...realLangs, ...seededLangs],
    looking_for: [...lookingForCounts.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag),
    zodiac: [...zodiacCounts.entries()].sort((a, b) => b[1] - a[1]).map(([sign]) => sign),
  };
}

export const privacyDefaults = {
  peopleRecommendations: true,
  discoveryVisibility: true,
  locationMatching: true,
  languageMatching: true,
};

/**
 * Calculate match score and generate "why" reasons for a member.
 * Preserved exactly from RC-002A — algorithm unchanged.
 */
export function calculateMatch(member, user, privacy = privacyDefaults) {
  const reasons = [];
  let score = 0;

  const sharedInterests = member.interests.filter(i => user.interests.includes(i));
  if (sharedInterests.length > 0) {
    score += Math.min(sharedInterests.length * 10, 30);
    if (sharedInterests.length === 1) {
      reasons.push({ key: 'match.reason.interests_single', params: { item: sharedInterests[0] } });
    } else {
      reasons.push({ key: 'match.reason.interests_multi', params: { items: sharedInterests.slice(0, -1).join(', '), last: sharedInterests[sharedInterests.length - 1] } });
    }
  }

  const sharedGoals = member.goals.filter(g => user.goals.includes(g));
  if (sharedGoals.length > 0) {
    score += Math.min(sharedGoals.length * 12, 24);
    reasons.push({ key: 'match.reason.goal', params: { goal: sharedGoals[0] } });
  }

  const sharedCommunities = member.communities.filter(c => user.communities.includes(c));
  if (sharedCommunities.length > 0) {
    score += Math.min(sharedCommunities.length * 15, 30);
    reasons.push({ key: 'match.reason.community', params: { community: sharedCommunities[0] } });
  }

  const sharedCircles = member.circles.filter(c => user.circles.includes(c));
  if (sharedCircles.length > 0) {
    score += Math.min(sharedCircles.length * 15, 30);
    reasons.push({ key: 'match.reason.circle', params: { circle: sharedCircles[0] } });
  }

  if (privacy.languageMatching) {
    const sharedLanguages = member.languages.filter(l => user.languages.includes(l));
    if (sharedLanguages.length > 0) {
      score += Math.min(sharedLanguages.length * 8, 16);
      if (sharedLanguages.length === 1) {
        reasons.push({ key: 'match.reason.language_single', params: { language: sharedLanguages[0] } });
      } else {
        reasons.push({ key: 'match.reason.language_multi', params: { languages: sharedLanguages.slice(0, -1).join(' / '), last: sharedLanguages[sharedLanguages.length - 1] } });
      }
    }
  }

  if (privacy.locationMatching) {
    if (member.city && user.city && member.city === user.city) {
      score += 10;
      reasons.push({ key: 'match.reason.city', params: { city: member.city } });
    }
  }

  const sharedAvailability = member.availability.filter(a =>
    user.availability.some(ua => ua.includes(a.split(',')[0]) || a.includes(ua.split(',')[0]))
  );
  if (sharedAvailability.length > 0) {
    score += 8;
    const avail = sharedAvailability[0];
    if (avail.includes('Weekend')) {
      reasons.push({ key: 'match.reason.weekend', params: {} });
    } else if (avail.includes('Today')) {
      reasons.push({ key: 'match.reason.free_today', params: { when: avail.toLowerCase() } });
    } else {
      reasons.push({ key: 'match.reason.schedule_overlap', params: { when: avail } });
    }
  }

  const sharedPrefs = member.experiencePreferences.filter(p => user.experiencePreferences.includes(p));
  if (sharedPrefs.length > 0) {
    score += Math.min(sharedPrefs.length * 5, 10);
    reasons.push({ key: 'match.reason.preferences', params: { prefs: sharedPrefs.slice(0, 2).join(' / ') } });
  }

  if (member.hostedExperiences > 20 && user.goals.includes('Grow Professionally')) {
    score += 5;
    reasons.push({ key: 'match.reason.networking', params: {} });
  }

  if (member.currentInMood) {
    const moodCategory = member.interests[0];
    if (moodCategory && user.interests.includes(moodCategory)) {
      score += 5;
      reasons.push({ key: 'match.reason.mood_align', params: {} });
    }
  }

  return {
    score: Math.min(score, 99),
    reasons: reasons.slice(0, 5),
    sharedInterests,
    sharedCommunities,
    sharedCircles,
    sharedLanguages: privacy.languageMatching ? member.languages.filter(l => user.languages.includes(l)) : [],
  };
}

/**
 * Map a real Member entity to the profile shape calculateMatch expects.
 * Respects age visibility (show_age) and privacy settings.
 */
export function mapMemberToProfile(m) {
  if (!m) return null;
  let age = null;
  if (m.show_age && m.date_of_birth) {
    const dob = new Date(m.date_of_birth);
    if (!isNaN(dob.getTime())) {
      const diff = Date.now() - dob.getTime();
      age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    }
  }
  return {
    id: m.id,
    user_id: m.created_by_id,
    created_date: m.created_date || null,
    name: resolveDisplayName(m) || MEMBER_NAME_FALLBACK,
    age,
    avatar: resolveMemberPhoto(m),
    city: m.city || '',
    distance: '',
    interests: m.interests || [],
    // Lifestyle maps to experiencePreferences — what type of social settings they prefer
    experiencePreferences: m.lifestyle ? [m.lifestyle] : [],
    languages: m.languages || [],
    // goals, communities, circles are not stored on the Member entity directly;
    // LifeGoal, CircleMembership, Community are separate entities. We leave these
    // empty here — they are populated by callers who fetch those entities separately.
    goals: [],
    communities: [],
    circles: [],
    // availability derived from lifestyle where possible
    availability: [],
    currentInMood: null,
    hostedExperiences: 0,
    joinedExperiences: 0,
    verified: false,
    isHidden: m.profile_visibility === 'private',
    isPal: false,
    is_demo: isDemoMember(m.email),
    bio: m.bio || '',
    looking_for_tags: m.looking_for_tags || [],
    zodiac: m.zodiac || '',
  };
}

/**
 * Fetch real Member recommendations from the database.
 * Excludes: current user, blocked, suspended, deleted, banned, private profiles,
 * and existing pals. Preserves the scoring algorithm, filters, and sorting.
 *
 * @param {object} user — buildMatchProfile result for the current user
 * @param {object} filters — filter criteria (interest, goal, city, language, etc.)
 * @param {object} privacy — privacy settings (privacyDefaults)
 * @param {object} exclusions — { currentUserId, blockedIds: [], palIds: [] }
 */
export async function fetchRecommendations(user, filters = {}, privacy = privacyDefaults, exclusions = {}) {
  if (!user) return [];
  // A user with no interests can still discover people — they just won't get
  // interest-based scoring boosts. Returning empty here hid every eligible
  // member (including imported demo members) for users who skipped onboarding.
  if (!privacy.peopleRecommendations) return [];

  const { currentUserId, currentUserEmail, blockedIds = [], palIds = [] } = exclusions;
  const blockedSet = new Set((blockedIds || []).map(String));
  const palSet = new Set((palIds || []).map(String));
  const selfEmail = currentUserEmail ? String(currentUserEmail).toLowerCase() : '';

  let members;
  try {
    // AGE-001 — Use the backend discoverMembers action, which filters at the
    // query level: excludes ineligible (no DOB, under 18), suspended, deleted,
    // not-onboarded, and private members. Client-side filtering below is a
    // secondary safeguard for blocks/pals only.
    members = await fetchDiscoverableMembers(100);
  } catch {
    return [];
  }

  if (!members || members.length === 0) return [];

  const eligible = members.filter(m => {
    const mUserId = m.created_by_id || m.user_id;
    // Exclude current user (the backend already excludes the viewer, but this
    // is a harmless secondary safeguard).
    if (currentUserId && (String(m.id) === String(currentUserId) || String(mUserId) === String(currentUserId))) return false;
    // Exclude blocked members
    if (blockedSet.has(String(m.id)) || blockedSet.has(String(mUserId))) return false;
    // Exclude existing pals
    if (palSet.has(String(m.id)) || palSet.has(String(mUserId))) return false;
    // Require only a display name so the card has a label. Demo/seed members
    // with photos but incomplete profile fields are intentionally kept —
    // their canonical records are populated separately so profile pages
    // render meaningful content for Premium viewers.
    if (!m.display_name) return false;

    const profile = mapMemberToProfile(m);
    if (!profile) return false;

    // Apply filters (preserved from RC-002A)
    if (filters.interest && !profile.interests.includes(filters.interest)) return false;
    if (filters.goal && !profile.goals.includes(filters.goal)) return false;
    if (filters.community && !profile.communities.includes(filters.community)) return false;
    if (filters.circle && !profile.circles.includes(filters.circle)) return false;
    if (filters.city && profile.city !== filters.city) return false;
    // Country filter (from Search preferences → discovery_scope 'same_country').
    // Lenient: members with no country set are kept so the pref never hides
    // everyone when country data is sparse.
    if (filters.country && (m.country || '').trim() && String(m.country).toLowerCase() !== String(filters.country).toLowerCase()) return false;
    if (filters.language) {
      // filters.language may be a display name ("English") or ISO code ("en");
      // profile.languages stores ISO codes. Normalize before comparing.
      const filterCode = normalizeLanguageCode(filters.language);
      if (!filterCode || !profile.languages.some(l => normalizeLanguageCode(l) === filterCode)) return false;
    }
    // Multi-select array filters (OR within group, AND between groups).
    // Lenient: members who haven't set the field pass the filter, so
    // empty/new users remain eligible.
    if (filters.interests?.length && (profile.interests || []).length > 0) {
      if (!filters.interests.some((i) => profile.interests.includes(i))) return false;
    }
    if (filters.looking_for?.length && (m.looking_for_tags || []).length > 0) {
      if (!filters.looking_for.some((tag) => (m.looking_for_tags || []).includes(tag))) return false;
    }
    if (filters.zodiac?.length && m.zodiac) {
      if (!filters.zodiac.includes(m.zodiac)) return false;
    }
    if (filters.languages?.length && (profile.languages || []).length > 0) {
      const memberCodes = profile.languages.map(normalizeLanguageCode);
      if (!filters.languages.some((l) => memberCodes.includes(normalizeLanguageCode(l)))) return false;
    }
    if (filters.goals?.length && (profile.goals || []).length > 0) {
      if (!filters.goals.some((g) => profile.goals.includes(g))) return false;
    }
    if (filters.circles?.length && (profile.circles || []).length > 0) {
      if (!filters.circles.some((c) => profile.circles.includes(c))) return false;
    }

    if (filters.availability && !profile.availability.includes(filters.availability)) return false;
    if (filters.ageMin && profile.age != null && profile.age < filters.ageMin) return false;
    if (filters.ageMax && profile.age != null && profile.age > filters.ageMax) return false;

    return true;
  });

  // Deduplicate by email — imported demo data creates multiple Member
  // records for the same person (one with a generated photo, one without).
  // Sort by photo first (so the photo-bearing record is kept), then filter.
  const sortedForDedup = [...eligible].sort((a, b) => {
    const aPhoto = a.photo_url ? 0 : 1;
    const bPhoto = b.photo_url ? 0 : 1;
    if (aPhoto !== bPhoto) return aPhoto - bPhoto;
    return new Date(a.created_date || 0).getTime() - new Date(b.created_date || 0).getTime();
  });
  const seenEmails = new Set();
  const deduped = sortedForDedup.filter(m => {
    if (!m.email) return true; // keep records without email (can't dedupe)
    if (seenEmails.has(m.email)) return false;
    seenEmails.add(m.email);
    return true;
  });

  const profiles = deduped.map(m => {
    const profile = mapMemberToProfile(m);
    return { ...profile, ...calculateMatch(profile, user, privacy) };
  });
  // Gate every other member's name by the viewer's server-verified
  // subscription. Non-subscribers (and members without a complete name)
  // receive "Member"; subscribers receive the real "First Last".
  const userIds = profiles.map(p => p.user_id).filter(Boolean);
  const names = await resolveMemberNames({ userIds });
  return profiles
    .map(p => ({ ...p, name: p.is_demo ? p.name : (names[p.user_id] || p.name || MEMBER_NAME_FALLBACK) }))
    // Keep all eligible members — score only controls ranking order, so
    // members with no shared interests (e.g. imported demo members) still
    // appear in discovery, ranked below stronger matches.
    .sort((a, b) => b.score - a.score);
}

export async function fetchTopRecommendations(user, limit = 4, exclusions = {}) {
  const recs = await fetchRecommendations(user, {}, privacyDefaults, exclusions);
  return recs.slice(0, limit);
}

/**
 * RC-002A/BUG-006 — Build a match profile from the authenticated Member entity.
 * Preserved exactly — maps onboarding data into the shape calculateMatch expects.
 */
export function buildMatchProfile(member) {
  if (!member) return null;
  return {
    id: 0,
    name: member.display_name || 'You',
    city: member.city || '',
    interests: member.interests || [],
    languages: member.languages || [],
    experiencePreferences: member.lifestyle ? [member.lifestyle] : [],
    // goals, communities, circles populated by callers that have fetched those entities
    goals: [],
    communities: [],
    circles: [],
    availability: [],
  };
}