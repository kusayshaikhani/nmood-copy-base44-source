const stableRank = (member, seed) => String(member?.id || '')
  .split('')
  .reduce((value, char) => ((value * 33) ^ char.charCodeAt(0)) >>> 0, seed);

/**
 * Home always shows untouched profiles before recycling passed ones. The
 * caller supplies an already-authorized, already-filtered eligible list, so
 * this helper can never reintroduce a block, a Pal, or a sent Like.
 */
export function cycleHomeDeckMembers({ eligibleMembers = [], dislikedIds = new Set(), seed = 0, lastPassedId = null }) {
  const fresh = eligibleMembers.filter(member => !dislikedIds.has(member?.id));
  const recycling = fresh.length === 0 && eligibleMembers.length > 0;
  const source = recycling ? eligibleMembers : fresh;
  const ordered = [...source].sort((left, right) => stableRank(left, seed) - stableRank(right, seed));

  // Do not immediately show the card that was just passed when other cards
  // are available. A one-person deck necessarily repeats that person.
  if (recycling && lastPassedId && ordered.length > 1) {
    return {
      members: [...ordered.filter(member => member?.id !== lastPassedId), ...ordered.filter(member => member?.id === lastPassedId)],
      recycling,
    };
  }
  return { members: ordered, recycling };
}
