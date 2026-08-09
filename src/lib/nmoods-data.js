import { useState, useEffect } from 'react';
import { computeNmoodStatus } from '@/lib/nmood-lifecycle';

/**
 * Nmoods — real-time intention discovery feed.
 * Each card represents an activity/intention, NOT a profile.
 * Activity dominates; member is secondary.
 */

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

export const nmoodCategories = [
  { id: 'Coffee', icon: '☕', label: 'Coffee' },
  { id: 'Food', icon: '🍽️', label: 'Food' },
  { id: 'Sports', icon: '🎾', label: 'Sports' },
  { id: 'Music', icon: '🎵', label: 'Music' },
  { id: 'Outdoor', icon: '🌿', label: 'Outdoor' },
  { id: 'Art', icon: '🎨', label: 'Art' },
  { id: 'Networking', icon: '🤝', label: 'Networking' },
  { id: 'Learning', icon: '📚', label: 'Learning' },
  { id: 'Photography', icon: '📸', label: 'Photography' },
  { id: 'Travel', icon: '✈️', label: 'Travel' },
  { id: 'Gaming', icon: '🎮', label: 'Gaming' },
  { id: 'Business', icon: '💼', label: 'Business' },
  { id: 'Wellness', icon: '🧘', label: 'Wellness' },
  { id: 'Movies', icon: '🎬', label: 'Movies' },
  { id: 'Shopping', icon: '🛍️', label: 'Shopping' },
  { id: 'Other', icon: '✨', label: 'Other' },
];

export const nmoodFilters = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'tonight', label: 'Tonight' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'weekend', label: 'Weekend' },
  { id: 'nearby', label: 'Nearby' },
  { id: 'Coffee', label: 'Coffee' },
  { id: 'Food', label: 'Food' },
  { id: 'Sports', label: 'Sports' },
  { id: 'Music', label: 'Music' },
  { id: 'Outdoor', label: 'Outdoor' },
  { id: 'Art', label: 'Art' },
  { id: 'Networking', label: 'Networking' },
  { id: 'Gaming', label: 'Gaming' },
  { id: 'Photography', label: 'Photography' },
  { id: 'Travel', label: 'Travel' },
  { id: 'Learning', label: 'Learning' },
];

export const whenOptions = [
  { id: 'now', label: 'Right Now', icon: '⚡' },
  { id: '1hour', label: 'In 1 Hour', icon: '🕐' },
  { id: 'today', label: 'Today', icon: '☀️' },
  { id: 'tonight', label: 'Tonight', icon: '🌙' },
  { id: 'tomorrow', label: 'Tomorrow', icon: '📅' },
  { id: 'weekend', label: 'Weekend', icon: '🎉' },
  { id: 'custom', label: 'Custom Date & Time', icon: '🗓️' },
];

export const groupSizeOptions = [
  { id: '1plus1', label: 'Just Me +1' },
  { id: '2-4', label: '2–4' },
  { id: '5-10', label: '5–10' },
  { id: 'unlimited', label: 'Unlimited' },
];

export const genderOptions = [
  { id: 'everyone', label: 'Everyone' },
  { id: 'women', label: 'Women Only' },
  { id: 'men', label: 'Men Only' },
];

export const ageOptions = [
  { id: '18', label: '18+' },
  { id: '21', label: '21+' },
  { id: '25', label: '25+' },
  { id: '30', label: '30+' },
  { id: 'any', label: 'No Preference' },
];

export const visibilityOptions = [
  { id: 'public', label: 'Public', icon: '🌍', desc: 'Anyone nearby can discover your Nmood.' },
  { id: 'friends', label: 'Friends', icon: '🤝', desc: 'Only your Pals can see this.' },
  { id: 'circle', label: 'Circle Members', icon: '⭕', desc: 'Only members of your Circles.' },
];

export const expirationOptions = [
  { id: '2h', label: '2 Hours', hours: 2 },
  { id: '6h', label: '6 Hours', hours: 6 },
  { id: '12h', label: '12 Hours', hours: 12 },
  { id: '24h', label: '24 Hours', hours: 24 },
  { id: '48h', label: '48 Hours', hours: 48 },
];

