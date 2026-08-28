export function getAppLink(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `https://app.nmood.app${normalizedPath}`;
}
