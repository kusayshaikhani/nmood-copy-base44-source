export const ANDROID_INITIAL_DECK_BATCH = 24;
export const ANDROID_BACKGROUND_DECK_PAGES = 3;

export function mergeDeckMembers(primary = [], prefetched = []) {
  const seen = new Set();
  return [...primary, ...prefetched].filter(member => {
    if (!member?.id || seen.has(member.id)) return false;
    seen.add(member.id);
    return true;
  });
}

export function upcomingDeckMembers(members = [], index = 0, currentId, limit = 3) {
  if (!members.length || limit < 1) return [];
  const upcoming = [];
  for (let offset = 1; offset <= limit && offset < members.length; offset += 1) {
    const candidate = members[(index + offset) % members.length];
    if (candidate?.id && candidate.id !== currentId) upcoming.push(candidate);
  }
  return upcoming;
}
