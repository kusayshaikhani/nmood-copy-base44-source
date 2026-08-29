export function getAppLink(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `https://app.nmood.app${normalizedPath}`;
}

// The ONLY active Supabase OAuth redirectTo destination for Google and
// Apple. A custom URL scheme always launches the installed app directly —
// unlike a Universal Link, which iOS can hand to Safari instead of the app
// when it arrives at the end of an OAuth provider's redirect chain. Must
// exactly match the "nmood://auth" entry already present in Supabase's
// Redirect URLs allow-list.
export const NATIVE_OAUTH_REDIRECT = 'nmood://auth';
