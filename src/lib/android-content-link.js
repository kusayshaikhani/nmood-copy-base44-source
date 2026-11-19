// Content links only. Authentication/recovery URLs stay with their own coordinator.
export function androidContentPath(raw) {
 try {
  const url = new URL(raw);
  if (url.username || url.password || url.port || url.search || url.hash) return null;
  let path;
  if (url.protocol === 'https:' && url.hostname === 'app.nmood.app') path = url.pathname;
  else if (url.protocol === 'nmood:') path = `/${url.hostname}${url.pathname}`;
  else return null;
  // Never forward arbitrary paths, callback parameters, or external destinations.
  if (!/^\/(?:home|explore|pals|messages|nmood|my-creations|membership|circle|experience|nmood|pal)\/?$/.test(path) &&
      !/^\/(?:circle|experience|nmood|pal)\/[A-Za-z0-9_-]+\/?$/.test(path)) return null;
  return path;
 } catch { return null; }
}
