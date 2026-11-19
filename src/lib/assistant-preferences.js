import { callSupabaseRpc } from '@/api/supabaseClient';

const first = (value) => Array.isArray(value) ? value[0] || null : value;
export const getAssistantPreferences = async () => first(await callSupabaseRpc('nmood_get_my_assistant_preferences'));
export const saveAssistantPreferences = async (personalizationEnabled) => first(await callSupabaseRpc('nmood_save_my_assistant_preferences', { p_personalization_enabled: personalizationEnabled === true }));

export function explicitAssistantContext(member, searchPreferences, optedIn) {
  if (!optedIn) return undefined;
  return {
    profile: {
      display_name: String(member?.display_name || '').slice(0, 80),
      city: String(member?.city || '').slice(0, 120),
      country: String(member?.country || '').slice(0, 120),
      interests: Array.isArray(member?.interests) ? member.interests.slice(0, 20) : [],
      languages: Array.isArray(member?.languages) ? member.languages.slice(0, 20) : [],
    },
    search_preferences: {
      interests: Array.isArray(searchPreferences?.interests) ? searchPreferences.interests.slice(0, 20) : [],
      languages: Array.isArray(searchPreferences?.languages) ? searchPreferences.languages.slice(0, 20) : [],
      people_tags: Array.isArray(searchPreferences?.people_tags) ? searchPreferences.people_tags.slice(0, 20) : [],
      country: searchPreferences?.use_location === true ? String(searchPreferences.country || '').slice(0, 120) : '',
      city: searchPreferences?.use_location === true ? String(searchPreferences.city || '').slice(0, 120) : '',
    },
  };
}
