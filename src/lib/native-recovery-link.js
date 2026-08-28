import { App as NativeApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { restoreSupabaseSessionFromUrl } from '@/api/supabaseClient';

function appPath(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol === 'https:' && url.hostname === 'app.nmood.app') {
      return `${url.pathname}${url.search}${url.hash}`;
    }
    if (url.protocol === 'nmood:' && url.hostname) {
      return `/${url.hostname}${url.pathname}${url.search}${url.hash}`;
    }
    return null;
  } catch {
    return null;
  }
}

async function openRecoveryUrl(rawUrl) {
  const target = appPath(rawUrl);
  if (!target) return false;
  const session = await restoreSupabaseSessionFromUrl(rawUrl);
  const callbackPath = target.split('?')[0].split('#')[0];
  if (callbackPath === '/auth' && !session) {
    throw new Error('OAuth callback did not contain a session.');
  }
  window.history.replaceState({}, '', target);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.dispatchEvent(new CustomEvent('nmood:auth-callback', { detail: { url: rawUrl } }));
  return true;
}

async function closeExternalBrowser() {
  try {
    await Browser.close();
  } catch {
    // The browser may already have closed itself on the deep-link callback.
  }
}

export async function installNativeRecoveryLinkHandler() {
  if (!Capacitor.isNativePlatform()) return () => {};
  const listener = await NativeApp.addListener('appUrlOpen', async ({ url }) => {
    try {
      if (await openRecoveryUrl(url)) await closeExternalBrowser();
    } catch {
      window.sessionStorage.setItem('nmood:oauth_callback_error', '1');
      window.history.replaceState({}, '', '/auth');
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.dispatchEvent(new CustomEvent('nmood:auth-callback-error'));
    }
  });
  const launch = await NativeApp.getLaunchUrl();
  if (launch?.url) {
    try {
      if (await openRecoveryUrl(launch.url)) await closeExternalBrowser();
    } catch {
      window.sessionStorage.setItem('nmood:oauth_callback_error', '1');
      window.dispatchEvent(new CustomEvent('nmood:auth-callback-error'));
    }
  }
  return () => listener.remove();
}
