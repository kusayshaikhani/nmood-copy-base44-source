import { base44 } from '@/api/base44Client';

// Connect = premium, Inspire = vip. Explorer (basic/standard) = no access.
export function canAccessProfileViews(tierId) {
  const stored = typeof localStorage !== 'undefined'
    ? localStorage.getItem('inmood_membership_tier') || 'basic'
    : 'basic';
  const tier = tierId || stored;
  return tier === 'premium' || tier === 'vip';
}

export const PROFILE_VIEW_FILTERS = ['All', 'Today', 'This Week', 'Connected', 'Not Connected'];

export function getConnectionState(view) {
  if (view?.is_connected) return 'connected';
  if (view?.connection_pending) return 'pending';
  return 'not_connected';
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isToday(viewedAt) {
  return isSameDay(new Date(), new Date(viewedAt));
}

export function isThisWeek(viewedAt) {
  const diff = (new Date() - new Date(viewedAt)) / 86400000;
  return diff >= 0 && diff <= 7;
}

// Just now / X minutes ago / X hours ago / Yesterday / weekday / Last week / date
export function formatViewedTime(viewedAt) {
  const now = new Date();
  const then = new Date(viewedAt);
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  const sameDay = isSameDay(now, then);
  const diffHr = Math.floor(diffMin / 60);
  if (sameDay) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
  const startOfThen = new Date(then); startOfThen.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((startOfToday - startOfThen) / 86400000);
  if (dayDiff === 1) return 'Yesterday';
  if (dayDiff > 1 && dayDiff < 7) return then.toLocaleDateString('en-US', { weekday: 'long' });
  if (dayDiff >= 7 && dayDiff < 14) return 'Last week';
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Record a profile view, respecting the viewer's Private Browsing setting.
export async function recordProfileView({ owner, viewer }) {
  if (!owner?.id || !viewer?.id) return;
  if (owner.id === viewer.id) return; // don't record self-views
  if (viewer.profile_view_visibility === 'private') return; // viewer is browsing privately
  try {
    await base44.entities.ProfileView.create({
      profile_owner_id: String(owner.id),
      viewer_id: String(viewer.id),
      viewer_name: viewer.name || 'Someone',
      viewer_avatar: viewer.avatar || '',
      viewer_age: viewer.age ?? null,
      viewer_location: viewer.location || '',
      viewer_verified: !!viewer.verified,
      viewed_at: new Date().toISOString(),
      is_connected: !!viewer.is_connected,
      connection_pending: !!viewer.connection_pending,
      shared_interests: viewer.shared_interests || [],
      shared_moods: viewer.shared_moods || [],
      mutual_circles: viewer.mutual_circles || 0,
      mutual_experiences: viewer.mutual_experiences || 0,
    });
  } catch {
    // recording should never break the viewing experience
  }
}

// PB-001: SAMPLE_VIEWERS and buildSeedView removed — never fabricate profile views.
// Real ProfileView records are created only when a real member views a profile.