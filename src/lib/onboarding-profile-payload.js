import { SETTING_KEYS } from './onboarding-settings';
import { prepareWorkFields } from './work-profile';
const CLIENT_ONLY_FIELDS = new Set([
  ...SETTING_KEYS, '_settingsChanges', '_personalChanges',
  'photo_gallery', 'id', 'user_id', 'created_date', 'updated_date', 'created_by', 'created_by_id',
  'date_of_birth', 'eligibility_status', 'eligibility_verified_at', 'dob_change_requested_at',
]);

export function buildOnboardingProgressPayload(data = {}) {
  data = prepareWorkFields(data);
  const fields = Object.fromEntries(
    Object.entries(data).filter(([key]) => !CLIENT_ONLY_FIELDS.has(key)),
  );
  if (Object.prototype.hasOwnProperty.call(data, 'gender')) {
    fields.gender = typeof data.gender === 'string' ? data.gender.trim() : data.gender;
  }
  return { ...fields, onboarding_completed: false };
}

export function requirePersistedOnboardingGender(requested, persisted) {
  const expected = typeof requested === 'string' ? requested.trim() : '';
  if (expected && persisted?.gender !== expected) {
    throw new Error('Your gender selection could not be saved. Please try again.');
  }
  return persisted;
}

export function requirePersistedOnboardingHereFor(requested, persisted) {
  const expected = typeof requested === 'string' ? requested.trim() : '';
  if (expected && persisted?.dating_looking_for_gender !== expected) {
    throw new Error('Your “I’m here for” selection could not be saved. Please try again.');
  }
  return persisted;
}

export function requirePersistedOnboardingLookingForTags(requested, persisted) {
  if (!Array.isArray(requested) || requested.length === 0) return persisted;
  const saved = Array.isArray(persisted?.looking_for_tags) ? persisted.looking_for_tags : [];
  if (requested.some((tag) => !saved.includes(tag))) {
    throw new Error('What you are looking for could not be saved. Please try again.');
  }
  return persisted;
}
