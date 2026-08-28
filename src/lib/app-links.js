export function getAppLink(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `https://app.nmood.app${normalizedPath}`;
}

export function getNativeAuthLink(path = '/auth') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `nmood:/${normalizedPath}`;
}
