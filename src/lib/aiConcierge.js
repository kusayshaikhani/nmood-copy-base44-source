// --- Partial-context helpers ----------------------------------------------
// The concierge is forgiving: any field the user leaves empty is simply
// treated as "no preference" and skipped — it never invalidates a match.
// When fewer signals are given, each active signal is weighted more heavily
// so a single-field query (e.g. only City) still produces a strong, clear
// ranking instead of a flat tie.

function activeFields(context = {}) {
  return {
    mood: Boolean(context.mood && String(context.mood).trim()),
    intent: Boolean(context.intent && String(context.intent).trim()),
    activity_style: Boolean(context.activity_style && String(context.activity_style).trim()),
    interests: Array.isArray(context.interests) && context.interests.length > 0,
    goal: Boolean(context.goal && String(context.goal).trim()),
    circles: Array.isArray(context.circles) && context.circles.length > 0,
    availability: Boolean(context.availability && String(context.availability).trim()),
    hasAge: (context.ageMin != null && !isNaN(context.ageMin)) || (context.ageMax != null && !isNaN(context.ageMax)),
    radius: context.radius != null && context.radius !== ""
    };
    }

function activeCount(active) {
  return Object.values(active).filter(Boolean).length;
}

// 1 active field → 2.2×, 2 fields → 1.6×, 3+ fields → 1×.
// Keeps relative ordering stable when the user is specific, while making a
// lone signal loud enough to dominate the ranking.
function focusMultiplier(count) {
  if (count <= 1) return 2.2;
  if (count === 2) return 1.6;
  return 1;
}

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// --- Filter → member-attribute mappings ----------------------------------
// The concierge filter model is built around Interests, Goal, Circles,
// Availability, and Age range. Goal/Circle/Availability don't exist as direct
// fields on Member, so each maps to the real attributes that DO exist
// (interests + lifestyle) — keeping recommendations grounded in real data
// while letting users express preferences in a premium, human vocabulary.
const GOAL_TO_INTERESTS = {
  "Be More Social": ["Coffee", "Food", "Networking"],
  "Stay Active": ["Sports", "Outdoors", "Wellness"],
  "Explore the City": ["Outdoors", "Photography", "Food"],
  "Meet Creative People": ["Art", "Music", "Photography"],
  "Grow Professionally": ["Networking", "Technology", "Learning"],
  "Learn Something New": ["Learning", "Art", "Technology"]
};

const CIRCLE_TO_INTERESTS = {
  "Mindful Mornings": ["Wellness", "Coffee"],
  "Creative Souls": ["Art", "Music"],
  "Coffee Connoisseurs": ["Coffee"],
  "Book Lovers": ["Learning"],
  "Padel Pros": ["Sports"],
  "Fitness Friends": ["Wellness", "Sports"],
  "Foodies Circle": ["Food"],
  "Wellness Circle": ["Wellness"],
  "Music Lovers": ["Music"],
  "Photography Club": ["Photography"],
  "Travelers": ["Outdoors", "Photography"],
  "AI Founders Circle": ["Technology", "Networking"]
};

const AVAILABILITY_TO_LIFESTYLE = {
  "Today, Morning": ["early_bird"],
  "Today, Afternoon": ["balanced"],
  "Today, Evening": ["night_owl", "social_butterfly"],
  "Tomorrow": ["balanced", "social_butterfly"],
  "This Weekend": ["social_butterfly", "adventurer"],
  "Weekday Evenings": ["night_owl"]
};

