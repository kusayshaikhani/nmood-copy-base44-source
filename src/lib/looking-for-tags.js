/**
 * Structured "What are you looking for?" tags and zodiac signs.
 * Used by EditProfileSheet (selection) and Search (filtering).
 *
 * Values are stable keys stored on the Member entity (looking_for_tags / zodiac).
 * Labels are resolved through the localization service via lookingForTagLabel()
 * and zodiacLabel().
 */

export const LOOKING_FOR_TAGS = [
  'soulmate',
  'serious_relationship',
  'long_term_partner',
  'dating',
  'casual_dating',
  'figuring_it_out',
  'new_friends',
  'activity_partner',
  'travel_companion',
  'group_hangouts',
  'networking',
  'home_gathering',
  'local_guide',
  'language_exchange',
];

export const ZODIAC_SIGNS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
];

export function lookingForTagLabel(t, key) {
  return t(`profile.looking_for_tag.${key}`, { defaultValue: key.replace(/_/g, ' ') });
}

export function zodiacLabel(t, key) {
  return t(`profile.zodiac.${key}`, { defaultValue: key });
}