// Master Interests Dataset — categorized catalog, single source of truth.
// Each interest has a stable key + English label; labels are localizable via
// translation keys `master.interests.<key>` (fallback to the English label here).

export const INTEREST_CATEGORIES = [
  {
    key: 'sports',
    label: 'Sports',
    interests: [
      { key:'football', label:'Football' }, { key:'basketball', label:'Basketball' },
      { key:'padel', label:'Padel' }, { key:'tennis', label:'Tennis' },
      { key:'running', label:'Running' }, { key:'cycling', label:'Cycling' },
      { key:'swimming', label:'Swimming' }, { key:'golf', label:'Golf' },
      { key:'gym', label:'Gym' }, { key:'yoga', label:'Yoga' },
      { key:'pilates', label:'Pilates' }, { key:'crossfit', label:'CrossFit' },
      { key:'boxing', label:'Boxing' }, { key:'martial_arts', label:'Martial Arts' },
      { key:'climbing', label:'Climbing' }, { key:'surfing', label:'Surfing' },
      { key:'skiing', label:'Skiing' }, { key:'snowboarding', label:'Snowboarding' },
      { key:'horse_riding', label:'Horse Riding' }, { key:'volleyball', label:'Volleyball' },
      { key:'cricket', label:'Cricket' }, { key:'rugby', label:'Rugby' },
      { key:'badminton', label:'Badminton' }, { key:'table_tennis', label:'Table Tennis' },
      { key:'skating', label:'Skating' }, { key:'diving', label:'Diving' },
    ],
  },
  {
    key: 'outdoor',
    label: 'Outdoor Activities',
    interests: [
      { key:'camping', label:'Camping' }, { key:'hiking', label:'Hiking' },
      { key:'fishing', label:'Fishing' }, { key:'road_trips', label:'Road Trips' },
      { key:'beach', label:'Beach' }, { key:'nature', label:'Nature' },
      { key:'photography', label:'Photography' }, { key:'bird_watching', label:'Bird Watching' },
      { key:'desert_adventures', label:'Desert Adventures' }, { key:'stargazing', label:'Stargazing' },
      { key:'gardening', label:'Gardening' }, { key:'kayaking', label:'Kayaking' },
      { key:'paddleboarding', label:'Paddleboarding' }, { key:'sailing', label:'Sailing' },
    ],
  },
  {
    key: 'food_drinks',
    label: 'Food & Drinks',
    interests: [
      { key:'coffee', label:'Coffee' }, { key:'tea', label:'Tea' },
      { key:'brunch', label:'Brunch' }, { key:'cooking', label:'Cooking' },
      { key:'baking', label:'Baking' }, { key:'bbq', label:'BBQ' },
      { key:'street_food', label:'Street Food' }, { key:'fine_dining', label:'Fine Dining' },
      { key:'desserts', label:'Desserts' }, { key:'healthy_eating', label:'Healthy Eating' },
      { key:'wine', label:'Wine' }, { key:'cocktails', label:'Cocktails' },
      { key:'vegan', label:'Vegan' }, { key:'foodie', label:'Foodie' },
    ],
  },
  {
    key: 'entertainment',
    label: 'Entertainment',
    interests: [
      { key:'movies', label:'Movies' }, { key:'tv_series', label:'TV Series' },
      { key:'anime', label:'Anime' }, { key:'gaming', label:'Gaming' },
      { key:'board_games', label:'Board Games' }, { key:'escape_rooms', label:'Escape Rooms' },
      { key:'comedy', label:'Comedy' }, { key:'theatre', label:'Theatre' },
      { key:'concerts', label:'Concerts' }, { key:'festivals', label:'Festivals' },
      { key:'karaoke', label:'Karaoke' }, { key:'amusement_parks', label:'Amusement Parks' },
    ],
  },
  {
    key: 'music',
    label: 'Music',
    interests: [
      { key:'pop', label:'Pop' }, { key:'rock', label:'Rock' },
      { key:'jazz', label:'Jazz' }, { key:'classical', label:'Classical' },
      { key:'hip_hop', label:'Hip Hop' }, { key:'rnb', label:'R&B' },
      { key:'country_music', label:'Country' }, { key:'edm', label:'EDM' },
      { key:'house', label:'House' }, { key:'techno', label:'Techno' },
      { key:'latin_music', label:'Latin' }, { key:'kpop', label:'K-Pop' },
      { key:'reggae', label:'Reggae' }, { key:'indie', label:'Indie' },
    ],
  },
  {
    key: 'arts',
    label: 'Arts',
    interests: [
      { key:'painting', label:'Painting' }, { key:'drawing', label:'Drawing' },
      { key:'pottery', label:'Pottery' }, { key:'sculpture', label:'Sculpture' },
      { key:'writing', label:'Writing' }, { key:'poetry', label:'Poetry' },
      { key:'reading', label:'Reading' }, { key:'museums', label:'Museums' },
      { key:'art_galleries', label:'Art Galleries' }, { key:'calligraphy', label:'Calligraphy' },
      { key:'design', label:'Design' }, { key:'crafts', label:'Crafts' },
    ],
  },
  {
    key: 'learning',
    label: 'Learning',
    interests: [
      { key:'technology', label:'Technology' }, { key:'artificial_intelligence', label:'Artificial Intelligence' },
      { key:'programming', label:'Programming' }, { key:'business', label:'Business' },
      { key:'investing', label:'Investing' }, { key:'marketing', label:'Marketing' },
      { key:'languages', label:'Languages' }, { key:'history', label:'History' },
      { key:'science', label:'Science' }, { key:'astronomy', label:'Astronomy' },
      { key:'philosophy', label:'Philosophy' }, { key:'psychology', label:'Psychology' },
    ],
  },
  {
    key: 'lifestyle',
    label: 'Lifestyle',
    interests: [
      { key:'travel', label:'Travel' }, { key:'fashion', label:'Fashion' },
      { key:'luxury', label:'Luxury' }, { key:'minimalism', label:'Minimalism' },
      { key:'wellness', label:'Wellness' }, { key:'meditation', label:'Meditation' },
      { key:'self_development', label:'Self Development' }, { key:'pets', label:'Pets' },
      { key:'cats', label:'Cats' }, { key:'dogs', label:'Dogs' },
      { key:'fitness', label:'Fitness' }, { key:'sustainability', label:'Sustainability' },
    ],
  },
  {
    key: 'family',
    label: 'Family',
    interests: [
      { key:'parenting', label:'Parenting' }, { key:'kids_activities', label:'Kids Activities' },
      { key:'family_time', label:'Family Time' }, { key:'grandparents', label:'Grandparents' },
    ],
  },
  {
    key: 'social',
    label: 'Social',
    interests: [
      { key:'networking', label:'Networking' }, { key:'meeting_new_people', label:'Meeting New People' },
      { key:'deep_conversations', label:'Deep Conversations' }, { key:'coffee_chats', label:'Coffee Chats' },
      { key:'group_activities', label:'Group Activities' }, { key:'volunteering', label:'Volunteering' },
      { key:'spirituality', label:'Spirituality' }, { key:'mindfulness', label:'Mindfulness' },
    ],
  },
];

// Flat list with category attached — the canonical searchable catalog.
export const INTERESTS = INTEREST_CATEGORIES.flatMap((cat) =>
  cat.interests.map((i) => ({ ...i, category: cat.key }))
);

export const INTEREST_MAP = Object.fromEntries(INTERESTS.map((i) => [i.key, i]));