export const lookingForSuggestions = [
  'Coffee lovers',
  'Good conversations',
  'Families',
  'Entrepreneurs',
  'Travel buddies',
  'Anyone',
  'Creative people',
  'Active people',
];

export const tagSuggestions = {
  Coffee: ['Latte', 'Espresso', 'Cozy', 'Study', 'Morning', 'Chatting'],
  Food: ['Brunch', 'Dinner', 'New Spot', 'Hidden Gem', 'Fine Dining', 'Street Food'],
  Sports: ['Padel', 'Football', 'Running', 'Tennis', 'Gym', 'Morning Run'],
  Music: ['Live Music', 'Jazz', 'Concert', 'Acoustic', 'Indie', 'Karaoke'],
  Outdoor: ['Sunset', 'Beach', 'Hiking', 'Walk', 'Park', 'Stargazing'],
  Art: ['Gallery', 'Exhibition', 'Painting', 'Museum', 'Creative', 'Sketching'],
  Networking: ['Startups', 'Entrepreneurs', 'Tech', 'Brainstorm', 'Mentor', 'Investors'],
  Learning: ['Study Buddy', 'Language', 'Coding', 'Workshop', 'Book Club', 'Skills'],
  Photography: ['Golden Hour', 'Street', 'Portrait', 'Landscape', 'Sunset', 'Editing'],
  Travel: ['Day Trip', 'Road Trip', 'Weekend', 'Explore', 'Adventure', 'Hidden Spots'],
  Gaming: ['Board Games', 'Console', 'Co-op', 'Retro', 'Strategy', 'Casual'],
  Business: ['Coffee Chat', 'Mentoring', 'Pitch', 'Partnership', 'Brainstorm', 'Networking'],
  Wellness: ['Yoga', 'Meditation', 'Running', 'Hiking', 'Self-care', 'Mindfulness'],
  Movies: ['Cinema', 'Indie', 'Classic', 'Marathon', 'Premiere', 'Discussion'],
  Shopping: ['Mall', 'Thrift', 'Vintage', 'Boutique', 'Market', 'Window Shopping'],
  Other: ['Spontaneous', 'Adventure', 'Chill', 'New Experience', 'Fun', 'Social'],
};

