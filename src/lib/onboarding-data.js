import { Coffee, Plane, Dumbbell, Footprints, Camera, Cpu, Briefcase, Film, Gamepad2, BookOpen, ChefHat, Users, Palette, Music, Trees, Heart } from 'lucide-react';

export const interests = [
  { id: 'coffee', label: 'Coffee', icon: Coffee },
  { id: 'travel', label: 'Travel', icon: Plane },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell },
  { id: 'walking', label: 'Walking', icon: Footprints },
  { id: 'photography', label: 'Photography', icon: Camera },
  { id: 'technology', label: 'Technology', icon: Cpu },
  { id: 'business', label: 'Business', icon: Briefcase },
  { id: 'movies', label: 'Movies', icon: Film },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'reading', label: 'Reading', icon: BookOpen },
  { id: 'cooking', label: 'Cooking', icon: ChefHat },
  { id: 'networking', label: 'Networking', icon: Users },
  { id: 'art', label: 'Art', icon: Palette },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'nature', label: 'Nature', icon: Trees },
  { id: 'wellness', label: 'Wellness', icon: Heart },
];

export const languages = [
  'English', 'Arabic', 'French', 'Spanish', 'German', 'Hindi', 'Urdu', 'Turkish',
  'Russian', 'Chinese', 'Japanese', 'Portuguese', 'Italian', 'Korean', 'Persian',
  'Bengali', 'Indonesian', 'Malay', 'Dutch', 'Swedish', 'Hebrew', 'Polish',
];

export const countries = [
  'United Arab Emirates', 'Saudi Arabia', 'Egypt', 'Jordan', 'Lebanon', 'Qatar',
  'Kuwait', 'Bahrain', 'Oman', 'Iraq', 'Morocco', 'Algeria', 'Tunisia',
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France',
  'Spain', 'Italy', 'Netherlands', 'Belgium', 'Switzerland', 'Sweden', 'Norway',
  'Turkey', 'India', 'Pakistan', 'Bangladesh', 'Indonesia', 'Malaysia',
  'Japan', 'China', 'South Korea', 'Philippines', 'Singapore', 'Thailand',
  'Brazil', 'Mexico', 'Argentina', 'South Africa', 'Nigeria', 'Kenya',
  'Other',
];

// BUG-009 GCC Launch Localization: RC1 member-facing gender selection is
// restricted to Male/Female for the UAE/GCC launch market. The Member entity
// schema (base44/entities/Member.jsonc) retains its full enum for future
// international expansion — only the selectable options are constrained.
export const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

export const lifestyleOptions = [
  { value: 'early_bird', label: 'Early Bird' },
  { value: 'night_owl', label: 'Night Owl' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'social_butterfly', label: 'Social Butterfly' },
  { value: 'homebody', label: 'Homebody' },
  { value: 'adventurer', label: 'Adventurer' },
];

// MP-004 — Reference-data localization helpers (additive; arrays above unchanged).
// Endonym display names for the language picker — each language in its own name,
// correct in every UI language without per-locale translation.
export const LANGUAGE_NATIVE_NAMES = {
  English: 'English', Arabic: 'العربية', French: 'Français', Spanish: 'Español',
  German: 'Deutsch', Hindi: 'हिन्दी', Urdu: 'اردو', Turkish: 'Türkçe',
  Russian: 'Русский', Chinese: '中文', Japanese: '日本語', Portuguese: 'Português',
  Italian: 'Italiano', Korean: '한국어', Persian: 'فارسی', Bengali: 'বাংলা',
  Indonesian: 'Bahasa Indonesia', Malay: 'Bahasa Melayu', Dutch: 'Nederlands',
  Swedish: 'Svenska', Hebrew: 'עברית', Polish: 'Polski',
};

// English country name → ISO 3166-1 alpha-2 code, for Intl.DisplayNames rendering
// (native country names in every locale with zero per-locale translation entries).
export const COUNTRY_NAME_TO_CODE = {
  'United Arab Emirates': 'AE', 'Saudi Arabia': 'SA', 'Egypt': 'EG', 'Jordan': 'JO',
  'Lebanon': 'LB', 'Qatar': 'QA', 'Kuwait': 'KW', 'Bahrain': 'BH', 'Oman': 'OM',
  'Iraq': 'IQ', 'Morocco': 'MA', 'Algeria': 'DZ', 'Tunisia': 'TN',
  'United States': 'US', 'United Kingdom': 'GB', 'Canada': 'CA', 'Australia': 'AU',
  'Germany': 'DE', 'France': 'FR', 'Spain': 'ES', 'Italy': 'IT', 'Netherlands': 'NL',
  'Belgium': 'BE', 'Switzerland': 'CH', 'Sweden': 'SE', 'Norway': 'NO', 'Turkey': 'TR',
  'India': 'IN', 'Pakistan': 'PK', 'Bangladesh': 'BD', 'Indonesia': 'ID',
  'Malaysia': 'MY', 'Japan': 'JP', 'China': 'CN', 'South Korea': 'KR',
  'Philippines': 'PH', 'Singapore': 'SG', 'Thailand': 'TH', 'Brazil': 'BR',
  'Mexico': 'MX', 'Argentina': 'AR', 'South Africa': 'ZA', 'Nigeria': 'NG',
  'Kenya': 'KE', 'Other': '',
};