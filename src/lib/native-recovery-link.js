import { App as NativeApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

function appPath(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'nmood:' || !url.hostname) return null;
    return `/${url.hostname}${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

function openRecoveryUrl(rawUrl) {
  const target = appPath(rawUrl);
  if (!target) return false;
  window.history.replaceState({}, '', target);
  window.dispatchEvent(new PopStateEvent('popstate'));
  return true;
}

export async function installNativeRecoveryLinkHandler() {
  if (!Capacitor.isNativePlatform()) return () => {};
  const listener = await NativeApp.addListener('appUrlOpen', ({ url }) => openRecoveryUrl(url));
  const launch = await NativeApp.getLaunchUrl();
  if (launch?.url) openRecoveryUrl(launch.url);
  return () => listener.remove();
}
