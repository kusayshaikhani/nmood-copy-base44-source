/**
 * FM-003 Member Management Center — pure presentation helpers.
 * Single source of truth for computed member fields, search, filters, sorting.
 */
import { formatDistanceToNow, format } from 'date-fns';

export const PROFILE_CHECKS = [
  { key: 'display_name', min: 1 },
  { key: 'date_of_birth', min: 1 },
  { key: 'gender', min: 1 },
  { key: 'country', min: 1 },
  { key: 'city', min: 1 },
  { key: 'languages', min: 1, array: true },
  { key: 'interests', min: 3, array: true },
  { key: 'bio', min: 1 },
  { key: 'photo_url', min: 1 },
  { key: 'lifestyle', min: 1 },
];

export function profileCompletion(member) {
  if (!member) return 0;
  let filled = 0;
  for (const c of PROFILE_CHECKS) {
    const val = member[c.key];
    const len = Array.isArray(val) ? val.length : val ? String(val).trim().length : 0;
    if (len >= c.min) filled++;
  }
  return Math.round((filled / PROFILE_CHECKS.length) * 100);
}

// 5-factor trust score out of 100 (Email, Phone, Photo, Profile complete, Standing).
export function trustScore(member) {
  if (!member) return 0;
  let score = 0;
  if (member.email) score += 20;
  if (member.phone_verified) score += 20;
  if (member.photo_url) score += 20;
  if (profileCompletion(member) >= 80) score += 20;
  if ((member.admin_status || 'active') === 'active') score += 20;
  return score;
}

export function fullName(member) {
  if (!member) return '—';
  return member.display_name || [member.first_name, member.last_name].filter(Boolean).join(' ') || '—';
}

export function username(member) {
  if (!member) return '—';
  if (member.email) return '@' + member.email.split('@')[0];
  return member.display_name ? '@' + member.display_name.toLowerCase().replace(/\s+/g, '_') : '—';
}

export function memberShortId(member) {
  if (!member?.id) return '—';
  return '#' + String(member.id).slice(-6);
}

export function membershipTier(member, membershipMap) {
  const m = membershipMap?.[member?.created_by_id];
  return m?.type === 'premium' && ['active', 'trial', 'grace_period'].includes(m?.status) ? 'premium' : 'explorer';
}

export function verificationStatus(member) {
  if (!member) return 'unverified';
  return member.phone_verified ? 'verified' : 'email';
}

export function primaryLanguage(member) {
  const langs = member?.languages;
  return Array.isArray(langs) && langs.length ? langs[0] : '—';
}

export function isWithinDays(dateStr, days) {
  if (!dateStr) return false;
  const t = new Date(dateStr).getTime();
  return Number.isFinite(t) && Date.now() - t < days * 86400000;
}

export function isWithinHours(dateStr, hours) {
  if (!dateStr) return false;
  const t = new Date(dateStr).getTime();
  return Number.isFinite(t) && Date.now() - t < hours * 3600000;
}

// Approximate online proxy from last record update (no real presence tracking).
export function onlineDot(member) {
  if (isWithinHours(member?.updated_date, 1)) return 'online';
  if (isWithinDays(member?.updated_date, 1)) return 'recent';
  return 'offline';
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const t = new Date(dateStr);
  if (Number.isNaN(t.getTime())) return '—';
  return format(t, 'dd MMM yyyy');
}

export function formatRelative(dateStr) {
  if (!dateStr) return '—';
  const t = new Date(dateStr);
  if (Number.isNaN(t.getTime())) return '—';
  try { return formatDistanceToNow(t, { addSuffix: true }); } catch { return '—'; }
}

export const STATUS_LABELS = {
  active: 'Active',
  suspended: 'Suspended',
  deactivated: 'Deactivated',
  banned: 'Banned',
  deleted: 'Deleted',
};

export const STATUS_BADGE = {
  active: 'default',
  suspended: 'secondary',
  deactivated: 'secondary',
  banned: 'destructive',
  deleted: 'secondary',
};

export function searchMatch(member, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  return [member.display_name, member.first_name, member.last_name, member.email, member.id, member.phone]
    .some((v) => v && String(v).toLowerCase().includes(q));
}

export function applyFiltersAndSearch(members, search, filters) {
  let result = members;
  if (search) result = result.filter((m) => searchMatch(m, search));
  if (filters.membership) result = result.filter((m) => m._tier === filters.membership);
  if (filters.verification) result = result.filter((m) => verificationStatus(m) === filters.verification);
  if (filters.status) result = result.filter((m) => (m.admin_status || 'active') === filters.status);
  if (filters.country) result = result.filter((m) => (m.country || '').toLowerCase() === filters.country.toLowerCase());
  if (filters.city) result = result.filter((m) => (m.city || '').toLowerCase() === filters.city.toLowerCase());
  if (filters.language) result = result.filter((m) => Array.isArray(m.languages) && m.languages.some((l) => l.toLowerCase() === filters.language.toLowerCase()));
  if (filters.trustMin) result = result.filter((m) => trustScore(m) >= Number(filters.trustMin));
  if (filters.online === 'online') result = result.filter((m) => onlineDot(m) === 'online');
  if (filters.online === 'offline') result = result.filter((m) => onlineDot(m) !== 'online');
  if (filters.recentlyRegistered) result = result.filter((m) => isWithinDays(m.created_date, 7));
  if (filters.recentlyActive) result = result.filter((m) => isWithinDays(m.updated_date, 7));
  return result;
}

export function applySort(members, sort) {
  const { key, dir } = sort;
  const factor = dir === 'asc' ? 1 : -1;
  return [...members].sort((a, b) => {
    let av, bv;
    switch (key) {
      case 'name': av = fullName(a).toLowerCase(); bv = fullName(b).toLowerCase(); break;
      case 'created_date': av = new Date(a.created_date || 0).getTime(); bv = new Date(b.created_date || 0).getTime(); break;
      case 'last_active': av = new Date(a.updated_date || 0).getTime(); bv = new Date(b.updated_date || 0).getTime(); break;
      case 'trust': av = trustScore(a); bv = trustScore(b); break;
      case 'membership': av = a._tier; bv = b._tier; break;
      case 'country': av = (a.country || '').toLowerCase(); bv = (b.country || '').toLowerCase(); break;
      default: return 0;
    }
    if (av < bv) return -1 * factor;
    if (av > bv) return 1 * factor;
    return 0;
  });
}

export function countActiveFilters(filters) {
  let n = 0;
  ['membership', 'verification', 'status', 'country', 'city', 'language', 'trustMin', 'online'].forEach((k) => { if (filters[k]) n++; });
  if (filters.recentlyRegistered) n++;
  if (filters.recentlyActive) n++;
  return n;
}