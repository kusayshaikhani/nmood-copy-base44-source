import { Coffee, Mountain, Users, Sunrise, Sunset, Moon, Award, MapPin, Clock, Star, Building2, Heart, Sparkles } from 'lucide-react';

export const journeyStats = {
  memberSince: 'March 2024',
  experiencesHosted: 7,
  experiencesJoined: 23,
  palsMade: 12,
  citiesExplored: 4,
};

export const coverImage = 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=80';

export const memberPhoto = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80';

export const timelineMilestones = [
  { id: 1, emoji: '🎉', title: 'Joined Nmood', date: 'Mar 15, 2024', description: 'Your journey began. Welcome to the community.' },
  { id: 2, emoji: '☕', title: 'First Coffee Experience', date: 'Mar 22, 2024', description: 'Coffee & Connection at Downtown Café — your first step out.' },
  { id: 3, emoji: '🤝', title: 'First Pal', date: 'Apr 5, 2024', description: 'You became pals with Sarah Chen after a shared hike.' },
  { id: 4, emoji: '🌅', title: 'First Hosted Experience', date: 'May 12, 2024', description: 'Sunset Yoga Session at Kite Beach — you brought people together.' },
  { id: 5, emoji: '🏔', title: 'First Adventure', date: 'Jun 8, 2024', description: 'Hatta Mountains hiking trail — you pushed your comfort zone.' },
  { id: 6, emoji: '🌍', title: 'First Experience Outside Your City', date: 'Jul 20, 2024', description: 'Art Therapy Workshop in Abu Dhabi — exploring beyond home.' },
  { id: 7, emoji: '⭐', title: '10 Experiences', date: 'Sep 3, 2024', description: 'A milestone of moments — ten experiences and counting.' },
  { id: 8, emoji: '⭐', title: '25 Experiences', date: 'Feb 15, 2025', description: 'Quarter-century of connections, coffees, and adventures.' },
  { id: 9, emoji: '⭐', title: '50 Experiences', date: 'Jun 30, 2025', description: 'A half-century of memories. You\'ve built something beautiful.' },
];

