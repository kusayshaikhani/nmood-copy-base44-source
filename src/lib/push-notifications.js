import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { callSupabaseRpc } from '@/api/supabaseClient';
export const PUSH_PREFERENCES = [
  { id: 'messages', label: 'Direct messages and replies' },
  { id: 'connections', label: 'Connection activity' },
  { id: 'circles', label: 'Circle invitations, requests, chat and activity' },
  { id: 'experiences', label: 'Experience invitations, RSVPs, reminders and changes' },
  { id: 'content_activity', label: 'Reactions and replies to your content' },
  { id: 'account_security', label: 'Account, verification and security' },
  { id: 'subscription', label: 'Subscription and purchase updates' },
  { id: 'safety_moderation', label: 'Safety reports and enforcement notices' },
  { id: 'discovery_digest', label: 'Optional discovery digest' },
];
let listenersInstalled = false;
let registrationPromise = null;
const platform = () => Capacitor.getPlatform();
export const getPushPreferences = () => callSupabaseRpc('nmood_get_push_preferences');
export const savePushPreferences = (preferences, options) => options
  ? callSupabaseRpc('nmood_set_push_preferences', { p_preferences: preferences }, options)
  : callSupabaseRpc('nmood_set_push_preferences', { p_preferences: preferences });
export async function disablePushForThisDevice() {
  if (Capacitor.isNativePlatform()) await callSupabaseRpc('nmood_disable_push_device', { p_platform: platform() });
}
export async function enableNativePush({ onNotification, onOpen, onError, requestPermission = true } = {}) {
  if (!Capacitor.isNativePlatform()) throw new Error('Push notifications are available in the Nmood mobile app.');
  if (registrationPromise) return registrationPromise;
  registrationPromise = (async () => {
    if (!listenersInstalled) {
      await PushNotifications.addListener('registration', async ({ value }) => {
        if (value) await callSupabaseRpc('nmood_register_push_device', { p_token: value, p_platform: platform(), p_locale: navigator.language || null });
      });
      await PushNotifications.addListener('registrationError', (error) => { const safe = new Error('Nmood could not register this device for notifications.'); safe.code = 'NMG-PUSH-REGISTER'; onError?.(safe, error?.error); });
      await PushNotifications.addListener('pushNotificationReceived', (notification) => { window.dispatchEvent(new Event('nmood:notifications-changed')); if (String(notification.data?.event || '').startsWith('subscription_')) window.dispatchEvent(new Event('nmood:subscription-changed')); onNotification?.(notification); });
      if (platform() !== 'android') await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const path = action.actionId === 'nmood-renew' ? '/membership?intent=renew' : action.actionId === 'nmood-manage-membership' ? '/membership' : action.notification?.data?.path;
        onOpen?.({ ...action.notification, data: { ...action.notification?.data, path } });
      });
      listenersInstalled = true;
    }
    let permission = await PushNotifications.checkPermissions();
    if (permission.receive !== 'granted' && !requestPermission) return { permission: permission.receive };
    if (permission.receive === 'prompt' || permission.receive === 'prompt-with-rationale') permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') throw new Error('Notifications are disabled. Enable them in your device Settings to receive alerts.');
    await PushNotifications.register();
    return { permission: 'granted' };
  })().finally(() => { registrationPromise = null; });
  return registrationPromise;
}
