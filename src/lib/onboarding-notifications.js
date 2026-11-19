import { callSupabaseRpc } from '@/api/supabaseClient';
import { withTimeout } from './bounded-operation';
import { PUSH_PREFERENCES, enableNativePush, savePushPreferences } from './push-notifications';
import { saveOnboardingSettings } from './onboarding-settings';

// This metadata distinguishes an absent preference row from an explicit opt-out.
export async function getNotificationOnboardingState(options) {
  const value = await withTimeout(() => callSupabaseRpc('nmood_get_my_notification_onboarding_state', {}, options));
  if (!value || typeof value.has_saved_push_preferences !== 'boolean' || typeof value.onboarding_completed !== 'boolean'
    || typeof value.notif_email !== 'boolean' || typeof value.push?.enabled !== 'boolean'
    || !value.push.categories || Array.isArray(value.push.categories) || typeof value.push.categories !== 'object'
    || Object.values(value.push.categories).some(v => typeof v !== 'boolean')) throw new Error('Notification preferences unavailable.');
  return value;
}
export function notificationChoices(saved) {
  const fresh = !saved.has_saved_push_preferences && !saved.onboarding_completed;
  return {
    enabled: fresh ? true : saved.push.enabled,
    email: saved.notif_email,
    categories: Object.fromEntries(PUSH_PREFERENCES.map(({ id }) => [id, fresh ? true : (saved.push.categories[id] ?? id !== 'discovery_digest')])),
  };
}
export function applyNotificationChanges(choices, changes) {
  return { ...choices, ...changes, categories: { ...choices.categories, ...changes.categories } };
}
export async function saveNotificationOnboarding(changes, options) {
  // Re-read before saving: untouched saved choices win over stale UI/defaults.
  const latest = await getNotificationOnboardingState(options);
  const desired = applyNotificationChanges(notificationChoices(latest), changes);
  let pushAvailability = 'off';
  if (desired.enabled) {
    try { await withTimeout(() => enableNativePush()); pushAvailability = 'granted'; }
    catch { pushAvailability = 'unavailable'; } // Permission/device failure never blocks onboarding.
  }
  const pushRequested = (!latest.has_saved_push_preferences && !latest.onboarding_completed) || Object.hasOwn(changes, 'enabled') || Object.keys(changes.categories || {}).length > 0;
  const pushChanged = pushRequested && (desired.enabled !== latest.push.enabled || Object.entries(desired.categories).some(([key, value]) => value !== latest.push.categories[key]));
  if (pushChanged) {
    const saved = await withTimeout(() => savePushPreferences({ enabled: desired.enabled, categories: desired.categories }, options));
    if (saved?.enabled !== desired.enabled || Object.entries(desired.categories).some(([key, value]) => saved.categories?.[key] !== value)) throw new Error('Notification save was not confirmed.');
  }
  if (desired.email !== latest.notif_email) await saveOnboardingSettings({ notif_email: desired.email }, options);
  return { choices: desired, pushAvailability };
}
