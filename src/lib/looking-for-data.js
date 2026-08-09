const avatars = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
  'https://images.unsplash.com/photo-1534528741775-5386540e6de1?w=200',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
  'https://images.unsplash.com/photo-1489889930646-618fc5c8e382?w=200',
];

export const intentionTemplates = [
  { icon: '☕', category: 'Coffee', label: 'Coffee Buddy', placeholder: 'Looking for someone to grab a coffee this afternoon.' },
  { icon: '🎾', category: 'Sports', label: 'Padel Partner', placeholder: 'Looking for a Padel partner.' },
  { icon: '📚', category: 'Study', label: 'Study Buddy', placeholder: 'Looking for a study buddy.' },
  { icon: '💼', category: 'Networking', label: 'Brainstorm Partner', placeholder: 'Looking for entrepreneurs to brainstorm.' },
  { icon: '🍣', category: 'Food', label: 'Foodie Friend', placeholder: 'Looking for people to try a new restaurant.' },
  { icon: '🏃', category: 'Fitness', label: 'Running Partner', placeholder: 'Looking for a running partner.' },
  { icon: '📸', category: 'Photography', label: 'Photographer', placeholder: 'Looking for photographers this weekend.' },
  { icon: '🎮', category: 'Gaming', label: 'Game Buddy', placeholder: 'Looking for a board game buddy.' },
  { icon: '🧘', category: 'Wellness', label: 'Yoga Partner', placeholder: 'Looking for a yoga partner.' },
  { icon: '🚶', category: 'Outdoors', label: 'Walking Companion', placeholder: 'Looking for a walking companion.' },
  { icon: '🎵', category: 'Music', label: 'Music Buddy', placeholder: 'Looking for live music buddies.' },
  { icon: '🏖️', category: 'Outdoors', label: 'Beach Buddy', placeholder: 'Looking for beach activity partners.' },
];

export const visibilityOptions = [
  { value: 'public', label: 'Public', icon: '🌍', description: 'Anyone nearby can see and respond.' },
  { value: 'community', label: 'Community Only', icon: '🏘️', description: 'Only members of your communities.' },
  { value: 'circle', label: 'Circle Only', icon: '⭕', description: 'Only members of your circles.' },
  { value: 'pals', label: 'Pals Only', icon: '🤝', description: 'Only your existing pals.' },
  { value: 'private_invite', label: 'Private Invite', icon: '🔒', description: 'Only people you invite.' },
];

export const durationOptions = [
  { value: 'today', label: 'Today', icon: '☀️', hours: 8 },
  { value: 'tomorrow', label: 'Tomorrow', icon: '📅', hours: 32 },
  { value: 'this_weekend', label: 'This Weekend', icon: '🎉', hours: 72 },
  { value: 'custom', label: 'Custom Date', icon: '🗓️', hours: 168 },
];

export const lookingForPosts = [
  {
    id: 1,
    intention_text: 'Looking for someone to grab a coffee this afternoon in Jumeirah.',
    intention_icon: '☕',
    category: 'Coffee',
    visibility: 'public',
    visibility_label: 'Public',
    duration: 'today',
    expires_at: 'Today, 6:00 PM',
    status: 'active',
    member_name: 'Layla Ahmed',
    member_avatar: avatars[0],
    member_city: 'Dubai',
    member_interests: ['Coffee', 'Wellness', 'Photography'],
    interested_count: 3,
    maybe_count: 1,
    message_count: 2,
    muted: false,
    distance: '1.2 km',
  },
  {
    id: 2,
    intention_text: 'Looking for a Padel partner for an evening match this week.',
    intention_icon: '🎾',
    category: 'Sports',
    visibility: 'community',
    visibility_label: 'Dubai Padel Community',
    duration: 'this_weekend',
    expires_at: 'Sat, 8:00 PM',
    status: 'active',
    member_name: 'Omar Khalid',
    member_avatar: avatars[3],
    member_city: 'Dubai',
    member_interests: ['Sports', 'Gaming', 'Food'],
    interested_count: 5,
    maybe_count: 2,
    message_count: 3,
    muted: false,
    distance: '3.5 km',
  },
  {
    id: 3,
    intention_text: 'Looking for a study buddy for Python and data science. Weekday evenings.',
    intention_icon: '📚',
    category: 'Study',
    visibility: 'pals',
    visibility_label: 'Pals Only',
    duration: 'tomorrow',
    expires_at: 'Tomorrow, 9:00 PM',
    status: 'active',
    member_name: 'Noor Hassan',
    member_avatar: avatars[5],
    member_city: 'Sharjah',
    member_interests: ['Learning', 'Photography', 'Walking'],
    interested_count: 1,
    maybe_count: 0,
    message_count: 0,
    muted: false,
    distance: '0.9 km',
  },
  {
    id: 4,
    intention_text: 'Looking for entrepreneurs to brainstorm a startup idea over brunch.',
    intention_icon: '💼',
    category: 'Networking',
    visibility: 'community',
    visibility_label: 'Dubai Entrepreneurs',
    duration: 'this_weekend',
    expires_at: 'Sat, 12:00 PM',
    status: 'active',
    member_name: 'Khalid Al-Rashid',
    member_avatar: avatars[4],
    member_city: 'Dubai',
    member_interests: ['Food', 'Networking', 'Music'],
    interested_count: 8,
    maybe_count: 3,
    message_count: 5,
    muted: false,
    distance: '3.5 km',
  },
  {
    id: 5,
    intention_text: 'Looking for people to try that new Japanese fusion spot in DIFC.',
    intention_icon: '🍣',
    category: 'Food',
    visibility: 'circle',
    visibility_label: 'Foodies Circle',
    duration: 'tomorrow',
    expires_at: 'Tomorrow, 8:00 PM',
    status: 'active',
    member_name: 'Sara Mansour',
    member_avatar: avatars[2],
    member_city: 'Dubai',
    member_interests: ['Photography', 'Art', 'Food'],
    interested_count: 4,
    maybe_count: 1,
    message_count: 2,
    muted: false,
    distance: '2.0 km',
  },
  {
    id: 6,
    intention_text: 'Looking for a running partner for early morning runs along the Marina.',
    intention_icon: '🏃',
    category: 'Fitness',
    visibility: 'public',
    visibility_label: 'Public',
    duration: 'today',
    expires_at: 'Today, 7:00 AM',
    status: 'active',
    member_name: 'Priya Nair',
    member_avatar: avatars[0],
    member_city: 'Dubai',
    member_interests: ['Wellness', 'Yoga', 'Meditation'],
    interested_count: 2,
    maybe_count: 0,
    message_count: 1,
    muted: false,
    distance: '2.0 km',
  },
  {
    id: 7,
    intention_text: 'Looking for photographers this weekend for a golden hour shoot at Al Seef.',
    intention_icon: '📸',
    category: 'Photography',
    visibility: 'community',
    visibility_label: 'Shutterbugs Dubai',
    duration: 'this_weekend',
    expires_at: 'Sun, 6:00 PM',
    status: 'active',
    member_name: 'Marco Rossi',
    member_avatar: avatars[5],
    member_city: 'Dubai',
    member_interests: ['Photography', 'Music', 'Art'],
    interested_count: 6,
    maybe_count: 2,
    message_count: 4,
    muted: false,
    distance: '5.0 km',
  },
];

