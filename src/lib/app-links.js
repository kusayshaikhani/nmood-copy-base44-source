export function getAppLink(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `https://app.nmood.app${normalizedPath}`;
}

// Native Supabase OAuth redirectTo destination for Google and Apple.
// Browsers use getAppLink('/auth'). A custom URL scheme launches the installed app directly —
// unlike a Universal Link, which iOS can hand to Safari instead of the app
// when it arrives at the end of an OAuth provider's redirect chain. Must
// exactly match the "nmood://auth" entry already present in Supabase's
// Redirect URLs allow-list.
export const NATIVE_OAUTH_REDIRECT = 'nmood://auth';

// Only Nmood's immutable candidate hosts; never treat arbitrary origins as trusted.
export function isNmoodCandidateOrigin(origin) {
 return /^https:\/\/[0-9a-f]{8}-nmood-copy-base44-source\.kusay-shaikhani\.workers\.dev$/.test(origin||'');
}