function computeAge(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export function scoreMember(member, context = {}) {
  const active = activeFields(context);
  const focus = focusMultiplier(activeCount(active));
  let score = 0;
  const reasons = [];

  if (active.interests) {
    const shared = (member.interests || []).filter(i => context.interests.includes(i));
    if (shared.length) {
      score += shared.length * 12 * focus;
      reasons.push(`shares your interest in ${shared.slice(0, 3).join(", ")}`);
    }
  }

  if (active.city && member.city && member.city === context.city) {
    score += 20 * focus;
    reasons.push("based in your city");
  }

  if (active.language && Array.isArray(member.languages) && member.languages.includes(context.language)) {
    score += 16 * focus;
    reasons.push(`speaks ${context.language}`);
  }

  if (active.mood && member.mood_tags?.includes(context.mood)) {
    score += 25 * focus;
    reasons.push(`matches your ${context.mood} mood`);
  }

  if (active.intent && member.intent_tags?.includes(context.intent)) {
    score += 18 * focus;
    reasons.push(`aligned with your ${context.intent} intention`);
  }

  if (active.activity_style && member.activity_style && member.activity_style === context.activity_style) {
    score += 10 * focus;
    reasons.push(`${context.activity_style} energy`);
  }

  // Goal — mapped to the interests that goal implies, so a goal preference
  // boosts members whose real interests align with that aspiration.
  if (active.goal) {
    const goalInterests = GOAL_TO_INTERESTS[context.goal] || [];
    if (goalInterests.length) {
      const shared = (member.interests || []).filter((i) => goalInterests.includes(i));
      if (shared.length) {
        score += 14 * focus;
        reasons.push(`aligned with "${context.goal}"`);
      }
    }
  }

  // Circles — each circle maps to interests; boost members who share them.
  if (active.circles) {
    const circleInterests = context.circles.flatMap((c) => CIRCLE_TO_INTERESTS[c] || []);
    if (circleInterests.length) {
      const shared = (member.interests || []).filter((i) => circleInterests.includes(i));
      if (shared.length) {
        score += 12 * focus;
        reasons.push("in circles you like");
      }
    }
  }

  // Availability — mapped to lifestyle, the real schedule signal on Member.
  if (active.availability) {
    const lifestyles = AVAILABILITY_TO_LIFESTYLE[context.availability] || [];
    if (lifestyles.length && member.lifestyle && lifestyles.includes(member.lifestyle)) {
      score += 10 * focus;
      reasons.push("free when you are");
    }
  }

  // Radius — soft proximity signal. Real coordinate filtering is coming;
  // today the member's city acts as a proxy when the user sets a radius.
  if (active.radius && context.userCity && member.city && member.city === context.userCity) {
    score += 10 * focus;
    reasons.push("nearby");
  }

  // Small constant trust tiebreaker — never enough to override a real match.
  if (member.is_verified) score += 4;

  return {
    ...member,
    ai_score: Math.round(score),
    ai_reason: reasons.length ? reasons.map(cap).join(" • ") : "good overall fit"
  };
}

export function scoreCircle(circle, context = {}) {
  const active = activeFields(context);
  const focus = focusMultiplier(activeCount(active));
  let score = 0;
  const reasons = [];

  if (active.interests) {
    const shared = (circle.tags || []).filter(tag => context.interests.includes(tag));
    if (shared.length) {
      score += shared.length * 14 * focus;
      reasons.push(`matches your interest in ${shared.slice(0, 3).join(", ")}`);
    }
  }

  if (active.city && circle.city && circle.city === context.city) {
    score += 18 * focus;
    reasons.push("active in your city");
  }

  if (active.mood && circle.mood_tags?.includes(context.mood)) {
    score += 20 * focus;
    reasons.push(`fits your ${context.mood} mood`);
  }

  if (active.intent && circle.intent_tags?.includes(context.intent)) {
    score += 12 * focus;
    reasons.push(`supports your ${context.intent} intention`);
  }

  return {
    ...circle,
    ai_score: Math.round(score),
    ai_reason: reasons.length ? reasons.map(cap).join(" • ") : "worth exploring"
  };
}

export function scoreExperience(experience, context = {}) {
  const active = activeFields(context);
  const focus = focusMultiplier(activeCount(active));
  let score = 0;
  const reasons = [];

  if (active.interests) {
    const shared = (experience.tags || []).filter(tag => context.interests.includes(tag));
    if (shared.length) {
      score += shared.length * 14 * focus;
      reasons.push(`matches your interest in ${shared.slice(0, 3).join(", ")}`);
    }
  }

  if (active.city && experience.city && experience.city === context.city) {
    score += 20 * focus;
    reasons.push("near you");
  }

  if (active.mood && experience.mood_tags?.includes(context.mood)) {
    score += 24 * focus;
    reasons.push(`fits your ${context.mood} mood today`);
  }

  if (active.intent && experience.intent_tags?.includes(context.intent)) {
    score += 14 * focus;
    reasons.push(`supports your ${context.intent} intention`);
  }

  if (active.activity_style && experience.activity_style && experience.activity_style === context.activity_style) {
    score += 8 * focus;
    reasons.push(`${context.activity_style} vibe`);
  }

  return {
    ...experience,
    ai_score: Math.round(score),
    ai_reason: reasons.length ? reasons.map(cap).join(" • ") : "recommended for you"
  };
}

export function runNmoodAI({ context, members = [], circles = [], experiences = [] }) {
  // Age range is a hard filter (not a soft score) — members outside the
  // selected range are excluded entirely. Members with no date of birth are
  // kept (age unknown shouldn't hide someone).
  let pool = members;
  if (activeFields(context).hasAge) {
    pool = members.filter((m) => {
      const age = computeAge(m.date_of_birth);
      if (age == null) return true;
      if (context.ageMin != null && age < context.ageMin) return false;
      if (context.ageMax != null && age > context.ageMax) return false;
      return true;
    });
  }

  const rankedMembers = pool
    .map(member => scoreMember(member, context))
    .sort((a, b) => b.ai_score - a.ai_score)
    .slice(0, 8);

  const rankedCircles = circles
    .map(circle => scoreCircle(circle, context))
    .sort((a, b) => b.ai_score - a.ai_score)
    .slice(0, 6);

  const rankedExperiences = experiences
    .map(experience => scoreExperience(experience, context))
    .sort((a, b) => b.ai_score - a.ai_score)
    .slice(0, 6);

  return {
    context,
    members: rankedMembers,
    circles: rankedCircles,
    experiences: rankedExperiences
  };
}

// Lightweight keyword-based prompt interpreter.
// Returns only the context fields it can confidently detect from the text;
// callers merge the patch into existing context so manual overrides persist
// and undetected fields fall back safely to their current values.
const MOOD_KEYWORDS = [
  { value: "calm", words: ["calm", "quiet", "peaceful", "relaxed", "soft", "coffee"] },
  { value: "social", words: ["social", "fun", "outgoing", "meetup"] },
  { value: "energetic", words: ["active", "workout", "sports", "energetic", "padel", "hiking"] },
  { value: "curious", words: ["curious", "explore", "discover", "try something new"] },
  { value: "reflective", words: ["reflective", "thoughtful", "deep", "meaningful"] },
  { value: "cozy", words: ["cozy", "intimate", "warm"] },
  { value: "adventurous", words: ["adventurous", "bold", "exciting"] }
];

const INTENT_KEYWORDS = [
  { value: "connection", words: ["meet people", "connect", "friendship", "conversation", "network", "founders", "career", "business", "date", "romance", "chemistry"] },
  { value: "fun", words: ["fun", "hangout", "casual"] },
  { value: "discovery", words: ["explore", "discover"] }
];

const ACTIVITY_STYLE_KEYWORDS = [
  { value: "low-pressure", words: ["chill", "quiet", "relaxed", "coffee"] },
  { value: "active", words: ["active", "sport", "movement", "energetic"] }
];

const INTEREST_KEYWORDS = [
  "coffee", "photography", "walking", "startups", "fitness", "hiking",
  "music", "food", "books", "art", "networking", "travel"
];

// Builds a short, emotionally intelligent concierge reply (1–2 sentences).
// The opener adapts to the interpreted mood (warm, upbeat, thoughtful…),
// and the closer shifts with the intent so the tone never feels mechanical.
export function buildConciergeResponse(ctx) {
  const mood = ctx?.mood || "";
  const intent = ctx?.intent || "";

  const openers = {
    calm: [
      "Sounds like a softer, slower kind of evening.",
      "You're after something gentle and grounding tonight."
    ],
    social: [
      "You're in the mood to be around people.",
      "A more social, easygoing energy is calling."
    ],
    energetic: [
      "You want to feel alive and in motion.",
      "An upbeat, high-energy kind of night is what you're after."
    ],
    curious: [
      "You're open to something a little new.",
      "A curious, exploratory mood is showing up tonight."
    ],
    reflective: [
      "You seem to be in a quieter, more thoughtful space.",
      "Something more meaningful and reflective is on your mind."
    ],
    cozy: [
      "You're craving warmth and closeness.",
      "A cozy, intimate kind of evening feels right."
    ],
    adventurous: [
      "You want to step outside the usual.",
      "A bolder, more adventurous energy is showing up."
    ]
  };

  const closers = {
    connection: "I've pulled together people and moments that match that energy.",
    fun: "Here are a few ways to find that spark tonight.",
    discovery: "These should open up something worth discovering.",
    growth: "These lean toward meaningful, growth-oriented moments.",
    belonging: "These are spaces where you might feel you belong.",
    rest: "These are gentle options to help you unwind."
  };

  const moodList = openers[mood] || openers.calm;
  const seed = (mood + intent).length;
  const opener = moodList[seed % moodList.length];
  const closer = closers[intent] || closers.connection;
  return `${opener} ${closer}`;
}

export function interpretPromptToContext(text) {
  const t = String(text || "").toLowerCase();
  if (!t.trim()) return {};
  const patch = {};

  const mood = MOOD_KEYWORDS.find((g) => g.words.some((w) => t.includes(w)));
  if (mood) patch.mood = mood.value;

  const intent = INTENT_KEYWORDS.find((g) => g.words.some((w) => t.includes(w)));
  if (intent) patch.intent = intent.value;

  const style = ACTIVITY_STYLE_KEYWORDS.find((g) => g.words.some((w) => t.includes(w)));
  if (style) patch.activity_style = style.value;

  const interests = INTEREST_KEYWORDS.filter((w) => t.includes(w));
  if (interests.length) {
    patch.interests = interests.map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  }

  return patch;
}