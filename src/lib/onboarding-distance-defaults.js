// New onboarding drafts start with approximate-distance sharing enabled.
// Existing profiles keep their explicit saved choice; never infer a change
// from an older display-only field.
export function onboardingDistanceDefaults(profile = {}) {
 const isNewProfile = profile?.onboarding_completed === false || (
  profile?.id == null
  && profile?.show_distance === undefined
  && profile?.indicator_distance_consent === undefined
 );
 const hasSavedConsent = typeof profile.indicator_distance_consent === 'boolean';
 const consent = hasSavedConsent ? profile.indicator_distance_consent : isNewProfile;
 return {
  show_distance: profile.show_distance ?? consent,
  indicator_distance_consent: consent,
  // Device permission remains authoritative. A default sharing preference
  // must never imply that a usable location already exists.
  indicator_distance_calculation: profile.indicator_distance_calculation === true,
 };
}
