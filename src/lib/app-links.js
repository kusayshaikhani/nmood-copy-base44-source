function isNativeApp() {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.Capacitor?.isNativePlatform?.() ||
    ['ios', 'android'].includes(window.Capacitor?.getPlatform?.())
  );
}

export function getAppLink(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return isNativeApp()
    ? `nmood://${normalizedPath.slice(1)}`
    : new URL(normalizedPath, window.location.origin).toString();
}
