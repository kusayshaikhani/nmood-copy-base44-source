import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

export async function sharePublicContent({ title, text, url, onCopied } = {}) {
  const payload = {
    title: String(title || 'Nmood').slice(0, 120),
    text: String(text || '').slice(0, 500),
    url: /^https?:\/\//i.test(url || '') ? url : undefined,
    dialogTitle: 'Share with…',
  };
  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share(payload);
      return { shared: true, copied: false };
    }
    if (navigator.share) {
      await navigator.share(payload);
      return { shared: true, copied: false };
    }
  } catch (error) {
    if (/cancel/i.test(error?.message || '')) return { shared: false, copied: false, cancelled: true };
  }
  const fallback = [payload.text, payload.url].filter(Boolean).join('\n');
  if (!fallback) return { shared: false, copied: false };
  try {
    await navigator.clipboard.writeText(fallback);
    onCopied?.();
    return { shared: false, copied: true };
  } catch {
    return { shared: false, copied: false, error: 'Sharing is unavailable on this device.' };
  }
}