export const seedPosts = [
  {
    id: 1,
    category: 'Coffee',
    category_icon: '☕',
    intention_text: 'Trying a hidden coffee place with good conversations.',
    looking_for: 'Coffee lovers',
    date: 'Today',
    time: '4:00 PM',
    distance_km: 1.2,
    distance: '1.2 km',
    location: 'Jumeirah',
    member_first_name: 'Layla',
    member_age: 28,
    member_avatar: avatars[0],
    verified: true,
    member_interests: ['Coffee', 'Books', 'Photography', 'Travel'],
    interested_count: 3,
    is_new: true,
    when: 'today',
  },
  {
    id: 2,
    category: 'Sports',
    category_icon: '🎾',
    intention_text: 'Looking for a Padel partner for an evening match this week.',
    looking_for: 'Active people',
    date: 'Weekend',
    time: '8:00 PM',
    distance_km: 3.5,
    distance: '3.5 km',
    location: 'Sports City',
    member_first_name: 'Omar',
    member_age: 31,
    member_avatar: avatars[3],
    verified: true,
    member_interests: ['Sports', 'Gaming', 'Food', 'Travel'],
    interested_count: 5,
    is_new: false,
    when: 'weekend',
  },
  {
    id: 3,
    category: 'Learning',
    category_icon: '📚',
    intention_text: 'Looking for a study buddy for Python and data science.',
    looking_for: 'Anyone',
    date: 'Tomorrow',
    time: '9:00 PM',
    distance_km: 0.9,
    distance: '0.9 km',
    location: 'Sharjah',
    member_first_name: 'Noor',
    member_age: 25,
    member_avatar: avatars[5],
    verified: false,
    member_interests: ['Learning', 'Photography', 'Wellness'],
    interested_count: 1,
    is_new: true,
    when: 'tomorrow',
  },
  {
    id: 4,
    category: 'Networking',
    category_icon: '🤝',
    intention_text: 'Looking for entrepreneurs to brainstorm a startup idea over brunch.',
    looking_for: 'Entrepreneurs',
    date: 'Weekend',
    time: '12:00 PM',
    distance_km: 3.5,
    distance: '3.5 km',
    location: 'DIFC',
    member_first_name: 'Khalid',
    member_age: 33,
    member_avatar: avatars[4],
    verified: true,
    member_interests: ['Networking', 'Food', 'Music', 'Learning'],
    interested_count: 8,
    is_new: false,
    when: 'weekend',
  },
  {
    id: 5,
    category: 'Food',
    category_icon: '🍽️',
    intention_text: 'Looking for people to try that new Japanese fusion spot in DIFC.',
    looking_for: 'Good conversations',
    date: 'Tomorrow',
    time: '8:00 PM',
    distance_km: 2.0,
    distance: '2.0 km',
    location: 'DIFC',
    member_first_name: 'Sara',
    member_age: 29,
    member_avatar: avatars[2],
    verified: true,
    member_interests: ['Food', 'Art', 'Photography', 'Travel'],
    interested_count: 4,
    is_new: false,
    when: 'tomorrow',
  },
  {
    id: 6,
    category: 'Wellness',
    category_icon: '🧘',
    intention_text: 'Looking for a running partner for early morning runs along the Marina.',
    looking_for: 'Active people',
    date: 'Today',
    time: '7:00 AM',
    distance_km: 2.0,
    distance: '2.0 km',
    location: 'Marina',
    member_first_name: 'Priya',
    member_age: 27,
    member_avatar: avatars[0],
    verified: false,
    member_interests: ['Wellness', 'Sports', 'Outdoor'],
    interested_count: 2,
    is_new: false,
    when: 'today',
  },
  {
    id: 7,
    category: 'Photography',
    category_icon: '📸',
    intention_text: 'Looking for photographers this weekend for a golden hour shoot at Al Seef.',
    looking_for: 'Creative people',
    date: 'Weekend',
    time: '6:00 PM',
    distance_km: 5.0,
    distance: '5.0 km',
    location: 'Al Seef',
    member_first_name: 'Marco',
    member_age: 30,
    member_avatar: avatars[5],
    verified: true,
    member_interests: ['Photography', 'Music', 'Art', 'Travel'],
    interested_count: 6,
    is_new: false,
    when: 'weekend',
  },
  {
    id: 8,
    category: 'Music',
    category_icon: '🎵',
    intention_text: 'Looking for live music buddies for a jazz night in the city.',
    looking_for: 'Anyone',
    date: 'Tonight',
    time: '9:00 PM',
    distance_km: 1.5,
    distance: '1.5 km',
    location: 'Downtown',
    member_first_name: 'Fatima',
    member_age: 26,
    member_avatar: avatars[1],
    verified: true,
    member_interests: ['Music', 'Art', 'Food', 'Coffee'],
    interested_count: 4,
    is_new: true,
    when: 'tonight',
  },
  {
    id: 9,
    category: 'Outdoor',
    category_icon: '🌿',
    intention_text: 'Looking for a walking companion for the Marina sunset stroll.',
    looking_for: 'Good conversations',
    date: 'Today',
    time: '6:30 PM',
    distance_km: 0.5,
    distance: '0.5 km',
    location: 'Marina Walk',
    member_first_name: 'Yuki',
    member_age: 24,
    member_avatar: avatars[7],
    verified: false,
    member_interests: ['Outdoor', 'Wellness', 'Photography'],
    interested_count: 2,
    is_new: false,
    when: 'today',
  },
  {
    id: 10,
    category: 'Gaming',
    category_icon: '🎮',
    intention_text: 'Looking for a board game buddy for a cozy evening at a café.',
    looking_for: 'Anyone',
    date: 'Tonight',
    time: '7:30 PM',
    distance_km: 2.8,
    distance: '2.8 km',
    location: 'JLT',
    member_first_name: 'David',
    member_age: 29,
    member_avatar: avatars[6],
    verified: false,
    member_interests: ['Gaming', 'Coffee', 'Learning'],
    interested_count: 3,
    is_new: true,
    when: 'tonight',
  },
  {
    id: 11,
    category: 'Art',
    category_icon: '🎨',
    intention_text: 'Looking for someone to explore the new art exhibition at Alserkal Avenue.',
    looking_for: 'Creative people',
    date: 'Tomorrow',
    time: '5:00 PM',
    distance_km: 4.2,
    distance: '4.2 km',
    location: 'Alserkal Avenue',
    member_first_name: 'Elena',
    member_age: 28,
    member_avatar: avatars[2],
    verified: true,
    member_interests: ['Art', 'Photography', 'Coffee', 'Travel'],
    interested_count: 5,
    is_new: false,
    when: 'tomorrow',
  },
  {
    id: 12,
    category: 'Travel',
    category_icon: '✈️',
    intention_text: 'Planning a weekend day trip to Hatta and looking for company.',
    looking_for: 'Travel buddies',
    date: 'Weekend',
    time: '8:00 AM',
    distance_km: 6.0,
    distance: '6.0 km',
    location: 'Hatta',
    member_first_name: 'Ahmed',
    member_age: 32,
    member_avatar: avatars[3],
    verified: true,
    member_interests: ['Travel', 'Outdoor', 'Sports', 'Photography'],
    interested_count: 7,
    is_new: true,
    when: 'weekend',
  },
];

