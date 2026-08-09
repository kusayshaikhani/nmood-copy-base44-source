// BUG-002: helpers to bust browser cache on profile photo URLs so a freshly
// uploaded image is always fetched from the server (never a stale cache entry).

export function stripQuery(url) {
  if (!url) return url;
  return url.split('?')[0];
}

export function bustPhotoUrl(url) {
  if (!url) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${Date.now()}`;
}