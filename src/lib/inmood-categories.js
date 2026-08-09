export const INMOOD_CATEGORIES = [
  { key: 'All', icon: '🌐' },
  { key: 'Coffee', icon: '☕' },
  { key: 'Food', icon: '🍽️' },
  { key: 'Outdoor', icon: '🏔️' },
  { key: 'Sports', icon: '🎾' },
  { key: 'Fitness', icon: '💪' },
  { key: 'Music', icon: '🎵' },
  { key: 'Art', icon: '🎨' },
  { key: 'Gaming', icon: '🎮' },
  { key: 'Travel', icon: '✈️' },
  { key: 'Networking', icon: '🤝' },
  { key: 'Beach', icon: '🏖️' },
  { key: 'Wellness', icon: '🧘' },
  { key: 'More', icon: '⋯' },
];

const CATEGORY_KEYWORDS = {
  'Coffee': ['coffee'],
  'Food': ['food', 'drink', 'brunch', 'dinner', 'lunch'],
  'Outdoor': ['outdoor', 'outdoors', 'nature', 'hiking', 'trail'],
  'Sports': ['sports', 'tennis', 'padel', 'football', 'cycling'],
  'Fitness': ['fitness', 'gym', 'workout'],
  'Music': ['music', 'jazz', 'concert', 'live'],
  'Art': ['art', 'arts', 'photography', 'museum', 'gallery'],
  'Gaming': ['gaming', 'games', 'esports'],
  'Travel': ['travel', 'road trip', 'trip'],
  'Networking': ['networking', 'business', 'professional'],
  'Beach': ['beach', 'sea', 'ocean', 'surf', 'paddle'],
  'Wellness': ['wellness', 'meditation', 'yoga', 'spa'],
};

export function matchesCategory(exp, category) {
  if (!category || category === 'All' || category === 'More') return true;
  const keys = CATEGORY_KEYWORDS[category];
  if (!keys) return true;
  const cat = (exp.category || '').toLowerCase();
  const tags = (exp.tags || []).map((t) => t.toLowerCase());
  const title = (exp.title || '').toLowerCase();
  return keys.some((k) => cat.includes(k) || tags.some((t) => t.includes(k)) || title.includes(k));
}

export function getCategoryIcon(exp) {
  const cat = (exp.category || '').toLowerCase();
  const match = INMOOD_CATEGORIES.find(
    (c) => c.key !== 'All' && c.key !== 'More' && cat.includes(c.key.toLowerCase().split(' ')[0])
  );
  return match?.icon || '✨';
}