export function getCategoryById(id) {
  return nmoodCategories.find((c) => c.id === id) || nmoodCategories[nmoodCategories.length - 1];
}

export function filterNmoods(posts, chipId) {
  const now = new Date();
  const visible = posts.filter((p) => {
    const status = computeNmoodStatus(p, now);
    return status !== 'expired' && status !== 'archived' && status !== 'completed';
  });

  if (!chipId || chipId === 'all') return visible;

  if (chipId === 'today') return visible.filter((p) => p.when === 'today' || p.date === 'Today');
  if (chipId === 'tonight') return visible.filter((p) => p.when === 'tonight' || (p.date === 'Today' && parseInt(p.time) >= 18));
  if (chipId === 'tomorrow') return visible.filter((p) => p.when === 'tomorrow' || p.date === 'Tomorrow');
  if (chipId === 'weekend') return visible.filter((p) => p.when === 'weekend' || p.date === 'Weekend');
  if (chipId === 'nearby') return visible.filter((p) => p.distance_km <= 3);

  return visible.filter((p) => p.category === chipId);
}

const interestedMemberPool = [
  { name: 'Layla', avatar: avatars[0] },
  { name: 'Omar', avatar: avatars[3] },
  { name: 'Noor', avatar: avatars[5] },
  { name: 'Khalid', avatar: avatars[4] },
  { name: 'Sara', avatar: avatars[2] },
  { name: 'Priya', avatar: avatars[0] },
  { name: 'Marco', avatar: avatars[5] },
  { name: 'Fatima', avatar: avatars[1] },
  { name: 'Yuki', avatar: avatars[7] },
  { name: 'David', avatar: avatars[6] },
];

const durationByCategory = {
  Coffee: '1–2 Hours', Food: '2 Hours', Sports: '2–3 Hours', Music: '3 Hours',
  Outdoor: '2–4 Hours', Art: '2 Hours', Networking: '2 Hours', Learning: '2–3 Hours',
  Photography: '2–3 Hours', Travel: 'Full Day', Gaming: '2–3 Hours', Business: '1–2 Hours',
  Wellness: '1–2 Hours', Movies: '3 Hours', Shopping: '2–3 Hours', Other: '2 Hours',
};

const languagePool = ['English', 'Arabic', 'Spanish', 'French', 'Hindi', 'Urdu', 'Italian', 'German'];

