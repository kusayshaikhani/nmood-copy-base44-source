/**
 * Local-only preview circle data for the Communities empty state.
 * These are NOT database records — they exist only in memory for design review.
 * No records, users, memberships, messages, notifications, or analytics are created.
 * Automatically hidden when at least one genuine public Community record exists.
 */
export const PREVIEW_CIRCLES = [
  {
    id: 'preview-entrepreneurs',
    name: 'Entrepreneurs',
    category: 'Business',
    member_count: 320,
    cover_photo: 'https://media.base44.com/images/public/6a4881a4266c514a9d9ebc6c/bb30e1ae4_generated_image.png',
    description: 'Connect with founders, share ideas, and grow your startup journey together. Weekly meetups, pitch nights, and mentorship sessions.',
  },
  {
    id: 'preview-photography',
    name: 'Photography',
    category: 'Creative',
    member_count: 245,
    cover_photo: 'https://media.base44.com/images/public/6a4881a4266c514a9d9ebc6c/c93a823d3_generated_image.png',
    description: 'From beginners to pros — share your shots, learn new techniques, and explore the city through your lens. Monthly photo walks and workshops.',
  },
  {
    id: 'preview-fitness',
    name: 'Fitness',
    category: 'Health',
    member_count: 410,
    cover_photo: 'https://media.base44.com/images/public/6a4881a4266c514a9d9ebc6c/3bbfd357e_generated_image.png',
    description: 'Find your training partners, join group workouts, and stay motivated. From HIIT to yoga, we move together every day.',
  },
  {
    id: 'preview-coffee',
    name: 'Coffee Lovers',
    category: 'Social',
    member_count: 180,
    cover_photo: 'https://media.base44.com/images/public/6a4881a4266c514a9d9ebc6c/cf066231f_generated_image.png',
    description: 'Discover the best brews in the city, learn latte art, and meet fellow caffeine enthusiasts over a perfect cup every weekend.',
  },
  {
    id: 'preview-travel',
    name: 'Travel',
    category: 'Adventure',
    member_count: 295,
    cover_photo: 'https://media.base44.com/images/public/6a4881a4266c514a9d9ebc6c/1f9fd1b69_generated_image.png',
    description: 'Plan trips together, share hidden gems, and explore new destinations. From weekend getaways to bucket-list adventures.',
  },
  {
    id: 'preview-gaming',
    name: 'Gaming',
    category: 'Entertainment',
    member_count: 360,
    cover_photo: 'https://media.base44.com/images/public/6a4881a4266c514a9d9ebc6c/de6a89c2d_generated_image.png',
    description: 'Squad up, compete in tournaments, and discover new games. From casual sessions to esports — all skill levels welcome.',
  },
  {
    id: 'preview-music',
    name: 'Music',
    category: 'Arts',
    member_count: 220,
    cover_photo: 'https://media.base44.com/images/public/6a4881a4266c514a9d9ebc6c/de0eb1d8d_generated_image.png',
    description: 'Jam sessions, concert buddies, and music discovery. Share what you are listening to and find your next favorite artist.',
  },
  {
    id: 'preview-book-club',
    name: 'Book Club',
    category: 'Learning',
    member_count: 150,
    cover_photo: 'https://media.base44.com/images/public/6a4881a4266c514a9d9ebc6c/27559e315_generated_image.png',
    description: 'Monthly reads, lively discussions, and a cozy community of readers. From fiction to self-improvement — every voice matters.',
  },
];