export const memories = [
  { id: 'm1', url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80', caption: 'Coffee & Connection', date: 'Mar 2024', size: 'large' },
  { id: 'm2', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d92df4?w=600&q=80', caption: 'Hatta Hike', date: 'Jun 2024', size: 'small' },
  { id: 'm3', url: 'https://images.unsplash.com/photo-1545205597-3d9d02dae295?w=600&q=80', caption: 'Sunset Yoga', date: 'May 2024', size: 'small' },
  { id: 'm4', url: 'https://images.unsplash.com/photo-1513415564515-763d91423bdd?w=600&q=80', caption: 'Art Workshop', date: 'Jul 2024', size: 'small' },
  { id: 'm5', url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=80', caption: 'Networking Night', date: 'Aug 2024', size: 'small' },
  { id: 'm6', url: 'https://images.unsplash.com/photo-1559521783-1d159958348a?w=600&q=80', caption: 'Beach Volleyball', date: 'Oct 2024', size: 'large' },
  { id: 'm7', url: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?w=600&q=80', caption: 'Cooking Class', date: 'Nov 2024', size: 'small' },
  { id: 'm8', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42c?w=600&q=80', caption: 'Mountain Retreat', date: 'Dec 2024', size: 'small' },
  { id: 'm9', url: 'https://images.unsplash.com/photo-1494059980473-813613bcca0b?w=600&q=80', caption: 'Photography Walk', date: 'Jan 2025', size: 'small' },
  { id: 'm10', url: 'https://images.unsplash.com/photo-1517816743773-6ae0f973b77d?w=600&q=80', caption: 'Community Brunch', date: 'Feb 2025', size: 'small' },
];

export const journeyLocations = [
  { id: 1, position: [25.2048, 55.2708], title: 'Coffee & Connection', date: 'Mar 2024', city: 'Dubai' },
  { id: 2, position: [25.0772, 55.2292], title: 'Sunset Yoga Session', date: 'May 2024', city: 'Dubai' },
  { id: 3, position: [24.8244, 56.1336], title: 'Hatta Hiking', date: 'Jun 2024', city: 'Hatta' },
  { id: 4, position: [24.4539, 54.3773], title: 'Art Therapy Workshop', date: 'Jul 2024', city: 'Abu Dhabi' },
  { id: 5, position: [25.2350, 55.2750], title: 'Networking Night', date: 'Aug 2024', city: 'Dubai' },
  { id: 6, position: [25.0833, 55.1714], title: 'Beach Volleyball', date: 'Oct 2024', city: 'Dubai' },
  { id: 7, position: [25.2769, 55.2962], title: 'Cooking Class', date: 'Nov 2024', city: 'Dubai' },
  { id: 8, position: [24.9668, 56.0632], title: 'Mountain Retreat', date: 'Dec 2024', city: 'Ras Al Khaimah' },
];

export const achievements = [
  { id: 'coffee_explorer', icon: Coffee, title: 'Coffee Explorer', description: 'Attended 10+ coffee experiences', unlocked: true, date: 'Sep 2024' },
  { id: 'adventure_seeker', icon: Mountain, title: 'Adventure Seeker', description: 'Completed 5 outdoor adventures', unlocked: true, date: 'Jan 2025' },
  { id: 'community_builder', icon: Users, title: 'Community Builder', description: 'Hosted 5+ experiences', unlocked: true, date: 'Mar 2025' },
  { id: 'weekend_warrior', icon: Star, title: 'Weekend Warrior', description: 'Joined 15 weekend experiences', unlocked: true, date: 'Feb 2025' },
  { id: 'networking_pro', icon: Sparkles, title: 'Networking Pro', description: 'Attended 8 networking events', unlocked: true, date: 'Apr 2025' },
  { id: 'early_bird', icon: Sunrise, title: 'Early Bird', description: 'Joined 5 morning experiences', unlocked: true, date: 'May 2025' },
  { id: 'night_owl', icon: Moon, title: 'Night Owl', description: 'Attended 5 evening experiences', unlocked: false, date: null },
  { id: 'host_champion', icon: Award, title: 'Host Champion', description: 'Host 10 experiences', unlocked: false, date: null },
];

export const journeyInsights = [
  { id: 'active_month', icon: Clock, label: 'Most Active Month', value: 'October', detail: '8 experiences joined' },
  { id: 'fav_category', icon: Coffee, label: 'Favorite Category', value: 'Coffee', detail: '12 experiences' },
  { id: 'fav_time', icon: Sunset, label: 'Favorite Time', value: 'Evening', detail: '45% of experiences' },
  { id: 'fav_area', icon: MapPin, label: 'Favorite Area', value: 'Downtown Dubai', detail: '9 experiences' },
  { id: 'fav_pal', icon: Heart, label: 'Most Frequent Pal', value: 'Sarah Chen', detail: '5 shared experiences' },
  { id: 'fav_organizer', icon: Building2, label: 'Most Frequent Organizer', value: 'James Wilson', detail: '4 experiences' },
];

export const lookBackMemories = [
  {
    id: 'lb1',
    title: 'Beach Volleyball Tournament',
    date: 'Jul 5, 2025',
    description: 'A sunny afternoon of sand, spikes, and laughter with 12 pals at Kite Beach.',
    image: 'https://images.unsplash.com/photo-1559521783-1d159958348a?w=800&q=80',
  },
  {
    id: 'lb2',
    title: 'Coffee Tasting Evening',
    date: 'Jul 12, 2025',
    description: 'Discovered three new single-origin beans and made two new pals.',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
  },
  {
    id: 'lb3',
    title: 'Photography Walk in Old Dubai',
    date: 'Jul 20, 2025',
    description: 'Captured golden-hour shots through the alleyways of Al Fahidi.',
    image: 'https://images.unsplash.com/photo-1494059980473-813613bcca0b?w=800&q=80',
  },
];