import { callSupabaseRpc } from '@/api/supabaseClient';
import { sanitizeRecommendationPreferences } from '@/lib/personalized-recommendations';

const first = (value) => Array.isArray(value) ? value[0] || null : value;

export async function getRecommendationPreferences() {
  return first(await callSupabaseRpc('nmood_get_my_recommendation_preferences'));
}

export async function saveRecommendationPreferences(preferences) {
  return first(await callSupabaseRpc('nmood_save_my_recommendation_preferences', {
    p_preferences: sanitizeRecommendationPreferences(preferences),
  }));
}

export async function clearRecommendationPreferences() {
  return callSupabaseRpc('nmood_clear_my_recommendation_preferences');
}

const SIGNAL_KEY = 'nmood_recommendation_signals_v1';

export function readLocalRecommendationSignals() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SIGNAL_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((v) => v && typeof v.tag === 'string').slice(0, 30) : [];
  } catch { return []; }
}

// Stores only a category/tag and action type: never message text, IDs, contacts, or coordinates.
export function recordLocalRecommendationSignal(tag, action = 'view') {
  const value = String(tag || '').trim().slice(0, 80);
  if (!value) return;
  const next = [{ tag: value, action }, ...readLocalRecommendationSignals().filter((v) => v.tag !== value)].slice(0, 30);
  try { localStorage.setItem(SIGNAL_KEY, JSON.stringify(next)); } catch { /* optional local signal */ }
}

export function clearLocalRecommendationSignals() {
  try { localStorage.removeItem(SIGNAL_KEY); } catch { /* optional local signal */ }
}
