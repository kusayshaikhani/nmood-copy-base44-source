// Defence in depth for server projections. Never cache contact or account fields
// in a public-profile response, even if an older RPC returns additional columns.
const fields = new Set([
  'id', 'user_id', 'display_name', 'photo_url', 'photo_gallery', 'age', 'show_age',
  'height_cm', 'work_text', 'city', 'country', 'bio', 'interests', 'looking_for_tags', 'languages',
  'personality_traits', 'life_goals', 'journey_text', 'nationality', 'gender',
  'lifestyle', 'zodiac', 'family_plan', 'marital_status', 'community_only', 'identity_verified',
  'profile_visibility', 'show_online_status', 'show_last_seen', 'last_active_at',
  'show_distance', 'share_family_plan', 'share_marital_status', 'share_nationality', 'share_height', 'share_work', 'smoking', 'drinking', 'share_smoking', 'share_drinking', 'distance_km', 'circle_summaries', 'experience_summaries',
]);
export function publicProfileResponse(response) {
  if (response?.tier === 'upgrade') return { tier: 'upgrade', profile: null, blocked: false, server_premium: false };
  if (!response?.profile) return response;
  const profile = Object.fromEntries(Object.entries(response.profile).filter(([key]) => fields.has(key)));
  if (profile.show_age === false) delete profile.age;
  if (profile.show_distance === false) delete profile.distance_km;
  if (profile.share_family_plan === false) delete profile.family_plan;
  if (profile.share_marital_status === false) delete profile.marital_status;
  if (profile.share_nationality === false) delete profile.nationality;
  if (profile.share_height === false) delete profile.height_cm;
  if (profile.share_work === false) delete profile.work_text;
  if (profile.share_smoking === false) delete profile.smoking;
  if (profile.share_drinking === false) delete profile.drinking;
  return { profile, tier: response.tier, blocked: response.blocked === true, server_premium: response.server_premium === true };
}
