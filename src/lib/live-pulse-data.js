// Live Pulse — anonymous aggregated trends. No private identities revealed.

const moodCategories = [
  { key: 'coffee', label: 'Coffee', emoji: '☕', count: 42, trend: 'up' },
  { key: 'networking', label: 'Networking', emoji: '👥', count: 28, trend: 'up' },
  { key: 'sports', label: 'Sports', emoji: '⚽', count: 35, trend: 'up' },
  { key: 'learning', label: 'Learning', emoji: '📚', count: 19, trend: 'steady' },
  { key: 'food', label: 'Food', emoji: '🍽️', count: 31, trend: 'up' },
];

const cityTrendTabs = [
  { key: 'tonight', label: 'Tonight' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'weekend', label: 'This Weekend' },
  { key: 'near', label: 'Near You' },
];

const cityTrendData = {
  tonight: [
    { label: 'Coffee meetups', count: 12, type: 'experience' },
    { label: 'Padel games', count: 8, type: 'experience' },
    { label: 'Board game nights', count: 5, type: 'experience' },
    { label: 'Live music', count: 3, type: 'experience' },
  ],
  tomorrow: [
    { label: 'Morning yoga', count: 15, type: 'experience' },
    { label: 'Business breakfasts', count: 9, type: 'experience' },
    { label: 'Photography walks', count: 6, type: 'experience' },
  ],
  weekend: [
    { label: 'Beach volleyball', count: 20, type: 'experience' },
    { label: 'Sunset walks', count: 14, type: 'experience' },
    { label: 'Creative workshops', count: 7, type: 'experience' },
  ],
  near: [
    { label: 'Coffee within 2km', count: 18, type: 'experience' },
    { label: 'Fitness within 2km', count: 11, type: 'experience' },
    { label: 'Social within 2km', count: 9, type: 'experience' },
  ],
};

const areas = [
  { name: 'Dubai Marina', experiences: 24, communities: 5, circles: 8 },
  { name: 'Business Bay', experiences: 18, communities: 4, circles: 6 },
  { name: 'Downtown', experiences: 31, communities: 7, circles: 10 },
  { name: 'JVC', experiences: 9, communities: 2, circles: 3 },
  { name: 'JLT', experiences: 15, communities: 3, circles: 5 },
  { name: 'Palm Jumeirah', experiences: 12, communities: 3, circles: 4 },
];

const popularNow = [
  { key: 'most_joined', value: 'Sunrise Coffee at Kite Beach', subKey: 'joined_today', subCount: 14, icon: '🔥' },
  { key: 'fastest_circle', value: 'AI Founders Circle', subKey: 'members_week', subCount: 3, icon: '📈' },
  { key: 'fastest_community', value: 'AI Dubai', subKey: 'members_month', subCount: 45, icon: '🚀' },
  { key: 'newest_host', value: 'A new host in Downtown', subKey: 'just_started', icon: '✨' },
];

const liveActivity = [
  { key: 'coffee_count', count: 42, moodKey: 'coffee' },
  { key: 'joined_today', count: 34 },
  { key: 'pals_today', count: 12 },
  { key: 'starting_soon', count: 7 },
];

const smartDiscoveryReasons = [
  'Similar interests',
  'Same Community',
  'Same Circle',
  'Your Pals joined',
  'Matches your goals',
];

const localRanges = [
  { label: 'Within 2 km', count: 8 },
  { label: 'Within 5 km', count: 19 },
  { label: 'Within 10 km', count: 31 },
];

export {
  moodCategories,
  cityTrendTabs,
  cityTrendData,
  areas,
  popularNow,
  liveActivity,
  smartDiscoveryReasons,
  localRanges,
};