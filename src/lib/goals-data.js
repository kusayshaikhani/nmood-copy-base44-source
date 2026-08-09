import { Users, Briefcase, Languages, Dumbbell, MapPin, Coffee, Network, GraduationCap, Home, Zap, Camera, Trees, HeartHandshake, Mic, Sparkles, Heart, Target, Calendar } from 'lucide-react';

export const goalDefinitions = [
  { key: 'make_friends', label: 'Make New Friends', icon: Users, description: 'Expand your circle and build meaningful connections.' },
  { key: 'meet_entrepreneurs', label: 'Meet Entrepreneurs', icon: Briefcase, description: 'Connect with founders and builders.' },
  { key: 'improve_english', label: 'Improve Language Skills', icon: Languages, description: 'Practice conversationally in real settings.' },
  { key: 'stay_active', label: 'Stay Active', icon: Dumbbell, description: 'Move your body and feel great.' },
  { key: 'explore_dubai', label: 'Explore Dubai', icon: MapPin, description: 'Discover hidden gems across the city.' },
  { key: 'discover_cafes', label: 'Discover Cafés', icon: Coffee, description: 'Find the best spots for a good cup.' },
  { key: 'grow_business', label: 'Grow My Business Network', icon: Network, description: 'Meet professionals and grow together.' },
  { key: 'learn_skills', label: 'Learn New Skills', icon: GraduationCap, description: 'Pick up something new and useful.' },
  { key: 'meet_families', label: 'Meet Families', icon: Home, description: 'Connect with other families nearby.' },
  { key: 'find_tennis', label: 'Find Tennis Partners', icon: Zap, description: 'Hit the court with new partners.' },
  { key: 'practice_photo', label: 'Practice Photography', icon: Camera, description: 'Sharpen your eye behind the lens.' },
  { key: 'explore_nature', label: 'Explore Nature', icon: Trees, description: 'Get outdoors and breathe deeply.' },
  { key: 'volunteer', label: 'Volunteer', icon: HeartHandshake, description: 'Give back and feel fulfilled.' },
  { key: 'public_speaking', label: 'Improve Public Speaking', icon: Mic, description: 'Find your voice and speak with ease.' },
  { key: 'build_confidence', label: 'Build Confidence', icon: Sparkles, description: 'Step into your strengths, gently.' },
  { key: 'reduce_loneliness', label: 'Reduce Loneliness', icon: Heart, description: 'Feel more connected, more often.' },
  { key: 'build_habits', label: 'Build Better Habits', icon: Target, description: 'Small steps toward lasting change.' },
];

