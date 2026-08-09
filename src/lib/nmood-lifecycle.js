/**
 * Nmood Lifecycle Engine — automatic status progression, real-time
 * countdowns, and AI priority scoring. No manual moderation required
 * unless a Nmood is reported.
 *
 * Status flow: draft → published → trending → starting_soon → live_now
 *              → completed → expired → archived
 */

export function computeNmoodStatus(post, now = new Date()) {
  if (!post) return 'published';
  if (post.manual_status === 'archived') return 'archived';
  if (post.manual_status === 'completed') return 'completed';

  if (!post.start_time || !post.end_time) {
    if ((post.interested_count || 0) >= 5) return 'trending';
    return 'published';
  }

  const start = new Date(post.start_time).getTime();
  const end = new Date(post.end_time).getTime();
  const expires = post.expires_at ? new Date(post.expires_at).getTime() : end;
  const nowMs = now.getTime();

  if (nowMs >= end) return 'completed';
  if (nowMs >= expires && nowMs < start) return 'expired';
  if (nowMs >= start && nowMs < end) return 'live_now';
  if (start - nowMs <= 3600000 && start - nowMs > 0) return 'starting_soon';
  if ((post.interested_count || 0) >= 5) return 'trending';

  return 'published';
}

export function getCountdown(post, now = new Date()) {
  if (!post || !post.start_time || !post.end_time) return null;
  const start = new Date(post.start_time).getTime();
  const end = new Date(post.end_time).getTime();
  const nowMs = now.getTime();

  if (nowMs < start) return { type: 'starts_in', ms: start - nowMs };
  if (nowMs >= start && nowMs < end) return { type: 'ends_in', ms: end - nowMs };
  return null;
}

export function formatCountdown(ms) {
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const totalSeconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function formatCountdownString(ms) {
  const { days, hours, minutes, seconds } = formatCountdown(ms);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

/**
 * AI Priority Score — the recommendation engine weighs:
 * starting soon > nearby > InMood match > schedule match >
 * interests match > available spots.
 */
export function computeAiScore(post, userContext = {}, now = new Date()) {
  if (!post) return 0;
  let score = 40;
  const status = computeNmoodStatus(post, now);

  if (status === 'starting_soon') score += 30;
  else if (status === 'live_now') score += 20;
  else if (status === 'trending') score += 15;

  if ((post.distance_km || 999) <= 2) score += 15;
  else if ((post.distance_km || 999) <= 5) score += 8;

  if (post.max_participants && (post.participants_joined || 0) < post.max_participants) score += 10;

  if (userContext.interests && post.member_interests) {
    const matches = post.member_interests.filter((i) => userContext.interests.includes(i)).length;
    score += matches * 3;
  }
  if (userContext.inmood && post.category && userContext.inmood === post.category) score += 10;

  return Math.min(100, Math.max(0, score));
}

export function sortByAiPriority(posts, userContext = {}, now = new Date()) {
  return [...posts].sort((a, b) => computeAiScore(b, userContext, now) - computeAiScore(a, userContext, now));
}