export function enrichWithLifecycle(post) {
  if (!post) return null;
  const now = new Date();
  let startTime = new Date(now);

  switch (post.when) {
    case 'now':
      startTime = new Date(now.getTime() + 20 * 60000);
      break;
    case '1hour':
      startTime = new Date(now.getTime() + 55 * 60000);
      break;
    case 'today':
      startTime = new Date(now.getTime() + (2 + (post.id % 4)) * 60 * 60000);
      break;
    case 'tonight':
      startTime = new Date(now);
      startTime.setHours(20, 0, 0, 0);
      if (startTime <= now) startTime = new Date(now.getTime() + 45 * 60000);
      break;
    case 'tomorrow':
      startTime = new Date(now);
      startTime.setDate(startTime.getDate() + 1);
      startTime.setHours(10 + (post.id % 8), 0, 0, 0);
      break;
    case 'weekend': {
      startTime = new Date(now);
      const dow = startTime.getDay();
      const daysToSat = dow === 6 ? 7 : ((6 - dow) % 7) || 7;
      startTime.setDate(startTime.getDate() + daysToSat);
      startTime.setHours(10 + (post.id % 8), 0, 0, 0);
      break;
    }
    default:
      startTime = new Date(now.getTime() + (1 + post.id) * 60 * 60000);
  }

  const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return {
    ...post,
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    expires_at: expiresAt.toISOString(),
  };
}

export function enrichNmoodDetail(post) {
  if (!post) return null;
  const maxParticipants = Math.max(4, post.interested_count + 3);
  const joined = Math.max(1, Math.min(post.interested_count, maxParticipants - 2));
  const totalInterested = post.interested_count + 5;

  const interestedMembers = [];
  for (let i = 0; i < Math.min(totalInterested, 8); i++) {
    interestedMembers.push(interestedMemberPool[i % interestedMemberPool.length]);
  }

  const insights = [
    { icon: '🎯', text: `${88 + (post.id % 12)}% shared interests` },
    { icon: '✨', text: 'Same mood today' },
    { icon: '⭕', text: `${post.id % 4 + 1} mutual circles` },
    { icon: '📍', text: 'Lives nearby' },
    { icon: '🕐', text: 'Available at the same time' },
  ];

  const lookingForChips = post.looking_for
    ? [post.looking_for, ...(post.member_interests || []).slice(0, 3)]
    : (post.member_interests || []).slice(0, 4);

  const cleanedIntention = post.intention_text
    .replace(/^trying\s/i, 'try ')
    .replace(/^Looking for\s/i, 'look for ')
    .replace(/^Planning\s/i, 'plan ');

  return {
    ...post,
    about: `I've wanted to ${cleanedIntention} for a while. Looking for relaxed people who enjoy ${post.category.toLowerCase()} and exploring new experiences together.`,
    estimated_duration: durationByCategory[post.category] || '2 Hours',
    max_participants: maxParticipants,
    participants_joined: joined,
    interested_members: interestedMembers,
    interested_total: totalInterested,
    ai_insights: insights,
    looking_for_chips: lookingForChips,
    member_languages: [languagePool[post.id % languagePool.length], languagePool[(post.id + 2) % languagePool.length]],
    hide_exact_location: false,
    host_stats: {
      attendance_rate: 70 + (post.id % 25),
      completion_rate: 80 + (post.id % 18),
      response_time: `${5 + (post.id % 30)}m`,
      successful_plans: 2 + (post.id % 14),
      community_rating: Number((4 + (post.id % 10) / 10).toFixed(1)),
    },
  };
}

export function getNmoodById(id) {
  const post = seedPosts.find((p) => p.id === parseInt(id, 10));
  return enrichNmoodDetail(enrichWithLifecycle(post));
}

export function getSimilarNmoods(post) {
  if (!post) return [];
  return seedPosts
    .filter((p) => p.id !== post.id)
    .sort((a, b) => {
      const aScore = (a.category === post.category ? 2 : 0) + (a.distance_km <= 3 ? 1 : 0);
      const bScore = (b.category === post.category ? 2 : 0) + (b.distance_km <= 3 ? 1 : 0);
      return bScore - aScore;
    })
    .slice(0, 5);
}

export function useNmoodsFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPosts(seedPosts.map(enrichWithLifecycle));
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return { posts, loading, setPosts };
}