const sharedExperiences = [
  { id: 'e1', title: 'Coffee & Connection', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80', host: 'Sarah Chen', date: 'Today · 3:00 PM', distance: '2 km', budget: 'Free' },
  { id: 'e2', title: 'Entrepreneur Meetup', image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&q=80', host: 'James Wilson', date: 'Jul 10 · 7:00 PM', distance: '5 km', budget: '$$' },
  { id: 'e3', title: 'Sunset Yoga', image: 'https://images.unsplash.com/photo-1545205597-3d9d02dae295?w=600&q=80', host: 'Emma Rodriguez', date: 'Jul 8 · 6:00 AM', distance: '3 km', budget: 'Free' },
  { id: 'e4', title: 'Photography Walk', image: 'https://images.unsplash.com/photo-1494059980473-813613bcca0b?w=600&q=80', host: 'Mike Chen', date: 'Jul 12 · 5:30 PM', distance: '8 km', budget: '$' },
  { id: 'e5', title: 'Language Exchange', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd47f?w=600&q=80', host: 'Layla Hassan', date: 'Jul 9 · 6:00 PM', distance: '4 km', budget: 'Free' },
  { id: 'e6', title: 'Hiking Adventure', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d92df4?w=600&q=80', host: 'David Park', date: 'Jul 15 · 7:00 AM', distance: '45 km', budget: '$$' },
  { id: 'e7', title: 'Tennis Social', image: 'https://images.unsplash.com/photo-1554080353-a576cf803bda?w=600&q=80', host: 'Tom Wilson', date: 'Jul 11 · 8:00 AM', distance: '6 km', budget: '$' },
  { id: 'e8', title: 'Cooking Class', image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&q=80', host: 'Maria Garcia', date: 'Jul 14 · 7:00 PM', distance: '7 km', budget: '$$' },
  { id: 'e9', title: 'Volunteer Day', image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&q=80', host: 'Ahmed Ali', date: 'Jul 13 · 9:00 AM', distance: '12 km', budget: 'Free' },
  { id: 'e10', title: 'Public Speaking Workshop', image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&q=80', host: 'Rachel Green', date: 'Jul 16 · 7:00 PM', distance: '5 km', budget: '$' },
];

const sharedCircles = [
  { id: 'c1', title: 'New in Dubai', members: 124, image: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=400&q=80' },
  { id: 'c2', title: 'Entrepreneurs UAE', members: 89, image: 'https://images.unsplash.com/photo-1556745753-b2904692bde0?w=400&q=80' },
  { id: 'c3', title: 'Language Learners', members: 210, image: 'https://images.unsplash.com/photo-1503676260728-1c00fa094a91?w=400&q=80' },
  { id: 'c4', title: 'Active Dubai', members: 156, image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80' },
  { id: 'c5', title: 'Café Hoppers', members: 78, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80' },
  { id: 'c6', title: 'Photography Club', members: 92, image: 'https://images.unsplash.com/photo-1494059980473-813613bcca0b?w=400&q=80' },
];

const sharedPals = [
  { id: 'p1', name: 'Sarah Chen', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80', mutual_interests: ['Coffee', 'Networking'] },
  { id: 'p2', name: 'Ahmed Ali', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80', mutual_interests: ['Sports', 'Adventure'] },
  { id: 'p3', name: 'Emma Rodriguez', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80', mutual_interests: ['Yoga', 'Wellness'] },
  { id: 'p4', name: 'James Wilson', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80', mutual_interests: ['Business', 'Tech'] },
  { id: 'p5', name: 'Layla Hassan', avatar: 'https://images.unsplash.com/photo-1534528741775-5f94d5b54e6e?w=200&q=80', mutual_interests: ['Languages', 'Culture'] },
];

const sharedOpportunities = [
  { id: 'o1', title: 'Speed Friending Night', date: 'Jul 10', venue: 'Downtown Hub' },
  { id: 'o2', title: 'Weekend Hike', date: 'Jul 15', venue: 'Hatta Mountains' },
  { id: 'o3', title: 'Coffee Crawl', date: 'Jul 12', venue: 'DIFC' },
  { id: 'o4', title: 'Startup Pitch Night', date: 'Jul 18', venue: 'Dubai Marina' },
];

const suggestionMap = {
  make_friends: { experiences: [0, 1, 4], circles: [0, 3], pals: [0, 2], opportunities: [0, 2] },
  meet_entrepreneurs: { experiences: [1, 9, 3], circles: [1], pals: [3], opportunities: [3] },
  improve_english: { experiences: [4, 0, 7], circles: [2], pals: [4], opportunities: [0] },
  stay_active: { experiences: [2, 5, 6], circles: [3], pals: [1], opportunities: [1] },
  explore_dubai: { experiences: [3, 2, 7], circles: [0, 4], pals: [0], opportunities: [2] },
  discover_cafes: { experiences: [0, 7, 3], circles: [4], pals: [0], opportunities: [2] },
  grow_business: { experiences: [1, 9, 0], circles: [1], pals: [3], opportunities: [3] },
  learn_skills: { experiences: [7, 3, 9], circles: [2, 5], pals: [4], opportunities: [0] },
  meet_families: { experiences: [7, 2, 8], circles: [0], pals: [2], opportunities: [0] },
  find_tennis: { experiences: [6, 2, 5], circles: [3], pals: [1], opportunities: [1] },
  practice_photo: { experiences: [3, 5, 0], circles: [5], pals: [4], opportunities: [2] },
  explore_nature: { experiences: [5, 2, 3], circles: [3], pals: [1], opportunities: [1] },
  volunteer: { experiences: [8, 0, 7], circles: [0], pals: [2], opportunities: [0] },
  public_speaking: { experiences: [9, 1, 0], circles: [1], pals: [3], opportunities: [3] },
  build_confidence: { experiences: [9, 0, 2], circles: [0], pals: [0], opportunities: [0] },
  reduce_loneliness: { experiences: [0, 7, 4], circles: [0, 4], pals: [0, 2], opportunities: [0] },
  build_habits: { experiences: [2, 5, 7], circles: [3], pals: [1], opportunities: [1] },
};

export const getGoalSuggestions = (goalKey) => {
  const indices = suggestionMap[goalKey] || { experiences: [0, 1, 2], circles: [0, 1], pals: [0, 1], opportunities: [0, 1] };
  return {
    experiences: indices.experiences.map((i) => sharedExperiences[i]),
    circles: indices.circles.map((i) => sharedCircles[i]),
    pals: indices.pals.map((i) => sharedPals[i]),
    opportunities: indices.opportunities.map((i) => sharedOpportunities[i]),
  };
};

export const getWeeklyProgress = (goalKey) => {
  const labels = {
    make_friends: 'Social Experiences',
    meet_entrepreneurs: 'Networking Experiences',
    improve_english: 'Language Sessions',
    stay_active: 'Active Experiences',
    explore_dubai: 'Explorations',
    discover_cafes: 'Café Visits',
    grow_business: 'Networking Events',
    learn_skills: 'Learning Experiences',
    meet_families: 'Family Meetups',
    find_tennis: 'Tennis Matches',
    practice_photo: 'Photo Walks',
    explore_nature: 'Nature Outings',
    volunteer: 'Volunteer Sessions',
    public_speaking: 'Speaking Workshops',
    build_confidence: 'Confidence Experiences',
    reduce_loneliness: 'Connection Experiences',
    build_habits: 'Habit-building Sessions',
  };
  return {
    attended: { label: labels[goalKey] || 'Experiences', count: 2, icon: Calendar },
    met: { label: 'New Members Met', count: 8, icon: Users },
    became_pals: { label: 'New Pals', count: 2, icon: Heart },
    hosted: { label: 'Hosted', count: 1, icon: Sparkles },
  };
};

export const getGoalMilestones = (goalKey) => {
  const milestoneSets = {
    make_friends: [
      { title: 'First Connection', description: 'Met your first new friend through Nmood', unlocked: true, date: 'Mar 2024' },
      { title: '5 New Pals', description: 'Built a growing circle of friends', unlocked: true, date: 'Jun 2024' },
      { title: '15 New Pals', description: 'A thriving social circle', unlocked: false, date: null },
      { title: '30 New Pals', description: 'A community around you', unlocked: false, date: null },
    ],
    meet_entrepreneurs: [
      { title: 'First Entrepreneur Met', description: 'Connected with a founder', unlocked: true, date: 'Apr 2024' },
      { title: '10 Entrepreneurs', description: 'A growing network of builders', unlocked: true, date: 'Aug 2024' },
      { title: '25 Entrepreneurs', description: 'Deeply connected to the startup scene', unlocked: false, date: null },
      { title: '50 Entrepreneurs', description: 'A powerhouse network', unlocked: false, date: null },
    ],
  };
  const fallback = [
    { title: 'First Step', description: 'Attended your first experience for this goal', unlocked: true, date: 'Mar 2024' },
    { title: '5 Experiences', description: 'Building momentum', unlocked: true, date: 'Jun 2024' },
    { title: '15 Experiences', description: 'Deeply invested in this goal', unlocked: false, date: null },
    { title: '30 Experiences', description: 'Goal achieved — you did it!', unlocked: false, date: null },
  ];
  return milestoneSets[goalKey] || fallback;
};

export const encouragingMessages = [
  'Every step counts. You\'re doing great.',
  'Small moments, big impact. Keep going.',
  'You\'re building something beautiful, one experience at a time.',
  'No pressure. Just possibilities.',
  'Progress isn\'t always loud. Yours is real.',
];