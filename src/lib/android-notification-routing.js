import { PushNotifications } from '@capacitor/push-notifications';
import { androidContentPath } from './android-content-link';

const fallback = '/notifications';
export function androidNotificationPath(notification) {
  const data = notification?.data;
  const raw = data?.path;
  if (typeof raw !== 'string' || /[\\%\s?#]/.test(raw)) return fallback;
  let path;
  if (raw.startsWith('/') && !raw.startsWith('//')) path = raw;
  else {
    try {
      const url = new URL(raw);
      if (url.origin !== 'https://app.nmood.app' || url.username || url.password) return fallback;
      path = url.pathname;
    } catch { return fallback; }
  }
  if (data?.event === 'direct_message' || data?.event === 'message_reply') {
    return /^\/messages\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(path) ? path : fallback;
  }
  return path === fallback ? path : androidContentPath(`https://app.nmood.app${path}`) || fallback;
}

// Install independently of permission/registration. Capacitor retains cold-start
// actions until this listener attaches; authorization remains with the chat route.
export function listenForAndroidNotificationOpen(onOpen) {
  let active = true;
  let listener;
  const handle = PushNotifications.addListener('pushNotificationActionPerformed', action => {
    if (!active) return;
    const path = action.actionId === 'nmood-renew' ? '/membership?intent=renew'
      : action.actionId === 'nmood-manage-membership' ? '/membership'
      : androidNotificationPath(action.notification);
    onOpen(path);
  });
  Promise.resolve(handle).then(value => { listener = value; if (!active) void listener.remove(); }).catch(() => {});
  return () => {
    active = false;
    if (listener) void listener.remove();
  };
}
