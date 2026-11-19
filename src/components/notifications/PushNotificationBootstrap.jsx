import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { listenForAndroidNotificationOpen } from '@/lib/android-notification-routing';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { enableNativePush, getPushPreferences } from '@/lib/push-notifications';
import { refreshNotificationCenter } from '@/lib/notifications-store';
import { refreshUnreadMessageCount } from '@/lib/unread-messages-store';
export default function PushNotificationBootstrap() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    const stopAndroidOpen = Capacitor.getPlatform() === 'android'
      ? listenForAndroidNotificationOpen(path => navigate(path)) : null;
    getPushPreferences().then((prefs) => {
      if (!active || !prefs?.enabled) return;
      return enableNativePush({ requestPermission: false, onNotification: () => { refreshNotificationCenter(); refreshUnreadMessageCount(); }, onOpen: (notification) => {
        const path = notification?.data?.path;
        navigate(typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') ? path : '/notifications');
      }, onError: () => { window.dispatchEvent(new CustomEvent('nmood:push-registration-error')); } });
    }).catch(() => {});
    return () => { active = false; stopAndroidOpen?.(); };
  }, [user?.id, navigate]);
  return null;
}