export const myLookingForPosts = [
  {
    id: 101,
    intention_text: 'Looking for a walking companion for the Marina sunset stroll.',
    intention_icon: '🚶',
    category: 'Outdoors',
    visibility: 'pals',
    visibility_label: 'Pals Only',
    duration: 'today',
    expires_at: 'Today, 6:30 PM',
    status: 'active',
    member_name: 'You',
    member_avatar: avatars[1],
    member_city: 'Dubai',
    member_interests: ['Walking', 'Wellness', 'Music'],
    interested_count: 2,
    maybe_count: 1,
    message_count: 1,
    muted: false,
    distance: '0 km',
  },
];

const memberPool = [
  { id: 1, name: 'Layla Ahmed', avatar: avatars[0], city: 'Dubai', distance: '1.2 km', interests: ['Coffee', 'Wellness', 'Photography'], goals: ['Be More Social'], communities: ['Dubai Coffee Club'], circles: ['Mindful Mornings'], availability: 'Today, Afternoon', matchScore: 92 },
  { id: 2, name: 'Omar Khalid', avatar: avatars[3], city: 'Dubai', distance: '3.5 km', interests: ['Sports', 'Gaming', 'Food'], goals: ['Stay Active'], communities: ['Dubai Padel Community'], circles: ['Padel Pros'], availability: 'This Weekend', matchScore: 88 },
  { id: 3, name: 'Fatima Zahra', avatar: avatars[1], city: 'Dubai', distance: '1.2 km', interests: ['Walking', 'Wellness', 'Music'], goals: ['Explore the City'], communities: ['Mindful Mornings'], circles: ['Mindful Mornings'], availability: 'Today, Evening', matchScore: 85 },
  { id: 4, name: 'Sara Mansour', avatar: avatars[2], city: 'Abu Dhabi', distance: '4.5 km', interests: ['Photography', 'Art', 'Food'], goals: ['Meet Creative People'], communities: ['Shutterbugs Dubai'], circles: ['Creative Souls'], availability: 'This Weekend', matchScore: 79 },
  { id: 5, name: 'Khalid Al-Rashid', avatar: avatars[4], city: 'Dubai', distance: '3.5 km', interests: ['Food', 'Networking', 'Music'], goals: ['Grow Professionally'], communities: ['Dubai Entrepreneurs'], circles: ['Foodies Circle'], availability: 'Tomorrow', matchScore: 76 },
  { id: 6, name: 'Noor Hassan', avatar: avatars[5], city: 'Sharjah', distance: '0.9 km', interests: ['Learning', 'Photography', 'Walking'], goals: ['Learn Something New'], communities: ['Book Lovers'], circles: ['Book Lovers'], availability: 'Weekday Evenings', matchScore: 81 },
  { id: 7, name: 'Priya Nair', avatar: avatars[0], city: 'Dubai', distance: '2.0 km', interests: ['Wellness', 'Yoga', 'Meditation'], goals: ['Stay Active'], communities: ['Mindful Mornings'], circles: ['Fitness Friends'], availability: 'Today, Morning', matchScore: 90 },
];

export function getMatches(intentionCategory, memberInterests = []) {
  return memberPool
    .map(m => {
      let score = m.matchScore;
      if (m.interests.some(i => memberInterests.includes(i))) score += 5;
      if (m.interests.some(i => i === intentionCategory)) score += 8;
      return { ...m, matchScore: Math.min(score, 99) };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
}

export function getActivePosts() {
  return lookingForPosts.filter(p => p.status === 'active');
}

export function getMyPosts() {
  return myLookingForPosts.filter(p => p.status === 'active');
}

export function shouldSuggestConversion(post) {
  return post.interested_count + post.maybe_count >= 4;
}